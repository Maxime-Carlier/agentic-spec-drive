# Project

Standing project rules. Rewrite a line when a decision changes; git keeps the history. Do not copy what the code already states. How work is done: `specs/WORKFLOW.md`.

Fill in each section for your project; delete the hints in parentheses.

## Product
- (What the project is, who it is for, and any rule about what must never be published.)

## Repository
- (Branch, remote, folder layout, ignored folders.)
- Work follows `specs/WORKFLOW.md`: one branch per spec, task commits on the branch, then one squash commit and one merge commit on `main`. Conventional Commits scoped by area (`feat(<area>): ...`).

## Stack
- (Languages, frameworks, package manager, runtime versions.)

## Checks
The verifier runs these commands (from the folder given) after each task and before `/accept`:
- (e.g. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` in `app/`.)

## Code conventions
- (Naming, structure, where content and configuration live.)

## Design
- (Visual and UX rules, if any.)

## Performance
- (Measurable targets, if any.)
