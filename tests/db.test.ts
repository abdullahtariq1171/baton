import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  openDb,
  saveCheckpoint,
  listCheckpoints,
  getCheckpoint,
  getLatestCheckpoint,
  deleteCheckpoint,
  clearWorkspace,
} from "../src/db.js";

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

describe("saveCheckpoint + listCheckpoints", () => {
  it("saves a checkpoint and reads it back with parsed arrays", () => {
    const db = openDb(dbPath);
    const saved = saveCheckpoint(db, {
      task: "Implement auth",
      decisions: ["Use JWT"],
      nextSteps: ["Add refresh tokens"],
      evidence: ["src/auth.ts"],
    });

    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeTruthy();

    const all = listCheckpoints(db);
    expect(all).toHaveLength(1);
    expect(all[0]!.task).toBe("Implement auth");
    expect(all[0]!.decisions).toEqual(["Use JWT"]);
    expect(all[0]!.nextSteps).toEqual(["Add refresh tokens"]);
    expect(all[0]!.evidence).toEqual(["src/auth.ts"]);
    db.close();
  });

  it("lists newest first", async () => {
    const db = openDb(dbPath);
    saveCheckpoint(db, { task: "first", decisions: [], nextSteps: [], evidence: [] });
    await new Promise((r) => setTimeout(r, 5));
    const second = saveCheckpoint(db, {
      task: "second",
      decisions: [],
      nextSteps: [],
      evidence: [],
    });

    const all = listCheckpoints(db);
    expect(all).toHaveLength(2);
    expect(all[0]!.id).toBe(second.id);
    db.close();
  });
});

describe("getCheckpoint", () => {
  it("returns the saved checkpoint by id", () => {
    const db = openDb(dbPath);
    const saved = saveCheckpoint(db, {
      task: "x",
      decisions: ["d"],
      nextSteps: ["n"],
      evidence: ["e"],
    });

    const found = getCheckpoint(db, saved.id);
    expect(found?.task).toBe("x");
    expect(found?.decisions).toEqual(["d"]);
    expect(found?.nextSteps).toEqual(["n"]);
    db.close();
  });

  it("returns null for an unknown id", () => {
    const db = openDb(dbPath);
    expect(getCheckpoint(db, "does-not-exist")).toBeNull();
    db.close();
  });
});

describe("deleteCheckpoint", () => {
  it("returns true when deleted, false when missing", () => {
    const db = openDb(dbPath);
    const c = saveCheckpoint(db, { task: "t", decisions: [], nextSteps: [], evidence: [] });
    expect(deleteCheckpoint(db, c.id)).toBe(true);
    expect(deleteCheckpoint(db, c.id)).toBe(false);
    db.close();
  });
});

describe("clearWorkspace", () => {
  it("removes all checkpoints and returns the count", () => {
    const db = openDb(dbPath);
    saveCheckpoint(db, { task: "a", decisions: [], nextSteps: [], evidence: [] });
    saveCheckpoint(db, { task: "b", decisions: [], nextSteps: [], evidence: [] });

    expect(clearWorkspace(db)).toBe(2);
    expect(listCheckpoints(db)).toHaveLength(0);
    db.close();
  });
});

describe("getLatestCheckpoint", () => {
  it("returns null when the workspace is empty", () => {
    const db = openDb(dbPath);
    expect(getLatestCheckpoint(db)).toBeNull();
    db.close();
  });

  it("returns the newest checkpoint", async () => {
    const db = openDb(dbPath);
    saveCheckpoint(db, { task: "first", decisions: [], nextSteps: [], evidence: [] });
    await new Promise((r) => setTimeout(r, 5));
    const second = saveCheckpoint(db, {
      task: "second",
      decisions: [],
      nextSteps: [],
      evidence: [],
    });

    expect(getLatestCheckpoint(db)?.id).toBe(second.id);
    db.close();
  });
});
