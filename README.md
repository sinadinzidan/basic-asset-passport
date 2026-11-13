# Asset Passport

A read-only Cognite Flows app. It lists assets from a CDF data model and opens
a details page for each asset with its properties and the equipment linked to
it. Built with React, TypeScript, Vite, Aura, the CDF SDK and TanStack Query.

`SPEC.md` is the product spec and describes the behaviour in detail.

## What it does

- **Asset register:** pages of 10 assets from the `Asset` view in the
  `sp-dm-idi-asset` space, with First/Previous/Next cursor paging and sortable
  columns. Loading, error (with Retry) and empty states are shown.
- **Asset details:** the asset's properties and its linked equipment on two
  tabs (`PROPERTIES`, `EQUIPMENTS`), with status and criticality pills.
- **Shared state:** the open asset and tab are saved through the Fusion host
  (`syncInternalState`), so reloads and shared links restore the same view.
- **Look:** a dark-only control-room HUD theme (electric blue on navy, cut-corner glass panels, glowing pills).
- **Resilience:** an error boundary around the app, and queries that fail with
  429, 502, 503 or 504 are retried up to 3 times with jittered backoff.

Not included: search, documents or file viewing, signals, and any CDF writes.

## Requirements and installation

The `engines` field in `package.json` lists the supported Node and npm
versions.

```sh
npm ci
```

Keep `package-lock.json` committed. `.npmrc` keeps the dependency release-age
protection; do not disable it permanently.

## Run

```sh
npm run dev
```

Open the Fusion URL printed by Vite and sign in through Fusion. The provider
gets the project, base URL and access token from the host; opening localhost
alone has no host connection. The signed-in user needs read access to the
instances and to the `Asset` and `Equipment` view schemas.

For local certificates, run `npm run setup-https` and follow Cognite's
[local HTTPS guide](https://docs.cognite.com/cdf/flows/guides/local-https).

### Mock mode

To work outside Fusion, set `VITE_MOCK_MODE=true` in a local `.env` (see
`.env.example`). The app then serves dummy data shaped like the CDF responses
and shows a banner saying so. The default is `false`. Make sure `.env` does
not set it to `true` before building for deployment.

## Validation

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
npm audit --audit-level=high
```

Tests use mocked CDF responses and never call live services. They sit in
`__tests__/` folders beside the code.

## Structure

- `src/pages/assets/`: the register and the asset details pages.
- `src/components/assets/`: table, columns, tabs and the open asset's breadcrumb.
- `src/components/general/`: shared pieces such as `ErrorBoundary`, `RetryAlert`,
  `StatusPill`, `CriticalityPill`, `HudPanel` and `NeonStage`.
- `src/hooks/`: query hooks with dependencies injected through React context.
- `src/services/assets/`: CDF `instances.query` calls.
- `src/lib/`, `src/enums/`, `src/types/`, `src/constants/`: helpers, shared
  enums, data contracts and named limits.
- `src/schemas/`: Zod schemas that check what CDF and the host return.
- `src/config/model.ts`: the space, model, view and property names.
- `src/__mocks__/`: dummy data and test factories.
- `public/`: the ADNOC Gas logos for the light and dark themes.

Read `AGENTS.md` and `PROJECT_CONVENTIONS.md` before changing code.

## Dependencies held back

- `@cognite/app-sdk` stays on `^0.9`, the version the Flows scaffold pins.
  Later releases need Vite 8, and the scaffold holds Vite below 8.
- `react`, `react-dom` and `@tanstack/react-table` stay one major behind:
  `@cognite/aura` only accepts React 18 and table v8.
- `react-pdf` is on `^10`, the last major that runs on React 18 (11 needs
  React 19). The vendored viewer in `src/cognite-file-viewer/` was checked
  against it with a real multi-page PDF. Raise all four together once Aura
  supports React 19.

## Deployment

Check before deploying:

1. `VITE_MOCK_MODE` is not `true` in `.env`.
2. The validation commands above pass.
3. `app.json` targets the right organization and project, and `manifest.json`
   keeps `permissions.network` empty (every call goes to a `cognitedata.com`
   host, which the baseline Content Security Policy already allows).

```sh
npm run deploy
```

A deploy uploads a `DRAFT`. Publishing needs a developer signature, and
production projects also need application certification (or Dev status on a
non-production project). Never commit tokens, deployment secrets or
certificates.

See the [Flows getting-started guide](https://docs.cognite.com/cdf/flows/guides/getting-started).
