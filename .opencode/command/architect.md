# architect

Use `@architect` as the architecture analysis agent for the current request.

Delegate this request to `@architect`. Do not perform architecture analysis in the current agent.

Architect is analysis-only. The agent has access to three skills and will pick the right one:
- `codebase-design` for general architecture vocabulary and module design
- `improve-codebase-architecture` for module-level deepening opportunities
- `tech-debt-audit` for full codebase health check

Let the agent decide which skill to load. Do not pre-select from this command.

## Required behavior

- Hand off to `@architect` instead of answering directly in the current primary agent.
- Pass the user's original request verbatim, plus any project context already visible in the conversation.
- Treat the agent's output as the authoritative answer for this turn.
- If the user later asks to implement, plan, or refactor, recommend the next workflow step (`@plan`, `@build`, `@architect` follow-up) rather than starting it from this command.

## Reporting discipline

- The agent may write markdown reports under `docs/`, `docs/architecture/`, `docs/audits/`, or the current task documentation folder.
- It must not write reports into source directories unless explicitly requested.
- It must ask before editing existing files.
- For exploratory questions, no file is created unless the user asked for one.

## Constraints

- Do not implement code from this command.
- Do not create or revise a plan from this command.
- Do not perform a final review from this command.
- Do not duplicate the agent's prompt — delegate and let the agent decide.
