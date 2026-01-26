# Changelog

All notable changes to the Polydoc MCP Server project will be documented in this file.

## [1.1.0] - 2025-07-09

### Added
- **New comprehensive tool**: `build-database-documentation` 
  - Orchestrates multiple analysis tools for complete documentation
  - Executive summary with key metrics and statistics
  - File structure visualization with tree view
  - Multiple output formats: Markdown, JSON, and HTML
  - Detailed file analysis results with success/error tracking
  - Enhanced visualization with emojis and better formatting
  - Configurable analysis options for future extensibility
  - Relationship type distribution analysis
  - Field statistics (primary keys, foreign keys, nullable fields)

### Enhanced
- **Improved documentation**: Added comprehensive usage examples and best practices
- **Better error handling**: More detailed error reporting in file analysis
- **Future-ready architecture**: Designed to integrate upcoming features like:
  - Relationship diagrams
  - SQL performance analysis
  - Migration tracking
  - Performance optimization hints

### Technical Improvements
- Enhanced TypeScript interfaces for better type safety
- Modular documentation generation functions
- Improved HTML output with modern CSS styling
- Better file tree generation algorithm

## [1.0.0] - 2025-07-09

### Added
- Initial release of Polydoc MCP Server
- **Core tools**:
  - `scan-database-files`: Basic database file scanning and documentation
  - `get-entity-details`: Specific entity information lookup
- **Multi-framework support**:
  - TypeORM entities with decorators
  - Sequelize models
  - Prisma schema files
  - Raw SQL migration files
- **Documentation formats**: Markdown and JSON output
- **Database parsing**: Field analysis, relationship detection, constraint identification
- **File pattern matching**: Automatic detection of database-related files
- **MCP integration**: Full Model Context Protocol compatibility
- **Setup automation**: Automated Claude Desktop configuration

### Framework Support
- TypeORM (`@Entity`, `@Column`, `@OneToMany`, etc.)
- Sequelize (`sequelize.define`, `DataTypes`)
- Prisma (`model` definitions, relationships)
- SQL migrations (CREATE TABLE statements)

### Infrastructure
- TypeScript development environment
- Automated build process
- Example project structure
- Comprehensive documentation
- Setup scripts for easy installation

---

## Future Roadmap

### [1.2.0] - Planned
- 📊 **Relationship Diagrams**: Visual ER diagram generation
- 🔍 **Advanced SQL Analysis**: Query optimization and performance hints
- 🧪 **Test Coverage Analysis**: Database test coverage tracking

### [1.3.0] - Planned
- 🔄 **Migration Tracking**: Schema change analysis over time
- 📈 **Usage Analytics**: Database usage patterns and recommendations
- 🔒 **Security Analysis**: Security best practices checking

### [1.4.0] - Planned
- 🌐 **Web Dashboard**: Interactive web interface for documentation
- 🔄 **Real-time Updates**: Live documentation updates
- 📤 **Export Options**: PDF, Word, and other export formats

---

**Legend:**
- 🆕 New Feature
- ✨ Enhancement
- 🐛 Bug Fix
- 🔧 Technical Improvement
- 📚 Documentation
- 🚀 Performance Improvement
