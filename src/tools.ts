import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DatabaseSync } from "node:sqlite";
import {
  clearWorkspace,
  deleteCheckpoint,
  getCheckpoint,
  listCheckpoints,
  saveCheckpoint,
} from "./db.js";

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerTools(server: McpServer, db: DatabaseSync): void {
  server.registerTool(
    "baton_save_checkpoint",
    {
      description:
        "Save a checkpoint of the current work (task, decisions, next steps, evidence) so another AI agent can resume with full context. Call this before switching agents.",
      inputSchema: {
        task: z.string().describe("What you are currently working on"),
        decisions: z.array(z.string()).default([]).describe("Key decisions made so far"),
        next_steps: z.array(z.string()).default([]).describe("What the next agent should do"),
        evidence: z.array(z.string()).default([]).describe("File paths or URLs to look at"),
      },
    },
    async ({ task, decisions, next_steps, evidence }) => {
      const checkpoint = saveCheckpoint(db, {
        task,
        decisions,
        nextSteps: next_steps,
        evidence,
      });
      return ok({ id: checkpoint.id, created_at: checkpoint.createdAt });
    },
  );

  server.registerTool(
    "baton_list_checkpoints",
    {
      description: "List all saved checkpoints, newest first.",
      inputSchema: {},
    },
    async () => {
      const checkpoints = listCheckpoints(db);
      return ok({ count: checkpoints.length, checkpoints });
    },
  );

  server.registerTool(
    "baton_get_checkpoint",
    {
      description: "Load a specific checkpoint by its id.",
      inputSchema: {
        checkpoint_id: z.string().describe("The checkpoint id"),
      },
    },
    async ({ checkpoint_id }) => {
      const checkpoint = getCheckpoint(db, checkpoint_id);
      if (!checkpoint) return fail(`Checkpoint not found: ${checkpoint_id}`);
      return ok(checkpoint);
    },
  );

  server.registerTool(
    "baton_delete_checkpoint",
    {
      description: "Delete a checkpoint by its id.",
      inputSchema: {
        checkpoint_id: z.string().describe("The checkpoint id"),
      },
    },
    async ({ checkpoint_id }) => {
      const deleted = deleteCheckpoint(db, checkpoint_id);
      if (!deleted) return fail(`Checkpoint not found: ${checkpoint_id}`);
      return ok({ deleted: true, id: checkpoint_id });
    },
  );

  server.registerTool(
    "baton_clear_workspace",
    {
      description: "Delete ALL checkpoints. This cannot be undone.",
      inputSchema: {
        confirm: z
          .boolean()
          .default(false)
          .describe("Must be true to proceed. Confirms you want to delete everything."),
      },
    },
    async ({ confirm }) => {
      if (!confirm) {
        return fail("Refusing to clear the workspace. Call again with confirm: true.");
      }
      const removed = clearWorkspace(db);
      return ok({ removed });
    },
  );
}
