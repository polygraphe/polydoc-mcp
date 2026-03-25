---
name: "polydoc"
displayName: "Polydoc - Database Documentation"
description: "Automatically generate comprehensive database documentation from your codebase models, entities, migrations, and schema files. Supports TypeORM, Sequelize, Prisma, raw SQL, and more."
keywords: ["database", "documentation", "schema", "migration", "entity", "model", "typeorm", "sequelize", "prisma", "sql", "polydoc", "db-docs", "erd", "database-docs"]
---

# Onboarding

## Step 1: Validate dependencies

Before using Polydoc, ensure the following are installed:

- **Node.js** (v18+): Required to run the MCP server
  - Verify with: `node --version`
- **npm**: Required for dependency installation
  - Verify with: `npm --version`

If Node.js is not installed, DO NOT proceed. Ask the user to install it first.

## Step 2: Build the server

The Polydoc MCP server needs to be built before first use:

```bash
npm install
npm run build
```

This compiles the TypeScript source into `build/polydoc.js` and `build/polydoc-stdio.js`.

## Step 3: MCP configuration

The server uses stdio transport by default, so Kiro manages the server lifecycle automatically — no manual start needed.

**IMPORTANT:** The `args` path in the MCP config MUST be an absolute path to `build/polydoc-stdio.js` so the power works from any workspace. A relative path will break when the user opens a different project.

During onboarding, you MUST:
1. Run `pwd` in the power's directory to get the current absolute path
2. Construct the full path by appending `/build/polydoc-stdio.js` to the result
3. Write that absolute path into the user-level MCP config at `~/.kiro/settings/mcp.json`

The resulting MCP config entry should look like this (where `<POWER_DIR>` is replaced by the actual `pwd` output):

```json
{
  "mcpServers": {
    "polydoc-database-docs": {
      "command": "node",
      "args": ["<POWER_DIR>/build/polydoc-stdio.js"],
      "env": {
        "NODE_ENV": "production",
        "POLYDOC_LOG_LEVEL": "info",
        "POLYDOC_ENABLE_DETAILED_ERRORS": "false"
      }
    }
  }
}
```

Do NOT hardcode any specific user path in the repository files. The resolution must happen dynamically at onboarding time.

Alternatively, you can run the HTTP server manually with `npm start` (listens on `http://localhost:3000/mcp`), but the stdio approach is recommended since it eliminates the need to manually start/reconnect the server.

## Step 4: Add hooks

Add a hook to `.kiro/hooks/generate-db-docs.kiro.hook` for on-demand database documentation generation:

```json
{
  "name": "Generate Database Documentation",
  "version": "1.0.0",
  "description": "Generate comprehensive database documentation for the current workspace",
  "when": {
    "type": "userTriggered"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Use the build-database-documentation tool from the polydoc-database-docs MCP server to generate comprehensive database documentation for this workspace. Follow the tool's output exactly — if it requests missing information, ask me before proceeding."
  }
}
```

# When to Load Steering Files

- Generating database documentation or scanning for database files → `generate-docs-workflow.md`
- Working with database models, entities, or schemas → `schema-best-practices.md`
