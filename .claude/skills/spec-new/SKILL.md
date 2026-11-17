---
name: spec-new
description: Write a new todo spec stub from a short idea. Use only when the user types /spec-new.
argument-hint: <idea>
disable-model-invocation: true
---
Create a todo spec stub for: $ARGUMENTS

Process and formats: `specs/WORKFLOW.md` ("Spec format", "Backlog commits"). Steps:

1. Get the next id: `node .claude/scripts/specs.mjs next-id`.
2. Derive a kebab-case slug (max about 5 words).
3. Read `specs/TAGS.md`; choose tags from it only. Never invent a tag.
4. Write `specs/todo/NNN-slug.md` with frontmatter (`id` quoted, `title`, `description`, `tags`, `created` = today's date) and a `## Goal` section. Nothing else.
5. Ask the user at most one question, and only if the idea is too vague to write a goal.
6. Run `node .claude/scripts/specs.mjs lint`; fix any error.
7. Commit per "Backlog commits" in WORKFLOW.md (only on `main` with no spec in progress, message `docs(specs): add spec-NNN <title>`); otherwise leave the file uncommitted.
8. Report the file path in one line.
