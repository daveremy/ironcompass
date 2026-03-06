import { describe, it } from "node:test";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const MCP = "./dist/mcp.js";

function sendJsonRpc(proc: ReturnType<typeof spawn>, msg: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("Timeout waiting for MCP response"));
    }, 5000);

    let buf = "";
    proc.stdout!.on("data", (chunk: Buffer) => {
      buf += chunk.toString();
      if (buf.includes("\n")) {
        clearTimeout(timeout);
        resolve(buf.trim());
      }
    });

    proc.stderr!.on("data", () => {});

    proc.stdin!.write(JSON.stringify(msg) + "\n");
  });
}

function spawnMcp() {
  return spawn("node", [MCP], {
    cwd: import.meta.dirname + "/..",
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, PATH: process.env.PATH },
  });
}

async function initAndSend(proc: ReturnType<typeof spawn>, msg: object): Promise<any> {
  await sendJsonRpc(proc, {
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test", version: "0.0.1" },
    },
  });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  return JSON.parse(await sendJsonRpc(proc, msg));
}

describe("ironcompass MCP server", () => {
  it("responds to initialize with server info", async () => {
    const proc = spawnMcp();
    try {
      const raw = await sendJsonRpc(proc, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "0.0.1" },
        },
      });

      const response = JSON.parse(raw);
      assert.equal(response.jsonrpc, "2.0");
      assert.equal(response.id, 1);
      assert.ok(response.result, "Expected result in response");
      assert.equal(response.result.serverInfo.name, "ironcompass");
      assert.equal(response.result.serverInfo.version, "0.1.0");
      assert.ok(response.result.capabilities.tools, "Expected tools capability");
    } finally {
      proc.kill();
    }
  });

  it("lists ironcompass_query_today tool with date schema", async () => {
    const proc = spawnMcp();
    try {
      const response = await initAndSend(proc, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      });

      assert.ok(response.result, "Expected result");
      const tools = response.result.tools;
      assert.equal(tools.length, 1);
      assert.equal(tools[0].name, "ironcompass_query_today");
      assert.ok(tools[0].description.includes("health summary"));
      assert.equal(tools[0].inputSchema.properties.date.type, "string");
    } finally {
      proc.kill();
    }
  });
});
