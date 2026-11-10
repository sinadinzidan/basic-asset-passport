---
name: check-agent
description: >-
  Review <name>.agent.yaml and eval setup locally — description, instructions, tool alignment,
  and common eval mismatches. Use when reviewing an agent, linting config, or asking
  if anything looks wrong before push or publish.
---

# Check agent

Produce a short markdown report from **local files only**. Do not call CDF APIs unless the user explicitly asks; for deployed state, suggest `cognite agents status`.

## Workflow

1. Read `<name>.agent.yaml` — `name`, `description`, `instructions`, `tools`, `exampleQuestions`, labels (e.g. published).
2. Read `eval/eval.yaml` and any `include:` files under `eval/`.
3. Read `AGENTS.md` when you need eval or prompt conventions.
4. Run checks and label each finding **error**, **warn**, or **info** with a concrete fix:

| Check | Severity | Rule |
|-------|----------|------|
| `description` missing or empty | warn | Add a clear user-facing description. |
| `instructions` empty or obvious scaffold placeholder | warn | Replace with real guidance (see write-instructions skill). |
| Tool named in `instructions` but not in `tools[]` | error | Add the tool or remove the mention. |
| Tool in `tools[]` never mentioned in `instructions` | info | Document when/how to use it. |
| `toolSelection` / `toolInvocation` in eval but no tools resolve (no eval `tools` at any cascade level and no `<name>.agent.yaml` `tools`) | error | Add a `tools` field at root, file, case, or scorer level in eval yaml, or add tools to `<name>.agent.yaml`. With `--external-id`/`--system-agent`, `<name>.agent.yaml` is not loaded. |
| `labels` includes published but `exampleQuestions` empty | warn | Add starter questions for Fusion. |
| Eval case ids duplicated | error | Rename ids in `eval/eval.yaml`. |

5. Optionally skim `README.md` for project-specific tool setup the checks above cannot see.

Keep the report scannable: bullet list grouped by severity, then suggested command order (`check-agent` → edit → `push` → `eval`).

## Anti-patterns

- Do not block on network or credentials for a default review.
- Do not rewrite `instructions` in full during a review — flag issues and offer the write-instructions skill if the user wants a rewrite.
- Do not invent tool config schemas — point to `README.md` and `<name>.agent.yaml` examples.

## Cross-references

- To improve `instructions` → **write-instructions** skill, then re-run this check.
- To add or fix eval coverage → **write-eval-case** skill.
- After a failed eval → **debug-eval** skill.
