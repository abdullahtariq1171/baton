import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, join, resolve } from "node:path";

const schema = `CREATE TABLE IF NOT EXISTS checkpoints
  (
     id         TEXT PRIMARY KEY,
     task       TEXT NOT NULL,
     decisions  TEXT NOT NULL,
     next_steps TEXT NOT NULL,
     evidence   TEXT NOT NULL,
     created_at TEXT NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_checkpoints_created ON checkpoints(created_at
DESC);
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
