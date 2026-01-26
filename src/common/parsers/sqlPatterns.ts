export const SQL_PATTERN_REGEX = {
  // Any constraint line
  anyConstraints: /^(PRIMARY KEY|UNIQUE|FOREIGN KEY|CHECK|CONSTRAINT)\b/i,

  // Create Table statement
  table: /CREATE TABLE\s+\w+\s*\([^;]+\);/gi,

  // Table name following Create Table statement
  tableName: /CREATE TABLE\s+(\w+)/i,

  // Primary Key with optional named constraint
  primaryKey: /^(CONSTRAINT\s+(\w+)\s+)?PRIMARY KEY\s*\(([^)]+)\)/i,

  // Unique constraint with optional named constraint
  unique: /^(CONSTRAINT\s+(\w+)\s+)?UNIQUE\s*\(([^)]+)\)/i,

  // Foreign Key with optional named constraint and multiple columns
  foreignKey: /^(CONSTRAINT\s+(\w+)\s+)?FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)/i,

  // Column definition
  column: /^(\w+)\s+([A-Z0-9()]+)(.*)$/i,
  columnPrimaryKey: /PRIMARY KEY/i,
  columnUnique: /UNIQUE/i,
  columnForeignKey: /REFERENCES\s+(\w+)\s*\(([^)]+)\)/i,
  columnNotNullable: /NOT NULL/i,
  columnDefault: /DEFAULT\s+([^\s,]+)/i,
};