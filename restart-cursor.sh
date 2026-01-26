#!/bin/bash

echo "🔄 Restarting Cursor to pick up MCP server changes..."

# Kill Cursor processes gracefully
echo "📱 Closing Cursor..."
osascript -e 'tell application "Cursor" to quit'

# Wait a moment for proper shutdown
sleep 3

# Start Cursor again
echo "🚀 Starting Cursor..."
open -a Cursor

echo "✅ Cursor has been restarted!"
echo ""
echo "📋 Next steps:"
echo "1. Wait for Cursor to fully load"
echo "2. Open the MCP Tools panel (Settings → Tools & MCP)"
echo "3. Check that 'polydoc-database-docs' shows '5 tools enabled'"
echo "4. Try using one of the tools!"
echo ""
echo "🛠️  Available tools:"
echo "   • scan-external-project - Quick scan of any project directory"
echo "   • build-database-documentation - Comprehensive documentation with metrics"
echo "   • debug-workspace-info - Shows current workspace root directories and paths"
echo "   • debug-client-capabilities - Checks what capabilities the MCP client supports"
echo "   • set-workspace-root - Manually set the workspace root directory"
