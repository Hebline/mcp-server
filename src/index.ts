#!/usr/bin/env node
// ---------------------------------------------------------------------------
// @hebline/mcp-server — MCP-native API broker
// Routes agents to the best service at the best price.
// ---------------------------------------------------------------------------

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerExecuteTool } from "./tools/execute.js";
import { registerCompareTool } from "./tools/compare.js";
import { registerCategoriesTool } from "./tools/categories.js";

const server = new McpServer({
  name: "hebline",
  version: "0.1.0",
});

// Register all tools
registerExecuteTool(server);
registerCompareTool(server);
registerCategoriesTool(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
