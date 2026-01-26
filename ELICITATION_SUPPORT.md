# MCP Elicitation Support Detection

## Overview

Model Context Protocol (MCP) supports an "elicitation" feature that allows servers to request additional information from users during tool execution. However, not all MCP clients support this feature. This document explains how to detect elicitation support and implement proper fallback strategies.

## How MCP Capability Negotiation Works

### 1. Initialization Phase

During the MCP connection initialization, the client and server exchange capabilities:

**Client declares capabilities:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "elicitation": {},
      "roots": {"listChanged": true},
      "sampling": {}
    },
    "clientInfo": {
      "name": "ExampleClient",
      "version": "1.0.0"
    }
  }
}
```

**Server responds with its capabilities:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "tools": {"listChanged": true},
      "resources": {"subscribe": true, "listChanged": true},
      "logging": {}
    },
    "serverInfo": {
      "name": "ExampleServer",
      "version": "1.0.0"
    }
  }
}
```

### 2. Server-side Detection

In your MCP server code, you can detect client capabilities using the SDK:

```typescript
const clientCapabilities = server.server.getClientCapabilities();
const supportsElicitation = !!(clientCapabilities?.elicitation);

if (supportsElicitation) {
  // Client supports elicitation - can prompt user for input
  const result = await server.server.elicitInput({
    message: "Please provide additional information:",
    requestedSchema: {
      type: "object",
      properties: {
        description: { type: "string" }
      }
    }
  });
} else {
  // Fallback: proceed without user interaction
  console.log("Client doesn't support elicitation - using fallback mode");
}
```

## Common Client Support Status

### ✅ Clients with Elicitation Support
- **Claude Desktop**: Full support for elicitation
- **Advanced MCP implementations**: Custom clients built with full MCP spec support

### ❌ Clients without Elicitation Support  
- **Cursor IDE**: Currently does not advertise elicitation capability in its MCP implementation
- **Basic MCP clients**: Many simplified implementations omit advanced features

### 🔍 How to Check Your Client

Use the `debug-client-capabilities` tool provided in this server:

```bash
# In your MCP client, call:
debug-client-capabilities
```

This will show exactly what capabilities your client reports.

## Implementation Strategy in Polydoc

The Polydoc server implements a robust fallback strategy:

### 1. Early Detection
```typescript
// Check capabilities before attempting elicitation
const clientCaps = server.server.getClientCapabilities();
const elicitationSupported = !!(clientCaps?.elicitation);

// Pass capability info to tool functions
const result = await toolBuildDatabaseDocumentation({
  // ... other params
  clientSupportsElicitation: elicitationSupported
});
```

### 2. Conditional Elicitation
```typescript
if (entitiesNeedingDescription.length > 0 && !forceGeneration) {
  const clientSupportsElicitation = params.clientSupportsElicitation ?? true;
  
  if (!clientSupportsElicitation) {
    console.log("⚠️ Client does not support elicitation feature");
    // Skip elicitation, proceed with available data
  } else {
    // Attempt elicitation
    return {
      loop: true,
      toolAnswer: "Please provide table descriptions..."
    };
  }
}
```

### 3. Automatic Fallback
When elicitation is not supported:
- Documentation is generated with available information
- User is informed about the limitation
- No interactive prompts are attempted
- Process continues without user interaction

## Debugging Elicitation Issues

### 1. Enable Debug Logging
Set environment variables:
```bash
NODE_ENV=development
POLYDOC_LOG_LEVEL=debug
```

### 2. Check Debug Output
The server logs capability information:
```
[DEBUG] CLIENT CAPABILITIES: {"tools": {}}
[DEBUG] Elicitation supported: false
[WARN] Client does not support elicitation feature, proceeding with documentation generation
```

### 3. Use the Debug Tool
Call `debug-client-capabilities` to get a comprehensive report:
- Shows exact client capabilities
- Indicates elicitation support status
- Provides troubleshooting guidance

## Best Practices

### 1. Always Check Capabilities
```typescript
// Don't assume elicitation works
const hasElicitation = !!(server.server.getClientCapabilities()?.elicitation);
```

### 2. Provide Meaningful Fallbacks
```typescript
if (!hasElicitation) {
  // Still generate useful output
  return generateDocumentationWithAvailableData();
} else {
  // Use interactive prompts
  return requestUserInput();
}
```

### 3. Inform Users About Limitations
```typescript
if (!hasElicitation) {
  console.log("Note: Your MCP client doesn't support interactive prompts");
  console.log("Documentation will be generated with available information");
}
```

### 4. Make Elicitation Optional
Design your tools so they work with or without user interaction:
- Collect as much information as possible from code analysis
- Use elicitation only for enhancement, not core functionality
- Provide good defaults when user input is unavailable

## Cursor IDE Specific Notes

Cursor IDE currently:
- ✅ Supports basic MCP tools and resources
- ✅ Can call MCP server tools successfully  
- ❌ Does not advertise elicitation capability
- ❌ Cannot display interactive prompts to users

**Workaround for Cursor users:**
- Use the `forceGeneration: true` parameter to skip elicitation
- Provide table descriptions manually via tool parameters if needed
- Documentation will still be comprehensive based on code analysis

## Future Considerations

As MCP clients evolve, more may add elicitation support. The capability detection approach ensures your server will automatically use new features as they become available without code changes.

## Testing Elicitation Support

### Test with a Simple Client
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {"elicitation": {}}}}' | node build/polydoc.js
```

### Test without Elicitation
```bash  
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {}}}' | node build/polydoc.js
```

This approach ensures your MCP server works reliably across different client implementations while taking advantage of advanced features when available.
