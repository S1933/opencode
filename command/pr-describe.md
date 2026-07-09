---
description: Générer une description de PR depuis le diff courant
agent: build
---
Documentation-only command. Do not implement code.

Generate a production-ready PR description from the current branch diff. $ARGUMENTS

Inspect branch name, commits, `git status`, `git diff --stat`, and the relevant diff against the base branch. Write the final description to `pr-description.md` at the project root. Output must be concise French Markdown with: résumé, changements, tests à effectuer, tickets liés, risques, and rollback notes if relevant.
