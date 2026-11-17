---
name: accept
description: Close the spec in progress: final verification, condense, squash and merge into main. Use only when the user types /accept.
disable-model-invocation: true
---
Close the spec in progress. Authoritative text: `specs/WORKFLOW.md` "Accept"; read it first, plus `specs/PROJECT.md`.

Refuse if no spec is in progress (`node .claude/scripts/specs.mjs current`). If the session is not running an Opus model, warn the user once and continue. Delegate checks to `verifier` with a brief (see `/work`), and use "final" for the verification run.

Checklist (stop and report on any failure; never force-push; never delete a branch that is not merged):

1. [ ] Final `verifier` run: all project checks and every Requirements scenario. On any failure stop; nothing is merged.
2. [ ] Write `## Result` in `spec.md` (delivered, verification numbers, follow-ups, essence of working files worth keeping), set `closed` to today, remove `## Progress` and `## Work files`.
3. [ ] Condense and commit:
   - `git mv specs/doing/NNN-slug/spec.md specs/done/NNN-slug.md`
   - `git rm -r specs/doing/NNN-slug`
   - `git commit -m "docs(specs): spec-NNN <title>"`
4. [ ] If `main` moved: `git merge main`; resolve conflicts, then verify again.
5. [ ] Squash:
   - `git log --reverse --format=%s main..HEAD` (record the subjects)
   - `git reset --soft main`
   - `git commit` once: subject `<type>(<scope>): spec-NNN <title>` (dominant type and scope of the branch), body = recorded subjects as a list, footers `Spec: spec-NNN` and the session's attribution trailer, if any (applies to every commit, see WORKFLOW.md "Principles").
6. [ ] Merge:
   - `git switch main`
   - `git merge --no-ff spec/NNN-slug -m "Merge branch 'spec/NNN-slug' into 'main'" -m "spec-NNN: <title>"`
   - `git branch -D spec/NNN-slug` only after the merge succeeded (the branch is then merged).
7. [ ] If `specs/todo/` has pending edits: `git add specs/todo` and `git commit -m "docs(specs): update backlog"`.
8. [ ] Report in one line: spec, squash sha, merge sha.
