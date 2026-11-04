#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { findBatonDb, openDb } from "./db.js";
import { registerTools } from "./tools.js";

const dbPath = findBatonDb();
if (!dbPath) {
  console.error("[baton] No .baton workspace found. Run 'baton init' in your project first.");
  process.exit(1);
}

const db = openDb(dbPath);

const server = new McpServer({ name: "baton-server", version: "1.0.0" });

registerTools(server, db);

const transport = new StdioServerTransport();

await server.connect(transport);
