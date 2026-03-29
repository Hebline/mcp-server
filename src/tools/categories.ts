// ---------------------------------------------------------------------------
// MCP Tool: categories — list all supported capabilities
// ---------------------------------------------------------------------------

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { services, getCategories, getServicesByCategory } from "../registry.js";

export function registerCategoriesTool(server: McpServer): void {
  server.tool(
    "categories",
    "List all capabilities Hebline supports and which services are available for each.",
    async () => {
      const categories = getCategories().map((cat) => {
        const categoryServices = getServicesByCategory(cat);
        return {
          category: cat,
          serviceCount: categoryServices.length,
          services: categoryServices.map((s) => ({
            id: s.id,
            name: s.name,
            free: s.free,
            requiresKey: s.requiresKey,
            keyAvailable: s.requiresKey
              ? !!process.env[s.envKey ?? ""]
              : true,
          })),
        };
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            totalCategories: categories.length,
            totalServices: services.length,
            categories,
          }, null, 2),
        }],
      };
    },
  );
}
