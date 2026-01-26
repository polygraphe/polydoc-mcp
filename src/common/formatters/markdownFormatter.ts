import { POLYDOC_VERSION } from "../../config.js";
import { DatabaseTable } from "../../domain/models/databaseModels.js";

export function generateMarkdownDocumentation(
  projectName: string,
  entities: DatabaseTable[],
  metrics: any,
  fileTree: string,
  fileAnalysis: any[],
  options: any
): string {
  // Create YAML front-matter
  let doc = `---\n`;  // Start YAML front-matter
  doc += `title: Database schema for project ${projectName}\n`;
  doc += `description: Enhanced documentation of database entities.\n`;
  doc += `tables:\n`;
  
  // Indentation constants for YAML
  const level1 = '  ';
  const level2 = '    ';
  const level3 = '      ';
  // Add each entity as a table in the YAML front-matter
  for (const entity of entities) {
    doc += `${level1}- name: "${entity.name}"\n`;
    doc += `${level1}  description: "${entity.description || ''}"\n`;
    // Add sampledata section
    doc += `${level1}  sampledata:\n`;
    if (Array.isArray(entity.sampledata) && entity.sampledata.length > 0) {
      for (const sample of entity.sampledata) {
        doc += `${level1}    - context: "${sample.context || ''}"\n`;
        doc += `${level1}      columnname: "${sample.columnname || ''}"\n`;
        doc += `${level1}      columnvalue: "${sample.columnvalue || ''}"\n`;
      }
    } else {
      doc += `${level1}    []\n`;
    }

    // Add relations section
    doc += `${level1}  relations:\n`;
    if (Array.isArray(entity.relationships) && entity.relationships.length > 0) {
      for (const rel of entity.relationships) {
        const relationshipTypes: Record<string, string> = {
          hasOne: 'HAS ONE',
          hasMany: 'HAS MANY',
          belongsTo: 'BELONGS TO',
          manyToMany: 'MANY TO MANY'
        };

        if (rel.foreignKey) {
          const relType = relationshipTypes[rel.type] || 'RELATED TO';
          const relationshipText = `${relType}: ${rel.target}${` (${rel.foreignKey})`}`;

          doc += `${level1}    - foreign Key: "${relationshipText}"\n`;
          doc += `${level1}      description: "${rel.description}"\n`;
        }
      }
    } else {
      doc += `${level1}    []\n`;
    }

    // Add columns section at the same level as sampledata and relations
    doc += `${level1}  columns:\n`;
    if (entity.fields.length > 0) {
      for (const field of entity.fields) {
        doc += `${level1}    - name: "${field.name}"\n`;
        doc += `${level1}      type: "${field.type}"\n`;
        // Build constraints array
        const constraints = [];
        if (field.primaryKey) constraints.push('PRIMARY_KEY');
        if (field.foreignKey) constraints.push('FOREIGN_KEY');
        if (!field.nullable) constraints.push('NOT_NULL');
        if (field.defaultValue) constraints.push('DEFAULT');
        doc += `${level1}      constraints: [${constraints.map(c => `"${c}"`).join(', ')}]\n`;
        // Add mapping if there's a foreign key or specific mapping logic
        if (field.foreignKey) {
          doc += `${level1}      mapping: { foreignKey: "${field.foreignKey}" }\n`;
        } else {
          doc += `${level1}      mapping: {}\n`;
        }
      }
    } else {
      doc += `${level1}    []\n`;
    }
  }
  
  doc += `ContextErrors:\n`;
  doc += `lastError: null\n`;
  doc += `---\n\n`; // End YAML front-matter
  // Markdown line separator before content
  doc += `-------------------------------------------------------------------------------------\n\n`;
  // Start the markdown content
  // Add environment variable value to the title if present
  const env = process.env.NODE_ENV  || 'no environment';
  doc += `# ${projectName} - Database Documentation (${env})\n\n`;

  doc += `**Generated on**: ${new Date().toISOString()}\n`;
  doc += `**Analysis completed**: ${new Date().toLocaleString()}\n\n`;
  // Executive Summary
  doc += `## Executive Summary\n\n`;
  doc += `- **Total Files Scanned**: ${metrics.totalFiles}\n`;
  doc += `- **Database Entities Found**: ${metrics.totalEntities}\n`;
  doc += `- **Successfully Parsed**: ${metrics.successfullyParsedFiles} files\n`;
  doc += `- **Parse Errors**: ${metrics.failedFiles} files\n`;
  doc += `- **Total Relationships**: ${metrics.relationships.total}\n`;
  doc += `- **Total Fields**: ${metrics.fields.total}\n\n`;
  
  // Debug information section (only in non-production environments)
  if (options.includeMetrics && options.enableDebugInfo !== false) {
    doc += `## Debug information\n\n`;
    doc += `### Field Statistics\n\n`;
    doc += `- **Total Fields**: ${metrics.fields.total}\n`;
    doc += `- **Primary Keys**: ${metrics.fields.primaryKeys}\n`;
    doc += `- **Foreign Keys**: ${metrics.fields.foreignKeys}\n`;
    doc += `- **Nullable Fields**: ${metrics.fields.nullable}\n\n`;
  }
  // File Tree Section
  if (options.includeFileTree && fileTree) {
    doc += `## Database Files Structure\n\n`;
    doc += '```\n';
    doc += fileTree;
    doc += '```\n\n';
  }
  // File Analysis Results
  doc += `## File Analysis Results\n\n`;
  
  // Add file types summary with type information
  doc += `### File Types Analyzed\n\n`;
  doc += '| Extension | Files | Type |\n';
  doc += '|-----------|-------|------|\n';
  for (const [ext, info] of Object.entries(metrics.byFileType)) {
    // info now contains both count and type from fileScan.ts
    const count = typeof info === 'object' && info !== null && 'count' in info ? info.count : info;
    const type = typeof info === 'object' && info !== null && 'type' in info ? info.type : 'unknown';
    doc += `| **${ext || 'no extension'}** | ${count} | ${type} |\n`;
  }
  doc += '\n';
  
  doc += '| File | Status | Entities Found | Notes |\n';
  doc += '|------------------------------------------------------|--------|----------------|-------|\n';
  for (const analysis of fileAnalysis) {
    const status = analysis.status === 'success' ? 'SUCCESS' : 'FAILED';
    const notes = analysis.error || '-';
    doc += `| ${analysis.file} | ${status} | ${analysis.entities} | ${notes} |\n`;
  }
  doc += '\n';
  
  // Database documentation section with metrics
  if (options.includeMetrics) {
    doc += `## Database documention\n\n`;
    doc += `### Relationship Types\n\n`;
    for (const [relType, count] of Object.entries(metrics.relationships.byType)) {
      doc += `- **${relType}**: ${count}\n`;
    }
    doc += '\n';
  }
  // Detailed Entity Documentation
  doc += `## Database Entities\n\n`;
  // Group by reference file types
  const grouped = entities.reduce((acc, entity) => {
    // For each entity, group by all its reference file types
    const types = entity.referenceFiles.map(ref => ref.type);
    const primaryType = types[0] || 'unknown'; // Use first type as primary
    if (!acc[primaryType]) acc[primaryType] = [];
    acc[primaryType].push(entity);
    return acc;
  }, {} as Record<string, DatabaseTable[]>);
  for (const [type, typeEntities] of Object.entries(grouped) as [string, DatabaseTable[]][]) {
    doc += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
    for (const entity of typeEntities) {
      doc += `#### ${entity.name}\n\n`;
      
      // Show all reference files
      if (entity.referenceFiles.length > 0) {
        doc += `**Reference Files**:\n`;
        for (const ref of entity.referenceFiles) {
          doc += `- **${ref.type}**: \`${ref.filePath}\`\n`;
        }
        doc += '\n';
      }
      if (entity.description) {
        doc += `**Description**: ${entity.description}\n\n`;
      }
      if (entity.fields.length > 0) {
        doc += '##### Fields\n\n';
        doc += '| Name | Type | Nullable | Primary Key | Foreign Key | Default |\n';
        doc += '|------|------|----------|-------------|-------------|---------|\n';
        for (const field of entity.fields) {
          doc += `| ${field.name} | \`${field.type}\` | ${field.nullable ? 'YES' : 'NO'} | ${field.primaryKey ? 'PRIMARY' : 'NO'} | ${field.foreignKey || '-'} | ${field.defaultValue || '-'} |\n`;
        }
        doc += '\n';
      }
      if (entity.relationships.length > 0) {
        doc += '##### Relationships\n\n';
        for (const rel of entity.relationships) {
          const relationshipTypes: Record<string, string> = {
            hasOne: 'HAS ONE',
            hasMany: 'HAS MANY',
            belongsTo: 'BELONGS TO',
            manyToMany: 'MANY TO MANY'
          };
          const relType = relationshipTypes[rel.type] || 'RELATED TO';
          doc += `- **${relType}**: \`${rel.target}\`${rel.foreignKey ? ` (${rel.foreignKey})` : ''}\n`;
        }
        doc += '\n';
      }
      if (entity.constraints.length > 0) {
        doc += '##### Constraints\n\n';
        for (const constraint of entity.constraints) {
          doc += `- **${constraint.type}**: ${constraint.name} on [${constraint.columns.join(', ')}]\n`;
        }
        doc += '\n';
      }
    }
  }
  
  doc += `---\n\n`;
  doc += `*Documentation generated by Polydoc MCP Server v${POLYDOC_VERSION}*\n`;
  
  return doc;
}
