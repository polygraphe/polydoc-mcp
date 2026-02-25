import * as fs from "fs/promises";
import * as path from "path";
import { FileScanner } from "../common/FileScanner.js";
import { generateHTMLDocumentation } from "../common/formatters/htmlFormatter.js";
import { generateMarkdownDocumentation } from "../common/formatters/markdownFormatter.js";
import { config, getConfigSummary, getErrorMessage, isMetricsEnabled, logger } from "../config.js";
import { ScanResult } from "../domain/models/fileScanModels.js";
import { OutputFormat } from "../domain/OutputFormat.js";
import { DBModelUtils } from "../utils/DBModelUtils";
import { PromptBuilder } from "./PromptBuilder.js";

/**
 * MCP Tool function for build-database-documentation
 * Handles the complete logic for building comprehensive database documentation :
 * 
 * - get project root directory
 * - get file patterns to scan
 * - build polydoc.md documentation file 
 * if elicitation is supported and needed to add more information, it will return a message requesting table descriptions (loop: true)
 * Parameters :
 *  - tool prefix parameters come from the MCP tool call
 */
export async function buildDatabaseDocumentation(params: {
  workspaceRootpath: string;
  toolOutputFormat: OutputFormat;
  toolIncludePatterns?: string[];
  toolKnownTables?: Record<string, string>;
  toolAnalysisOptions?: {
    includeRelationshipDiagram?: boolean;
    includeMetrics?: boolean;
    includeFileTree?: boolean;
    includeSqlAnalysis?: boolean;
    includePerformanceHints?: boolean;
  };
  toolTableDescriptions?: Record<string, string>;

  clientSupportsElicitation?: boolean; // New parameter to indicate client elicitation support
  filelist?: boolean; // New parameter to indicate client file list capability
  fileread?: boolean; // New parameter to indicate client file read capability

}): Promise<{toolAnswer: string }> {
  const { 
    workspaceRootpath, 
    toolOutputFormat, 
    toolIncludePatterns, 
    toolKnownTables, 
    toolAnalysisOptions = {}, 
    toolTableDescriptions = {}, 
    clientSupportsElicitation, 
    filelist = false, 
    fileread = false 
  } = params;

  // Process knownTables to extract both table names and descriptions
  let extractedTableNames: string[] = [];
  let extractedTableDescriptions: Record<string, string> = { ...toolTableDescriptions };
  
  if (toolKnownTables) {
      extractedTableNames = Object.keys(toolKnownTables);

      // Merge the descriptions from knownTables with any existing toolTableDescriptions
      extractedTableDescriptions = { ...extractedTableDescriptions, ...toolKnownTables };
  }

  // Test comment

  logger.info(`🔨 Starting database documentation build tool`);
  logger.debug(`Build parameters: ${JSON.stringify({ workspaceRootpath, toolOutputFormat })}`);
  logger.debug(`Client capabilities: elicitation=${clientSupportsElicitation}, filelist=${filelist}, fileread=${fileread}`);
  logger.debug(`Table names provided: ${extractedTableNames.length > 0 ? extractedTableNames.join(', ') : 'none'}`);
  logger.debug(`Table descriptions provided: ${Object.keys(extractedTableDescriptions).length > 0 ? Object.keys(extractedTableDescriptions).join(', ') : 'none'}`);
  
  // Step 1: get project path and validate
  try {
    // Validate and normalize the project path using centralized validation
    const pathValidation = await FileScanner.validateProjectPath(workspaceRootpath);
    if (!pathValidation.isValid) {
      return {
        toolAnswer: `❌ Invalid project path: \`${workspaceRootpath}\`\n\nError: ${pathValidation.error}`
      };
    }
    
    const options = {
      includeRelationshipDiagram: false,
      includeMetrics: true,
      includeFileTree: true,
      includeSqlAnalysis: true,
      includePerformanceHints: false,
      ...toolAnalysisOptions
    };
    
    // Get project name from path
    const inferredProjectName = path.basename(pathValidation.normalizedProjectPath);
    logger.info(`📦 Project: ${inferredProjectName}`);
    
    // Step 2: Use internal scan function to get parsed data
    logger.info(`📁 Scanning database files in: ${pathValidation.finalScanPath}`);
    let scanData: ScanResult = await FileScanner.executeScanDatabaseFiles({
      projectPath: pathValidation.normalizedProjectPath,
      includePatterns: toolIncludePatterns
    });
    
    logger.info(`📊 Found ${scanData.databaseModel.entries.length} database entities in ${scanData.summary.totalFiles} files`);
    
    // Step 3: Deduplicate database models
    logger.info('🔄 Removing duplicate database entities');
    scanData = DBModelUtils.modelDeduplicate(scanData);
    logger.info(`📊 After deduplication: ${scanData.databaseModel.entries.length} total entities (${scanData.databaseModel.entries.filter(entry => entry.table.isDuplicate === true).length} duplicates marked)`);
    
    if (scanData.databaseModel.entries.length === 0) {
      logger.warn('⚠️ No database entities found in project');
      return {
        toolAnswer: `# ${inferredProjectName} - Database Documentation\n\nNo database-related files found in the specified path. Make sure the path contains models, migrations, or schema files.\n\n**Searched in**: \`${pathValidation.finalScanPath}\``
      };
    }
    
    // Step 4: Apply user-provided descriptions to entities
    if (Object.keys(extractedTableDescriptions).length > 0) {
      logger.info(`📝 Applying ${Object.keys(extractedTableDescriptions).length} user-provided descriptions`);
      scanData.databaseModel.entries.forEach((entry: any) => {
        if (extractedTableDescriptions[entry.table.name]) {
          entry.table.description = extractedTableDescriptions[entry.table.name];
          logger.info(`Applied description to table: ${entry.table.name}`);
        }
      });
    } else {
      logger.info('No user descriptions to apply');
    }
    
    // Step 5: Generate metrics and statistics (if enabled)
    logger.info('📊 Generating documentation metrics and statistics');
    const metrics = isMetricsEnabled() ? {
      totalFiles: scanData.summary.totalFiles,
      scannedFiles: scanData.summary.totalFiles,
      totalEntities: scanData.summary.totalEntities,
      successfullyParsedFiles: scanData.summary.totalEntities > 0 ? scanData.summary.totalFiles : 0,
      failedFiles: 0, // Would need enhanced scan function to track this
      byType: scanData.summary.byType,
      byFileType: scanData.summary.byFileType,
      relationships: {
        total: scanData.databaseModel.entries.reduce((acc: any, entry: any) => acc + entry.table.relationships.length, 0),
        byType: scanData.databaseModel.entries.reduce((acc: any, entry: any) => {
          for (const rel of entry.table.relationships) {
            acc[rel.type] = (acc[rel.type] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      },
      fields: {
        total: scanData.databaseModel.entries.reduce((acc: any, entry: any) => acc + entry.table.fields.length, 0),
        primaryKeys: scanData.databaseModel.entries.reduce((acc: any, entry: any) => 
          acc + entry.table.fields.filter((f: any) => f.primaryKey).length, 0),
        foreignKeys: scanData.databaseModel.entries.reduce((acc: any, entry: any) => 
          acc + entry.table.fields.filter((f: any) => f.foreignKey).length, 0),
        nullable: scanData.databaseModel.entries.reduce((acc: any, entry: any) => 
          acc + entry.table.fields.filter((f: any) => f.nullable).length, 0)
      },
      configuration: config.nodeEnv === 'development' ? getConfigSummary() : undefined
    } : {
      totalFiles: scanData.summary.totalFiles,
      scannedFiles: scanData.summary.totalFiles,
      totalEntities: scanData.summary.totalEntities
    };

    logger.info('Metrics calculated:', { 
      totalEntities: metrics.totalEntities, 
      totalFiles: metrics.totalFiles,
      metricsEnabled: isMetricsEnabled() 
    });
    
    // Step 6: Generate file tree
    const fileTree = options.includeFileTree ? generateFileTree(scanData.scannedFiles.map((f: string) => path.resolve(scanData.scanPath, f)), scanData.scanPath) : '';
    
    if (options.includeFileTree) {
      logger.info('📁 Generated file tree for documentation');
    }
    
    // Step 7: Generate  documentation
    logger.info(`📄 Generating documentation in ${toolOutputFormat} format`);
    if (toolOutputFormat === OutputFormat.JSON) {
      logger.info('Creating JSON documentation output');
      const jsonResult = JSON.stringify({
        projectName: inferredProjectName,
        projectPath: workspaceRootpath,
        scanPath: scanData.scanPath,
        generatedAt: new Date().toISOString(),
        scannedFiles: scanData.scannedFiles,
        databaseModel: scanData.databaseModel,
        entities: scanData.entities, // Keep for backward compatibility
        metrics,
        fileAnalysis: [], // Not available from internal scan function
        analysisOptions: options
      }, null, 2);

      logger.info('✅ JSON documentation generated successfully');
      return {
        toolAnswer: jsonResult
      };
    }

    //---------- html version
    if (toolOutputFormat === OutputFormat.HTML) {
      logger.info('Creating HTML documentation output');
      
      // Build file analysis data from scan results for HTML
      const fileAnalysis = scanData.scannedFiles.map(filePath => {
        // Count entities found in this specific file
        const entitiesInFile = scanData.databaseModel.entries.filter(entry => 
          entry.table.referenceFiles.some(ref => 
            ref.filePath === filePath || 
            ref.filePath.endsWith(filePath) ||
            filePath.endsWith(path.basename(ref.filePath))
          )
        ).length;
        
        return {
          file: path.relative(workspaceRootpath, filePath),
          status: 'success',
          entities: entitiesInFile,
          error: null
        };
      });
      
      const htmlResult = generateHTMLDocumentation(inferredProjectName, scanData.entities, metrics, fileTree, fileAnalysis, options);

      logger.info('✅ HTML documentation generated successfully');
      return {
        toolAnswer: htmlResult
      };
    }
    
    // Default: Markdown format
    logger.info('Creating Markdown documentation output');
    
    // Build file analysis data from scan results
    const fileAnalysis = scanData.scannedFiles.map(filePath => {
      // Count entities found in this specific file
      const entitiesInFile = scanData.databaseModel.entries.filter(entry => 
        entry.table.referenceFiles.some(ref => 
          ref.filePath === filePath || 
          ref.filePath.endsWith(filePath) ||
          filePath.endsWith(path.basename(ref.filePath))
        )
      ).length;
      
      return {
        file: path.relative(workspaceRootpath, filePath),
        status: 'success',
        entities: entitiesInFile,
        error: null
      };
    });
    
    const markdownResult = generateMarkdownDocumentation(
      inferredProjectName, 
      scanData.entities, 
      metrics, 
      fileTree, 
      fileAnalysis, // Now providing proper file analysis data
      {
        ...options,
        environment: config.nodeEnv,
        enableDebugInfo: config.nodeEnv !== 'production'
      }
    );
    
    logger.info('✅ Markdown documentation generated successfully');
    
    // Save markdown result to file in workspace root
    try {
      const outputFileName = `polygraph.md`;
      const outputFilePath = path.join(workspaceRootpath, outputFileName);
      await fs.writeFile(outputFilePath, markdownResult, 'utf8');
      logger.info(`📄 Markdown documentation saved to: ${outputFilePath}`);
    } catch (fileError) {
      logger.error(`❌ Failed to save markdown file: ${getErrorMessage(fileError, 'File write error')}`);
      // Continue execution even if file save fails
    }

     // Final Step : Give tool return
    // Use utility function to get only reference tables
    const referenceTables = DBModelUtils.getReferenceTables(scanData.databaseModel);
    
    const entitiesNeedingDescription = referenceTables.filter((entry: any) => {
      const hasDescription = entry.table.description && entry.table.description.trim().length > 0;
      const hasUserDescription = extractedTableDescriptions[entry.table.name] && extractedTableDescriptions[entry.table.name].trim().length > 0;
      const needsDescription = !hasDescription && !hasUserDescription;
      
      if (needsDescription) {
        logger.debug(`Reference table needs description: ${entry.table.name} (ID: ${entry.id})`);
      }
      
      return needsDescription;
    });
    
    logger.info(`Checking ${referenceTables.length} reference tables for missing descriptions...`);
    logger.info(`Found ${entitiesNeedingDescription.length} reference tables needing descriptions`);

    let toolanswerMsg: string;
    const builder = new PromptBuilder();
    if (entitiesNeedingDescription.length > 0) {
        const tableNames = entitiesNeedingDescription.map((entry: any) => entry.table.name);
        logger.info(`📝 Requesting descriptions for reference tables: ${tableNames.join(', ')}`);
        
        // Log debug info about all tables to help diagnose issues
        logger.debug('All reference tables:');
        referenceTables.forEach((entry: any) => {
          logger.debug(`  ${entry.table.name} (${entry.id}): hasDesc=${!!(entry.table.description && entry.table.description.trim())}`);
        });

        toolanswerMsg = builder
          .add(`Documentation generated with missing descriptions`)
          .addInstruction(`Please provide additional information for the following tables`)
          .addTables(tableNames)
          .build();
        
      } else {
        logger.info(`All reference tables have descriptions.`);
        toolanswerMsg = `Documentation generated successfully. All reference tables have descriptions.`;
      }
    return {
          toolAnswer: toolanswerMsg
    };
  } catch (error) {
    logger.error(`❌ Error building database documentation: ${error}`);
    return {
      toolAnswer: `Error building database documentation: ${getErrorMessage(error, 'Failed to build documentation')}`
    };
  }
}

function generateFileTree(files: string[], rootPath: string): string {
  const relativePaths = files.map(f => path.relative(rootPath, f)).sort();
  const tree: Record<string, any> = {};
  
  for (const filePath of relativePaths) {
    const parts = filePath.split(path.sep);
    let current = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // It's a file
        current[part] = null;
      } else {
        // It's a directory
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  
  return treeToString(tree);
}

function treeToString(obj: any, indent = ''): string {
  let result = '';
  const entries = Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));
  
  for (const [key, value] of entries) {
    if (value === null) {
      // It's a file
      result += `${indent}📄 ${key}\n`;
    } else {
      // It's a directory
      result += `${indent}📁 ${key}/\n`;
      result += treeToString(value, indent + '  ');
    }
  }
  
  return result;
}
