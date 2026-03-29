// ---------------------------------------------------------------------------
// MCP Tool: execute — route & call the best service
// ---------------------------------------------------------------------------

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { routeBest } from "../router.js";
import { getAdapter } from "../adapters/index.js";
import { logCall } from "../logger.js";
import type { CostConstraint } from "../types.js";

const inputSchema = {
  capability: z.string().describe("What you need, e.g. 'geocoding', 'translation'"),
  input: z.record(z.unknown()).describe("Service-specific input (e.g. { query: 'Berlin' } for geocoding, { text: 'Hello', target: 'de' } for translation)"),
  constraint: z.enum(["free", "cheapest", "any"]).default("any").describe("Cost constraint: 'free' = only free services, 'cheapest' = prefer lowest cost, 'any' = best overall"),
  region: z.string().optional().describe("Preferred region, e.g. 'eu', 'us'. Omit for global."),
};

export function registerExecuteTool(server: McpServer): void {
  server.tool(
    "execute",
    "Route to the best service and execute the API call. Returns result with metadata (service used, cost, latency).",
    inputSchema,
    async ({ capability, input, constraint, region }) => {
      const best = routeBest({
        capability,
        input,
        constraint: constraint as CostConstraint,
        region,
      });

      if (!best) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `No service available for '${capability}' with constraint '${constraint}'${region ? ` in region '${region}'` : ""}. Use the 'categories' tool to see what's available.`,
            }),
          }],
        };
      }

      const adapter = getAdapter(best.service.id);
      if (!adapter) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Adapter not found for service '${best.service.id}'`,
            }),
          }],
        };
      }

      const start = performance.now();
      const result = await adapter.execute(input);
      const latencyMs = Math.round(performance.now() - start);

      // Log the call (fire-and-forget)
      logCall({
        timestamp: new Date().toISOString(),
        capability,
        serviceId: best.service.id,
        latencyMs,
        success: result.success,
        costUsd: best.service.costPerCall,
      }).catch(() => {});

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: result.success,
            data: result.data,
            error: result.error,
            meta: {
              service: best.service.name,
              serviceId: best.service.id,
              costUsd: best.service.costPerCall,
              latencyMs,
              score: best.score,
              free: best.service.free,
            },
          }, null, 2),
        }],
      };
    },
  );
}
