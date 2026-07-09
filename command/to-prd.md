---
description: Générer un PRD structuré depuis la discussion ou une idée
agent: build
---
Documentation-only command. Do not implement code.

Generate a structured PRD for: $ARGUMENTS

Use the current conversation as context. If critical scope, data model, API, or security questions are blocking, ask them before writing. Otherwise inspect the relevant codebase, ground requirements in real modules/routes/entities where applicable, and write the PRD to `docs/prd/<slug>.md` unless the user provided another path.

Include: problem statement, goals, non-goals, functional requirements, constraints, acceptance criteria, testing seams, and open questions.
