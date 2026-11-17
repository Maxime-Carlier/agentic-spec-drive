---
name: spec-find
description: Search or list specs by status, tag or text, or show the board. Use when asked what specs exist, what is todo/paused/done, or to find a spec.
argument-hint: [filters]
---
Request: $ARGUMENTS

Translate the request into a call to `node .claude/scripts/specs.mjs` and show the output as is, without rewording.

- Empty request: `node .claude/scripts/specs.mjs board`.
- Otherwise: `node .claude/scripts/specs.mjs find [options] [query]` with:
  - `--status todo|doing|paused|done|all`
  - `--tag <t>` (repeatable; all must match; tags are listed in `specs/TAGS.md`)
  - `--in meta|all` (`meta` = title and description, default; `all` = whole file, also prints matching lines)
  - `query`: free text, case-insensitive.

Output lines are `status  NNN  title  [tags]`. Details: `specs/WORKFLOW.md` ("Script").
