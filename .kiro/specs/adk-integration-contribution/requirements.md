# Requirements Document

## Introduction

This document specifies the requirements for contributing Polydoc to the Google ADK (Agent Development Kit) integration catalog. Polydoc is an MCP server that automatically scans codebases to generate comprehensive database documentation from models, entities, migrations, and schema files. The integration will enable AI agents to understand database schemas for query generation and data operations across multiple frameworks including TypeORM, Sequelize, Prisma, SQL migrations, and Active Record.

The requirements are based on actual ADK documentation structure from CONTRIBUTING.md and real integration examples (GitHub, Daytona).

## Glossary

- **Polydoc**: The MCP server that generates database documentation from codebase analysis
- **ADK**: Google's Agent Development Kit for building AI agents
- **Integration_Documentation**: The markdown file following ADK's structure that describes the Polydoc integration
- **Repository**: The Polydoc GitHub repository containing the MCP server code
- **Logo_Asset**: Square logo image stored at docs/integrations/assets/polydoc.png
- **Screenshot_Assets**: Optional screenshot images stored in docs/integrations/assets/ directory
- **NPM_Package**: The published npm package for Polydoc MCP server
- **Code_Examples**: Tabbed code examples demonstrating Polydoc usage with Python and TypeScript
- **Integration_Catalog**: Google ADK's official catalog of third-party integrations
- **MCP_Server**: Model Context Protocol server that provides tools to AI agents
- **Pull_Request**: The GitHub pull request to google/adk-docs main branch
- **mkdocs**: The documentation build system used by Google ADK
- **Frontmatter**: YAML metadata at the top of the integration document
- **CLA**: Contributor License Agreement required at https://cla.developers.google.com/
- **Available_Tools_Table**: Markdown table listing tools with descriptions in "Tool | Description" format

## Requirements

### Requirement 1: Integration Documentation Structure

**User Story:** As an ADK contributor, I want to create integration documentation following ADK's exact structure, so that it matches other integrations in the catalog.

#### Acceptance Criteria

1. THE Integration_Documentation SHALL be created at path `docs/integrations/polydoc.md`
2. THE Integration_Documentation SHALL include Frontmatter with `catalog_title` field set to "Polydoc"
3. THE Integration_Documentation SHALL include Frontmatter with `catalog_description` field describing database documentation generation
4. THE Integration_Documentation SHALL include Frontmatter with `catalog_icon` field set to `/adk-docs/integrations/assets/polydoc.png`
5. THE Integration_Documentation SHALL include Frontmatter with optional `catalog_tags` array including "database" and "mcp"
6. THE Integration_Documentation SHALL include a title section with "Polydoc" as the heading
7. THE Integration_Documentation SHALL include an optional language support tag HTML div showing Python and TypeScript support
8. THE Integration_Documentation SHALL include a brief description paragraph explaining the integration purpose
9. THE Integration_Documentation SHALL include a "Use cases" section with bullet points having bold titles
10. THE Integration_Documentation SHALL include a "Prerequisites" section listing requirements
11. THE Integration_Documentation SHALL include an "Installation" section with npm/npx commands
12. THE Integration_Documentation SHALL include a "Use with agent" section with tabbed code examples
13. THE Integration_Documentation SHALL include an Available_Tools_Table in "Tool | Description" format
14. THE Integration_Documentation SHALL include a "Configuration" section if applicable
15. THE Integration_Documentation SHALL include an "Additional resources" section with links to GitHub and npm

### Requirement 2: Logo and Screenshot Assets

**User Story:** As an ADK user, I want to see visual representations of Polydoc, so that I can quickly identify and understand the integration.

#### Acceptance Criteria

1. THE Logo_Asset SHALL be created at path `docs/integrations/assets/polydoc.png`
2. THE Logo_Asset SHALL be square and appropriately sized for catalog display
3. THE Logo_Asset SHALL use PNG format
4. THE Screenshot_Assets MAY be added to `docs/integrations/assets/` directory to demonstrate functionality
5. WHEN Screenshot_Assets are included, THE Integration_Documentation SHALL reference them with relative paths
6. THE Logo_Asset SHALL be referenced in Frontmatter as `/adk-docs/integrations/assets/polydoc.png`

### Requirement 3: MCP Server Connection Examples

**User Story:** As a developer, I want to see how to connect to Polydoc MCP server, so that I can integrate it with my ADK agent.

#### Acceptance Criteria

1. THE Code_Examples SHALL include a Python example demonstrating MCP remote connection to Polydoc
2. THE Code_Examples SHALL include a TypeScript example demonstrating MCP remote connection to Polydoc
3. THE Code_Examples SHALL be formatted as tabbed code blocks in the "Use with agent" section
4. THE Code_Examples SHALL demonstrate npx execution of polydoc-mcp-server
5. THE Code_Examples SHALL show how to configure the MCP connection with proper parameters
6. WHEN a Code_Example is executed, THE MCP_Server SHALL successfully connect and respond to tool calls
7. THE Code_Examples SHALL include error handling patterns for connection failures
8. FOR ALL Code_Examples, the syntax SHALL be valid and executable

### Requirement 4: Available Tools Documentation

**User Story:** As an AI agent developer, I want to see all available Polydoc tools in a table format, so that I can quickly understand what capabilities are available.

#### Acceptance Criteria

1. THE Available_Tools_Table SHALL list the `build-database-documentation` tool with description
2. THE Available_Tools_Table SHALL list the `scan-database-files` tool with description
3. THE Available_Tools_Table SHALL list the `debug-workspace-info` tool with description
4. THE Available_Tools_Table SHALL list the `debug-client-capabilities` tool with description
5. THE Available_Tools_Table SHALL use markdown table format with "Tool | Description" columns
6. THE Available_Tools_Table SHALL be placed in the Integration_Documentation after the "Use with agent" section
7. THE tool descriptions SHALL clearly explain the purpose and value of each tool

### Requirement 5: Use Cases Section

**User Story:** As an ADK developer, I want to understand practical use cases for Polydoc, so that I can determine if it fits my needs.

#### Acceptance Criteria

1. THE Integration_Documentation SHALL include a "Use cases" section with bullet points
2. THE use case bullet points SHALL have bold titles followed by descriptions
3. THE Integration_Documentation SHALL include a use case for query generation assistance
4. THE Integration_Documentation SHALL include a use case for schema understanding
5. THE Integration_Documentation SHALL include a use case for data operation planning
6. THE use cases SHALL demonstrate clear value for building AI agents
7. THE use cases SHALL be specific and practical rather than generic

### Requirement 6: Local Testing with mkdocs

**User Story:** As a contributor, I want to test the integration documentation locally, so that I can verify formatting and content before submitting the pull request.

#### Acceptance Criteria

1. WHEN `mkdocs serve` command is executed in the adk-docs repository, THE Integration_Documentation SHALL render without errors
2. WHEN `mkdocs serve` command is executed, THE Logo_Asset SHALL display correctly in the rendered documentation
3. WHEN `mkdocs serve` command is executed, THE code examples SHALL have proper syntax highlighting
4. WHEN `mkdocs serve` command is executed, THE Available_Tools_Table SHALL render correctly
5. THE contributor SHALL verify all links in the Integration_Documentation are functional
6. THE mkdocs build SHALL complete without warnings or errors

### Requirement 7: Pull Request and CLA

**User Story:** As a contributor, I want to submit a pull request to google/adk-docs, so that Polydoc becomes available in the official ADK integration catalog.

#### Acceptance Criteria

1. THE contributor SHALL sign the CLA at https://cla.developers.google.com/ before submitting the Pull_Request
2. THE Pull_Request SHALL target the main branch of google/adk-docs repository
3. THE Pull_Request SHALL include the Integration_Documentation file at docs/integrations/polydoc.md
4. THE Pull_Request SHALL include the Logo_Asset at docs/integrations/assets/polydoc.png
5. THE Pull_Request SHALL include Screenshot_Assets if applicable
6. THE Pull_Request SHALL have a descriptive title following the format "Add Polydoc integration"
7. THE Pull_Request description SHALL explain the value Polydoc provides to ADK developers
8. THE Pull_Request description SHALL confirm compliance with ADK contribution guidelines
9. THE Pull_Request SHALL pass all automated checks in the google/adk-docs repository
10. WHEN the Pull_Request is reviewed, THE contributor SHALL respond to feedback promptly

### Requirement 8: Completeness and Testability

**User Story:** As an ADK reviewer, I want to verify that the Polydoc integration is complete and testable, so that I can approve it for the catalog.

#### Acceptance Criteria

1. THE Integration_Documentation SHALL include functional code examples that can be executed
2. THE Integration_Documentation SHALL document all four MCP tools provided by Polydoc
3. THE Code_Examples SHALL demonstrate actual working connections to the MCP_Server
4. WHEN a developer follows the installation instructions, THE MCP_Server SHALL start successfully via npx
5. WHEN a developer follows the usage examples, THE MCP_Server SHALL respond with expected tool outputs
6. THE Integration_Documentation SHALL include prerequisites such as Node.js version requirements
7. THE Integration_Documentation SHALL not violate any Terms of Service or circumvent technical protections
8. THE Integration_Documentation SHALL provide clear value for developers building agents

### Requirement 9: Framework Support Documentation

**User Story:** As a developer using specific database frameworks, I want to understand which frameworks Polydoc supports, so that I can determine compatibility with my project.

#### Acceptance Criteria

1. THE Integration_Documentation SHALL mention TypeORM as a supported framework
2. THE Integration_Documentation SHALL mention Sequelize as a supported framework
3. THE Integration_Documentation SHALL mention Prisma as a supported framework
4. THE Integration_Documentation SHALL mention SQL migrations as a supported format
5. THE Integration_Documentation SHALL mention Active Record as a supported framework
6. THE framework support information SHALL be included in the brief description or use cases section
7. THE Integration_Documentation SHALL explain that Polydoc automatically detects framework files

### Requirement 10: Installation Instructions

**User Story:** As a developer, I want clear installation instructions, so that I can quickly set up Polydoc with my ADK agent.

#### Acceptance Criteria

1. THE Integration_Documentation SHALL include an "Installation" section
2. THE Installation section SHALL document npx usage for running Polydoc without installation
3. THE Installation section SHALL document npm install command for permanent installation
4. THE Installation section SHALL specify the package name as it appears on npm registry
5. THE Installation instructions SHALL be concise and immediately actionable
6. WHEN a developer follows the installation instructions, THE MCP_Server SHALL be accessible via npx or npm

### Requirement 11: Additional Resources Section

**User Story:** As a developer, I want links to additional resources, so that I can learn more about Polydoc and access the source code.

#### Acceptance Criteria

1. THE Integration_Documentation SHALL include an "Additional resources" section
2. THE Additional resources section SHALL include a link to the Polydoc GitHub repository
3. THE Additional resources section SHALL include a link to the npm package page
4. THE Additional resources section SHALL include any other relevant documentation or resources
5. THE links SHALL be formatted as a bulleted list or similar clear structure

### Requirement 12: Prerequisites Section

**User Story:** As a developer, I want to know what prerequisites are needed, so that I can prepare my environment before installing Polydoc.

#### Acceptance Criteria

1. THE Integration_Documentation SHALL include a "Prerequisites" section
2. THE Prerequisites section SHALL list Node.js version requirements
3. THE Prerequisites section SHALL list any other system requirements or dependencies
4. THE Prerequisites section SHALL be clear and concise
5. THE Prerequisites SHALL be realistic and necessary for running the MCP_Server
