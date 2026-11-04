# Asset Passport

## Purpose

A read-only Cognite Flows app that lists assets from CDF and shows the
properties of an asset and of the equipment linked to it. It shows only data
read from CDF: there is no mock mode, dummy data, or simulated content.

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
  An Operating status is shown with the success style and a check icon.
- Two tabs: Properties (the asset's properties) and Equipments (the
  `Equipment` nodes whose `asset` relation points to the asset, up to 1000,
  with a count badge on the tab). Each equipment shows its name, "Equipment ID:
  <external ID>" and its properties. With no linked equipment the tab shows
  "No equipment linked".
- Properties are every non-relation, non-JSON property the view defines and
  that has a value, labelled with the view property name. System and
  source-tracking properties (for example `source`, `sourceId`, `uid`,
  `createdByUser`) are hidden.
- Loading shows a status message with the back button available. A failed
  load shows "Asset details could not be loaded" with Retry and the back
  button; the page is never shown with partial or fabricated data.

## Shared state and theme

- The selected asset and the active tab are host-synced: they are restored
  from the Fusion `initialState` and pushed with `syncInternalState` on every
  change, so reloads and shared links open the same screen. Tab values are
  `PROPERTIES` and `EQUIPMENTS`; unknown or malformed state falls back to the
  register on the Properties tab. A failed sync is logged and does not block
  navigation.
- The topbar shows the ADNOC Gas logo (light or dark variant), a breadcrumb
  with the selected asset name when one is open, and a light/dark theme
  switcher. The theme follows the system preference until the user picks one;
  the choice is remembered in local storage when it is available.

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

- Build the UI from Aura components and semantic tokens; the teal brand colour
  is applied once in `src/styles.css` by aliasing Aura's tokens. Custom
  components live in `src/components/general/`.
- Stack panels on small screens without page overflow.

## CDF data and host

- Use the existing `CogniteSdkProvider` for authentication; never hardcode the
  project, base URL or token.
- Resolve the `Asset` and `Equipment` views in `sp-dm-idi-asset` at run time
  (latest version, inherited properties included) and query through
  `client.instances.query()` with TanStack Query. Query keys include the
  project, view and cursor or asset identity.
- Read only: do not create views, spaces or instances. The signed-in user
  needs read access to the instances and the view schema.

## Engineering and acceptance

- Follow `PROJECT_CONVENTIONS.md`.
- Mock CDF boundaries in tests; never require live services in automated tests.
- Run lint, type-check, build and tests before release.

## Out of scope

CDF writes, documents and file viewing, search, signals and time series,
SAP integration, health or risk scoring, reports and 3D.
