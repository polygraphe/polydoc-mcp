# Database Documentation Generation Workflow

## Overview

Polydoc scans your codebase for database-related files and generates comprehensive documentation including entity definitions, relationships, constraints, and metrics.

## Required Workflow

Follow this order when generating documentation:

1. **set-workspace-root** — Set the workspace root if not auto-detected
2. **debug-workspace-info** (optional) — Verify workspace detection is correct
3. **scan-database-files** (optional) — Quick scan to preview what files will be analyzed
4. **build-database-documentation** — Generate the full documentation

## Human-Input Gate

The `build-database-documentation` tool enforces a strict human-input gate. If the tool output contains any of these phrases:
- "missing"
- "please provide"
- "additional information"
- "instruction:"
- "required"

You MUST stop and ask the user for the missing information before continuing. Do NOT generate or finalize documentation until the user responds.

## Tool Parameters

### build-database-documentation

- `outputFormat`: `"markdown"` (default), `"json"`, or `"html"`
- `includePatterns`: Additional glob patterns for non-standard file locations (e.g., `["**/*.graphql", "**/*.dbml"]`)
- `knownTables`: Object mapping table names to descriptions for richer documentation
  ```json
  {
    "users": "User account information",
    "posts": "Blog posts and articles"
  }
  ```
- `analysisOptions`:
  - `includeMetrics`: Include database metrics and statistics (default: true)
  - `includeFileTree`: Include file tree of database-related files (default: true)

### scan-database-files

- `outputFormat`: `"markdown"` or `"json"`
- `includePatterns`: Additional file patterns to include
- `knownTables`: Same as above

## Supported File Types

Polydoc automatically detects:
- `**/*.sql` — SQL migration files
- `**/migrations/*.{js,ts}` — Migration directories
- `**/models/*.{js,ts}` — Model directories
- `**/entities/*.{js,ts}` — Entity directories
- `**/*model*.{js,ts}` — Files with "model" in name
- `**/*entity*.{js,ts}` — Files with "entity" in name
- `**/schema.prisma` — Prisma schema files
- `**/database.yml` — Database configuration files
- `**/schema.rb` — Rails schema files

Use `includePatterns` for anything outside these defaults.

## Output

The `build-database-documentation` tool writes a `polygraph.md` file at the workspace root containing:
- Executive summary with key metrics
- File structure visualization
- Detailed file analysis results
- Complete entity documentation with relationships
- Database metrics and statistics

## Tips

- Provide `knownTables` with descriptions for significantly better documentation quality
- Use `"html"` output format when sharing with non-technical stakeholders
- Use `"json"` output format for CI/CD integration or automated processing
- Re-run documentation generation after major schema changes
