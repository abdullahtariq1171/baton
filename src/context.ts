import type { Checkpoint } from "./types.js";

function bullets(items: string[]): string[] {
  if (items.length === 0) return ["_None recorded._"];
  return items.map((item) => `- ${item}`);
}

export function formatContext(checkpoint: Checkpoint | null): string {
  if (!checkpoint) {
    return [
      "No checkpoint found for this workspace.",
      "Save one with the baton_save_checkpoint tool (or `baton save`) so the next agent can resume.",
    ].join("\n");
  }

  const lines: string[] = [];

  lines.push("## Current Task");
  lines.push(checkpoint.task);

  lines.push("");
  lines.push("## Decisions Made");
  lines.push(...bullets(checkpoint.decisions));

  lines.push("");
  lines.push("## Next Steps");
  lines.push(...bullets(checkpoint.nextSteps));

  lines.push("");
  lines.push("## Evidence");
  lines.push(...bullets(checkpoint.evidence));

  lines.push("");
  lines.push(`Saved: ${checkpoint.createdAt}`);

  return lines.join("\n");
}
