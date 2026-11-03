#!/usr/bin/env node
import { Command } from "commander";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { openDb } from "./db.js";

const program = new Command();

program.name("baton").description("Shared memory for AI agents").version("0.1.0");

program
  .command("init")
  .description("Create a .baton workspace in the current project")
  .action(() => {
    const batonDir = join(process.cwd(), ".baton");
    if (!existsSync(batonDir)) mkdirSync(batonDir, { recursive: true });

    const dbPath = join(batonDir, "baton.db");
    const db = openDb(dbPath);
    db.close();

    console.log(`Initialized Baton workspace at ${batonDir}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
