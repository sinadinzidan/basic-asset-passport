# Agent Project — AI Development Guide

This file is for **AI coding assistants** (Cursor, Claude Code, etc.) working in this
repository. Humans should start with `README.md`.

## Project layout

| Path | Purpose |
|------|---------|
| `<name>.agent.yaml` | Agent definition — read this file for current field values |
| `eval/eval.yaml` | Eval cases and optional `include:` fragments under `eval/` |
| `README.md` | Human-oriented quick start and workflow |

## Reference documentation

For full field schemas, tool types, scorer details, and CLI flags beyond what this
file covers, see the Cognite CLI agents documentation:

- [Cognite CLI — Agents](https://docs.cognite.com/dev/sdks/cognite-cli/agents)
- [Eval cases JSON Schema](https://docs.cognite.com/assets/schemas/agent-eval-cases.schema.json)

## CLI validation

The CLI validates both `<name>.agent.yaml` and `eval/eval.yaml` at runtime. Schema errors
surface before commands execute — you do not need to validate YAML manually:

- **`<name>.agent.yaml`** is parsed and checked when you run `push`, `status`, `eval`, or
  other commands that read the project.
- **`eval/eval.yaml`** (and any `include:` fragments) is validated at the start of
  `cognite agents eval` before cases run.

Use the scaffolded templates and examples as your reference for valid field shapes.

## Design principle: discover via tools

Agents should **retrieve** answers with declared tools, not rely on eval YAML to inject
facts into the chat. Evals should validate that behavior.

- Use `dataModels`, `instanceSpaces`, `appContext`, and eval overlay `additionalInstructions`
  (folded into chat `appContext` at run time) to scope **where** the agent operates
  (plant, site, spaces) — not to paste answer text the agent should have found.
- **`faithfulness` `groundTruth`** is supplied to the **LLM judge only**. It does not replace
  tool use when you are testing retrieval.

**Do not** put expected answer facts in `appContext` to make a discovery test pass:

```yaml
# Wrong — agent sees the answer without using tools
appContext: "Pump P-101 was shut down on 2024-03-15."
turns:
  - input: "When was P-101 shut down?"
    scorers:
      - type: faithfulness
        groundTruth: "Pump P-101 was shut down on 2024-03-15."
```

```yaml
# Right — judge checks grounding; agent must still retrieve in production
turns:
  - input: "When was P-101 shut down?"
    scorers:
      - type: faithfulness
        groundTruth: |
          Pump P-101 was shut down on 2024-03-15 due to bearing wear.
```

## Two-layer prompts

Deployed agent chat is two layers:

- **`instructions`** in `<name>.agent.yaml` is the builder-editable system guidance for this agent.
- The platform may apply additional system behavior that is not editable in this file.

**Eval overlay** is separate: optional `additionalInstructions`, `additionalSkills`, and
`additionalSubagents` (or `includeExtension` pointing at a local agent project config
file with `type: draft` or `published`) add session context for that run only. Use
inline `additional*` **or** `includeExtension` at a given YAML level — not both.
`includeExtension.path` is relative to the directory that contains `eval.yaml` (same
base as `include:`). An extension replaces the whole overlay batch at that level
(omitted slot keys are empty, not inherit). Eval reads extension files from disk only;
it does not fetch project config from CDF. Instructions fold into session `appContext`
(after any scoped `appContext`). Subagents require a Cognite builtin agent as the eval
target (`cdf_*`).

## Workflow

`create` → edit `<name>.agent.yaml` → `cognite agents push` → `cognite agents open` (manual test)
→ `cognite agents eval` → `cognite agents publish` when ready.

When attaching **CDF project skills** (`skills:` in `<name>.agent.yaml`), push each skill
to the project first (`cognite skills create` → `cognite skills push`), then add its
`externalId` under `skills:`, then `cognite agents push`. Do not confuse these with
eval overlay `additionalSkills` (per-run session attachments) or with
coding-assistant skills under `.cursor/skills` or `.claude/skills` (local CLI helpers).

Other commands: `pull`, `list`, `status`, `unpublish`. See `README.md` for examples.

**Eval runs against deployed config.** Push first, or run `cognite agents eval --upsert`.
To evaluate a deployed agent without a local `<name>.agent.yaml` (e.g. Cognite builtin agents
you cannot pull), use `cognite agents eval --system-agent` or
`cognite agents eval --external-id <id>`. Pass `[dir]` at a folder that resolves to one
eval suite (flat or `eval/eval.yaml` here, or a single nested `eval.yaml` when neither
canonical layout is present). Do not put both flat and nested canonical layouts in the
same directory.
`--system-agent` and `--external-id` cannot be used together.
Auth: `cognite auth login`; optional env vars are documented in the CLI package
`env.example` (do not commit secrets).

## Eval essentials

- Cases live in `eval/eval.yaml`; split suites with `include:` (paths relative to `eval/`).
- Filter runs: `--tag`, `--case` (repeatable), `--fail-fast`, `-v`.
- Use `--system-agent` to evaluate the Cognite-managed system agent without `<name>.agent.yaml`,
  or `--external-id <id>` for any other deployed agent. These flags skip `<name>.agent.yaml`
  entirely — pass `[dir]` at a folder that resolves to one eval suite (this project's
  `eval/eval.yaml`, a flat `eval.yaml`, or a single nested `eval.yaml` under `[dir]`).
  Cognite builtin agents (`cdf_*`) use the internal chat route; `AGENT_CHAT_ROUTE` cannot
  override that.
- Multi-turn cases thread the conversation cursor; scorers run on the turns that declare them.

| Scorer | Use when | Required / notable fields |
|--------|----------|---------------------------|
| `correctness` | General answer quality | `criteria` |
| `faithfulness` | Output must match judge-supplied facts | `groundTruth` |
| `toolSelection` | Whether the agent picked the right tools (names only) | Optional `tools`; use runtime names (see below) |
| `toolInvocation` | Whether tool arguments match the question | Optional `tools`; put parameter details in each tool `description` (see below) |

Phoenix metric docs: [Correctness](https://arize.com/docs/phoenix/evaluation/pre-built-metrics/correctness),
[Faithfulness](https://arize.com/docs/phoenix/evaluation/pre-built-metrics/faithfulness),
[Tool Selection](https://arize.com/docs/phoenix/evaluation/pre-built-metrics/tool-selection),
[Tool Invocation](https://arize.com/docs/phoenix/evaluation/pre-built-metrics/tool-invocation).

### Tool scorers: `tools` field and gotchas

`toolSelection` and `toolInvocation` need a resolved tool list for the LLM judge.
The judge does a **literal name membership check** — if the names don't match what
the agent actually called, the scorer will report `incorrect` even when tool use
was appropriate.

**Eval `tools` are NOT `<name>.agent.yaml` tools.** `<name>.agent.yaml` declares tools for the
agent runtime (config-time names like `query`). Eval `tools` declare what the
*judge* should expect the agent to *call* at runtime (e.g. `find_assets`, `execute`).
These are often different names.

**Three categories of tools:**

- **Custom tools** (user-defined): config name = runtime name. Tool scorers work
  with tools from `<name>.agent.yaml` — no eval `tools` needed.
- **Cognite platform tools** (`query`, `ask_document`, etc.): the runtime decomposes
  these into sub-tools (`find_assets`, `list_views`) whose names differ from config.
  Declare runtime tool names in eval `tools`, or use `correctness`/`faithfulness`
  to evaluate outcomes instead.
- **System tools** (sandbox `execute`, `commandTool`): never in any config. Declare
  them in eval `tools`, or use `correctness`.

**Discovering runtime tool names:** Run eval once with `-v` or `--report-dir` and
look at the `toolsCalled:` output to see what the agent actually invoked.

**Tool list cascade** (most specific wins, whole-array replace — not merge-by-name):

```
scorer.tools → case.tools → included-file.tools → root eval.yaml tools → <name>.agent.yaml tools
```

With `--external-id` or `--system-agent`, `<name>.agent.yaml` is skipped entirely —
declare eval `tools` at root, file, case, or scorer level.

**Empty resolution skips the scorer.** If no tools resolve after the full cascade,
the scorer is skipped with a stderr warning (not a misleading "incorrect" verdict).
Other scorers on the same turn still run. A case whose *only* scorers were all
skipped fails the verdict (zero scores).

**`toolInvocation` description quality:** The judge evaluates arguments against
whatever you put in each tool's `description`. Include parameter details for
accurate invocation scoring:

```yaml
tools:
  - name: find_assets
    description: |
      Find assets in the knowledge graph.
      Parameters: filter (string, required), limit (integer, optional).
```

Without parameter details, the judge can only check whether arguments "seem
reasonable" for the user's question — it cannot verify schema compliance.

## Eval YAML inheritance

Fields resolve at three levels for session context and case-level tools: root
`eval/eval.yaml` → included file → individual case. Scorer-level `tools` on a turn
override case/file/root (and `<name>.agent.yaml` fallback) for that scorer only.

- **`tags`** — union (file-level tags merge into each case's tags, deduplicated).
- **`dataModels`, `instanceSpaces`, `appContext`, `additionalInstructions`, `additionalSkills`, `additionalSubagents`** — per-field replace (most specific wins; no deep merge). Overlay `additional*` keys expand to chat wire fields (`appContext` / `skills` / `subagents`); they are not sent on the request as `additional*`. Empty overlay `""` / `[]` clears inherited overlay for that field; omit inherits. Scope fields reject empty when present.
- **`includeExtension`** — at root, included file, or case: `{ path, type }` loads a draft or published `systemAgentExtensions` slot from a local config file. `path` is relative to the directory that contains `eval.yaml` (in this project `eval/`, same base as `include:`), even when the key lives on a fragment or case. Replaces all three `additional*` fields at that level (omitted slot keys are empty). Exclusive with inline `additional*` on the same object.
- **`tools`** — whole-array replace at each level (not merge-by-name). Used by
  `toolSelection` / `toolInvocation`; does not change what tools the agent can call —
  only what the judge considers when scoring.

## Conventions for AI assistants

- Minimize scope when editing YAML; match existing case `id` style and tags.
- Do not commit credentials; use environment variables.
- For detailed eval authoring or debugging workflows, use project skills under
  `.cursor/skills` or `.claude/skills` when they are present.
