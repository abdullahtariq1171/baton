import { describe, it, expect } from "vitest";
import { formatContext } from "../src/context.js";
import type { Checkpoint } from "../src/types.js";

const checkpoint: Checkpoint = {
  id: "1",
  task: "Implement auth",
  decisions: ["Use JWT"],
  nextSteps: ["Add refresh tokens"],
  evidence: ["src/auth.ts"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("formatContext", () => {
  it("renders all sections with the task and bullet items", () => {
    const out = formatContext(checkpoint);
    expect(out).toContain("## Current Task");
    expect(out).toContain("Implement auth");
    expect(out).toContain("## Decisions Made");
    expect(out).toContain("- Use JWT");
    expect(out).toContain("## Next Steps");
    expect(out).toContain("- Add refresh tokens");
    expect(out).toContain("## Evidence");
    expect(out).toContain("- src/auth.ts");
    expect(out).toContain("Saved: 2026-01-01T00:00:00.000Z");
  });

  it("renders placeholders for empty lists", () => {
    const out = formatContext({ ...checkpoint, decisions: [], nextSteps: [], evidence: [] });
    expect(out).toContain("- (none)");
  });

  it("returns a friendly message for a null checkpoint", () => {
    const out = formatContext(null);
    expect(out).toContain("No checkpoint found");
    expect(out).toContain("baton_save_checkpoint");
  });
});
