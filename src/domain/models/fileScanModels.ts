import { DatabaseModel, DatabaseTable } from "./databaseModels.js";

/**
 * Result type for the database scan operation
 */
export interface ScanResult {
  projectPath: string;
  subdirectory?: string;
  scanPath: string;
  scannedFiles: string[];
  databaseModel: DatabaseModel;
  // Legacy compatibility - entities will be deprecated
  entities: DatabaseTable[];
  summary: {
    totalFiles: number;
    totalEntities: number;
    byType: Record<string, number>;
    byFileType: Record<string, { count: number; type: string }>;
  };
}

/**
 * Options for the database scan operation
 */
export interface ScanOptions {
  projectPath: string;
  subdirectory?: string;
  includePatterns?: string[];
}

/**
 * File pattern with associated type information
 */
export interface FilePattern {
  pattern: string;
  type: string;
}