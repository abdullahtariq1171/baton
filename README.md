# Baton

Shared memory for AI coding agents. Save what you were doing, switch agents, and the next one picks up where you stopped.

Baton is an MCP server that stores checkpoints — the task, the decisions made, what's left, and the files involved — in a local SQLite database inside your project. Claude Code, Cursor, and Codex all read the same checkpoint.

## The problem

Every agent handoff loses context. The new agent doesn't know what you decided, what changed, or what's next, so you re-explain it — or it re-reads files and burns tokens rediscovering what the last session already knew.

## The loop

```
save checkpoint  →  switch agents  →  get context  →  continue
```

## Quickstart

Requires Node 22.5+ (for `node:sqlite`).

```bash
git clone <this-repo> baton
cd baton && pnpm install && pnpm build
```

Initialize a workspace in any project:

```bash
node /path/to/baton/dist/cli.js init
```

That creates `.baton/baton.db` in the current directory.

Save a checkpoint:

```bash
node /path/to/baton/dist/cli.js save "refactoring auth to JWT" \
  -d "use JWT instead of sessions" \
  -d "argon2 for password hashing" \
  -n "add refresh token rotation" \
  -e "src/auth.ts"
```

Read it back as a prompt:

```bash
node /path/to/baton/dist/cli.js show
```

```md
## Current Task
refactoring auth to JWT

## Decisions Made
- use JWT instead of sessions
- argon2 for password hashing

## Next Steps
- add refresh token rotation

## Evidence
- src/auth.ts

Saved: 2026-11-03T14:05:02.354Z
```

Paste that into any agent and it has the context.

## MCP setup

### Command Code

```bash
cmd mcp add --scope user baton -- node /path/to/baton/dist/index.js
```

### Claude Code

```bash
claude mcp add baton --scope user -- node /path/to/baton/dist/index.js
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "baton": {
      "command": "node",
      "args": ["/path/to/baton/dist/index.js"]
    }
  }
}
```

Verify with `/mcp` inside a session — `baton` should be connected with six tools.

## Make your agent actually use it

Tools don't fire themselves. Add this to `AGENTS.md` (Codex, Cursor) or `CLAUDE.md` (Claude Code):

```md
## Session memory
Before ending a session or switching tools, call `baton_save_checkpoint` with:
- task: what you were doing
- decisions: choices made and why
- next_steps: what remains
- evidence: files and URLs the next agent needs

Do this silently, without asking. When starting a session, call
`baton_get_context` first if a checkpoint exists.
```

Without that rule, the agent will happily finish the task and save nothing.

## MCP tools

| Tool | Purpose |
|---|---|
| `baton_save_checkpoint` | Record task, decisions, next steps, evidence |
| `baton_get_context` | Load the latest checkpoint as a formatted prompt |
| `baton_get_checkpoint` | Load one checkpoint by id |
| `baton_list_checkpoints` | List checkpoints, newest first |
| `baton_delete_checkpoint` | Delete one by id |
| `baton_clear_workspace` | Delete all (requires `confirm: true`) |

## CLI

```bash
baton init                       # create .baton/ in the current project
baton save "task" -d "..." -n "..." -e "path"
baton list                       # newest first
baton show [id]                  # latest if no id
baton delete <id>
baton clear --yes
```

Every command except `init` requires an existing workspace and exits 1 with a clear message if there isn't one.

## How it works

- **One database per project**, at `<project>/.baton/baton.db`
- **Discovery walks up** from the current directory, the same way git finds `.git/`
- **The workspace is the directory** — there is no `workspaces` table; the database file is the scope
- **Checkpoints are append-only rows**: `id`, `task`, `decisions`, `next_steps`, `evidence`, `created_at`
- **The CLI and the MCP server share the same data layer** (`src/db.ts`), so they can't drift

```
baton/
├── src/
│   ├── db.ts       # schema, discovery, CRUD
│   ├── context.ts  # checkpoint → markdown prompt
│   ├── tools.ts    # MCP tool registration
│   ├── cli.ts      # command line interface
│   ├── index.ts    # MCP server entry (stdio)
│   └── types.ts
└── tests/
```

## Limitations

- **Evidence stores paths only.** The next agent still has to open the files. Storing snippets is the next feature, and until then Baton saves re-explaining, not re-reading.
- **One workspace per project.** A monorepo shares a single memory across all packages. There's no global, cross-project view.
- **The server exits if there's no `.baton/`.** Run `baton init` first, or the client will show it as failed.
- **The server resolves from its own working directory.** If your MCP client launches it elsewhere, it won't find the database.
- **No eval yet.** There's no published measurement of tokens saved — that's the next milestone.
- **Lexical: no search, no embeddings.** You get the latest checkpoint, not "what did I decide about auth three weeks ago."

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## License

MIT
