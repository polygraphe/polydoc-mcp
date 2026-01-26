import * as fs from "fs/promises";
import { glob } from "glob";
import * as path from "path";
import { config, getErrorMessage, logger, validateFileSize } from '../config.js';
import {
  DatabaseModel,
  DatabaseModelEntry,
  DatabaseTable
} from '../domain/models/databaseModels.js';
import { FilePattern, ScanOptions, ScanResult } from "../domain/models/fileScanModels.js";
import { PathUtils } from '../utils/PathUtils.js';
import { FileParser } from './parsers/FileParser.js';

export class FileScanner {
  /**
   * Internal function that performs database file scanning and parsing
   * This function is shared between scan-database-files and build-database-documentation tools
   * Note: Path validation should be done by the caller before calling this function
   */
  static async executeScanDatabaseFiles(options: ScanOptions): Promise<ScanResult> {
    const { projectPath, subdirectory, includePatterns } = options;

    // Build the full scan path (path validation should already be done by caller)
    const scanPath = subdirectory ? PathUtils.safePath(projectPath, subdirectory) : projectPath;

    // Scan for database files
    const files = await this.scanCodebaseForDatabaseFiles(scanPath);

    if (includePatterns) {
      for (const pattern of includePatterns) {
        const additionalFiles = await glob(pattern, {
          cwd: scanPath,
          absolute: true,
          ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
        });
        files.push(...additionalFiles);
      }
    }

    // Limit files based on configuration
    const filesToScan = files.slice(0, config.maxFilesPerScan);
    if (files.length > config.maxFilesPerScan) {
      logger.warn(`Limiting scan to ${config.maxFilesPerScan} files (found ${files.length})`);
    }

    // Parse all database files
    const allEntities: DatabaseTable[] = [];

    for (const file of filesToScan) {
      try {
        // Check file size before processing
        const stat = await fs.stat(file);
        const sizeValidation = validateFileSize(file, stat.size);
        if (!sizeValidation.isValid) {
          logger.warn(`Skipping file ${file}: ${sizeValidation.error}`);
          continue;
        }

        let entities: DatabaseTable[] = [];

        if (file.endsWith('.sql') || file.includes('migration')) {
          entities = await FileParser.parseSQLFile(file);
        } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.prisma')) {
          entities = await FileParser.parseModelFile(file);
        }

        allEntities.push(...entities);
        logger.debug(`Processed file: ${file}, found ${entities.length} entities`);
      } catch (error) {
        logger.error(`Error processing file ${file}:`, error);
        // File parsing failed, continue with other files
      }
    }

    // Create DatabaseModel with unique IDs
    const databaseModelEntries: DatabaseModelEntry[] = allEntities.map((table, index) => ({
      id: `table_${index}`, // Simple position-based ID
      table
    }));

    const databaseModel: DatabaseModel = {
      entries: databaseModelEntries,
      metadata: {
        projectPath,
        scanPath,
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return {
      projectPath,
      subdirectory,
      scanPath: scanPath,
      scannedFiles: files.map((f: string) => path.relative(scanPath, f)),
      databaseModel,
      entities: allEntities, // Keep for backward compatibility
      summary: {
        totalFiles: files.length,
        totalEntities: allEntities.length,
        byType: allEntities.reduce((acc, entity) => {
          // Count by reference file types
          entity.referenceFiles.forEach(ref => {
            acc[ref.type] = (acc[ref.type] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        byFileType: files.reduce((acc, file) => {
          const ext = path.extname(file);
          const fileType = this.getFileType(file);
          const key = ext || 'no extension';

          if (!acc[key]) {
            acc[key] = { count: 0, type: fileType };
          }
          acc[key].count += 1;
          return acc;
        }, {} as Record<string, { count: number; type: string }>)
      }
    };
  }

  /**
   * Validates a project path and subdirectory combination
   */
  static async validateProjectPath(projectPath: string, subdirectory?: string): Promise<{
    isValid: boolean;
    normalizedProjectPath: string;
    finalScanPath: string;
    error?: string;
  }> {
    try {
      // Validate and normalize the project path
      const pathValidation = await PathUtils.validatePath(projectPath);
      if (!pathValidation.isValid) {
        return {
          isValid: false,
          normalizedProjectPath: projectPath,
          finalScanPath: projectPath,
          error: pathValidation.error
        };
      }

      // Build the full scan path
      const scanPath = subdirectory ? PathUtils.safePath(pathValidation.normalizedPath, subdirectory) : pathValidation.normalizedPath;

      // Verify the scan path exists and is a directory
      const scanPathValidation = await PathUtils.validatePath(scanPath);
      if (!scanPathValidation.isValid) {
        return {
          isValid: false,
          normalizedProjectPath: pathValidation.normalizedPath,
          finalScanPath: scanPath,
          error: `Invalid scan path: ${scanPath} - ${scanPathValidation.error}`
        };
      }

      const stat = await fs.stat(scanPathValidation.normalizedPath);
      if (!stat.isDirectory()) {
        return {
          isValid: false,
          normalizedProjectPath: pathValidation.normalizedPath,
          finalScanPath: scanPathValidation.normalizedPath,
          error: `Path is not a directory: ${scanPathValidation.normalizedPath}`
        };
      }

      return {
        isValid: true,
        normalizedProjectPath: pathValidation.normalizedPath,
        finalScanPath: scanPathValidation.normalizedPath
      };
    } catch (error) {
      return {
        isValid: false,
        normalizedProjectPath: projectPath,
        finalScanPath: projectPath,
        error: getErrorMessage(error, 'Failed to validate project path')
      };
    }
  }

  /**
   * Get file type based on file path and known patterns
   */
  private static getFileType(filePath: string): string {
    // Direct checks based on file path patterns
    if (filePath.endsWith('.sql')) return 'migration';
    if (filePath.includes('migration')) return 'migration';
    if (filePath.includes('model') && (filePath.endsWith('.js') || filePath.endsWith('.ts'))) return 'model';
    if (filePath.includes('entit') && (filePath.endsWith('.js') || filePath.endsWith('.ts'))) return 'model';
    if (filePath.endsWith('schema.prisma')) return 'schema';
    if (filePath.endsWith('database.yml')) return 'schema';
    if (filePath.endsWith('schema.rb')) return 'schema';

    return 'unknown';
  }

  /**
   * Scan codebase for database-related files
   */
  private static async scanCodebaseForDatabaseFiles(rootPath: string): Promise<string[]> {
    const patterns: FilePattern[] = [
      { pattern: '**/*.sql', type: 'migration' },
      { pattern: '**/migrations/*.{js,ts}', type: 'migration' },
      { pattern: '**/models/*.{js,ts}', type: 'model' },
      { pattern: '**/entities/*.{js,ts}', type: 'model' },
      { pattern: '**/*model*.{js,ts}', type: 'model' },
      { pattern: '**/*entity*.{js,ts}', type: 'model' },
      { pattern: '**/schema.prisma', type: 'schema' },
      { pattern: '**/database.yml', type: 'schema' },
      { pattern: '**/schema.rb', type: 'schema' }
    ];

    const files: string[] = [];

    // Validate and normalize the path
    const pathValidation = await PathUtils.validatePath(rootPath);
    if (!pathValidation.isValid) {
      // Return empty array if path is invalid
      return [];
    }

    const normalizedRootPath = pathValidation.normalizedPath;

    // Additional check to ensure it's a directory
    try {
      const stat = await fs.stat(normalizedRootPath);
      if (!stat.isDirectory()) {
        return [];
      }
    } catch (error) {
      return [];
    }

    for (const { pattern } of patterns) {
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

    return [...new Set(files)]; // Remove duplicates
  }
}