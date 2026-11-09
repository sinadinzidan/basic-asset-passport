# Asset Passport

## Purpose

A Cognite Flows app that lists assets from CDF, shows the properties of an
asset and of the equipment linked to it, and lets users add notes to an asset.
Notes are the only data the app writes. It shows only data read from CDF. Dummy
data appears only in the opt-in mock mode below, which is off by default and
labelled on screen.

Assets, equipment and notes are all read through one solution data model,
`Asset_Passport` (space `sp-asset-passport`, version `1`). It references the
`Asset` and `Equipment` views of the RMDM model and defines the `Note` view.

## Asset register

- The first screen lists assets from the `Asset` view of the `Asset_Passport`
  data model, in pages of 10, with columns Plant, Functional
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
- Three tabs: Properties (the asset's properties, in the same grid of label and
  value cells as each equipment), Equipments (the
  `Equipment` nodes whose `asset` relation points to the asset, up to 1000,
  with a count badge on the tab) and Notes (see below). Each equipment is a card with its name,
  "Equipment ID: <external ID>" and its properties as a grid of label and value
  cells. With no linked equipment the tab shows
  "No equipment linked".
- Properties are every non-relation, non-JSON property the view defines and
  that has a value, labelled with the view property name. System and
  source-tracking properties (for example `source`, `sourceId`, `uid`,
  `createdByUser`) are hidden.
- Loading shows only a status message, with no back button. A failed
  load shows "Asset details could not be loaded" with Retry and the back
  button; the page is never shown with partial or fabricated data.

## Asset notes

- The Notes tab lists the notes written against the open asset, newest first,
  up to 50. Each note shows its title, text, author (or "Unknown author") and
  the date it was added. Loading shows a status message; a failed load shows
  "Notes could not be loaded" with Retry; no notes shows "No notes yet".
- An "Add note" form sits above the list: a required Title (up to 100
  characters) and an optional Note text (up to 2000 characters). The button is
  disabled while the title is empty or while saving. A saved note appears in
  the list at once and the form is cleared. A failed save shows
  "The note could not be saved" with the reason, keeps what was typed, and
  never shows the note in the list.
- A note is a node of the `Note` view (`sp-asset-passport`, `v1`) written to
  the instance space `sp-asset-passport-data` with a generated external ID
  (`note-<uuid>`). Its `asset` property is a direct relation to the asset
  node. Missing target nodes are never auto-created, so a wrong asset
  reference fails instead of creating an empty asset.
- The author and author ID come from the signed-in user's profile. If the
  profile cannot be read the note is still saved, without an author.
- Notes are only added: editing and deleting are out of scope for now.

## Shared state and look

- The selected asset and the active tab are host-synced: they are restored
  from the Fusion `initialState` and pushed with `syncInternalState` on every
  change, so reloads and shared links open the same screen. Tab values are
  `PROPERTIES`, `EQUIPMENTS` and `NOTES`; unknown or malformed state falls back to the
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
  sends (data model lookup, the paged `assets` query, the `asset` plus
  `equipment` details query, the `notes` query, note creation and the user
  profile) with CDF-shaped responses, so the real services and UI run
  unchanged. Notes added in mock mode are kept in memory only. With the flag off the app behaves exactly as before.
- A banner states that the data is dummy data. The dummy data is loaded on
  demand and is not part of a build made without the flag.

## Design

- Build the UI from Aura components and Aura colour ramps (blue, amber, red,
  mountain); no raw hex. The HUD theme lives in `src/styles.css`, and custom
  components live in `src/components/general/`.
- Panels (`HudPanel`) have cut corners, a lit gradient edge, a glow and a
  light that travels along the border. Tabs in a panel sit on a full-width
  header strip with a lit active tab. Type is Chakra Petch throughout, with
  Source Code Pro for IDs. Status and criticality pills use the same lit-tab look (cut
  corners, gradient fill, bright bottom line, capitals) with a colour taken
  from the data: Operating is blue, maintenance amber, other statuses grey;
  criticality A is red, B amber and C green. The register's Criticality column
  uses the same pill. Pills are small (22px high, 10px type). Text buttons (Add note, Retry, Previous, Next) have the pill look at
  their normal size; the back button stays square. The page sits on
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
- Resolve the `Asset`, `Equipment` and `Note` views from the `Asset_Passport`
  data model (`sp-asset-passport`, version `1`, views inlined) at run time and query
  through `client.instances.query()` with TanStack Query. Query keys include
  the project, data model, view and cursor or asset identity.
- Throttled (429) and temporary gateway (502, 503, 504) responses are retried
  up to 3 times with exponential backoff and jitter, capped at 15 seconds;
  other errors are shown at once.
- An unexpected rendering error shows "Something went wrong" with a Retry
  action instead of a blank page.
- The only writes are note instances in `sp-asset-passport-data`; never create
  views, spaces or containers. The signed-in user needs `dataModelsAcl` read on
  `sp-asset-passport` and `sp-dm-idi-rmdm`, `dataModelInstancesAcl` read on
  the spaces holding the asset and equipment nodes, and `dataModelInstancesAcl`
  write on `sp-asset-passport-data`.

## Engineering and acceptance

- Follow `PROJECT_CONVENTIONS.md`.
- Mock CDF boundaries in tests; never require live services in automated tests.
- Run lint, type-check, build and tests before release.

## Out of scope

CDF writes other than adding notes (editing or deleting notes, notes on
equipment or TFN row items), documents and file viewing, search, signals and time series,
SAP integration, health or risk scoring, reports and 3D.
