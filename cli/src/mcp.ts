#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchDay } from "./commands/query.js";
import { todayDate } from "./lib/date.js";

const server = new McpServer({ name: "ironcompass", version: "0.1.0" });

server.registerTool("ironcompass_query_today", {
  title: "Today's Summary",
  description:
    "Get full health summary for a date (daily, sleep, fasting, workouts, meals, pullups, supplements, body composition)",
  inputSchema: z.object({
    date: z
      .string()
      .optional()
      .describe("YYYY-MM-DD, defaults to today"),
  }),
}, async ({ date }) => {
  const result = await fetchDay(date ?? todayDate());
  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
