/**
 * Information Model for Polydoc Database Documentation
 * 
 * This file contains the core data structures used throughout the Polydoc system
 * for representing database entities, fields, relationships, and sample data.
 */

export interface ReferenceFile {
  filePath: string;
  type: 'schema' | 'model' | 'migration' | 'code';
}

export interface DatabaseTable {
  name: string;
  description?: string;
  fields: DatabaseField[];
  relationships: Relationship[];
  constraints: Constraint[];
  referenceFiles: ReferenceFile[];
  sampledata?: SampleData[];
  // Duplicate tracking fields
  isDuplicate?: boolean;           // True if this table is a duplicate of another
  duplicateOf?: string;           // ID of the reference table (if this is a duplicate)
  duplicates?: string[];          // Array of IDs of tables that are duplicates of this one (if this is a reference)
}

export interface DatabaseField {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: string;
  description?: string;
  defaultValue?: string;
}

export interface Relationship {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany';
  target: string;
  foreignKey?: string;
  description?: string;
}

export interface Constraint {
  type: 'unique' | 'index' | 'check' | 'foreign_key' | 'primary_key';
  name: string;
  columns: string[];
  description?: string;
}

export interface SampleData {
  context: string;
  columnname: string;
  columnvalue: string;
}

/**
 * Database Model Entry - a table with a unique identifier
 */
export interface DatabaseModelEntry {
  id: string; // Unique identifier for the table (could be table position or generated ID)
  table: DatabaseTable;
}

/**
 * Database Model - a collection of all database tables with unique identifiers
 */
export interface DatabaseModel {
  entries: DatabaseModelEntry[];
  metadata?: {
    projectName?: string;
    projectPath?: string;
    scanPath?: string;
    generatedAt?: string;
    version?: string;
  };
}
