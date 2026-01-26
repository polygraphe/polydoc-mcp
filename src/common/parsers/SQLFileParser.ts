import * as fs from "fs/promises";
import {
  DatabaseTable,
  DatabaseField,
  Relationship,
  Constraint
} from '../../domain/models/databaseModels.js';
import { SQL_PATTERN_REGEX } from "./sqlPatterns.js";

export class SQLFileParser {

  public async parseSQLFile(filePath: string): Promise<DatabaseTable[]> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const tables = this.extractTables(fileContent);
    const entities: DatabaseTable[] = [];

    for (const table of tables) {
      const entity = this.parseTable(filePath, table);
      entities.push(entity);
    }

    // Infer reverse belongsTo → hasOne / hasMany
    this.inferReverseRelationships(entities);

    // Infer many-to-many relationships from join tables
    this.inferManyToManyRelationships(entities);

    return entities;
  }

  private extractTables(fileContent: string): string[] {
    return Array
      .from(fileContent.matchAll(SQL_PATTERN_REGEX.table))
      .map(match => match[0]);
  }

  private parseTable(filePath: string, table: string): DatabaseTable {
    const tableName = this.extractTableName(table);
    const fields: DatabaseField[] = [];
    const constraints: Constraint[] = [];
    const relationships: Relationship[] = [];

    const lines = this.extractTableLines(table);
    const { foreignKeys } = this.extractConstraints(lines, constraints, relationships);
    this.extractFields(lines, foreignKeys, fields, constraints, relationships);

    return {
      name: tableName,
      fields,
      relationships,
      constraints: constraints,
      referenceFiles: [{ filePath, type: 'migration' }]
    }
  }

  private extractTableName(table: string): string {
    const tableNameMatch = table.match(SQL_PATTERN_REGEX.tableName);
    return tableNameMatch?.[1] ?? '';
  }

  private extractTableLines(table: string): string[] {
    const body = table
      .replace(/CREATE TABLE\s+\w+\s*\(/i, '')
      .replace(/\)\s*;?\s*$/s, '')
      .trim();

    return body.split(/,(?![^(]*\))/).map(line => line.trim());
  }

  private extractConstraints(lines: string[], constraints: Constraint[], relationships: Relationship[]): {
    foreignKeys: Map<string, string>
  } {
    const foreignKeys = new Map<string, string>();

    for (const line of lines) {
      if (SQL_PATTERN_REGEX.primaryKey.test(line)) {
        this.extractPrimaryKeyConstraint(line, constraints);
      }
      if (SQL_PATTERN_REGEX.foreignKey.test(line)) {
        this.extractForeignKeyConstraint(line, foreignKeys, constraints, relationships);
      }
      if (SQL_PATTERN_REGEX.unique.test(line)) {
        this.extractUniqueConstraint(line, constraints);
      }
    }

    return { foreignKeys }
  }

  private extractPrimaryKeyConstraint(line: string, constraints: Constraint[]) {
    const match = line.match(SQL_PATTERN_REGEX.primaryKey);
    if (match) {
      const constraintName = match[2] || '';
      const columns = match[3].split(',').map(c => c.trim());

      constraints.push({
        type: "primary_key",
        name: constraintName,
        columns
      });
    }
  }

  private extractForeignKeyConstraint(line: string, foreignKeys: Map<string, string>, constraints: Constraint[], relationships: Relationship[]) {
    const match = line.match(SQL_PATTERN_REGEX.foreignKey);
    if (match) {
      const constraintName = match[2] || '';
      const localColumns = match[3].split(',').map(c => c.trim());
      const targetTable = match[4].trim();
      const targetColumns = match[5].split(',').map(c => c.trim());

      localColumns.forEach(col => foreignKeys.set(col, targetTable));

      constraints.push({
        type: 'foreign_key',
        name: constraintName,
        columns: localColumns
      });

      relationships.push({
        type: 'belongsTo',
        target: targetTable,
        foreignKey: localColumns.join(', '),
        description: `FK to ${targetTable}(${targetColumns.join(', ')})`
      });
    }
  }

  private extractUniqueConstraint(line: string, constraints: Constraint[]) {
    const match = line.match(SQL_PATTERN_REGEX.unique);
    if (match) {
      const constraintName = match[2] || '';
      const columns = match[3].split(',').map(c => c.trim().toLowerCase());

      constraints.push({
        type: 'unique',
        name: constraintName,
        columns
      });
    }
  }

  private extractFields(lines: string[], foreignKeys: Map<string, string>, fields: DatabaseField[], constraints: Constraint[], relationships: Relationship[]) {
    for (const line of lines) {
      if (SQL_PATTERN_REGEX.anyConstraints.test(line)) {
        continue; // already handled in first pass
      }

      const match = line.match(SQL_PATTERN_REGEX.column);
      if (match) {
        const [, name, type, rest] = match;
        const defaultMatch = rest.match(/DEFAULT\s+([^\s,]+)/i);
        const defaultValue = defaultMatch?.[1];

        if (SQL_PATTERN_REGEX.columnPrimaryKey.test(rest)) {
          constraints.push({
            type: 'primary_key',
            name: '',
            columns: [name]
          });
        }

        if (SQL_PATTERN_REGEX.columnUnique.test(rest)) {
          constraints.push({
            type: 'unique',
            name: '',
            columns: [name]
          });
        }

        if (SQL_PATTERN_REGEX.columnForeignKey.test(rest)) {
          const foreignKeyMatch = rest.match(SQL_PATTERN_REGEX.columnForeignKey);
          if (foreignKeyMatch) {
            const targetTable = foreignKeyMatch[1];
            const targetColumn = foreignKeyMatch[2];

            foreignKeys.set(name, targetTable);

            constraints.push({
              type: 'foreign_key',
              name: '',
              columns: [name],
            });

            relationships.push({
              type: 'belongsTo',
              target: targetTable,
              foreignKey: name,
              description: `FK to ${targetTable}(${targetColumn})`
            });
          }
        }

        fields.push({
          name: name,
          type: type,
          nullable: !SQL_PATTERN_REGEX.columnNotNullable.test(rest),
          primaryKey: this.isPrimaryKey(name, constraints),
          foreignKey: foreignKeys.get(name),
          defaultValue
        });
      }
    }
  }

  private isPrimaryKey(fieldName: string, constraints: Constraint[]): boolean {
    return constraints.some(constraint =>
      constraint.type === 'primary_key' &&
      constraint.columns.includes(fieldName)
    );
  }

  private inferReverseRelationships(tables: DatabaseTable[]): void {
    for (const sourceTable of tables) {
      for (const otherTable of tables) {
        if (sourceTable.name === otherTable.name) continue;

        for (const relationship of otherTable.relationships) {
          if (relationship.type !== 'belongsTo' || relationship.target !== sourceTable.name) continue;

          const foreignKey = otherTable.fields.find(f => f.name === relationship.foreignKey);
          const isUnique = foreignKey && otherTable.constraints.some(constraint =>
            constraint.type === 'unique' &&
            constraint.columns.length === 1 &&
            constraint.columns[0] === foreignKey.name
          );

          const alreadyExists = sourceTable.relationships.some(relationship =>
            relationship.target === otherTable.name &&
            (relationship.type === 'hasOne' || relationship.type === 'hasMany')
          );

          if (!alreadyExists) {
            sourceTable.relationships.push({
              type: isUnique ? 'hasOne' : 'hasMany',
              target: otherTable.name,
              foreignKey: foreignKey?.name,
              description: `${sourceTable.name} ${isUnique ? 'hasOne' : 'hasMany'} ${otherTable.name}`
            });
          }
        }
      }
    }
  }

  private inferManyToManyRelationships(tables: DatabaseTable[]): void {
    const tableMap = new Map<string, DatabaseTable>(
      tables.map(table => [table.name, table])
    );

    for (const table of tables) {
      const fkConstraints = table.constraints.filter(constraint => constraint.type === 'foreign_key');

      // Must have exactly 2 FKs and 2 fields
      if (fkConstraints.length !== 2 || table.fields.length !== 2) continue;

      const [fk1, fk2] = fkConstraints;
      const [refA, refB] = fk1.columns.concat(fk2.columns).map(column =>
        table.relationships.find(r => r.foreignKey === column)?.target
      );

      if (!refA || !refB || refA === refB) continue;

      const relA = tableMap.get(refA);
      const relB = tableMap.get(refB);

      if (!relA || !relB) continue;

      const hasRelAtoB = relA && relA.relationships.some(r => r.target === refB && r.type === 'manyToMany');
      const hasRelBtoA = relB && relB.relationships.some(r => r.target === refA && r.type === 'manyToMany');


      if (!hasRelAtoB) {
        relA.relationships.push({
          type: 'manyToMany',
          target: refB,
          description: `Many ${relA.name} are related to many ${relB.name} through join table ${table.name}`
        });
      }

      if (!hasRelBtoA) {
        relB.relationships.push({
          type: 'manyToMany',
          target: refA,
          description: `Many ${relB.name} are related to many ${relA.name} through join table ${table.name}`
        });
      }
    }
  }
}