# Asset Passport

## Purpose

A read-only Cognite Flows app with a live CDF asset listing and an equipment
passport for each asset. It shows only data read from CDF: there is no mock
mode, dummy data, or simulated content.

## Asset passport

### Passport contents

- Hero: equipment name, description, full location (facility / area / parent
  asset) and external ID. Missing fields show an explicit message rather than
  a placeholder value.
- Overview: identity and specifications taken from every property the
  equipment view returns, labelled from the property name (text, number,
  boolean and lists of these). Relations and empty values are omitted;
  manufacturer, serial number, tag number, class, system, part number, area
  and facility are listed first when present.
- Documents: real CDF files linked to the equipment or its asset. Selecting a
  file opens the in-app file viewer.
- Health, operating status, criticality, availability, work orders, spares,
  lifecycle and costs are not shown because they are not connected to CDF.

### Interaction and design

- Build the UI from Aura only: Aura components for the Topbar, breadcrumb,
  tabs, segmented control, cards, search, pagination, badges, avatars, empty
  states, alerts, skeletons and dialogs, and Aura semantic and decorative
  tokens (Tailwind token utilities such as `bg-card-background`,
  `text-muted-foreground` and `bg-decorative-background-fjord`) for colour,
  type and spacing. The look is customised in one place, `src/styles.css`, by
  aliasing Aura's primary, link and focus-ring tokens to the "nordic" (teal)
  ramp for light and dark, as Aura's customization guide describes; there is
  no other theme layer. Custom components live in `src/components/general/`. No raw hex, rgb or hsl values and no style overrides on Aura
  components. The reusable `DataTable` (`src/components/general/DataTable.tsx`) is the one
  custom element, because it is a plain semantic table (Aura's `@cognite/aura/data-grid` is a virtualised grid with extra peer dependencies and is not used); it is driven
  by column definitions and styled with Aura tokens only. Lists build their
  columns on it (see `AssetTable`).
- Use exactly one Aura Topbar: app mark, interactive breadcrumb (Asset
  Passport > asset name; the app name returns to the list), a "Read-only"
  note, and a light/dark theme switcher. The theme follows the system
  preference until the user picks one. There is no sidebar and no extra back
  button.
- Assets can be shown as a table or as a card grid (a segmented control in the
  toolbar; the choice is kept in the shared link), and "/" jumps to the search
  field.
- Follow Aura's list-page and detail-page layouts: page header, then one
  `TablePanel` frame holding the search toolbar, the table (or its loading,
  error and empty state) and the pagination footer; then a hero card, and below it two columns on wide screens: Overview and
  Documents tabs (with a document count) on the left, and a summary column on
  the right with "Key facts" tiles and, when more than one item is linked, an
  "Equipment on this asset" list to switch between them (the choice is kept in
  the shared link); the summary column
  moves under the tabs on small screens. The read-only footer closes the page. Let the page content use the full width.
- Make it lively within Aura's rules: a gradient icon tile and gradient
  accent bar from Aura's gradient tokens, decorative-colour avatars with
  initials, decorative badges for class, system, facility and area, and
  "key facts" tiles. Decorative colour never implies health or status.
  Entrances use Aura's entrance easing, about 400 ms, with a 40 ms stagger,
  and are skipped when the user prefers reduced motion.
- Stack the passport panels on small screens without page overflow.
- Use readable typography: 14px body/record text, 12px metadata and labels,
  18px section headings, with wrapping for badges and dense record rows.
- Label the app as a read-only view of CDF data. This is not a safety
  system or an operational instruction.

## CDF data

- Empty states use one shared pattern (icon, title, short hint and, where it
  helps, an action) instead of bare text: no assets (hint names the view),
  no search matches (Show all assets), no equipment, no
  specifications, and no files. Titles keep the plain sentence so screen
  readers announce it as a status.
- Use the existing CogniteSdkProvider for Fusion host authentication.
- Query nodes in pages of 10 through `client.instances.query()` in
  `@cognite/sdk` and TanStack Query, using the `energy_dm.EnergyAsset/v1` view.
- Use a named `assets` result set with a `hasData` view filter and select
  only `name` and `description`. Preserve instance space and external ID
  as composite identity; use external ID as the label for unnamed nodes.
- Provide First page, Previous, and Next controls. Use the `assets` entry
  in the query's `nextCursor`/`cursors` maps to navigate; do not infer
  another page from item counts.
- Search live assets by name and description across the full view using
  `instances.search`, not by filtering the current page. Submit with Search
  or Enter; Clear search restores the unfiltered listing. Search uses CDF
  text matching with all terms required and returns up to 1000 ranked matches,
  displayed 10 per page with a visible limit notice if the cap is reached.
  Search does not match external IDs. Keep controls available during loading,
  no matches and errors. Changing the term resets to the first page.
- Restore the submitted search and page through Fusion host state, preserving
  both when opening an asset and returning to the listing. Keep draft input
  local until submitted, limit it to 256 characters, and include the search
  term in query/cache keys so cursors/results cannot cross search scopes.
- Keep pagination controls visible while a new page loads, retain the previous
  rows during the transition, announce the loading page, and disable navigation
  until the request completes.
- Preserve the current page in Fusion host state. Restore later pages by
  replaying preceding query cursors, and show a restart-to-first-page action
  if a saved page is no longer available.
- Activating an asset opens its equipment page and synchronizes the selected
  asset with the current page in Fusion host state. Query up to 25
  `energy_dm.EnergyEquipment/v1` nodes whose `asset` direct relation points
  to the selected `EnergyAsset` node and render them in the asset passport
  layout using only live fields. Request all properties of the equipment view
  (`properties: ['*']`) so details do not depend on a fixed list of names.
  The page is labelled “CDF · Live equipment”.
- Live asset detail uses the full content width. Keep Back to assets and data disclosure above the
  passport. Show compact equipment controls only when multiple equipment
  items are linked.
- Split live asset detail into Aura tabs: Overview (identity and
  specifications) and Documents. Default to Overview, restore the active tab
  from Fusion host state, and preserve asset context when switching tabs.
  Keep the equipment header and selector visible across tabs and use the same
  tab structure for assets without equipment, including their files.
- The Documents section shows real `energy_dm.EnergyFile/v1` files: files in
  the selected equipment's `files` relation, plus up to 100 files whose
  `assets` relation includes the selected asset (labelled “Asset file”). Never
  show placeholder documents for live equipment. Show “No files linked to this
  equipment or its asset.” when none exist; file loading and errors (with
  retry) stay inside the Documents section without hiding equipment.
- If no equipment references the asset, still list the asset's files.
- Signals (time series and datapoints) are out of scope: the app does not
  query time series or datapoints, and shared links saved with the removed
  Signals tab open on Overview.
- Selecting a real file opens an in-app CogniteFileViewer dialog, including
  P&ID PDFs, with page navigation, zoom, pan and reset controls. Use the full
  file instance identity (`space` + `externalId`) and the authenticated SDK
  to resolve content; never treat it as a classic file external ID.
- Restore the open file through Fusion host state. Closing the viewer keeps
  the asset selection and asset-list page. Opening another file resets its
  PDF page, zoom and pan. The PDF renderer and worker load only when needed.
- Display diagram annotation overlays when available; annotation access
  failures remain visible without preventing the diagram itself from opening.
  File-content errors offer Retry. Missing content, denied access and
  unsupported formats must not fall back to a simulated diagram.
- Match the file viewer to the rest of the app: an Aura dialog with a neutral
  document canvas, compact grouped page/zoom controls and a read-only footer.
  Keep the diagram dominant; use an edge-to-edge workspace on small screens.
- If no equipment references the asset, show “No equipment data
  available for this asset.” Keep request failures distinct with an error and
  retry action.
- Show names, external IDs, and descriptions with loading/error/empty states.
- Get runtime project, base URL, and token from the host, not hardcoded config.
- Keep project and query limit in the query key.
- The asset list shows only equipment name, external ID, plant area and
  description; it has no health column because health is not connected to CDF.
- Read the existing view only; do not create views, spaces, or instances.
- Local deployment target: flows-builder on westeurope-1.
  The signed-in user needs data-model instance read access to the relevant
  spaces and access to the view schema.

## Engineering and acceptance

- Follow `PROJECT_CONVENTIONS.md`; use typed records and UPPER_SNAKE_CASE string enum members and values.
- Preserve live authentication and query behavior.
- Mock CDF boundaries in tests; never require live services in automated tests.
- Cover equipment switching, tabs, document opening, empty states and search.
- Run lint, type-check, build, and tests; visually inspect desktop and mobile.

## Out of scope

CDF writes, SAP integration, document editing, operational authorization,
full RCA/risk/financial modules, reports, 3D simulation, and deployment.
