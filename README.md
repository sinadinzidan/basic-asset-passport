# Asset Passport

A Cognite Flows starter using React, TypeScript, Vite, Aura, the CDF SDK,
and TanStack Query. It offers a read-only CDF data-model asset listing with
an equipment passport for each asset.

Live assets use Data Modeling cursor pagination with First page, Previous,
and Next controls, a "Showing 11–20" summary and a Results per page choice
(10, 25 or 50; 10 by default and kept in shared links). The current page is saved through the
Fusion host; a new session replays preceding query pages to obtain fresh
cursors rather than storing opaque cursors in links.
Use **Search** (or Enter) to search asset names and descriptions across CDF,
not just the visible page. Results are ranked by CDF, capped at 1000 with a
limit notice, and paginated 10 at a time. **Clear search** restores the full
listing. Search resets the page and is preserved in shared links and when
returning from an equipment passport.
Select an asset to open its equipment page, which lists up to 25
`energy_dm.EnergyEquipment/v1` nodes whose `asset` relation points to the
selected `EnergyAsset` in the asset passport layout using only live CDF
fields: identity, specifications and documents. Documents are
real `energy_dm.EnergyFile/v1` files linked to the equipment (`files`) or the
asset (`assets`). If no equipment is linked, the page shows a clear
no-equipment-data state; request failures remain visible and retryable.
Live asset details use the full page. Back to assets
stays above the passport, with compact equipment controls only when needed.

Live detail is organized into **Overview** and **Documents** tabs. The selected
tab is restored in shared links; the equipment identity and selector remain
visible. Links saved with the removed Signals tab open on Overview.
The UI is built only from Aura components and tokens (no custom theme layer),
with a single Aura Topbar (breadcrumb, read-only note and light/dark switcher).
The brand colour is set only in `src/styles.css` through Aura token aliases (teal
ramp, light and dark). Assets show as a table or a card grid, and "/" focuses
the search field.

The app does not show signals: it does not query time series or datapoints, so
only instance and file read access is needed.

Select **Preview** on a real document or asset file to view its content in
the app. P&ID PDFs support page navigation, zoom, pan and diagram annotation
overlays when available. Images and text files are also supported. The viewer
uses the authenticated SDK and the file's instance identity; the open file
is restored from Fusion shared links. File content requires CDF file-read
access in addition to data-model access. Missing uploads or access failures
show an error rather than simulated content.

## Requirements and installation

This project was scaffolded from the current Flows template and is developed on
Node 26.13.0 (the latest LTS when it was created) with npm 12.2.1. The template's
`engines` field in `package.json` lists every supported Node and npm version.

```sh
nvm install 26.13.0
nvm use 26.13.0
npm ci
```

Commit and retain `package-lock.json` for reproducible installs. The template
requires npm >=11.10.0. `.npmrc` intentionally retains its dependency release-age
protection. During the initial install, a newly published transitive dependency
was blocked. Prefer waiting for the protection window; only after reviewing
the affected package, use `npm install --min-release-age=0` as a one-off
override. Do not permanently disable the protection.

## Run

```sh
npm run dev
```

Open the Fusion URL printed by Vite and sign in through Fusion. The provider
obtains the project, base URL, and renewable access token from the host.
Opening localhost alone does not provide a Fusion host connection.
The signed-in user must have instance-read access to the relevant spaces
and access to the `energy_dm.EnergyAsset/v1` view schema. The service uses
`client.instances.query()` (`/models/instances/query`) with a `hasData`
filter, selects `name` and `description`, and returns up to 10 nodes.
Use **Next** and **Previous** to navigate pages; **First page** returns to the
start. Page navigation follows the `assets` cursor from each query response
and persists the page index in the Fusion host for shared links.

The configured target in `app.json` is organization/project `flows-builder`
on `https://westeurope-1.cognitedata.com`. For another environment, update
the deployment configuration, never hardcode credentials in source.
Vite selects another port when its preferred port is occupied.

For local certificate setup:

```sh
npm run setup-https
```

Follow Cognite's [local HTTPS guide](https://docs.cognite.com/cdf/flows/guides/local-https).
Use the supported certificate setup rather than bypassing browser warnings.

## Validation

```sh
npm run lint
npx tsc --noEmit
npm run build
npm test
```

Tests use mocked CDF SDK responses and do not need live CDF access. They live in
`__tests__/` folders beside the code they cover (for example
`src/components/assets/__tests__/AssetList.test.tsx`).

## Structure and conventions

- `src/pages/dashboard/Dashboard.tsx`: home-page composition.
- `src/components/passport/`: the equipment passport (hero, specifications, documents, key facts and equipment list).
- `src/types/passport.ts`: passport data contracts.
- `src/components/general/`: custom components built from Aura primitives
  (`AppTopbar`, `DataTable`, `TablePanel`, `StateMessage`, `PageHeader`, `ErrorBoundary`).
- `src/components/assets/AssetList.tsx`: live asset list (search, table, pagination).
- `src/hooks/assets/useAssetList.ts`: query and authenticated client access.
- `src/services/assets/assetService.ts`: injected CDF instances query and mapping.
- `src/enums/`: shared fixed values as enums (`PassportTab`, `AssetView`, `ThemeMode`, `FileViewerType`); members and string values are UPPER_SNAKE_CASE. What is written to Fusion shared links and browser storage keeps its original lowercase values (`src/constants/persistence.ts`), so saved links and choices still work.
- `src/constants/`: named limits, sizes, durations and display labels (`labels.ts` maps each enum member to its text).

Read `AGENTS.md` and `PROJECT_CONVENTIONS.md` before changing code.
Cursor also loads `.cursor/rules/project-conventions.mdc` automatically.
These are instructions, not a substitute for linting or review.

## Deployment

```sh
npm run deploy
```

Deployment is not needed for local development. Configure the target and
required app-hosting permissions/signatures before publishing. Never commit
tokens, deployment secrets, or certificates.

Before deploying, run the validation commands above and `npm audit
--audit-level=high`. Every CDF call goes through `cdfTaskRunner` (15 concurrent
tasks, 429 retries with jittered exponential backoff) and the dashboard is
wrapped in an `ErrorBoundary`. A deploy uploads a `DRAFT`; publishing needs a
developer signature, and production projects also need application
certification (or Dev status on a non-production project).

### Dependency upgrade plan

The app follows the Flows template as scaffolded: `@cognite/aura` 1.x,
`@cognite/app-sdk` 0.9, React 18 and Vitest 4.1.10 as the template pins them. The
only additions are `motion` and `react-pdf` (the PDF viewer) and two test-only
shims in `vitest.setup.ts` (Happy DOM animations, and `localStorage` on current
Node versions). `react-pdf` is on 10.x, one major behind (11). Version 11 requires
React 19, and `@cognite/aura` and the Flows template pin React 18, so it stays on
10 until the template moves to React 19; then upgrade React, `react-pdf` and
`pdfjs-dist` together and retest the file viewer with a real PDF. The Cognite CLI
is always run as `npx @cognite/cli@latest`, so it needs no separate upgrade. To
update the template files, scaffold a fresh app in a scratch folder with
`apps create`, compare its configuration files with this project's, and copy the
`src/` folder across; do not edit the template configuration by hand.

See the [Flows getting-started guide](https://docs.cognite.com/cdf/flows/guides/getting-started).
