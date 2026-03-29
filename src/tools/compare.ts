// ---------------------------------------------------------------------------
// MCP Tool: compare — show all services for a capability with scores
// ---------------------------------------------------------------------------

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { route } from "../router.js";
import type { CostConstraint } from "../types.js";

const inputSchema = {
  capability: z.string().describe("Capability to compare services for, e.g. 'geocoding', 'translation'"),
  constraint: z.enum(["free", "cheapest", "any"]).default("any").describe("Cost constraint filter"),
  region: z.string().optional().describe("Region filter, e.g. 'eu', 'us'"),
};

export function registerCompareTool(server: McpServer): void {
  server.tool(
    "compare",
    "Compare all available services for a capability. Shows scores, costs, and Hebline's recommendation.",
    inputSchema,
    async ({ capability, constraint, region }) => {
      const scored = route({
        capability,
        input: {},
        constraint: constraint as CostConstraint,
        region,
      });

      if (scored.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              capability,
              services: [],
              note: `No services available for '${capability}' with constraint '${constraint}'${region ? ` in region '${region}'` : ""}. Use 'categories' to see all supported capabilities.`,
            }, null, 2),
          }],
        };
      }

      const result = {
        capability,
        recommended: scored[0].service.id,
        services: scored.map((s, i) => ({
          rank: i + 1,
          id: s.service.id,
          name: s.service.name,
          score: s.score,
          free: s.service.free,
          costPerCall: s.service.costPerCall,
          avgLatencyMs: s.service.avgLatencyMs,
          qualityScore: s.service.qualityScore,
          successRate: s.service.successRate,
          requiresKey: s.service.requiresKey,
          keyAvailable: s.service.requiresKey
            ? !!process.env[s.service.envKey ?? ""]
            : true,
          breakdown: s.breakdown,
        })),
      };

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );
}
