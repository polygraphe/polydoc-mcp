#!/usr/bin/env node

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from 'express';
import { config, getConfigSummary, logger, POLYDOC_VERSION } from './config.js';
import { checkClientCapabilities, handleRootsListChanged, logWorkspaceRoots, server } from "./serverInit.js";

const app = express();
app.use(express.json());

logger.info(`Starting Polydoc MCP Server v${config.serverVersion || POLYDOC_VERSION}`);
logger.info(`Environment: ${config.nodeEnv}`);
logger.debug('Configuration:', getConfigSummary());

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined
});
server.connect(transport);

server.server.oninitialized = async () => {
  await handleRootsListChanged();
};

logWorkspaceRoots();

checkClientCapabilities();

app.post('/mcp', async (req: Request, res: Response) => {
  try {
    await transport.handleRequest(req, res, req.body);
  }
  catch (error) {
    logger.error('Internal server error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: null
      });
    }
  }
});

const PORT = 3000;
app.listen(PORT, async () => {
  logger.info(`Polydoc Stateless Streamable HTTP Server listening on port ${PORT}`);
});