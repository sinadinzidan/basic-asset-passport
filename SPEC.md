# Asset Passport

## Purpose

A read-only Cognite Flows app that lists assets from CDF and shows the
properties of an asset and of the equipment linked to it. It shows only data
read from CDF. Dummy data appears only in the opt-in mock mode below, which is
off by default and labelled on screen.

## Asset register

- The first screen lists assets from the `Asset` view in the
  `sp-dm-idi-asset` space, in pages of 10, with columns Plant, Functional
  location (external ID), Asset name, Description, Status and Criticality.
  Missing values show an explicit label ("Not provided", "Unnamed asset",
  "No description") rather than a blank cell.
- Two summary tiles count assets with an Operating status and all other
  statuses on the current page. They show a placeholder while the page loads.
  Operating is matched case-insensitively on the trimmed status text.
- Columns can be sorted. Selecting a row opens that asset.
- Previous and Next controls page through the results using the cursors
  returned by CDF (never inferred from item counts). Both are disabled while a
  page loads, and Previous is disabled on the first page.
- Loading shows grid skeleton rows. An empty view shows "No assets found". A
  failed load shows "Assets could not be loaded" with a Retry action; it is
  never shown as an empty list.

## Asset details

- Opening an asset shows its name (or external ID when unnamed) as the page
  title with a back button, plus status and criticality badges when present.
  Pill colours follow the data: an Operating status is blue with a check
  icon, a maintenance status is amber and any other status is grey.
  Criticality is shown as its own value (for example "A - High criticality")
  with a colour by class: A red, B amber, C green, anything else grey.
- Two tabs: Properties (the asset's properties) and Equipments (the
  `Equipment` nodes whose `asset` relation points to the asset, up to 1000,
  with a count badge on the tab). Each equipment shows its name, "Equipment ID:
  <external ID>" and its properties. With no linked equipment the tab shows
  "No equipment linked".
- Properties are every non-relation, non-JSON property the view defines and
  that has a value, labelled with the view property name. System and
  source-tracking properties (for example `source`, `sourceId`, `uid`,
  `createdByUser`) are hidden.
- Loading shows only a status message, with no back button. A failed
  load shows "Asset details could not be loaded" with Retry and the back
  button; the page is never shown with partial or fabricated data.

## Shared state and look

- The selected asset and the active tab are host-synced: they are restored
  from the Fusion `initialState` and pushed with `syncInternalState` on every
  change, so reloads and shared links open the same screen. Tab values are
  `PROPERTIES` and `EQUIPMENTS`; unknown or malformed state falls back to the
  register on the Properties tab. A failed sync is logged and does not block
  navigation.
- The topbar shows the white ADNOC Gas logo (the app name "Asset Passport" is
  shown instead if the image cannot load) and a breadcrumb with the selected
  asset name when one is open.
- The app is dark only, with the control-room HUD look: electric blue on deep
  navy, an engineering grid and soft glows behind the page, and a mono kicker
  line above each page title. There is no light mode or theme switcher.

## Mock mode

- `VITE_MOCK_MODE=true` (default `false`; see `.env.example`) serves dummy data
  instead of calling CDF, for local development outside Fusion. It skips the
  Fusion host connection, so no authentication is needed and the selected
  asset and tab are not synced to the URL.
- The dummy data lives in `src/mocks/` and answers the same requests the app
  sends (view lookup, the paged `assets` query, and the `asset` plus
  `equipment` details query) with CDF-shaped responses, so the real services
  and UI run unchanged. With the flag off the app behaves exactly as before.
- A banner states that the data is dummy data. The dummy data is loaded on
  demand and is not part of a build made without the flag.

## Design

- Build the UI from Aura components and Aura colour ramps (blue, amber, red,
  mountain); no raw hex. The HUD theme lives in `src/styles.css`, and custom
  components live in `src/components/general/`.
- Panels (`HudPanel`) have cut corners, a lit gradient edge, a glow and a
  light that travels along the border. Tabs are a cut-corner glass rail with a
  lit active tab. Status and criticality pills use the same lit-tab look (cut
  corners, gradient fill, bright bottom line, capitals) with a colour taken
  from the data: Operating is blue, maintenance amber, other statuses grey;
  criticality A is red, B amber and C green. The register's Criticality column
  uses the same pill. Buttons use mono capitals, and the page sits on
  `NeonStage` (grid, rings and two slow glows).
- Every notice (load errors, the connection error, the mock-mode banner) uses
  one app-owned alert, `AppAlert`: a tinted, bordered row with an icon, an
  optional title, a message and an optional action. Variants are error,
  warning, info and success, taken from Aura's semantic colour tokens. Errors
  and warnings are announced as alerts; info and success as status.
- Stack panels on small screens without page overflow.

## CDF data and host

- Use the existing `CogniteSdkProvider` for authentication; never hardcode the
  project, base URL or token.
- Resolve the `Asset` and `Equipment` views in `sp-dm-idi-asset` at run time
  (latest version, inherited properties included) and query through
  `client.instances.query()` with TanStack Query. Query keys include the
  project, view and cursor or asset identity.
- Throttled (429) and temporary gateway (502, 503, 504) responses are retried
  up to 3 times with exponential backoff and jitter, capped at 15 seconds;
  other errors are shown at once.
- An unexpected rendering error shows "Something went wrong" with a Retry
  action instead of a blank page.
- Read only: do not create views, spaces or instances. The signed-in user
  needs read access to the instances and the view schema.

## Engineering and acceptance

- Follow `PROJECT_CONVENTIONS.md`.
- Mock CDF boundaries in tests; never require live services in automated tests.
- Run lint, type-check, build and tests before release.

## Out of scope

CDF writes, documents and file viewing, search, signals and time series,
SAP integration, health or risk scoring, reports and 3D.
