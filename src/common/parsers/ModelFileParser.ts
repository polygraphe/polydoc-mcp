import * as fs from "fs/promises";
import {
  DatabaseTable,
  DatabaseField,
  Relationship
} from '../../domain/models/databaseModels.js';

export class ModelFileParser {
  // Parse TypeScript/JavaScript model files (Sequelize, TypeORM, Prisma, etc.)
  public async parseModelFile(filePath: string): Promise<DatabaseTable[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const entities: DatabaseTable[] = [];

    // Parse TypeORM entities
    if (content.includes('@Entity')) {
      const entity = this.parseTypeORMEntity(content, filePath);
      if (entity) entities.push(entity);
    }

    // Parse Sequelize models
    if (content.includes('sequelize.define') || content.includes('DataTypes')) {
      const entity = this.parseSequelizeModel(content, filePath);
      if (entity) entities.push(entity);
    }

    // Parse Prisma models (if it's a schema file)
    if (content.includes('model ') && filePath.endsWith('.prisma')) {
      const prismaEntities = this.parsePrismaSchema(content, filePath);
      entities.push(...prismaEntities);
    }

    return entities;
  }

  private parseTypeORMEntity(content: string, filePath: string): DatabaseTable | null {
    const entityMatch = content.match(/@Entity\(['"]?(\w+)['"]?\)[\s\S]*?class\s+(\w+)/);
    if (!entityMatch) return null;

    const tableName = entityMatch[1] || entityMatch[2];
    const className = entityMatch[2];

    const fields = this.parseTypeORMFields(content);
    const relationships = this.parseTypeORMRelationships(content);

    return {
      name: tableName,
      fields,
      relationships,
      constraints: [],
      referenceFiles: [{ filePath, type: 'model' }]
    };
  }

  private parseSequelizeModel(content: string, filePath: string): DatabaseTable | null {
    const modelMatch = content.match(/sequelize\.define\(['"](\w+)['"]|Model\s+extends\s+.*\s*\{[\s\S]*?static\s+init.*['"](\w+)['"]/);
    if (!modelMatch) return null;

    const modelName = modelMatch[1] || modelMatch[2];
    const fields = this.parseSequelizeFields(content);

    return {
      name: modelName,
      fields,
      relationships: [],
      constraints: [],
      referenceFiles: [{ filePath, type: 'model' }]
    };
  }

  private parsePrismaSchema(content: string, filePath: string): DatabaseTable[] {
    const entities: DatabaseTable[] = [];
    const modelMatches = content.match(/model\s+(\w+)\s*\{([\s\S]*?)\}/g);

    if (modelMatches) {
      for (const match of modelMatches) {
        const nameMatch = match.match(/model\s+(\w+)/);
        if (nameMatch) {
          const modelName = nameMatch[1];
          const fields = this.parsePrismaFields(match);
          const relationships = this.parsePrismaRelationships(match);

          entities.push({
            name: modelName,
            fields,
            relationships,
            constraints: [],
            referenceFiles: [{ filePath, type: 'schema' }]
          });
        }
      }
    }

    return entities;
  }

  private parseTypeORMFields(content: string): DatabaseField[] {
    const fields: DatabaseField[] = [];

    // Match @Column decorators with their field declarations
    const decoratorPattern = /@(PrimaryGeneratedColumn|Column)\([^)]*\)[\s\S]*?(\w+):\s*(\w+)/g;
    let match;

    while ((match = decoratorPattern.exec(content)) !== null) {
      const decorator = match[1];
      const name = match[2];
      const type = match[3];
      const decoratorContent = match[0];

      fields.push({
        name,
        type,
        nullable: !decoratorContent.includes('nullable: false') && !decoratorContent.includes('@PrimaryGeneratedColumn'),
        primaryKey: decorator === 'PrimaryGeneratedColumn' || decoratorContent.includes('primary: true')
      });
    }

    // Also catch simple @Column() decorators without parameters
    const simpleColumnPattern = /@Column\(\)[\s\S]*?(\w+):\s*(\w+)/g;
    while ((match = simpleColumnPattern.exec(content)) !== null) {
      const name = match[1];
      const type = match[2];

      // Avoid duplicates
      if (!fields.find(f => f.name === name)) {
        fields.push({
          name,
          type,
          nullable: true,
          primaryKey: false
        });
      }
    }

    return fields;
  }

  private parseSequelizeFields(content: string): DatabaseField[] {
    const fields: DatabaseField[] = [];
    // This is a simplified parser - you'd want to make it more robust
    const fieldMatches = content.match(/(\w+):\s*\{[\s\S]*?type:\s*DataTypes\.(\w+)/g);

    if (fieldMatches) {
      for (const match of fieldMatches) {
        const nameMatch = match.match(/(\w+):/);
        const typeMatch = match.match(/DataTypes\.(\w+)/);

        if (nameMatch && typeMatch) {
          fields.push({
            name: nameMatch[1],
            type: typeMatch[1],
            nullable: !match.includes('allowNull: false'),
            primaryKey: match.includes('primaryKey: true')
          });
        }
      }
    }

    return fields;
  }

  private parsePrismaFields(modelContent: string): DatabaseField[] {
    const fields: DatabaseField[] = [];
    const fieldMatches = modelContent.match(/(\w+)\s+(\w+)(\??)\s*(@\w+.*)?/g);

    if (fieldMatches) {
      for (const match of fieldMatches) {
        const parts = match.trim().split(/\s+/);
        if (parts.length >= 2 && parts[0] !== 'model') {
          fields.push({
            name: parts[0],
            type: parts[1].replace('?', ''),
            nullable: parts[1].includes('?'),
            primaryKey: match.includes('@id')
          });
        }
      }
    }

    return fields;
  }

  private parseTypeORMRelationships(content: string): Relationship[] {
    const relationships: Relationship[] = [];

    // Match relationship decorators
    const relationshipPattern = /@(OneToMany|ManyToOne|OneToOne|ManyToMany)\([^)]*\)[\s\S]*?(\w+):\s*(\w+)/g;
    let match;

    while ((match = relationshipPattern.exec(content)) !== null) {
      const relationType = match[1];
      const fieldName = match[2];
      const targetType = match[3];

      let type: Relationship['type'];
      switch (relationType) {
        case 'OneToMany':
          type = 'hasMany';
          break;
        case 'ManyToOne':
          type = 'belongsTo';
          break;
        case 'OneToOne':
          type = 'hasOne';
          break;
        case 'ManyToMany':
          type = 'manyToMany';
          break;
        default:
          continue;
      }

      relationships.push({
        type,
        target: targetType
      });
    }

    return relationships;
  }

  private parsePrismaRelationships(modelContent: string): Relationship[] {
    const relationships: Relationship[] = [];
    // Simplified Prisma relationship parsing
    const relMatches = modelContent.match(/(\w+)\s+(\w+)(\[\])?\s*@relation/g);

    if (relMatches) {
      for (const match of relMatches) {
        const parts = match.split(/\s+/);
        if (parts.length >= 2) {
          const isArray = match.includes('[]');
          relationships.push({
            type: isArray ? 'hasMany' : 'hasOne',
            target: parts[1].replace('[]', '')
          });
        }
      }
    }

    return relationships;
  }
}