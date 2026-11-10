# Asset Passport assistant

> Edit `<name>.agent.yaml` to configure your agent — tools, model, instructions.

## Quick start

```bash
# Push agent config to CDF (draft)
cognite agents push

# Open agent in Fusion for testing
cognite agents open

# Publish agent (makes it visible to users)
cognite agents publish
```

## Project layout

| Path | Purpose |
|------|---------|
| `<name>.agent.yaml` | Agent definition (externalId, tools, model, instructions), named after this folder |
| `eval/eval.yaml` | Example eval cases — run with `cognite agents eval` |
| `README.md` | This file |

## Evaluating the agent

`eval/eval.yaml` contains starter test cases (single-turn and multi-turn) that
grade the agent's responses with an LLM judge. The default cases are designed to
pass on a freshly pushed agent — push first, then run:

```bash
cognite agents eval
```

Edit the cases to match what your agent does, and add more over time.
Add tools in `<name>.agent.yaml` before adding tool-scorer eval cases (`toolSelection`, `toolInvocation`).

## Attaching CDF skills

To give this agent project-scoped skills (`SKILL.md` uploaded to CDF), push each skill
before referencing it in the agent:

```bash
cognite skills create ./skills/my-skill
# edit ./skills/my-skill/SKILL.md
cognite skills push ./skills/my-skill
```

Then add the skill id to `<name>.agent.yaml`:

```yaml
skills:
  - my-skill
```

Run `cognite agents push` after the skill exists in the project. This is not the same as
the coding-assistant skills scaffolded under `.cursor/skills` and `.claude/skills`.

## Adding tools

Edit the `tools` array in `<name>.agent.yaml`. Common tool types (illustrative — may not
reflect all available types; check the Cognite documentation or the agent builder
UI in Fusion for the latest list):

- `analyzeData` — analyze tabular or structured data
- `analyzeImage` — analyze images and P&ID diagrams
- `analyzeTimeSeries` — analyze time series data
- `askDocument` — ask questions about documents
- `callFunction` — call a Cognite Function
- `callRestApi` — call an external REST API
- `callWebhook` — POST a payload to an external webhook
- `examineDataSemantically` — semantic data examination
- `query` — structured queries against CDF data models
- `queryKnowledgeGraph` — query CDF data models with natural language
- `queryTimeSeriesDatapoints` — fetch raw or aggregated time series data
- `runPythonCode` — execute custom Python code
- `summarizeDocument` — summarize documents
- `timeSeriesAnalysis` — advanced time series analysis and anomaly detection

Example tool:

```yaml
tools:
  - name: find_assets
    type: queryKnowledgeGraph
    description: Find assets and related instances in the knowledge graph.
    configuration:
      version: v2
      dataModels:
        - space: cdf_cdm
          externalId: CogniteCore
          version: v1
          viewExternalIds:
            - CogniteAsset
      instanceSpaces:
        type: all
```

## Deployment with Toolkit

The generated `<name>.agent.yaml` is compatible with [Cognite Toolkit](https://docs.cognite.com/cdf/deploy/toolkit/).
Place it in your Toolkit module under `agents/` and deploy with `cdf deploy`. Toolkit
treats the `<name>` part as a label and reads the `externalId` from inside the file,
so you can rename the file freely — the CLI keeps working as long as the folder holds
one definition.

## About this agent

It answers questions about the assets in the `Asset_Passport` data model (`sp-asset-passport`, version `1`):
assets, their equipment and notes. It has one tool, a knowledge graph query, and no tool that
writes. Its external ID is `a0545c2c-27d0-4a1d-a19a-27785cb348f3`: that is the agent the Asset Passport app chats with
(`FOCUSED_AGENT_EXTERNAL_ID` in `src/constants/agents.ts`), so keep the two in sync.
