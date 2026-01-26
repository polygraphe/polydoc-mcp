import * as fs from "fs/promises";
import { glob } from "glob";
import * as path from "path";
import { FileParser } from '../common/parsers/FileParser.js';
import { config, getErrorMessage, logger, validateFileSize } from '../config.js';
import { DatabaseTable } from '../domain/models/databaseModels.js';
import { OutputFormat } from "../domain/OutputFormat.js";
import { PathUtils } from '../utils/PathUtils.js';
import { PromptBuilder } from "./PromptBuilder.js";

/**
 * Tool function for scan-database-files MCP tool
 * Handles the complete logic for scanning database files and returning formatted results
 */
export async function scanDatabaseFiles(params: {
  projectPath: string;
  subdirectory?: string;
  outputFormat: OutputFormat.Markdown | OutputFormat.JSON;
  includePatterns?: string[];
  knownTables?: Record<string, string>;
}): Promise<string> {
  const { projectPath, subdirectory, outputFormat, includePatterns, knownTables } = params;
  
  // Process knownTables to extract both table names and descriptions
  let extractedTableNames: string[] = [];
  let extractedTableDescriptions: Record<string, string> = {};
  
  if (knownTables) {
      // New format: object with table names as keys and descriptions as values
      extractedTableNames = Object.keys(knownTables);
      extractedTableDescriptions = knownTables;
  }
  
  try {
    // Validate and normalize the project path
    const pathValidation = await PathUtils.validatePath(projectPath);
    if (!pathValidation.isValid) {
      return `❌ Invalid project path: \`${projectPath}\`\n\nError: ${pathValidation.error}`;
    }
    
    // Build the full scan path
    const scanPath = subdirectory ? PathUtils.safePath(pathValidation.normalizedPath, subdirectory) : pathValidation.normalizedPath;
    
    // Verify the scan path exists and is a directory
    const scanPathValidation = await PathUtils.validatePath(scanPath);
    if (!scanPathValidation.isValid) {
      return `❌ Invalid scan path: \`${scanPath}\`\n\nError: ${scanPathValidation.error}`;
    }
    
    try {
      const stat = await fs.stat(scanPathValidation.normalizedPath);
      if (!stat.isDirectory()) {
        return `❌ Path is not a directory: \`${scanPathValidation.normalizedPath}\``;
      }
    } catch (error) {
      return `❌ Path does not exist or is not accessible: \`${scanPathValidation.normalizedPath}\`\n\nError: ${error instanceof Error ? error.message : String(error)}`;
    }
    
    logger.info('🔍 Starting database file scan');
    logger.info(`📁 Project path: ${projectPath}`);
    if (subdirectory) {
      logger.info(`📂 Subdirectory: ${subdirectory}`);
    }
    logger.info(`📄 Output format: ${outputFormat}`);
    
    // Perform combined file scan and parse operation
    const scanResult = await scanAndParseDbFiles(scanPathValidation.normalizedPath, includePatterns, config, logger, validateFileSize);
    
    if (scanResult.files.length === 0) {
      logger.info('❌ No database files found');
      return generateNoDatabaseFilesFoundMessage(scanPath, projectPath, subdirectory);
    }
    
    const { files, allEntities } = scanResult;
    
    // Apply extracted table descriptions to entities if provided
    if (Object.keys(extractedTableDescriptions).length > 0) {
      allEntities.forEach((entity: any) => {
        if (extractedTableDescriptions[entity.name] && (!entity.description || entity.description.trim().length === 0)) {
          entity.description = extractedTableDescriptions[entity.name];
        }
      });
    }
    
    logger.info(`✅ Scan completed: ${files.length} files, ${allEntities.length} entities found`);
    
    if (outputFormat === "json") {
      return JSON.stringify({
        projectPath,
        subdirectory,
        scanPath,
        scannedFiles: files,
        entities: allEntities,
        summary: {
          totalFiles: files.length,
          totalEntities: allEntities.length,
          byType: allEntities.reduce((acc, entity) => {
            // Count by reference file types
            entity.referenceFiles.forEach(ref => {
              acc[ref.type] = (acc[ref.type] || 0) + 1;
            });
            return acc;
          }, {} as Record<string, number>)
        }
      }, null, 2);
    }
    
    // Generate file report
    const projectName = path.basename(projectPath);
    
    if (allEntities.length > 0) {
      const feedback = generateFeedback(allEntities);
      let documentation = feedback + "\n\n";
      return documentation;
    } else {
      let documentation = `# ${projectName} - Database Files Report\n\n`;
      documentation += `**Project Path:** \`${projectPath}\`\n`;
      documentation += `**Scanned Directory:** \`${scanPath}\`\n`;
      documentation += `**Generated:** ${new Date().toISOString()}\n\n`;
      documentation += `**Summary:**\n`;
      documentation += `- Files found: ${files.length}\n`;
      documentation += `- Entities parsed: ${allEntities.length}\n\n`;
      documentation += "No database entities could be parsed from the found files.\n";
      return documentation;
    }
    
  } catch (error) {
    logger.error('❌ Error scanning external project:', error);
    return `Error scanning external project: ${getErrorMessage(error, 'Failed to scan project')}`;
  }
}

/**
 * Combined scan and parse operation - more efficient than separate calls
 * This function eliminates the double file scanning issue by doing everything in one pass
 */
async function scanAndParseDbFiles(
  rootPath: string, 
  includePatterns?: string[], 
  config?: any, 
  Logger?: any, 
  validateFileSize?: any
): Promise<{ files: string[], allEntities: DatabaseTable[] }> {
  const patterns = [
    '**/*.sql',
    '**/migrations/*.{js,ts}',
    '**/models/*.{js,ts}',
    '**/entities/*.{js,ts}',
    '**/*model*.{js,ts}',
    '**/*entity*.{js,ts}',
    '**/schema.prisma',
    '**/database.yml',
    '**/schema.rb'
  ];

  const files: string[] = [];
  const allEntities: DatabaseTable[] = [];

  // Validate and normalize the path (already done in calling function, but kept for safety)
  const pathValidation = await PathUtils.validatePath(rootPath);
  if (!pathValidation.isValid) {
    return { files: [], allEntities: [] };
  }

  const normalizedRootPath = pathValidation.normalizedPath;

  // Additional check to ensure it's a directory
  try {
    const stat = await fs.stat(normalizedRootPath);
    if (!stat.isDirectory()) {
      return { files: [], allEntities: [] };
    }
  } catch (error) {
    return { files: [], allEntities: [] };
  }

  // Scan for database files using patterns
  for (const pattern of patterns) {
    try {
      const matches = await glob(pattern, {
        cwd: normalizedRootPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
      });
      files.push(...matches);
    } catch (error) {
      // Pattern scan failed, continue with other patterns
    }
  }

  // Add additional include patterns if provided
  if (includePatterns) {
    for (const pattern of includePatterns) {
      try {
        const additionalFiles = await glob(pattern, { 
          cwd: normalizedRootPath, 
          absolute: true,
          ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
        });
        files.push(...additionalFiles);
      } catch (error) {
        // Pattern scan failed, continue with other patterns
      }
    }
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(files)];
  
  // Limit files based on configuration if provided
  const filesToScan = config ? uniqueFiles.slice(0, config.maxFilesPerScan) : uniqueFiles;
  if (config && uniqueFiles.length > config.maxFilesPerScan && Logger) {
    Logger.warn(`Limiting scan to ${config.maxFilesPerScan} files (found ${uniqueFiles.length})`);
  }

  // Parse all database files in a single pass
  for (const file of filesToScan) {
    try {
      // Check file size before processing if validation function is provided
      if (validateFileSize) {
        const stat = await fs.stat(file);
        const sizeValidation = validateFileSize(file, stat.size);
        if (!sizeValidation.isValid) {
          if (Logger) Logger.warn(`Skipping file ${file}: ${sizeValidation.error}`);
          continue;
        }
      }
      
      let entities: DatabaseTable[] = [];
      
      if (file.endsWith('.sql') || file.includes('migration')) {
        entities = await FileParser.parseSQLFile(file);
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.prisma')) {
        entities = await FileParser.parseModelFile(file);
      }
      
      allEntities.push(...entities);
      if (Logger) Logger.debug(`Processed file: ${file}, found ${entities.length} entities`);
    } catch (error) {
      if (Logger) Logger.error(`Error processing file ${file}:`, error);
      // File parsing failed, continue with other files
    }
  }

  return { files: uniqueFiles, allEntities };
}

/**
 * Generate feedback prompt listing discovered tables
 * @param allEntities - Array of database entities discovered during scanning
 * @returns Feedback prompt string asking for confirmation of discovered tables
 */
function generateFeedback(allEntities: DatabaseTable[]): string {
  const builder = new PromptBuilder();

  if (allEntities.length === 0) {
    builder.add("No database tables were found during the scan.")
    builder.addInstruction(`Could you confirm this is correct or if there are specific files/directories we should examine?`);
    return builder.build();
  }

  // Extract unique table/entity names
  const tableNames = [...new Set(allEntities.map(entity => entity.name))].sort();
  builder.add(`We found the following tables:`); 
  builder.addTables(tableNames);
  builder.addInstruction(`Confirm that no tables are missing. if tables are missing, please specify them and call scan-database-files tool again with knownTables parameter`);
  builder.addInstruction(`Please provide insights on possible duplicates or typos in the table names.`);
  return builder.build();
}

function generateNoDatabaseFilesFoundMessage(
  scanPath: string,
  projectPath: string,
  subdirectory?: string
): string {
  let message = `No database-related files found in: \`${scanPath}\`\n\n`;
  message += `**Project path:** \`${projectPath}\`\n`;
  message += `**Subdirectory:** \`${subdirectory || 'none'}\`\n`;
  message += `**Full scan path:** \`${scanPath}\`\n\n`;
  message += `**Patterns searched:**\n`;
  message += `- **/*.sql\n`;
  message += `- **/migrations/*.{js,ts}\n`;
  message += `- **/models/*.{js,ts}\n`;
  message += `- **/entities/*.{js,ts}\n`;
  message += `- **/*model*.{js,ts}\n`;
  message += `- **/*entity*.{js,ts}\n`;
  message += `- **/schema.prisma\n`;
  message += `- **/database.yml\n`;
  message += `- **/schema.rb\n\n`;
  message += `**Suggestions:**\n`;
  message += `- Check if the directory contains database files\n`;
  message += `- Try different subdirectories (e.g., 'src', 'api', 'db')\n`;
  message += `- Use \`includePatterns\` for custom file patterns`;

  return message;
}
