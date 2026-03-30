import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { join } from "node:path";

function sendMcpRequest(
  messages: object[],
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [join(import.meta.dirname, "..", "dist", "index.js")], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => {
      // Log stderr for debugging but don't fail
    });

    // Send messages with small delays
    let i = 0;
    function sendNext() {
      if (i >= messages.length) {
        setTimeout(() => {
          proc.stdin.end();
          proc.kill();
        }, 500);
        return;
      }
      proc.stdin.write(JSON.stringify(messages[i]) + "\n");
      i++;
      setTimeout(sendNext, 100);
    }
    sendNext();

    proc.on("close", () => {
      const lines = stdout.trim().split("\n").filter(Boolean);
      resolve(lines);
    });

    setTimeout(() => {
      proc.kill();
      reject(new Error("MCP server timed out"));
    }, 10_000);
  });
}

const INIT = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "e2e-test", version: "1.0" },
  },
};

const INITIALIZED = {
  jsonrpc: "2.0",
  method: "notifications/initialized",
};

describe("E2E: MCP Server", () => {
  it("initializes and lists tools", async () => {
    const lines = await sendMcpRequest([
      INIT,
      INITIALIZED,
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    ]);

    // Find the tools/list response
    const toolsResponse = lines
      .map((l) => JSON.parse(l))
      .find((r: any) => r.id === 2);

    expect(toolsResponse).toBeDefined();
    const toolNames = toolsResponse.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain("execute");
    expect(toolNames).toContain("compare");
    expect(toolNames).toContain("categories");
  });

  it("categories tool returns geocoding and translation", async () => {
    const lines = await sendMcpRequest([
      INIT,
      INITIALIZED,
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "categories", arguments: {} },
      },
    ]);

    const response = lines
      .map((l) => JSON.parse(l))
      .find((r: any) => r.id === 2);

    expect(response).toBeDefined();
    const content = JSON.parse(response.result.content[0].text);
    expect(content.totalCategories).toBe(9);
    expect(content.totalServices).toBe(20);

    const cats = content.categories.map((c: any) => c.category);
    expect(cats).toContain("geocoding");
    expect(cats).toContain("translation");
  });

  it("compare tool returns scored services", async () => {
    const lines = await sendMcpRequest([
      INIT,
      INITIALIZED,
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "compare",
          arguments: { capability: "translation", constraint: "free" },
        },
      },
    ]);

    const response = lines
      .map((l) => JSON.parse(l))
      .find((r: any) => r.id === 2);

    const content = JSON.parse(response.result.content[0].text);
    expect(content.recommended).toBe("mymemory");
    expect(content.services.length).toBe(1);
    expect(content.services[0].free).toBe(true);
  });
});
