#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { Command } from "commander";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  clearWorkspace,
  deleteCheckpoint,
  findBatonDb,
  getCheckpoint,
  getLatestCheckpoint,
  listCheckpoints,
  openDb,
  saveCheckpoint,
} from "./db.js";
import { formatContext } from "./context.js";

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function requireDb() {
  const dbPath = findBatonDb();
  if (!dbPath) {
    console.error("[baton] No .baton workspace found. Run 'baton init' first.");
    process.exit(1);
  }
  return openDb(dbPath);
}

const program = new Command();

program.name("baton").description("Shared memory for AI agents").version("0.1.0");

program
  .command("init")
  .description("Create a .baton workspace in the current project")
  .action(() => {
    const batonDir = join(process.cwd(), ".baton");
    if (!existsSync(batonDir)) mkdirSync(batonDir, { recursive: true });

    const db = openDb(join(batonDir, "baton.db"));
    db.close();

    console.log(`Initialized Baton workspace at ${batonDir}`);
  });

program
  .command("save")
  .description("Save a checkpoint")
  .argument("<task>", "What you are working on")
  .option("-d, --decision <text>", "Add a decision (repeatable)", collect, [])
  .option("-n, --next-step <text>", "Add a next step (repeatable)", collect, [])
  .option("-e, --evidence <entry>", "Add evidence: a file path or URL (repeatable)", collect, [])
  .action((task: string, opts: { decision: string[]; nextStep: string[]; evidence: string[] }) => {
    const db = requireDb();
    const checkpoint = saveCheckpoint(db, {
      task,
      decisions: opts.decision,
      nextSteps: opts.nextStep,
      evidence: opts.evidence,
    });
    db.close();
    console.log(`Saved checkpoint ${checkpoint.id}`);
  });

program
  .command("list")
  .description("List checkpoints, newest first")
  .action(() => {
    const db = requireDb();
    const checkpoints = listCheckpoints(db);
    db.close();

    if (checkpoints.length === 0) {
      console.log("No checkpoints yet.");
      return;
    }
    for (const c of checkpoints) {
      console.log(`${c.id}  ${c.createdAt}  ${c.task}`);
    }
  });

program
  .command("show")
  .description("Show a checkpoint (latest if no id given)")
  .argument("[id]", "Checkpoint id")
  .action((id?: string) => {
    const db = requireDb();
    const checkpoint = id ? getCheckpoint(db, id) : getLatestCheckpoint(db);
    db.close();

    if (!checkpoint) {
      console.error(id ? `Checkpoint not found: ${id}` : "No checkpoints yet.");
      process.exit(1);
    }
    console.log(formatContext(checkpoint));
  });

program
  .command("delete")
  .description("Delete a checkpoint by id")
  .argument("<id>", "Checkpoint id")
  .action((id: string) => {
    const db = requireDb();
    const deleted = deleteCheckpoint(db, id);
    db.close();
    if (!deleted) {
      console.error(`Checkpoint not found: ${id}`);
      process.exit(1);
    }
    console.log(`Deleted ${id}`);
  });

program
  .command("clear")
  .description("Delete all checkpoints in the workspace")
  .option("-y, --yes", "Confirm deletion (required)")
  .action((opts: { yes?: boolean }) => {
    if (!opts.yes) {
      console.error("Refusing to clear. Re-run with --yes to confirm.");
      process.exit(1);
    }
    const db = requireDb();
    const removed = clearWorkspace(db);
    db.close();
    console.log(`Cleared ${removed} checkpoint(s).`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
