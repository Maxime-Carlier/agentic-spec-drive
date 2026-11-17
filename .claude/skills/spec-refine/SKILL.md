---
name: spec-refine
description: Refine a todo spec through a grilling interview and write requirements into it. Use only when the user types /spec-refine.
argument-hint: <id>
disable-model-invocation: true
---
Refine spec: $ARGUMENTS

Formats and rules: `specs/WORKFLOW.md` ("Spec format", "Backlog commits"). Steps:

1. Check the id is a todo spec: `node .claude/scripts/specs.mjs find --status todo`. If not listed, refuse and say why (unknown, paused, doing or done).
2. Read `specs/PROJECT.md` and the spec file.
3. Invoke the `grilling` skill to interview the user about the spec. Facts come from the `scout` subagent; decisions come from the user. The last question is the user's approval of the spec. Write nothing before approval.
4. Rewrite the spec's `## Context`, `## Requirements` (`The <thing> SHALL <behaviour>.` with `- WHEN <condition> THEN <outcome>` scenarios where there is behaviour to test, else a checklist), `## Decisions` (one line each) and `## Out of scope`. Set `refined` to today's date. Keep Goal; leave Tasks and Result to `/work` and `/accept`.
5. Run `node .claude/scripts/specs.mjs lint`; fix any error.
6. Commit per "Backlog commits" (only on `main` with no spec in progress, message `docs(specs): refine spec-NNN`); otherwise leave uncommitted.
