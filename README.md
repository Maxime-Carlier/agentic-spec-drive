# Agentic spec-driven workflow

A Claude Code setup for working one spec at a time: specs in plain Markdown folders, an orchestrator session that delegates to subagents, and a git flow of one branch per spec squashed into `main`.

## What's inside
| Path | Role |
|---|---|
| `specs/WORKFLOW.md` | The process: layout, spec format, pipeline, accept, pause and resume |
| `specs/PROJECT.md` | Template for the project's standing rules, including the checks the verifier runs |
| `specs/TAGS.md` | Allowed tags |
| `specs/todo/`, `specs/doing/`, `specs/done/` | Specs by status (`doing/` is only filled on a spec branch) |
| `.claude/skills/` | `/spec-new`, `/spec-refine`, `/spec-find`, `/work`, `/accept`, plus `grill-me` / `grilling` |
| `.claude/agents/` | `scout` (haiku), `implementer` (sonnet), `verifier` (haiku) |
| `.claude/scripts/specs.mjs` | Search, board, lint, next id, session-start hook and status line (Node, no dependencies) |
| `.claude/settings.json` | Opus as default model, status line, session-start hook |

The `grill-me` and `grilling` skills come from [mattpocock/skills](https://github.com/mattpocock/skills) (see `skills-lock.json`).

## Use it in a project
1. Copy `.claude/`, `.agents/`, `specs/`, `CLAUDE.md` and `skills-lock.json` into the project root.
2. Fill in `specs/PROJECT.md` (especially "Checks"), `specs/TAGS.md` and the first line of `CLAUDE.md`.
3. Check the setup: `node .claude/scripts/specs.mjs lint` should print `ok (0 specs)`.
4. Open a new Claude Code session, then `/spec-new <idea>`, `/spec-refine <id>`, `/work <id>`, `/accept`.

Requirements: Claude Code, git, Node.js 18 or newer.
