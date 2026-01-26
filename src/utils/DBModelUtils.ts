import { logger } from "../config.js";
import { DatabaseModel, DatabaseModelEntry, DatabaseTable } from "../domain/models/databaseModels.js";
import { ScanResult } from "../domain/models/fileScanModels.js";

/**
 * Database Model Utilities
 * Provides functions to clean up and deduplicate database models after file scanning and parsing
 */
export class DBModelUtils {
  /**
   * Remove duplicate tables from the database model
   * Tables with 'schema' reference files are considered most accurate
   * Tables with less accurate reference files that are similar to schema tables are marked as duplicates
   * 
   * @param scanData The scan data containing entities to deduplicate
   * @param similarityThreshold Threshold for considering entities similar (default: 0.7)
   * @returns Updated scan data with duplicates marked
   */
  static modelDeduplicate(scanData: ScanResult, similarityThreshold: number = 0.7): ScanResult {
    logger.info('🔍 Starting model deduplication process');
    logger.debug(`Using similarity threshold: ${similarityThreshold}`);
    
    const modelEntries = [...scanData.databaseModel.entries];
    const duplicateIndices = new Set<number>();
    let duplicatesFound = 0;
    
    // Sort entries by authority (schema files first, then by priority)
    const entriesWithIndices = modelEntries.map((entry, index) => ({
      entry,
      index,
      maxPriority: Math.max(...entry.table.referenceFiles.map(rf => this.getFileTypePriority(rf.type)))
    })).sort((a, b) => b.maxPriority - a.maxPriority);
    
    logger.debug(`Processing ${modelEntries.length} entities for deduplication`);
    
    // Compare each entity with all others
    for (let i = 0; i < entriesWithIndices.length; i++) {
      const currentItem = entriesWithIndices[i];
      
      // Skip if already marked as duplicate
      if (duplicateIndices.has(currentItem.index)) {
        continue;
      }
      
      for (let j = i + 1; j < entriesWithIndices.length; j++) {
        const compareItem = entriesWithIndices[j];
        
        // Skip if already marked as duplicate
        if (duplicateIndices.has(compareItem.index)) {
          continue;
        }
        
        // Calculate similarity
        const similarity = this.calculateEntitySimilarity(currentItem.entry.table, compareItem.entry.table);
        
        if (similarity >= similarityThreshold) {
          logger.debug(`Found similar entities: "${currentItem.entry.table.name}" and "${compareItem.entry.table.name}" (similarity: ${similarity.toFixed(2)})`);
          
          // Determine which one is more authoritative
          const moreAuthoritative = this.getMoreAuthoritativeEntity(currentItem.entry.table, compareItem.entry.table);
          
          let duplicateIndex: number;
          let keepIndex: number;
          
          if (moreAuthoritative === currentItem.entry.table) {
            duplicateIndex = compareItem.index;
            keepIndex = currentItem.index;
          } else if (moreAuthoritative === compareItem.entry.table) {
            duplicateIndex = currentItem.index;
            keepIndex = compareItem.index;
          } else {
            // If equal authority, mark the one with lower priority as duplicate
            if (currentItem.maxPriority >= compareItem.maxPriority) {
              duplicateIndex = compareItem.index;
              keepIndex = currentItem.index;
            } else {
              duplicateIndex = currentItem.index;
              keepIndex = compareItem.index;
            }
          }
          
          // Mark as duplicate using the new fields instead of modifying the name
          const duplicateEntry = modelEntries[duplicateIndex];
          const referenceEntry = modelEntries[keepIndex];
          
          if (!duplicateEntry.table.isDuplicate) {
            // Set duplicate flags
            duplicateEntry.table.isDuplicate = true;
            duplicateEntry.table.duplicateOf = referenceEntry.id;
            
            // Add to reference table's duplicates array
            if (!referenceEntry.table.duplicates) {
              referenceEntry.table.duplicates = [];
            }
            referenceEntry.table.duplicates.push(duplicateEntry.id);
            
            duplicatesFound++;
            
            logger.info(`Marked "${duplicateEntry.table.name}" as duplicate of "${referenceEntry.table.name}"`);
            logger.debug(`  Duplicate ID: ${duplicateEntry.id}, Reference ID: ${referenceEntry.id}`);
            logger.debug(`  Duplicate has file types: [${duplicateEntry.table.referenceFiles.map(rf => rf.type).join(', ')}]`);
            logger.debug(`  Reference has file types: [${referenceEntry.table.referenceFiles.map(rf => rf.type).join(', ')}]`);
          }
          
          duplicateIndices.add(duplicateIndex);
        }
      }
    }
    
    logger.info(`✅ Deduplication complete: ${duplicatesFound} duplicates found and marked`);
    
    // Update the database model with deduplicated entries
    const updatedDatabaseModel: DatabaseModel = {
      ...scanData.databaseModel,
      entries: modelEntries
    };
    
    // Update legacy entities array for backward compatibility
    const updatedEntities = modelEntries.map(entry => entry.table);
    
    // Update summary statistics
    const updatedSummary = {
      ...scanData.summary,
      duplicatesFound,
      uniqueEntities: modelEntries.filter((_, index) => !duplicateIndices.has(index)).length
    };
    
    return {
      ...scanData,
      databaseModel: updatedDatabaseModel,
      entities: updatedEntities, // Keep for backward compatibility
      summary: updatedSummary
    };
  }

  /**
   * Get all reference tables (non-duplicate tables) from the database model
   * @param databaseModel The database model
   * @returns Array of database table entries that are not duplicates
   */
  static getReferenceTables(databaseModel: DatabaseModel): DatabaseModelEntry[] {
    return databaseModel.entries.filter(entry => !entry.table.isDuplicate);
  }

  /**
   * Convert a field name to comparable format (handle snake_case vs camelCase)
   */
  private static normalizeFieldName(fieldName: string): string {
    return fieldName
      // Convert camelCase to snake_case
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      // Convert snake_case to a normalized form
      .replace(/_/g, '');
  }

  /**
   * Calculate similarity score between two database tables
   * @param table1 First table to compare
   * @param table2 Second table to compare
   * @returns Similarity score between 0 and 1 (1 = identical)
   */
  private static calculateEntitySimilarity(table1: DatabaseTable, table2: DatabaseTable): number {
    let score = 0;
    let totalChecks = 0;

    // 1. Name similarity (case-insensitive, accounting for plural/singular)
    totalChecks += 30; // Weight name heavily
    const name1 = table1.name.toLowerCase();
    const name2 = table2.name.toLowerCase();
    
    if (name1 === name2) {
      score += 30;
    } else {
      // Check for plural/singular variations
      const name1Singular = name1.endsWith('s') ? name1.slice(0, -1) : name1;
      const name2Singular = name2.endsWith('s') ? name2.slice(0, -1) : name2;
      
      if (name1Singular === name2Singular || 
          name1 === name2Singular || 
          name1Singular === name2) {
        score += 25;
      } else {
        // Partial name match
        const longerName = name1.length > name2.length ? name1 : name2;
        const shorterName = name1.length <= name2.length ? name1 : name2;
        
        if (longerName.includes(shorterName) || shorterName.includes(longerName)) {
          score += 15;
        }
      }
    }

    // 2. Field similarity (enhanced to handle naming conventions)
    totalChecks += 40; // Weight fields heavily
    const fields1 = table1.fields.map(f => this.normalizeFieldName(f.name));
    const fields2 = table2.fields.map(f => this.normalizeFieldName(f.name));
    
    if (fields1.length === 0 && fields2.length === 0) {
      score += 40;
    } else if (fields1.length > 0 && fields2.length > 0) {
      const commonFields = fields1.filter(f => fields2.includes(f));
      const fieldSimilarity = (commonFields.length * 2) / (fields1.length + fields2.length);
      score += Math.round(fieldSimilarity * 40);
    }

    // 3. Type similarity - since DatabaseTable doesn't have a type field, skip this check
    // totalChecks += 10;

    // 4. Relationship similarity
    totalChecks += 20;
    const rels1 = table1.relationships.map(r => `${r.type}-${r.target}`.toLowerCase());
    const rels2 = table2.relationships.map(r => `${r.type}-${r.target}`.toLowerCase());
    
    if (rels1.length === 0 && rels2.length === 0) {
      score += 20;
    } else if (rels1.length > 0 && rels2.length > 0) {
      const commonRels = rels1.filter(r => rels2.includes(r));
      const relSimilarity = (commonRels.length * 2) / (rels1.length + rels2.length);
      score += Math.round(relSimilarity * 20);
    } else if (rels1.length === 0 || rels2.length === 0) {
      score += 5; // Partial credit for one having no relationships
    }

    return Math.min(score / totalChecks, 1);
  }

  /**
   * Determine which table is more authoritative based on reference file types
   * @param table1 First table to compare
   * @param table2 Second table to compare
   * @returns The more authoritative table, or null if equal
   */
  private static getMoreAuthoritativeEntity(table1: DatabaseTable, table2: DatabaseTable): DatabaseTable | null {
    const table1MaxPriority = Math.max(...table1.referenceFiles.map(rf => this.getFileTypePriority(rf.type)));
    const table2MaxPriority = Math.max(...table2.referenceFiles.map(rf => this.getFileTypePriority(rf.type)));
    
    if (table1MaxPriority > table2MaxPriority) {
      return table1;
    } else if (table2MaxPriority > table1MaxPriority) {
      return table2;
    }
    
    // If priorities are equal, prefer the one with more fields
    if (table1.fields.length > table2.fields.length) {
      return table1;
    } else if (table2.fields.length > table1.fields.length) {
      return table2;
    }
    
    // If still equal, prefer the one with more relationships
    if (table1.relationships.length > table2.relationships.length) {
      return table1;
    } else if (table2.relationships.length > table1.relationships.length) {
      return table2;
    }
    
    return null; // Truly equal
  }

  /**
   * Get the priority of a reference file type for determining which table definition is most accurate
   * @param fileType The type of reference file
   * @returns Priority score (higher = more authoritative)
   */
  private static getFileTypePriority(fileType: string): number {
    const priorities: Record<string, number> = {
      'schema': 100,     // Most authoritative - explicit schema definitions
      'migration': 80,   // High priority - actual database structure
      'model': 60,       // Medium priority - ORM model definitions  
      'code': 20         // Low priority - usage in code
    };
    
    return priorities[fileType] || 0;
  }

  // TODO: Currently unused
  /**
 * Get statistics about the deduplication process
 * @param scanData The scan data after deduplication
 * @returns Statistics object
 */
  private static getDeduplicationStats(scanData: ScanResult): {
    totalEntities: number;
    duplicates: number;
    uniqueEntities: number;
    byFileType: Record<string, number>;
  } {
    const duplicates = scanData.databaseModel.entries.filter(entry => entry.table.isDuplicate === true).length;
    const unique = scanData.databaseModel.entries.length - duplicates;
    
    const byFileType: Record<string, number> = {};
    scanData.databaseModel.entries.forEach(entry => {
      entry.table.referenceFiles.forEach(rf => {
        byFileType[rf.type] = (byFileType[rf.type] || 0) + 1;
      });
    });
    
    return {
      totalEntities: scanData.databaseModel.entries.length,
      duplicates,
      uniqueEntities: unique,
      byFileType
    };
  }

  // TODO: Currently unused
  /**
   * Get a table by its unique ID from the database model
   * @param databaseModel The database model
   * @param id The unique ID of the table
   * @returns The database table entry or undefined if not found
   */
  private static getTableById(databaseModel: DatabaseModel, id: string): DatabaseModelEntry | undefined {
    return databaseModel.entries.find(entry => entry.id === id);
  }

  // TODO: Currently unused
  /**
   * Get a table by its name from the database model
   * @param databaseModel The database model
   * @param name The name of the table
   * @returns The database table entry or undefined if not found
   */
  private static getTableByName(databaseModel: DatabaseModel, name: string): DatabaseModelEntry | undefined {
    return databaseModel.entries.find(entry => entry.table.name === name);
  }

  // TODO: Currently unused
  /**
   * Get all tables from the database model as a simple array (for backward compatibility)
   * @param databaseModel The database model
   * @returns Array of database tables
   */
  private static getAllTables(databaseModel: DatabaseModel): DatabaseTable[] {
    return databaseModel.entries.map(entry => entry.table);
  }

  // TODO: Currently unused
  /**
   * Add a new table to the database model with a unique ID
   * @param databaseModel The database model to modify
   * @param table The table to add
   * @returns The new unique ID assigned to the table
   */
  private static addTableToModel(databaseModel: DatabaseModel, table: DatabaseTable): string {
    const newId = `table_${databaseModel.entries.length}`;
    databaseModel.entries.push({
      id: newId,
      table
    });
    return newId;
  }

  // TODO: Currently unused
  /**
   * Remove a table from the database model by its ID
   * @param databaseModel The database model to modify
   * @param id The unique ID of the table to remove
   * @returns True if the table was removed, false if not found
   */
  private static removeTableFromModel(databaseModel: DatabaseModel, id: string): boolean {
    const index = databaseModel.entries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      databaseModel.entries.splice(index, 1);
      return true;
    }
    return false;
  }

  // TODO: Currently unused
  /**
   * Get all duplicates of a specific table
   * @param databaseModel The database model
   * @param tableId The ID of the reference table
   * @returns Array of database table entries that are duplicates of the specified table
   */
  private static getDuplicatesOf(databaseModel: DatabaseModel, tableId: string): DatabaseModelEntry[] {
    const referenceTable = this.getTableById(databaseModel, tableId);
    if (!referenceTable || !referenceTable.table.duplicates) {
      return [];
    }
    
    return referenceTable.table.duplicates
      .map(duplicateId => this.getTableById(databaseModel, duplicateId))
      .filter((entry): entry is DatabaseModelEntry => entry !== undefined);
  }

  // TODO: Currently unused
  /**
   * Check if a table is marked as a duplicate
   * @param databaseModel The database model
   * @param tableId The ID of the table to check
   * @returns True if the table is a duplicate, false otherwise
   */
  private static isDuplicateTable(databaseModel: DatabaseModel, tableId: string): boolean {
    const table = this.getTableById(databaseModel, tableId);
    return table?.table.isDuplicate === true;
  }

  // TODO: Currently unused
  /**
   * Get the reference table for a duplicate table
   * @param databaseModel The database model
   * @param duplicateId The ID of the duplicate table
   * @returns The reference table entry, or undefined if not found or not a duplicate
   */
  private static getReferenceTable(databaseModel: DatabaseModel, duplicateId: string): DatabaseModelEntry | undefined {
    const duplicateTable = this.getTableById(databaseModel, duplicateId);
    if (!duplicateTable || !duplicateTable.table.isDuplicate || !duplicateTable.table.duplicateOf) {
      return undefined;
    }
    
    return this.getTableById(databaseModel, duplicateTable.table.duplicateOf);
  }

  // TODO: Currently unused
  /**
   * Get duplicate statistics for the database model
   * @param databaseModel The database model
   * @returns Object with duplicate statistics
   */
  private static getDuplicateStatistics(databaseModel: DatabaseModel): {
    totalTables: number;
    referenceTables: number;
    duplicateTables: number;
    duplicateGroups: number;
    averageDuplicatesPerGroup: number;
  } {
    const referenceTables = DBModelUtils.getReferenceTables(databaseModel);
    const duplicateTables = databaseModel.entries.filter(entry => entry.table.isDuplicate);
    const duplicateGroups = referenceTables.filter(entry => entry.table.duplicates && entry.table.duplicates.length > 0);
    
    const totalDuplicatesInGroups = duplicateGroups.reduce((sum, entry) => 
      sum + (entry.table.duplicates?.length || 0), 0);
    
    return {
      totalTables: databaseModel.entries.length,
      referenceTables: referenceTables.length,
      duplicateTables: duplicateTables.length,
      duplicateGroups: duplicateGroups.length,
      averageDuplicatesPerGroup: duplicateGroups.length > 0 ? totalDuplicatesInGroups / duplicateGroups.length : 0
    };
  }
}
