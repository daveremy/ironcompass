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

const EXPECTED_TOOLS = [
  "ironcompass_query_today",
  "ironcompass_query_week",
  "ironcompass_query_trend",
  "ironcompass_query_streak",
  "ironcompass_log_daily",
  "ironcompass_log_sleep",
  "ironcompass_log_fasting",
  "ironcompass_log_bp",
  "ironcompass_log_workout",
  "ironcompass_log_meal",
  "ironcompass_log_pullups",
  "ironcompass_log_supplements",
  "ironcompass_log_bodycomp",
];

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

  it("lists all 13 tools with correct schemas", async () => {
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

      // All 13 tools present
      assert.equal(tools.length, 13);
      const names = tools.map((t: any) => t.name).sort();
      assert.deepEqual(names, [...EXPECTED_TOOLS].sort());

      // bp requires systolic and diastolic
      const bp = tools.find((t: any) => t.name === "ironcompass_log_bp");
      const bpRequired = bp.inputSchema.required ?? [];
      assert.ok(bpRequired.includes("systolic"), "systolic should be required");
      assert.ok(bpRequired.includes("diastolic"), "diastolic should be required");

      // workout type has enum
      const workout = tools.find((t: any) => t.name === "ironcompass_log_workout");
      const typeSchema = workout.inputSchema.properties.type;
      assert.ok(typeSchema.enum || typeSchema.anyOf, "type should have enum values");
    } finally {
      proc.kill();
    }
  });
});
