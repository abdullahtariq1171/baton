import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, join, resolve } from "node:path";
import type { Checkpoint, CheckpointInput } from "./types.js";
import { randomUUID } from "node:crypto";


const schema = `
CREATE TABLE IF NOT EXISTS checkpoints (
  id         TEXT PRIMARY KEY,
  task       TEXT NOT NULL,
  decisions  TEXT NOT NULL,
  next_steps TEXT NOT NULL,
  evidence   TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_created ON checkpoints(created_at DESC);
`;

export function findBatonDb(startDir: string = process.cwd()): string | null {
  let current = resolve(startDir);
  while (true) {
    const candidate = join(current, ".baton", "baton.db");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return null; // hit "/"
    current = parent;
  }
}

export function openDb(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec(schema);
  return db;
}

export function saveCheckpoint(
  db: DatabaseSync,
  input: CheckpointInput,
): Checkpoint {
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO checkpoints (id, task, decisions, next_steps, evidence, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.task,
    JSON.stringify(input.decisions),
    JSON.stringify(input.nextSteps),
    JSON.stringify(input.evidence),
    createdAt,
  );

  return {
    id,
    task: input.task,
    decisions: input.decisions,
    nextSteps: input.nextSteps,
    evidence: input.evidence,
    createdAt,
  };
}


type CheckpointRow = {
  id: string;
  task: string;
  decisions: string;
  next_steps: string;
  evidence: string;
  created_at: string;
};

function parseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToCheckpoint(row: CheckpointRow): Checkpoint {
  return {
    id: row.id,
    task: row.task,
    decisions: parseArray(row.decisions),
    nextSteps: parseArray(row.next_steps),
    evidence: parseArray(row.evidence),
    createdAt: row.created_at,
  };
}

export function listCheckpoints(db: DatabaseSync): Checkpoint[] {
  const rows = db
    .prepare(
      `SELECT id, task, decisions, next_steps, evidence, created_at
       FROM checkpoints
       ORDER BY created_at DESC`,
    )
    .all() as CheckpointRow[];

  return rows.map(rowToCheckpoint);
}

export function getCheckpoint(db: DatabaseSync, id: string): Checkpoint | null {
  const row = db
    .prepare(
      `SELECT id, task, decisions, next_steps, evidence, created_at
       FROM checkpoints
       WHERE id = ?`,
    )
    .get(id) as CheckpointRow | undefined;

  return row ? rowToCheckpoint(row) : null;
}

export function deleteCheckpoint(db: DatabaseSync, id: string): boolean {
  const result = db.prepare(`DELETE FROM checkpoints WHERE id = ?`).run(id);
  return Number(result.changes) > 0;
}

export function clearWorkspace(db: DatabaseSync): number {
  const result = db.prepare(`DELETE FROM checkpoints`).run();
  return Number(result.changes);
}