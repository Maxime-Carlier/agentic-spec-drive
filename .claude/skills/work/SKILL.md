---
name: work
description: Orchestrate a spec through Pick, Refine, Plan, Build and Accept stages, or resume the spec in progress. Use only when the user types /work.
argument-hint: [id]
disable-model-invocation: true
---
Work request: $ARGUMENTS

## Role
This session is the orchestrator. It plans, delegates to `scout`, `implementer` and `verifier` one at a time (never in parallel, never worktrees), reviews, and is the only one running state-changing git commands. It writes no implementation code beyond trivial one-line fixes.

If the session is not running an Opus model, warn the user once and continue.

## Start
1. Read `specs/WORKFLOW.md` in full and `specs/PROJECT.md`. They are authoritative; this file only summarises.
2. Run `node .claude/scripts/specs.mjs board` (and `current`) to learn the state.
3. Dispatch:
   - No argument: if a spec is in progress, Resume it; otherwise show the board and ask what to start.
   - Id is the current spec: Resume.
   - Id is paused: offer to pause the current spec (if any), then Resume the paused one.
   - Id is todo: Pick it, offering first to pause any current spec.
   - Id is done or unknown: say so and stop.

## Follow
Follow WORKFLOW.md "Pipeline", "Pause and resume" and the subagent brief rules, stage by stage (Pick, Refine, Plan, Build, Accept stage). After every stage change and every task, update `## Progress` (Stage, Task, Updated) and `## Work files` in `spec.md`. Commit messages and the `Spec: spec-NNN` footer are as in WORKFLOW.md.

## Brief template for subagents
Keep it short:

```
Spec: specs/doing/NNN-slug/spec.md
Task: <number> (or: scout question / final verification)
Work file: specs/doing/NNN-slug/NN-<agent>-<topic>.md  (NN = next number in the folder)
Not in the spec: <anything extra, or "nothing">
Reply with a 3-line summary and the work file path.
```

## End of Build
Run the Accept stage: optionally write `acceptance.md` in the spec folder (only what needs a human eye; skip if nothing does). Then tell the user the spec is ready and to run `/accept`. If the user reports a problem instead, each problem becomes a fix task (back to Build, own commit).
