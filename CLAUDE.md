# Project

(One-line description of the project and its folder layout.)

## Read first
- `specs/PROJECT.md`: standing project rules (stack, checks, conventions).
- `specs/WORKFLOW.md`: how work is planned, built and accepted. Read it when running a spec command or when briefed on a spec.

## Commands
| Command | Purpose |
|---|---|
| `/spec-new <idea>` | Capture a todo spec |
| `/spec-refine <id>` | Interview the user to refine a todo spec |
| `/spec-find [filters]` | Search specs by status, tag or text |
| `/work [id]` | Start or resume a spec (orchestrator) |
| `/accept` | Close the spec in progress: verify, squash, merge |

The orchestrator rules live in the `/work` skill and `specs/WORKFLOW.md`. Subagents (`.claude/agents/`): `scout` (read-only lookups), `implementer` (one task), `verifier` (checks and requirements).
