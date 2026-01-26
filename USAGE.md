# Polydoc Usage Examples

This document provides practical examples of how to use the Polydoc MCP Server tools.

## 1. Basic Database Documentation

### Using the comprehensive tool (recommended)
```
Please use the build-database-documentation tool to analyze my project at /path/to/my/project
```

### With custom project name
```
Please use the build-database-documentation tool with:
- rootPath: "/path/to/my/project"
- projectName: "My E-commerce Platform"
- outputFormat: "markdown"
```

## 2. HTML Documentation for Sharing

```
Generate HTML documentation for my project at /path/to/my/project using the build-database-documentation tool with outputFormat set to "html"
```

## 3. JSON Output for Integration

```
Use the build-database-documentation tool with:
- rootPath: "/path/to/my/project"
- outputFormat: "json"
- analysisOptions: {"includeMetrics": true, "includeFileTree": true}
```

## 4. Custom File Patterns

```
Analyze my project at /path/to/my/project using build-database-documentation with additional patterns:
- includePatterns: ["**/*.graphql", "**/schema/*.yaml", "**/*.dbml"]
```

## 5. Minimal Analysis

```
Use build-database-documentation with:
- rootPath: "/path/to/my/project"
- analysisOptions: {"includeMetrics": false, "includeFileTree": false}
```

## 6. Specific Entity Lookup

```
Get details about the "User" entity in my project at /path/to/my/project using the get-entity-details tool
```

## 7. Quick File Scan

```
Use scan-database-files to quickly scan /path/to/my/project for database files
```

## Expected Output Examples

### Markdown Output Sample
```markdown
# My Project - Database Documentation

📅 **Generated on**: 2025-07-09T15:58:55.133Z
🔍 **Analysis completed**: 7/9/2025, 11:58:55 AM

## 📊 Executive Summary

- **Total Files Scanned**: 15
- **Database Entities Found**: 8
- **Successfully Parsed**: 14 files
- **Parse Errors**: 1 files
- **Total Relationships**: 12
- **Total Fields**: 45

## 📈 Database Metrics

### Entity Types Distribution
- **table**: 3
- **entity**: 4
- **model**: 1

### File Types Analyzed
- **.sql**: 5 files
- **.ts**: 8 files
- **.prisma**: 2 files
```

### JSON Output Sample
```json
{
  "projectName": "My Project",
  "generatedAt": "2025-07-09T15:58:55.133Z",
  "scannedFiles": ["models/User.ts", "models/Post.ts", "migrations/001_init.sql"],
  "entities": [...],
  "metrics": {
    "totalFiles": 15,
    "totalEntities": 8,
    "byType": {
      "table": 3,
      "entity": 4,
      "model": 1
    }
  }
}
```

## Integration with Claude Desktop

Once configured in Claude Desktop, you can use natural language:

- "Please analyze my database structure in the current project"
- "Generate HTML documentation for my database models"
- "Show me details about the User entity"
- "Create comprehensive database documentation with all metrics"

## Future Features Preview

The `build-database-documentation` tool is designed to integrate future features:

### Coming Soon:
- 📊 **Relationship Diagrams**: Visual ER diagrams
- 🔍 **Advanced SQL Analysis**: Query optimization hints
- ⚡ **Performance Hints**: Index recommendations
- 🔄 **Migration Analysis**: Schema change tracking
- 🧪 **Test Coverage**: Database test analysis

### Usage Preview:
```
Use build-database-documentation with:
- rootPath: "/path/to/my/project"
- analysisOptions: {
    "includeRelationshipDiagram": true,
    "includePerformanceHints": true,
    "includeSqlAnalysis": true
  }
```

## Troubleshooting

### No Files Found
```
No database-related files found in the specified path. Make sure the path contains models, migrations, or schema files.
```
**Solution**: Ensure your project has database files in standard locations or use `includePatterns` to specify custom locations.

### Parse Errors
Check the "File Analysis Results" section in the output to see which files had parsing errors and why.

### Entity Not Found
```
Entity "UserModel" not found. Available entities: User, Post, Comment
```
**Solution**: Use the exact entity name as defined in your code, or check the available entities list.

## Best Practices

1. **Use the comprehensive tool**: `build-database-documentation` provides the most complete analysis
2. **Start with default settings**: The default options work well for most projects
3. **Use HTML for sharing**: Generate HTML documentation for non-technical stakeholders
4. **Regular updates**: Re-run documentation generation after major schema changes
5. **Custom patterns**: Use `includePatterns` for non-standard file locations
6. **JSON for automation**: Use JSON output for CI/CD integration or automated processing
