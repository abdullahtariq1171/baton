import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db.js";

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "baton-test-"));
  dbPath = join(tmpDir, "baton.db");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("openDb", () => {
  it("creates the checkpoints table", () => {
    const db = openDb(dbPath);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain("checkpoints");
    db.close();
  });
});
