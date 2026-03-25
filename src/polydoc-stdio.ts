#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config, getConfigSummary, logger, POLYDOC_VERSION } from './config.js';
import { handleRootsListChanged, logWorkspaceRoots, server } from "./serverInit.js";

logger.info(`Starting Polydoc MCP Server v${config.serverVersion || POLYDOC_VERSION} (stdio)`);
logger.info(`Environment: ${config.nodeEnv}`);
logger.debug('Configuration:', getConfigSummary());

const transport = new StdioServerTransport();

server.server.oninitialized = async () => {
  await handleRootsListChanged();
};

logWorkspaceRoots();

await server.connect(transport);
