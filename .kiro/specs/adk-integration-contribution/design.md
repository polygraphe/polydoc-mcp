# Design Document: ADK Integration Contribution

## Overview

This design document specifies the technical implementation for contributing Polydoc to the Google ADK (Agent Development Kit) integration catalog. The implementation involves creating structured documentation following ADK's exact format, providing visual assets, demonstrating MCP server connections, and submitting a pull request to the google/adk-docs repository.

The design focuses on practical implementation guidance for creating integration documentation that matches ADK's established patterns, as seen in existing integrations like GitHub and Daytona. The documentation will enable AI agent developers to discover and integrate Polydoc's database documentation capabilities into their ADK-based agents.

### Key Design Goals

1. **Structural Compliance**: Match ADK's exact documentation structure and conventions
2. **Practical Examples**: Provide executable code examples for Python and TypeScript
3. **Clear Value Proposition**: Communicate Polydoc's capabilities through use cases and tool documentation
4. **Visual Identity**: Include appropriate logo and optional screenshot assets
5. **Testability**: Enable local verification with mkdocs before submission
6. **Contribution Readiness**: Prepare all materials for successful PR submission

## Architecture

### Component Overview

The integration contribution consists of three primary components:

1. **Documentation File** (`docs/integrations/polydoc.md`)
   - Structured markdown following ADK conventions
   - YAML frontmatter with catalog metadata
   - Multiple sections covering installation, usage, and resources

2. **Asset Files** (`docs/integrations/assets/`)
   - Logo image (polydoc.png) - required
   - Screenshot images - optional

3. **Code Examples** (embedded in documentation)
   - Python MCP connection example
   - TypeScript MCP connection example
   - Both demonstrating npx execution pattern

### File Structure

```
google/adk-docs/
├── docs/
│   └── integrations/
│       ├── polydoc.md                    # Main integration documentation
│       └── assets/
│           ├── polydoc.png               # Square logo (required)
│           └── polydoc-screenshot-*.png  # Optional screenshots
```

### Documentation Flow

The integration documentation follows a linear narrative structure:

1. **Discovery Phase**: Frontmatter metadata enables catalog discovery
2. **Understanding Phase**: Title, description, and use cases explain value
3. **Setup Phase**: Prerequisites and installation instructions
4. **Integration Phase**: Code examples demonstrate MCP connection
5. **Reference Phase**: Available tools table and configuration details
6. **Extension Phase**: Additional resources for deeper learning

## Components and Interfaces

### 1. Frontmatter Metadata Component

**Purpose**: Provides structured metadata for ADK's integration catalog system.

**Structure**:
```yaml
---
catalog_title: "Polydoc"
catalog_description: "Automatically generate comprehensive database documentation from your codebase for AI agents"
catalog_icon: "/adk-docs/integrations/assets/polydoc.png"
catalog_tags:
  - "database"
  - "mcp"
---
```

**Field Specifications**:
- `catalog_title`: String, exact integration name (required)
- `catalog_description`: String, concise value proposition (required)
- `catalog_icon`: String, absolute path from site root (required)
- `catalog_tags`: Array of strings, categorization tags (optional)

**Design Decisions**:
- Use absolute path `/adk-docs/` prefix for icon to match ADK's mkdocs configuration
- Keep description under 150 characters for catalog display
- Select tags that match existing ADK taxonomy ("database", "mcp")

### 2. Title and Description Component

**Purpose**: Provides human-readable introduction to the integration.

**Structure**:
```markdown
# Polydoc

<div class="language-support">
  <span class="language-badge">Python</span>
  <span class="language-badge">TypeScript</span>
</div>

Polydoc is an MCP server that automatically scans your codebase to generate comprehensive database documentation from models, entities, migrations, and schema files. It supports TypeORM, Sequelize, Prisma, SQL migrations, and Active Record, enabling AI agents to understand your database schema for query generation and data operations.
```

**Design Decisions**:
- Language support badges use HTML div for consistent styling with other ADK integrations
- Description paragraph includes framework list to set expectations
- Emphasizes "automatic" scanning as key differentiator

### 3. Use Cases Component

**Purpose**: Demonstrates practical applications to help developers assess fit.

**Structure**:
```markdown
## Use cases

- **Query generation assistance**: AI agents can generate accurate SQL queries by understanding your database schema, table relationships, and column types.
- **Schema understanding**: Agents can answer questions about your database structure, explain relationships between tables, and identify available data fields.
- **Data operation planning**: Agents can plan complex data operations by understanding constraints, indexes, and relationships defined in your models.
- **Migration analysis**: Agents can review migration files to understand schema evolution and suggest compatible changes.
```

**Design Decisions**:
- Use bold titles followed by detailed descriptions (matches ADK pattern)
- Focus on agent-centric use cases rather than developer tasks
- Include specific technical details (SQL queries, relationships, constraints)
- Cover both read operations (understanding) and write operations (planning)

### 4. Prerequisites Component

**Purpose**: Lists requirements before installation.

**Structure**:
```markdown
## Prerequisites

- Node.js 18 or higher
- A codebase using TypeORM, Sequelize, Prisma, SQL migrations, or Active Record
```

**Design Decisions**:
- Keep minimal - only essential requirements
- Specify Node.js version for compatibility clarity
- Mention framework requirement to set expectations

### 5. Installation Component

**Purpose**: Provides clear, actionable installation instructions.

**Structure**:
```markdown
## Installation

Polydoc can be run directly with npx without installation:

\`\`\`bash
npx polydoc-mcp-server
\`\`\`

Or install globally:

\`\`\`bash
npm install -g polydoc-mcp-server
\`\`\`
```

**Design Decisions**:
- Prioritize npx approach (no installation required)
- Provide npm install as alternative for permanent setup
- Use exact package name from npm registry

### 6. MCP Connection Examples Component

**Purpose**: Demonstrates how to connect ADK agents to Polydoc MCP server.

**Structure**: Tabbed code blocks with Python and TypeScript examples.

**Python Example Pattern**:
```python
from google.genai.adk import Agent
from google.genai.adk.mcp import RemoteMCPServer

# Create MCP server connection
polydoc_server = RemoteMCPServer(
    command="npx",
    args=["polydoc-mcp-server"],
    env={"WORKSPACE_PATH": "/path/to/your/codebase"}
)

# Create agent with Polydoc tools
agent = Agent(
    model="gemini-2.0-flash-exp",
    mcp_servers=[polydoc_server]
)

# Use the agent
response = agent.generate_content(
    "What tables are in my database and how are they related?"
)
print(response.text)
```

**TypeScript Example Pattern**:
```typescript
import { Agent } from '@google/genai-adk';
import { RemoteMCPServer } from '@google/genai-adk/mcp';

// Create MCP server connection
const polydocServer = new RemoteMCPServer({
  command: 'npx',
  args: ['polydoc-mcp-server'],
  env: { WORKSPACE_PATH: '/path/to/your/codebase' }
});

// Create agent with Polydoc tools
const agent = new Agent({
  model: 'gemini-2.0-flash-exp',
  mcpServers: [polydocServer]
});

// Use the agent
const response = await agent.generateContent(
  'What tables are in my database and how are they related?'
);
console.log(response.text);
```

**Design Decisions**:
- Use `RemoteMCPServer` class for subprocess execution
- Pass `WORKSPACE_PATH` environment variable for codebase location
- Demonstrate npx execution pattern (no global install required)
- Include realistic example query to show practical usage
- Use consistent model name across examples (gemini-2.0-flash-exp)
- Follow ADK's established patterns from other integrations

**Interface Contract**:
- Command: "npx"
- Args: ["polydoc-mcp-server"]
- Environment: { WORKSPACE_PATH: string }
- Protocol: MCP (Model Context Protocol)

### 7. Available Tools Table Component

**Purpose**: Documents all MCP tools provided by Polydoc.

**Structure**:
```markdown
## Available tools

| Tool | Description |
|------|-------------|
| `build-database-documentation` | Scans the workspace and generates comprehensive database documentation including tables, columns, relationships, and constraints |
| `scan-database-files` | Lists all detected database-related files in the workspace (models, migrations, schemas) |
| `debug-workspace-info` | Returns workspace path and configuration information for troubleshooting |
| `debug-client-capabilities` | Returns MCP client capabilities for debugging connection issues |
```

**Design Decisions**:
- Use markdown table format (Tool | Description)
- List tools in order of importance (primary tool first)
- Include debug tools for troubleshooting support
- Provide clear, actionable descriptions
- Use backticks for tool names to indicate they are identifiers

### 8. Configuration Component

**Purpose**: Documents optional configuration parameters.

**Structure**:
```markdown
## Configuration

Polydoc accepts the following environment variables:

- `WORKSPACE_PATH`: Path to the codebase to scan (required)
- `INCLUDE_PATTERNS`: Comma-separated glob patterns for files to include (optional)
- `EXCLUDE_PATTERNS`: Comma-separated glob patterns for files to exclude (optional)
```

**Design Decisions**:
- Only include if configuration options exist
- Use environment variables as configuration mechanism (matches MCP pattern)
- Mark required vs optional parameters
- Provide examples of glob patterns if needed

### 9. Additional Resources Component

**Purpose**: Provides links for further learning and source access.

**Structure**:
```markdown
## Additional resources

- [Polydoc GitHub Repository](https://github.com/username/polydoc)
- [Polydoc on npm](https://www.npmjs.com/package/polydoc-mcp-server)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
```

**Design Decisions**:
- Use bulleted list format
- Include GitHub repository for source code access
- Include npm package for installation reference
- Optionally include MCP protocol docs for deeper understanding
- Use descriptive link text rather than bare URLs

## Data Models

### Integration Document Model

```typescript
interface IntegrationDocument {
  frontmatter: FrontmatterMetadata;
  content: DocumentContent;
}

interface FrontmatterMetadata {
  catalog_title: string;           // Required: Display name in catalog
  catalog_description: string;     // Required: Brief description
  catalog_icon: string;            // Required: Absolute path to logo
  catalog_tags?: string[];         // Optional: Categorization tags
}

interface DocumentContent {
  title: string;                   // H1 heading
  languageSupport?: LanguageBadge[]; // Optional language badges
  description: string;             // Opening paragraph
  useCases: UseCase[];            // Bulleted use cases
  prerequisites: string[];         // Required setup items
  installation: InstallationInstructions;
  usage: CodeExamples;            // Tabbed code blocks
  availableTools: ToolTable;      // Markdown table
  configuration?: ConfigSection;   // Optional config details
  additionalResources: ResourceLink[];
}

interface UseCase {
  title: string;                   // Bold title
  description: string;             // Detailed explanation
}

interface CodeExamples {
  python: string;                  // Python code block
  typescript: string;              // TypeScript code block
}

interface ToolTable {
  tools: Tool[];
}

interface Tool {
  name: string;                    // Tool identifier
  description: string;             // What the tool does
}

interface ResourceLink {
  text: string;                    // Link display text
  url: string;                     // Link target URL
}
```

### Asset Model

```typescript
interface LogoAsset {
  path: string;                    // docs/integrations/assets/polydoc.png
  format: 'PNG';                   // Required format
  dimensions: {
    width: number;                 // Square aspect ratio
    height: number;                // Equal to width
  };
  minSize: number;                 // Minimum 256x256 recommended
  maxSize: number;                 // Maximum 1024x1024 recommended
}

interface ScreenshotAsset {
  path: string;                    // docs/integrations/assets/polydoc-screenshot-*.png
  format: 'PNG';                   // Recommended format
  purpose: string;                 // What the screenshot demonstrates
}
```

### MCP Connection Model

```typescript
interface MCPServerConnection {
  command: string;                 // "npx"
  args: string[];                  // ["polydoc-mcp-server"]
  env: Record<string, string>;     // { WORKSPACE_PATH: "..." }
  protocol: 'MCP';                 // Model Context Protocol
}

interface MCPTool {
  name: string;                    // Tool identifier
  description: string;             // Tool purpose
  inputSchema: object;             // JSON schema for inputs
  outputSchema: object;            // JSON schema for outputs
}
```

## Data Flow

### 1. Documentation Discovery Flow

```
User browses ADK catalog
  → mkdocs renders integration list
  → Frontmatter metadata populates catalog card
  → catalog_icon displays logo
  → catalog_description shows preview
  → catalog_tags enable filtering
  → User clicks to view full documentation
```

### 2. Integration Setup Flow

```
Developer reads documentation
  → Checks prerequisites (Node.js version)
  → Runs installation command (npx or npm)
  → Copies code example (Python or TypeScript)
  → Modifies WORKSPACE_PATH to their codebase
  → Executes code to create agent
  → MCP server starts via npx subprocess
  → Agent connects to MCP server
  → Tools become available to agent
```

### 3. MCP Tool Invocation Flow

```
Agent receives user query
  → Agent decides to use Polydoc tool
  → Agent calls build-database-documentation
  → MCP server scans WORKSPACE_PATH
  → Server detects framework files
  → Server parses models/migrations
  → Server generates documentation
  → Server returns structured data
  → Agent uses data to answer query
```

### 4. Local Testing Flow

```
Contributor creates documentation
  → Contributor adds logo asset
  → Contributor runs `mkdocs serve`
  → mkdocs builds documentation
  → Contributor opens localhost:8000
  → Contributor navigates to integration page
  → Contributor verifies rendering
  → Contributor tests all links
  → Contributor checks code syntax highlighting
```

### 5. Pull Request Flow

```
Contributor signs CLA
  → Contributor forks google/adk-docs
  → Contributor creates feature branch
  → Contributor adds documentation file
  → Contributor adds logo asset
  → Contributor commits changes
  → Contributor pushes to fork
  → Contributor opens pull request
  → Automated checks run
  → ADK team reviews
  → Contributor addresses feedback
  → PR gets merged
  → Integration appears in catalog
```


## Error Handling

### Documentation Validation Errors

**Error Type**: Missing Required Section
- **Cause**: Integration documentation lacks a required section (Prerequisites, Installation, etc.)
- **Detection**: Markdown parser fails to find expected heading
- **Handling**: Validation script reports missing section with line number guidance
- **Prevention**: Use documentation template with all required sections

**Error Type**: Invalid Frontmatter
- **Cause**: YAML frontmatter is malformed or missing required fields
- **Detection**: YAML parser fails or required field validation fails
- **Handling**: Report specific field that is missing or invalid
- **Prevention**: Use frontmatter template with all required fields

**Error Type**: Broken Links
- **Cause**: Links point to non-existent resources or have malformed URLs
- **Detection**: Link checker finds 404 responses or invalid URL format
- **Handling**: Report each broken link with location in document
- **Prevention**: Verify all links before committing

### Asset Validation Errors

**Error Type**: Missing Logo Asset
- **Cause**: Logo file not present at expected path
- **Detection**: File system check fails to find logo
- **Handling**: Report missing file with expected path
- **Prevention**: Add logo before creating documentation

**Error Type**: Invalid Logo Format
- **Cause**: Logo is not PNG format or not square aspect ratio
- **Detection**: Image metadata check reveals wrong format or dimensions
- **Handling**: Report format/dimension requirements
- **Prevention**: Prepare logo according to specifications before adding

**Error Type**: Logo Path Mismatch
- **Cause**: Frontmatter icon path doesn't match actual logo location
- **Detection**: Path in frontmatter doesn't resolve to existing file
- **Handling**: Report path mismatch with expected vs actual paths
- **Prevention**: Use absolute path format `/adk-docs/integrations/assets/`

### Code Example Errors

**Error Type**: Syntax Error in Code Example
- **Cause**: Code example contains invalid syntax for the language
- **Detection**: Language parser fails to parse code block
- **Handling**: Report syntax error with line number and language
- **Prevention**: Test code examples in actual environment before documenting

**Error Type**: Missing Required Parameters
- **Cause**: Code example doesn't include required configuration (e.g., WORKSPACE_PATH)
- **Detection**: Code analysis finds missing required parameters
- **Handling**: Report missing parameter with example of correct usage
- **Prevention**: Use code example template with all required parameters

**Error Type**: Inconsistent Examples
- **Cause**: Python and TypeScript examples demonstrate different functionality
- **Detection**: Semantic analysis finds different API calls or patterns
- **Handling**: Report inconsistency between language examples
- **Prevention**: Ensure both examples demonstrate the same workflow

### Build and Deployment Errors

**Error Type**: mkdocs Build Failure
- **Cause**: Documentation contains markdown that mkdocs cannot process
- **Detection**: `mkdocs build` command exits with non-zero status
- **Handling**: Review mkdocs error output for specific issue
- **Prevention**: Run `mkdocs serve` locally before committing

**Error Type**: CI Check Failure
- **Cause**: Automated checks in google/adk-docs repository fail
- **Detection**: GitHub Actions reports failed checks on PR
- **Handling**: Review check output and fix reported issues
- **Prevention**: Run local validation before pushing

**Error Type**: CLA Not Signed
- **Cause**: Contributor hasn't signed Google's CLA
- **Detection**: CLA bot comments on PR indicating missing signature
- **Handling**: Sign CLA at https://cla.developers.google.com/
- **Prevention**: Sign CLA before creating PR

### Recovery Strategies

**Strategy 1: Incremental Validation**
- Validate each section as it's written rather than at the end
- Use markdown linter to catch formatting issues early
- Test code examples in isolation before adding to documentation

**Strategy 2: Template-Based Creation**
- Start with a template containing all required sections
- Fill in template sections to ensure nothing is missed
- Use checklist to verify all requirements are met

**Strategy 3: Local Testing Loop**
- Run `mkdocs serve` frequently during documentation creation
- Verify rendering after each major change
- Test all links and code examples before final commit

**Strategy 4: Peer Review**
- Have another developer review documentation before PR
- Verify code examples work in fresh environment
- Check that use cases are clear and valuable

## Testing Strategy

### Overview

The testing strategy for ADK integration contribution employs a dual approach combining unit tests for specific validation checks and property-based tests for comprehensive coverage of documentation correctness. This ensures both concrete requirements (specific sections, fields, content) and universal properties (all links valid, all code syntactically correct) are verified.

### Unit Testing Approach

Unit tests focus on specific examples and concrete requirements from the acceptance criteria. These tests verify that the integration documentation contains all required elements in the correct format.

**Test Categories**:

1. **Structure Tests**: Verify presence of required sections
   - Test that "Prerequisites" section exists
   - Test that "Installation" section exists
   - Test that "Use with agent" section exists
   - Test that "Available tools" section exists
   - Test that "Additional resources" section exists

2. **Content Tests**: Verify specific content requirements
   - Test that frontmatter contains "Polydoc" as catalog_title
   - Test that frontmatter contains catalog_icon path
   - Test that all five frameworks are mentioned (TypeORM, Sequelize, Prisma, SQL migrations, Active Record)
   - Test that all four tools are documented in the table
   - Test that Node.js version requirement is specified

3. **Format Tests**: Verify formatting requirements
   - Test that Available Tools table has "Tool | Description" columns
   - Test that use cases have bold titles
   - Test that links are formatted as bulleted list
   - Test that code examples are in code blocks with language tags

4. **Asset Tests**: Verify asset requirements
   - Test that logo file exists at expected path
   - Test that logo is PNG format
   - Test that logo has square dimensions
   - Test that logo dimensions are within acceptable range (256x256 to 1024x1024)

5. **Build Tests**: Verify documentation builds correctly
   - Test that mkdocs build completes without errors
   - Test that mkdocs build completes without warnings
   - Test that rendered HTML contains expected elements

**Test Implementation**:
- Use Python with pytest for test framework
- Use PyYAML for frontmatter parsing
- Use markdown parser (e.g., python-markdown) for structure analysis
- Use Pillow for image validation
- Use subprocess to run mkdocs commands

### Property-Based Testing Approach

Property-based tests verify universal properties that should hold across all valid documentation. These tests use randomization and comprehensive input coverage to ensure correctness.

**Property Test Configuration**:
- Library: Hypothesis (Python)
- Minimum iterations: 100 per property test
- Each test tagged with: **Feature: adk-integration-contribution, Property {number}: {property_text}**

**Property Test Categories**:

1. **Syntax Validity Properties**: Ensure all code examples are syntactically valid
   - Generate variations of code examples with different parameters
   - Verify each variation parses successfully in target language
   - Test both Python and TypeScript examples

2. **Link Validity Properties**: Ensure all links are well-formed
   - Extract all links from documentation
   - Verify each link matches URL pattern
   - Verify relative paths resolve correctly

3. **Structural Consistency Properties**: Ensure document structure is consistent
   - Verify section ordering is correct
   - Verify heading hierarchy is valid (no skipped levels)
   - Verify all required sections appear exactly once

4. **Content Completeness Properties**: Ensure all required content is present
   - Verify all required frontmatter fields exist
   - Verify all required frameworks are mentioned
   - Verify all required tools are documented

### Test Execution Workflow

**Local Development**:
```bash
# Run unit tests
pytest tests/unit/test_integration_docs.py -v

# Run property tests
pytest tests/property/test_integration_properties.py -v --hypothesis-show-statistics

# Run all tests
pytest tests/ -v

# Test mkdocs build
cd google/adk-docs
mkdocs build --strict
mkdocs serve
```

**CI/CD Pipeline**:
1. Automated tests run on every commit to feature branch
2. Tests must pass before PR can be created
3. Additional checks run in google/adk-docs repository on PR
4. Manual review by ADK team after automated checks pass

### Manual Testing Checklist

Before submitting PR, manually verify:
- [ ] Documentation renders correctly in mkdocs serve
- [ ] Logo displays at correct size and quality
- [ ] Code examples have proper syntax highlighting
- [ ] All links are clickable and navigate correctly
- [ ] Table renders with proper formatting
- [ ] Language badges display correctly
- [ ] Screenshots (if included) display correctly
- [ ] Mobile rendering is acceptable
- [ ] No spelling or grammar errors
- [ ] Use cases are clear and valuable
- [ ] Code examples are executable (test in fresh environment)

### Validation Script

A validation script should be created to automate pre-submission checks:

```python
#!/usr/bin/env python3
"""
Validation script for ADK integration documentation.
Run before submitting PR to catch common issues.
"""

import sys
from pathlib import Path
from typing import List, Tuple

def validate_integration_docs() -> Tuple[bool, List[str]]:
    """
    Validates integration documentation against requirements.
    Returns (success, list of errors).
    """
    errors = []
    
    # Check file exists
    doc_path = Path("docs/integrations/polydoc.md")
    if not doc_path.exists():
        errors.append(f"Documentation file not found: {doc_path}")
        return False, errors
    
    # Check logo exists
    logo_path = Path("docs/integrations/assets/polydoc.png")
    if not logo_path.exists():
        errors.append(f"Logo file not found: {logo_path}")
    
    # Parse and validate frontmatter
    content = doc_path.read_text()
    # ... validation logic ...
    
    # Validate required sections
    required_sections = [
        "Prerequisites",
        "Installation",
        "Use with agent",
        "Available tools",
        "Additional resources"
    ]
    # ... validation logic ...
    
    # Validate code examples
    # ... validation logic ...
    
    # Validate links
    # ... validation logic ...
    
    return len(errors) == 0, errors

if __name__ == "__main__":
    success, errors = validate_integration_docs()
    if not success:
        print("Validation failed:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("Validation passed!")
        sys.exit(0)
```

### Test Coverage Goals

- **Unit Test Coverage**: 100% of concrete requirements (all specific sections, fields, content)
- **Property Test Coverage**: All universal properties (syntax validity, link validity, structural consistency)
- **Manual Test Coverage**: Visual and UX aspects that cannot be automated
- **Integration Test Coverage**: Actual MCP server execution (separate from documentation tests)

### Testing Tools and Libraries

**Python Testing Stack**:
- pytest: Test framework
- hypothesis: Property-based testing
- PyYAML: YAML parsing for frontmatter
- python-markdown: Markdown parsing
- Pillow: Image validation
- requests: Link validation (optional)
- beautifulsoup4: HTML parsing for rendered output

**JavaScript/TypeScript Testing** (for code example validation):
- @typescript-eslint/parser: TypeScript syntax validation
- acorn: JavaScript syntax validation

**Documentation Tools**:
- mkdocs: Documentation build system
- mkdocs-material: Theme (if used by ADK)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Document Structure Completeness

*For any* valid ADK integration documentation, it must contain all required sections in the correct order: title, description, use cases, prerequisites, installation, usage examples, available tools, and additional resources.

**Validates: Requirements 1.6, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.15**

### Property 2: Frontmatter Completeness

*For any* valid ADK integration documentation, the YAML frontmatter must contain all required fields (catalog_title, catalog_description, catalog_icon) with valid values, and optional fields (catalog_tags) must be well-formed arrays if present.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

### Property 3: Framework Coverage Completeness

*For any* valid Polydoc integration documentation, all five supported frameworks (TypeORM, Sequelize, Prisma, SQL migrations, Active Record) must be mentioned in the description or use cases section.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

### Property 4: Tool Documentation Completeness

*For any* valid Polydoc integration documentation, the Available Tools table must document all four MCP tools (build-database-documentation, scan-database-files, debug-workspace-info, debug-client-capabilities) with descriptions.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 8.2**

### Property 5: Code Syntax Validity

*For any* code example in the integration documentation (Python or TypeScript), the code must be syntactically valid and parseable by the respective language parser.

**Validates: Requirements 3.8, 8.1**

### Property 6: Link Validity

*For any* link in the integration documentation, the link must be a well-formed URL (for external links) or a valid relative path (for internal links), and all links must be reachable or resolvable.

**Validates: Requirements 6.5**

### Property 7: Asset Validity

*For any* logo asset in the integration, the file must exist at the specified path, be in PNG format, have square dimensions (width equals height), and have dimensions within the acceptable range (256x256 to 1024x1024 pixels).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 8: Section Ordering Consistency

*For any* valid ADK integration documentation, sections must appear in the standard order, with "Use with agent" appearing before "Available tools", and "Available tools" appearing before "Additional resources".

**Validates: Requirements 4.6**

### Property 9: Code Example Consistency

*For any* pair of Python and TypeScript code examples in the integration documentation, both examples must demonstrate the same MCP connection pattern (using npx, RemoteMCPServer, and WORKSPACE_PATH environment variable).

**Validates: Requirements 3.1, 3.2, 3.4, 3.5**

### Property 10: Required Content Presence

*For any* valid Polydoc integration documentation, it must contain specific required content including: Node.js version in prerequisites, npx command in installation, GitHub link in additional resources, and npm link in additional resources.

**Validates: Requirements 8.6, 10.2, 10.3, 11.2, 11.3**

### Property 11: Build Success

*For any* valid ADK integration documentation, running `mkdocs build --strict` must complete with exit code 0 (no errors or warnings).

**Validates: Requirements 6.1, 6.6**

### Property 12: Markdown Table Format Validity

*For any* markdown table in the integration documentation, the table must have properly formatted headers with pipe separators, and all rows must have the same number of columns as the header.

**Validates: Requirements 4.5**

## Implementation Guidance

### Step-by-Step Implementation Process

**Phase 1: Preparation**
1. Fork google/adk-docs repository
2. Clone forked repository locally
3. Create feature branch: `git checkout -b add-polydoc-integration`
4. Sign CLA at https://cla.developers.google.com/
5. Prepare logo asset (square PNG, 256x256 to 1024x1024)

**Phase 2: Documentation Creation**
1. Create file: `docs/integrations/polydoc.md`
2. Add frontmatter with all required fields
3. Write title and description paragraph
4. Write use cases section with bold titles
5. Write prerequisites section (Node.js version)
6. Write installation section (npx and npm commands)
7. Write "Use with agent" section with Python and TypeScript examples
8. Create Available Tools table with all four tools
9. Write configuration section (environment variables)
10. Write additional resources section with links

**Phase 3: Asset Addition**
1. Add logo: `docs/integrations/assets/polydoc.png`
2. Verify logo dimensions and format
3. Optionally add screenshots to assets directory
4. Update documentation to reference screenshots if added

**Phase 4: Local Testing**
1. Install mkdocs: `pip install mkdocs mkdocs-material`
2. Run `mkdocs serve` in adk-docs directory
3. Navigate to http://localhost:8000/integrations/polydoc/
4. Verify all sections render correctly
5. Verify logo displays correctly
6. Verify code syntax highlighting works
7. Test all links are clickable
8. Run validation script (if created)
9. Run unit tests (if created)
10. Run property tests (if created)

**Phase 5: Pull Request Submission**
1. Commit changes: `git add docs/integrations/polydoc.md docs/integrations/assets/polydoc.png`
2. Write commit message: "Add Polydoc integration documentation"
3. Push to fork: `git push origin add-polydoc-integration`
4. Create PR to google/adk-docs main branch
5. Write PR title: "Add Polydoc integration"
6. Write PR description explaining value and confirming compliance
7. Wait for automated checks to complete
8. Address any feedback from reviewers
9. Respond to comments promptly
10. Wait for approval and merge

### Documentation Template

```markdown
---
catalog_title: "Polydoc"
catalog_description: "Automatically generate comprehensive database documentation from your codebase for AI agents"
catalog_icon: "/adk-docs/integrations/assets/polydoc.png"
catalog_tags:
  - "database"
  - "mcp"
---

# Polydoc

<div class="language-support">
  <span class="language-badge">Python</span>
  <span class="language-badge">TypeScript</span>
</div>

[Brief description paragraph explaining what Polydoc does and which frameworks it supports]

## Use cases

- **[Use case title]**: [Detailed description]
- **[Use case title]**: [Detailed description]
- **[Use case title]**: [Detailed description]

## Prerequisites

- Node.js 18 or higher
- [Other prerequisites]

## Installation

[Installation instructions with npx and npm commands]

## Use with agent

=== "Python"
    ```python
    [Python code example]
    ```

=== "TypeScript"
    ```typescript
    [TypeScript code example]
    ```

## Available tools

| Tool | Description |
|------|-------------|
| `tool-name` | Tool description |

## Configuration

[Configuration details if applicable]

## Additional resources

- [Link to GitHub repository]
- [Link to npm package]
- [Other relevant links]
```

### Code Example Templates

**Python Template**:
```python
from google.genai.adk import Agent
from google.genai.adk.mcp import RemoteMCPServer

# Create MCP server connection
polydoc_server = RemoteMCPServer(
    command="npx",
    args=["polydoc-mcp-server"],
    env={"WORKSPACE_PATH": "/path/to/your/codebase"}
)

# Create agent with Polydoc tools
agent = Agent(
    model="gemini-2.0-flash-exp",
    mcp_servers=[polydoc_server]
)

# Use the agent
response = agent.generate_content(
    "What tables are in my database and how are they related?"
)
print(response.text)
```

**TypeScript Template**:
```typescript
import { Agent } from '@google/genai-adk';
import { RemoteMCPServer } from '@google/genai-adk/mcp';

// Create MCP server connection
const polydocServer = new RemoteMCPServer({
  command: 'npx',
  args: ['polydoc-mcp-server'],
  env: { WORKSPACE_PATH: '/path/to/your/codebase' }
});

// Create agent with Polydoc tools
const agent = new Agent({
  model: 'gemini-2.0-flash-exp',
  mcpServers: [polydocServer]
});

// Use the agent
const response = await agent.generateContent(
  'What tables are in my database and how are they related?'
);
console.log(response.text);
```

### Common Pitfalls and Solutions

**Pitfall 1: Incorrect Icon Path**
- Problem: Using relative path or wrong prefix for catalog_icon
- Solution: Always use `/adk-docs/integrations/assets/` prefix

**Pitfall 2: Non-Square Logo**
- Problem: Logo has rectangular dimensions
- Solution: Crop or resize logo to square aspect ratio before adding

**Pitfall 3: Missing Language Tags in Code Blocks**
- Problem: Code blocks don't specify language for syntax highlighting
- Solution: Always use ` ```python ` or ` ```typescript ` with language tag

**Pitfall 4: Inconsistent Code Examples**
- Problem: Python and TypeScript examples show different workflows
- Solution: Ensure both examples demonstrate the same MCP connection pattern

**Pitfall 5: Broken Links**
- Problem: Links point to non-existent resources
- Solution: Verify all links before committing, use link checker

**Pitfall 6: Missing Required Sections**
- Problem: Documentation lacks required sections
- Solution: Use template with all required sections, check against requirements

**Pitfall 7: Invalid Markdown Table**
- Problem: Table has misaligned columns or missing pipes
- Solution: Use markdown table generator or verify alignment manually

**Pitfall 8: mkdocs Build Failures**
- Problem: Documentation contains markdown that mkdocs cannot process
- Solution: Run `mkdocs serve` locally and fix errors before pushing

### Success Criteria

The integration contribution is complete and ready for submission when:

1. ✅ All required sections are present in documentation
2. ✅ All required frontmatter fields are populated correctly
3. ✅ Logo asset exists and meets specifications
4. ✅ Code examples are syntactically valid and executable
5. ✅ All links are functional and well-formed
6. ✅ All four MCP tools are documented
7. ✅ All five frameworks are mentioned
8. ✅ mkdocs build completes without errors or warnings
9. ✅ Documentation renders correctly in local mkdocs serve
10. ✅ CLA is signed
11. ✅ All validation tests pass
12. ✅ Manual testing checklist is complete

Once all success criteria are met, the pull request can be submitted with confidence that it meets ADK's contribution requirements.
