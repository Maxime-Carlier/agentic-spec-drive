# Spec workflow

How work is planned, built and accepted in this repository. The skills in `.claude/skills/` (`/spec-new`, `/spec-refine`, `/spec-find`, `/work`, `/accept`) follow this file; when a skill and this file disagree, this file wins.

## Principles
- **One spec at a time.** No parallel tasks, no worktrees. Subagents run one after another.
- **The orchestrator is the session running `/work` or `/accept`.** It plans, delegates and reviews; it does not write implementation code beyond trivial one-line fixes.
- **Only the orchestrator runs git commands that change state.** Subagents never do. A second session may edit specs in `specs/todo/` but never commits.
- **Every commit** (task, docs, squash, merge, wip) ends with the attribution trailer the session's instructions require, if any, after the `Spec: spec-NNN` footer.
- **Uncommitted `specs/todo/` edits** from a second session travel across `git switch`. If git refuses to switch because of them, `git stash push -- specs/todo`, switch, `git stash pop`.
- **State lives in files and git, never in conversation memory.** Any new session (new model, crash, next day) resumes from them.
- The orchestrator should run on Opus. If `/work` or `/accept` starts on another model, warn the user once, then continue.

## Layout

```
specs/
├── WORKFLOW.md      this file
├── PROJECT.md       standing project rules (rewrite lines in place, never append history)
├── TAGS.md          allowed tags
├── todo/NNN-slug.md            a spec not started (single file)
├── doing/NNN-slug/             a spec in progress, ONLY on its branch
│   ├── spec.md
│   └── NN-<agent>-<topic>.md   working files
└── done/NNN-slug.md            a finished spec (single condensed file)
```

- Status comes from location, never from a field:
  - **todo**: a file in `specs/todo/` whose id has no `spec/NNN-*` branch.
  - **doing**: the spec whose `spec/NNN-*` branch is checked out (its folder is in `specs/doing/`).
  - **paused**: a `spec/NNN-*` branch exists but is not checked out. On other branches its file still shows in `todo/`; tools hide it from the todo list.
  - **done**: a file in `specs/done/`.
- `specs/doing/` is committed on the spec's branch only. Its files never reach `main`: they are condensed into `done/` before the squash.
- Ids are three digits, assigned once, never reused: next id = highest id found in `todo/`, `done/` and `spec/*` branch names, plus one.

## Spec format

```markdown
---
id: "007"
title: Dark footer
description: One or two sentences, what and why. Searched by default.
tags: [front, design]
created: 2026-11-17
refined: 2026-11-18   # set by /spec-refine or the Refine stage
closed: 2026-11-20    # set by /accept
---

## Goal
## Context
## Requirements
## Decisions
## Out of scope
## Tasks
## Result
```

- A todo stub needs only the frontmatter (without `refined`/`closed`) and **Goal**.
- **Requirements**: when there is behaviour to test, write `The <thing> SHALL <behaviour>.` followed by scenarios `- WHEN <condition> THEN <outcome>`. Otherwise a plain checklist.
- **Decisions**: the outcomes of the grill-me interview, one line each.
- **Tasks**: `- [ ] 1. <task>`; once committed, `- [x] 1. <task> (<short sha>)`.
- **Result** (written at `/accept`): what was delivered, verification numbers, follow-ups, and the essence of the working files worth keeping.
- Tags must be listed in `specs/TAGS.md`. Add a tag there before using it.
- While in `doing/`, `spec.md` also has, at the end:

```markdown
## Progress
Stage: Build
Task: 2/4
Updated: 2026-11-17

## Work files
- 01-scout-context.md: where the footer styles live
- 02-implementer-task1.md: task 1 report
```

  Both sections are removed when the spec is condensed into `done/`.

## Commands

| Command | Purpose |
|---|---|
| `/spec-new <idea>` | Write a todo stub. Ask nothing beyond what is needed for a title, description, tags and goal. |
| `/spec-refine <id>` | Run the grilling skill on a todo spec, write the outcome into it, set `refined`. Ends with the user's approval. |
| `/spec-find [filters]` | Search specs (see Script). |
| `/work [id]` | With an id: start or resume that spec. Without: resume the spec in progress, else show the board. |
| `/accept` | Close the spec in progress: verify, condense, squash, merge. |

**Backlog commits.** `/spec-new` and `/spec-refine` commit their file on `main` as `docs(specs): add spec-NNN <title>` / `docs(specs): refine spec-NNN` only when `main` is checked out and no spec is in progress. Otherwise they leave the file uncommitted, and `/accept` commits all pending `specs/todo/` changes on `main` as `docs(specs): update backlog`. The orchestrator never stages `specs/todo/` changes that belong to other specs while on a spec branch.

## Pipeline (`/work`)

1. **Pick**
   - If another spec is in progress, offer to pause it (see Pause) and stop unless the user agrees.
   - From `main` (clean except `specs/todo/` edits): `git switch -c spec/NNN-slug`, `git mv specs/todo/NNN-slug.md specs/doing/NNN-slug/spec.md`, add the Progress and Work files sections, commit `docs(specs): spec-NNN start`.
2. **Refine** (skipped if `refined` is set and the user confirms nothing changed)
   - Run the grilling skill on the spec. Facts come from `scout`; decisions come from the user.
   - Rewrite the spec: Context, Requirements, Decisions, Out of scope. Set `refined`.
   - The last question of the interview is the user's approval of the spec. No code before it.
3. **Plan**
   - Write the Tasks checklist: small, ordered tasks, each verifiable. Commit `docs(specs): spec-NNN plan`.
4. **Build**, for each task in order:
   1. `implementer` with a short brief: the spec path, the task number, anything not already in the spec. It writes its report to the work file named in the brief.
   2. `verifier`: runs the checks and the relevant Requirements scenarios; writes its report to its work file.
   3. Orchestrator review of the diff, especially for design-sensitive changes.
   4. If something fails, a fix brief to `implementer`, then verify again.
   5. Commit the code and `specs/doing/NNN-slug/` together: a Conventional Commit scoped by project (`feat(front): ...`) with the footer `Spec: spec-NNN`. Tick the task with its sha; update Progress.
5. **Accept stage**
   - Optionally write `acceptance.md` in the spec folder: only what needs a human eye (what to run and look at, specific choices worth a glance with `file:line`, the agent's own observations). Skip it when nothing needs review.
   - Tell the user the spec is ready for `/accept`. If the user reports a problem instead, each problem becomes a fix task (back to Build, own commit).

**Subagent briefs** stay short: they point to `specs/PROJECT.md`, `specs/WORKFLOW.md` only if needed, the spec file and the task number, and name the work file to write (`NN-<agent>-<topic>.md`, NN = next number among the `NN-*` files of the folder; `spec.md` and `acceptance.md` don't count). Subagents reply with a 3-line summary plus the work file path, so their full report never has to pass through the orchestrator's context.

## Accept (`/accept`)

1. Final `verifier` run: all project checks plus every Requirements scenario. If anything fails, stop and report; nothing is merged.
2. Write **Result** in `spec.md`, set `closed`, remove Progress and Work files, keep from the working files only what is worth keeping.
3. Condense: `git mv specs/doing/NNN-slug/spec.md specs/done/NNN-slug.md`, `git rm -r specs/doing/NNN-slug`, commit `docs(specs): spec-NNN <title>`.
4. `git merge main` into the branch if `main` moved (resolve conflicts, verify again).
5. Squash: record the subjects of the branch commits (`git log --reverse --format=%s main..HEAD`), then `git reset --soft main` and commit once:
   - subject: `<type>(<scope>): spec-NNN <title>`, with the dominant type and scope of the branch (`feat(front)`, `chore(workflow)`, ...);
   - body: the recorded subjects as a list;
   - footers: `Spec: spec-NNN` and the Co-Authored-By line.
6. `git switch main`, `git merge --no-ff spec/NNN-slug -m "Merge branch 'spec/NNN-slug' into 'main'"` with body `spec-NNN: <title>`, then `git branch -D spec/NNN-slug`.
7. Commit pending `specs/todo/` edits as `docs(specs): update backlog`, if any.
8. Report in one line: spec, squash sha, merge sha.

`main` therefore receives two commits per spec: the squash commit and the merge commit. `git log --first-parent main` lists one merge per spec.

## Pause and resume

- **Pause** spec A to work on B: stage everything except `specs/todo/` (`git add -A -- . ':!specs/todo'`), commit `wip(<scope>): spec-NNN paused at <stage>` on A's branch, `git switch main`, then Pick B. Git removes A's `specs/doing/` folder from disk and restores it when A's branch is checked out again.
- **Resume** (`/work` with no id, or `/work <id>` of a paused spec):
  1. `git switch spec/NNN-slug` if needed; `git merge main` if `main` moved.
  2. Read `spec.md` (Progress, Tasks, Work files), `git log --oneline main..HEAD` and `git status`.
  3. Give the user a three-line summary (spec, stage and task, uncommitted changes) and wait for a go-ahead before continuing.
- Nothing is ever undone or rewritten on a branch before `/accept`; the WIP commit disappears in the squash.

## Script

`node .claude/scripts/specs.mjs <command>`, no dependencies. Used by `/spec-find`, the board, the session-start hook and the status line, so they always agree.

| Command | Output |
|---|---|
| `find [--status todo\|doing\|paused\|done\|all] [--tag t]... [--in meta\|all] [query]` | One line per spec: `status  NNN  title  [tags]`; with `--in all`, also the matching lines. `--tag` is repeatable (all must match); `--in meta` (default) searches title and description. Case-insensitive. |
| `board` | In progress (with stage and task), paused, todo, last five done. |
| `current` | One line: `spec-NNN <title> · <stage> <task>`, or `no spec in progress`. |
| `hook` | Session-start context: the `current` line, paused ids, todo count, and a hint to run `/work`. |
| `statusline` | Same as `current`, for the status line (reads and ignores stdin). |
| `next-id` | The next free id. |
| `lint` | Checks every spec's frontmatter, unknown tags, duplicate ids, file names matching ids. Exit 1 on errors. |
