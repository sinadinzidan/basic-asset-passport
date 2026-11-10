---
name: write-instructions
description: >-
  Guide writing or improving agent instructions in <name>.agent.yaml — purpose, constraints,
  tool usage, and response style. Use when improving the system prompt, clarifying
  behavior, or aligning instructions with declared tools.
---

# Write instructions

Edit the `instructions` field in `<name>.agent.yaml`. Platform system behavior may apply on top; you only control the builder-editable layer.

## Workflow

1. Read `<name>.agent.yaml` — current `instructions`, `description`, `tools`, and any `appContext`-related fields you should stay consistent with.
2. Read `AGENTS.md` — **Two-layer prompts** (your instructions vs platform behavior) and **discover via tools** (agents should retrieve with tools, not rely on hidden cheat sheets).
3. Clarify with the user: primary audience, tone, allowed/refused actions, and which tools must be used for which tasks.
4. Structure the prompt clearly:
   - **Purpose** — what the agent is for in one short block.
   - **Working principles** — how to reason, when to use tools, how to handle uncertainty.
   - **Constraints** — safety, data scope, “do not” rules, org/project facts that must not be guessed.
   - **Response style** — format, brevity, widgets or tables if the project uses them.
5. For every entry in `tools[]`, add explicit guidance: when to call it, what inputs mean, and what to do if the tool fails.
6. Remove contradictions, vague placeholders, and duplicate rules. Prefer specific, testable guidance evals can target.
7. After edits, suggest `cognite agents push` and a targeted `cognite agents eval` (see `cognite agents eval --help`).

Propose changes as a unified diff or full `instructions` block the user can paste into `<name>.agent.yaml`.

## Anti-patterns

- Do not promise capabilities no tool or platform feature provides.
- Do not embed secrets, tokens, or user credentials in instructions.
- Do not tell the agent to ignore tools when evals expect tool use (or the reverse).
- Do not paste entire scorer or CLI reference docs — link to `AGENTS.md` and `--help`.

## Cross-references

- After rewriting → run **check-agent** to verify tool/instruction alignment and eval consistency.
- If evals fail on grounding or retrieval → **debug-eval** skill; if cases need updates → **write-eval-case** skill.
