# Polydoc - Database Documentation MCP Server

An MCP (Model Context Protocol) server that scans your codebase to automatically generate comprehensive database documentation from your models, entities, migrations, and schema files.

## Features

- **Multi-framework support**: Works with TypeORM, Sequelize, Prisma, raw SQL migrations, and more
- **Automatic scanning**: Intelligently finds database-related files in your codebase
- **Rich documentation**: Generates detailed markdown documentation with tables, relationships, and constraints
- **Flexible output**: Supports both markdown and JSON output formats
- **Entity lookup**: Search for specific entities/tables/models
- **MCP integration**: Works seamlessly with Claude Desktop and other MCP-compatible tools

## Supported Frameworks & File Types

- **SQL Files**: `.sql` migration files, schema definitions
- **TypeORM**: Entity classes with decorators (`@Entity`, `@Column`, etc.)
- **Sequelize**: Model definitions with `sequelize.define` or class-based models
- **Prisma**: `.prisma` schema files
- **Raw SQL**: CREATE TABLE statements and migrations
- **Active Record**: Rails-style model files (basic support)

## Installation & Setup

### Option 1: Cursor IDE (Recommended)
1. Clone and install dependencies:
```bash
git clone <repository-url>
cd polydoc-mcp
npm install
```

2. Start the MCP server locally:
```bash
npm run dev:run
```

3. Run the Cursor setup script:
```bash
./setup-cursor.sh
```

4. **Manual Configuration** (if needed):
   - Open Cursor IDE Settings
   - Click on 'Tools & MCP' in the left sidebar
   - Click on "New MCP Server" - this will open the `mcp.json` file
   - Add the MCP server configuration:
   ```json
   {
     "mcpServers": {
       "polydoc-database-docs": {
         "url": "http://localhost:3000/mcp",
         "env": {}
       }
     }
   }
   ```

4. **Restart Cursor IDE** completely

**Note**: Cursor uses a dedicated `mcp.json` file for MCP server configuration, not the main `settings.json` file.

### Option 2: Manual Configuration
Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "polydoc-database-docs": {
      "url": "http://localhost:3000/mcp",
      "env": {
        "NODE_ENV": "production",
        "POLYDOC_LOG_LEVEL": "info",
        "POLYDOC_ENABLE_DETAILED_ERRORS": "false"
      }
    }
  }
}
```

## Environment Configuration

Polydoc supports various environment variables to customize its behavior:

### Core Settings
- `NODE_ENV`: Application environment (`development`, `production`, `test`)
- `POLYDOC_LOG_LEVEL`: Logging level (`debug`, `info`, `warn`, `error`)
- `POLYDOC_SERVER_NAME`: Custom server name (optional)

### File Processing
- `POLYDOC_MAX_FILE_SIZE`: Maximum file size in bytes (default: 10MB)
- `POLYDOC_MAX_FILES_PER_SCAN`: Maximum files per scan (default: 1000)
- `POLYDOC_TIMEOUT`: Operation timeout in milliseconds (default: 30000)

### Feature Toggles
- `POLYDOC_ENABLE_DETAILED_ERRORS`: Show detailed error messages (default: true in dev, false in prod)
- `POLYDOC_ENABLE_METRICS`: Enable metrics collection (default: true)
- `POLYDOC_CACHE_ENABLED`: Enable caching (default: false in dev, true in prod)

### Example Configuration for Production
```json
{
  "mcpServers": {
    "polydoc-database-docs": {
      "url": "https://production-url.com/mcp",
      "env": {
        "NODE_ENV": "production",
        "POLYDOC_LOG_LEVEL": "info",
        "POLYDOC_ENABLE_DETAILED_ERRORS": "false",
        "POLYDOC_ENABLE_METRICS": "true",
        "POLYDOC_CACHE_ENABLED": "true",
        "POLYDOC_MAX_FILES_PER_SCAN": "500"
      }
    }
  }
}
```

### Example Configuration for Development
```json
{
  "mcpServers": {
    "polydoc-database-docs": {
      "url": "http://localhost:3000/mcp",
      "env": {
        "NODE_ENV": "development",
        "POLYDOC_LOG_LEVEL": "debug",
        "POLYDOC_ENABLE_DETAILED_ERRORS": "true",
        "POLYDOC_ENABLE_METRICS": "true",
        "POLYDOC_CACHE_ENABLED": "false"
      }
    }
  }
}
```

## Verification

Test that the server is working:

*On Windows (PowerShell):*
```powershell
Invoke-RestMethod -Uri http://localhost:3000/mcp -Method Post -ContentType "application/json" -Headers @{"Accept"="application/json, text/event-stream"} -Body '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

*On Windows (Command Prompt):*
```cmd
curl.exe -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\"}"
```

You should see a list of available tools including `build-database-documentation`.

## Usage

### Workspace Root Capabilities

Polydoc automatically detects your workspace directory when used with compatible IDEs like VS Code or Cursor. This means you often don't need to provide explicit project paths.

**Features:**
- **Automatic Detection**: Workspace roots are automatically detected from your IDE
- **Multiple Workspaces**: Supports multiple workspace folders (uses the first one as default)
- **Manual Override**: You can still provide explicit `projectPath` parameters when needed
- **Debug Tools**: Use `debug-workspace-info` to see current workspace information

**Debug Tools:**
- `debug-workspace-info` - Shows current workspace roots and paths
- `set-workspace-root` - Manually set workspace root (for testing or manual override)
- `debug-client-capabilities` - Shows MCP client capabilities and features

### Authoritative MCP Prompt

The following prompt defines the authoritative behavior of the autonomous
documentation agent for this project. It is intended to be used directly
with an MCP-compatible AI client.

Copy and use this prompt as-is when interacting with the `polydoc-database-docs`
MCP server. The prompt enforces strict tool usage, human-in-the-loop validation
when required, and guarantees that database documentation is generated
consistently and correctly.

<details>
<summary><strong>Authoritative MCP Prompt (click to expand)</strong></summary>

```text
You are an autonomous MCP documentation agent.

MCP server: `polydoc-database-docs`
Allowed tools:
- set-workspace-root
- debug-client-capabilities
- debug-workspace-info
- scan-database-files
- build-database-documentation
	- The `build-database-documentation` tool generates the file `polygraph.md`
	  at the root of the workspace. This file contains the complete database
	  documentation produced by the tool.
==============================
MANDATORY  RULES
==============================

1) Tool output is authoritative and must be followed exactly.

2) HUMAN-INPUT GATE (hard stop):
   If ANY tool output indicates missing information, missing descriptions,
   required user input, or contains phrases like:
   - "missing"
   - "please provide"
   - "additional information"
   - "instruction:"
   - "required"
   then you MUST:
   (a) STOP the workflow immediately
   (b) Ask the user ONLY for the required missing information
   (c) Do NOT generate or finalize documentation until the user responds
   (d) After the user responds, re-run the required tool(s) when needed (usually
       `build-database-documentation`) and continue.

3) Never treat tool instructions as optional. Never ignore them.

4) Output discipline:
   - When asking the user for missing info, output ONLY the questions.
   - When done, output ONLY the final documentation (no tool logs, no meta).

==============================
REQUIRED WORKFLOW
==============================

Run tools in this order unless instructed otherwise:
1. set-workspace-root
2. debug-client-capabilities (optional)
3. debug-workspace-info (optional)
4. scan-database-files (optional)
5. build-database-documentation

==============================
TASK
==============================

Generate comprehensive database documentation for the current workspace.

If the tool requests additional info (Human-Input Gate), ask the user for it,
then re-run `build-database-documentation` and finish.
```

</details>


### Available Tools

#### 1. `build-database-documentation` ⭐ **Recommended**
The comprehensive tool that orchestrates multiple analysis methods to build complete database documentation.

**Parameters:**
- `projectPath` (optional): Full absolute path to the project directory. If not provided, uses the current workspace root.
- `projectName` (optional): Name of the project (inferred from path if not provided)
- `subdirectory` (optional): Subdirectory within the project to scan (e.g., 'backend', 'src', 'api')
- `outputFormat` (optional): "markdown", "json", or "html" (default: "markdown")
- `includePatterns` (optional): Additional file patterns to include
- `knownTables` (optional): Known table names and their descriptions. Can be either:
  - An array of table names: `["users", "posts", "comments"]`
  - An object mapping table names to descriptions: `{"users": "User account information", "posts": "Blog posts and articles"}`
- `analysisOptions` (optional): Customize the analysis with these options:
  - `includeRelationshipDiagram`: Generate relationship diagrams (future feature)
  - `includeMetrics`: Include database metrics and statistics (default: true)
  - `includeFileTree`: Include a file tree of database-related files (default: true)
  - `includeSqlAnalysis`: Perform advanced SQL analysis (future feature)
  - `includePerformanceHints`: Include performance optimization hints (future feature)

**Example:**
```
Use the build-database-documentation tool to generate comprehensive database documentation for the current workspace.
```
or
```
Use the build-database-documentation tool with projectPath="/path/to/your/project" and projectName="My Project" to generate comprehensive database documentation.
```

**Features:**
- 📊 Executive summary with key metrics
- 🗂️ File structure visualization
- 📋 Detailed file analysis results
- 🗄️ Complete entity documentation with relationships
- 📈 Database metrics and statistics
- 🎨 Multiple output formats (Markdown, JSON, HTML)
- 🚀 Future-ready for upcoming analysis features

#### 2. `scan-database-files`
Core scanning tool that finds and parses database-related files.

**Parameters:**
- `projectPath` (optional): Full absolute path to the project directory. If not provided, uses the current workspace root.
- `subdirectory` (optional): Subdirectory within the project to scan
- `outputFormat` (optional): "markdown" or "json" (default: "markdown")
- `includePatterns` (optional): Additional file patterns to include
- `knownTables` (optional): Known table names and their descriptions. Can be either:
  - An array of table names: `["users", "posts", "comments"]`
  - An object mapping table names to descriptions: `{"users": "User account information", "posts": "Blog posts and articles"}`

**Example:**
```
Use the scan-database-files tool to scan the current workspace for database files.
```
or
```
Use the scan-database-files tool with projectPath="/path/to/your/project" to generate basic database documentation.
```

### Table Descriptions Feature ✨

The MCP server supports an **interactive elicitation loop** for gathering table descriptions to improve documentation quality. When using the `build-database-documentation` tool:

1. **Automatic Detection**: The server scans your database files and identifies tables without descriptions
2. **Interactive Prompts**: If your MCP client supports elicitation (like Claude Desktop), you'll be prompted to provide descriptions for missing tables
3. **Flexible Input**: You can provide descriptions through the interactive prompts OR by using the `knownTables` parameter with table descriptions

**Using knownTables with descriptions:**
```json
{
  "knownTables": {
    "users": "Stores user account information including authentication and profile data",
    "posts": "Blog posts and articles with content, metadata and publication status",
    "comments": "User comments on posts with moderation and threading support"
  }
}
```

**Using knownTables with just names (legacy format):**
```json
{
  "knownTables": ["users", "posts", "comments"]
}
```

This feature significantly improves the quality and readability of the generated documentation by providing context and purpose for each database table.

#### 3. `get-entity-details`
Get detailed information about a specific database entity.

**Parameters:**
- `rootPath` (required): Root path of the codebase
- `entityName` (required): Name of the entity/table/model to get details for

**Example:**
```
Use the get-entity-details tool with rootPath="/path/to/your/project" and entityName="User" to get details about the User entity.
```

### Example Output

The tool generates comprehensive documentation including:

- **Entity Overview**: Name, type, and source file
- **Fields Table**: Field names, types, constraints, and relationships
- **Relationships**: hasOne, hasMany, belongsTo, manyToMany relationships
- **Constraints**: Unique constraints, indexes, foreign keys
- **File Locations**: Source file paths for each entity

### Supported File Patterns

The server automatically scans for these patterns:
- `**/*.sql` - SQL migration files
- `**/migrations/*.{js,ts}` - Migration directories
- `**/models/*.{js,ts}` - Model directories
- `**/entities/*.{js,ts}` - Entity directories
- `**/*model*.{js,ts}` - Files containing "model" in name
- `**/*entity*.{js,ts}` - Files containing "entity" in name
- `**/schema.prisma` - Prisma schema files
- `**/database.yml` - Database configuration files
- `**/schema.rb` - Rails schema files

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev:run
```

### Testing the Server

*On Windows (PowerShell):*
```powershell
Invoke-RestMethod -Uri http://localhost:3000/mcp -Method Post -ContentType "application/json" -Headers @{"Accept"="application/json, text/event-stream"} -Body '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "scan-database-files", "arguments": {"rootPath": "/path/to/test/project"}}}'
```

*On Windows (Command Prompt):*
```cmd
curl.exe -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": {\"name\": \"scan-database-files\", \"arguments\": {\"rootPath\": \"/path/to/test/project\"}}}"
```

## Examples

### TypeORM Entity Example
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}
```

### Sequelize Model Example
```javascript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true
  }
});
```

### Prisma Schema Example
```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
  posts Post[]
}
```

## Integration with Other MCP Servers

This server works great in combination with:
- **`@modelcontextprotocol/server-filesystem`**: For file system operations
- **`@modelcontextprotocol/server-git`**: For git repository analysis
- **`@modelcontextprotocol/server-github`**: For GitHub repository access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

