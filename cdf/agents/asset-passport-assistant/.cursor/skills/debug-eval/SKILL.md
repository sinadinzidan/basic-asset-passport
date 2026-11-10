---
name: debug-eval
description: >-
  Diagnose Cognite agent eval failures from CLI output — config drift, deployment,
  invoke errors, and scorer rationales. Use when eval failed, a scorer failed, or
  the user pastes eval run output.
---

# Debug eval

Work through failures systematically using the user’s eval output (paste or summary).

## Workflow

1. Identify the failing **case id**, **turn**, and **scorer type** (if any). Note exit code and whether the whole suite or one case failed.
2. **Config drift** — local `<name>.agent.yaml` / `eval/eval.yaml` may differ from what CDF runs. Suggest `cognite agents push` or `cognite agents eval --upsert` so eval matches the project on disk.
3. **Not deployed** — if push was never done or status is stale, suggest `cognite agents push` and `cognite agents status` (run `cognite agents status --help` for flags).
4. **Invoke / runtime errors** — auth, routing, or agent errors before scoring. Suggest `cognite auth login`, confirm project/cluster flags, and re-run with verbosity from `cognite agents eval --help` (e.g. `-v`).
5. **Scorer failures** — read the judge rationale. For `correctness`, compare the response to `criteria`. For `faithfulness`, check `groundTruth` vs actual tool-retrieved facts. For tool scorers, check where the tool list resolved from (scorer → case → file → root `eval/eval.yaml` → `<name>.agent.yaml`); confirm runtime tool names match what the agent called (`toolsCalled:` output). A "Skipping … no tools available" warning means no tools resolved at all — add a `tools` field at the appropriate cascade level.
   - **Common gotcha:** `<name>.agent.yaml` declares config-time names (e.g. `query`) but the agent calls runtime sub-tools (e.g. `find_assets`). Override with runtime names in eval `tools`.
   - **`--external-id` / `--system-agent`:** `<name>.agent.yaml` tools are not loaded; tools must come from eval yaml.
6. **Narrow the run** — suggest isolating with `--case` (repeatable), `--tag`, or `--fail-fast` per `cognite agents eval --help`.
7. For scorer semantics or field meaning, read **AGENTS.md** rather than guessing.

Summarize likely root cause, concrete next step, and whether the fix is config, deployment, auth, instructions, or the eval case itself.

## Anti-patterns

- Do not assume eval uses local YAML without push/`--upsert` unless the user confirmed deployment state.
- Do not change `criteria` or `groundTruth` to match a bad hallucination — fix retrieval, instructions, or the case intent.
- Do not list every CLI flag from memory — delegate to `--help`.

## Cross-references

- If the case design or scorers are wrong → **write-eval-case** skill.
- If the agent behavior but instructions are weak → **write-instructions** skill, then **check-agent** for alignment.
