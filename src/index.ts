import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { findBatonDb, openDb } from "./db.js";
import { registerTools } from "./tools.js";

function resolveDbPath(): string {
  const existing = findBatonDb();
  if (existing) return existing;

  const batonDir = join(process.cwd(), ".baton");
  if (!existsSync(batonDir)) mkdirSync(batonDir, { recursive: true });
  return join(batonDir, "baton.db");
}

const dbPath = resolveDbPath();
const db = openDb(dbPath);

const server = new McpServer({ name: "baton-server", version: "1.0.0" });

registerTools(server, db);

const transport = new StdioServerTransport();

await server.connect(transport);
