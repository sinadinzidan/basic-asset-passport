---
name: write-eval-case
description: >-
  Guide authoring eval cases in eval/eval.yaml — scorer choice, multi-turn patterns,
  and YAML structure. Use when adding tests, extending the eval suite, or validating
  agent behavior for a Cognite agent project.
---

# Write eval case

Help the user add or edit cases in `eval/eval.yaml` (or an `include:` fragment under `eval/`).

## Workflow

1. Read `<name>.agent.yaml` — note declared tools, model, and what the agent is meant to do.
2. Read `AGENTS.md` — use the eval essentials table for scorer types and required fields, plus inheritance rules for `tags`, session scope (`dataModels`, `instanceSpaces`, `appContext`), and overlay (inline `additional*` or `includeExtension` with `path` + `type: draft|published`).
3. Ask what behavior to test: single-turn vs multi-turn, happy path vs edge case, and whether tool use should be exercised.
4. Choose scorers using the AGENTS.md table:
   - `correctness` when a good answer can be described in `criteria`.
   - `faithfulness` when grounding against judge-only `groundTruth` matters (retrieval / facts).
   - `toolSelection` / `toolInvocation` when tools are available via the cascade: scorer `tools` → case `tools` → file `tools` → root `eval/eval.yaml` `tools` → `<name>.agent.yaml` `tools`. Use runtime names (e.g. `find_assets`, `execute`), not config-time names (e.g. `query`). For `toolInvocation`, include parameter details in each tool's `description`.
5. Draft YAML: unique `id`, optional `tags`, one or more `turns` with `input` and `scorers` on the turns you want judged.
6. Validate locally: every case has at least one scored turn; no duplicate `id` values across the suite; tool scorers have tools resolvable via the cascade (eval yaml or `<name>.agent.yaml`).
7. Remind the user that eval runs against **deployed** config — run `cognite agents push` first, or use `cognite agents eval --upsert`. For run filters and flags, run `cognite agents eval --help`.

Match existing `id` and tag style in the file. Prefer small, focused cases over one huge conversation.

## Anti-patterns

- Do not put answer facts in `appContext` or `additionalInstructions` so the agent passes without using tools — see AGENTS.md “discover via tools”.
- Do not use eval `additionalSkills` when you mean `<name>.agent.yaml` `skills:` (deployed agent config) or `.cursor/skills` helpers — overlay skills attach only for that eval chat.
- Do not combine `includeExtension` with inline `additionalInstructions`, `additionalSkills`, or `additionalSubagents` on the same YAML object (root, included file, or case). Pick one overlay source per level; mixing across levels (e.g. root `includeExtension` + case `additionalSkills`) is fine.
- Do not omit an overlay field when you mean to clear it — write `additionalSkills: []` or `additionalInstructions: ""`. Omit inherits from parent.
- Do not use a child `includeExtension` to change only one overlay field — the slot replaces all three `additional*` fields (omitted keys are empty and clear the parent). To add one skill or instruction for a test, keep `includeExtension` on the parent and set that `additional*` field on the case.
- `includeExtension.path` is relative to the directory that contains the root `eval.yaml` (same as `include:`), not relative to the fragment or case that declares it.
- Do not attach runtime subagents when evaluating a customer agent (non-`cdf_*` external ID): neither inline `additionalSubagents` nor an `includeExtension` slot that lists them. Runtime subagents require a Cognite builtin agent (`--system-agent` or `--external-id cdf_*`).
- Do not add `toolSelection` or `toolInvocation` when no tools resolve from the cascade (eval yaml levels + `<name>.agent.yaml`). If tools are empty, these scorers are skipped with a warning — not scored as "incorrect."
- Do not use `<name>.agent.yaml` config-time names (e.g. `query`) in eval `tools` when the agent calls different runtime sub-tools (e.g. `find_assets`). Run eval with `-v` to discover actual tool names.
- Do not duplicate case `id` values or leave turns unscored when the user expects a pass/fail result.
- Do not inline full scorer schemas in chat — point to `AGENTS.md` and the scaffolded examples in `eval/eval.yaml`.

## Cross-references

- If the agent cannot pass because instructions are vague or wrong → use the **write-instructions** skill, then re-run eval.
- If a run fails and the case looks correct → use the **debug-eval** skill.
