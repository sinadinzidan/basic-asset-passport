# Asset Passport

## Purpose

A Cognite Flows app that lists assets from CDF, shows the properties of an
asset and of the equipment linked to it, and lets users add, edit and delete notes on an asset
and upload, view and delete documents for it. Notes and documents are the only
data the app writes. It shows only data read from CDF. Dummy
data appears only in the opt-in mock mode below, which is off by default and
labelled on screen.

Assets, equipment, timeseries, notes and documents are all read through one solution data
model, `Asset_Passport` (space `sp-asset-passport`, version `1`). It references
the `Asset`, `Equipment` and `PI_Timeseries` views of the RMDM model and defines the `Note` and
`Document` views.

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
- A search box above the table searches the Asset view's name, description and
  plant with CDF's full-text search. What is typed shows at once and is applied
  after a short pause (300 ms), on Enter, or when cleared with the clear button;
  a blank search lists every asset again. A search is one page of at most 100
  matches with no paging; when it hits that limit the table says "Showing the
  first 100 matches. Refine the search to narrow them." Changing the search
  returns to the first page. The summary tiles count the matches shown. The
  applied search is host-synced with the rest of the navigation state, so a
  reload or shared link restores it, and it is kept when an asset is opened and
  the user returns to the register.
- Loading shows grid skeleton rows. An empty view shows "No assets found"; a
  search without matches shows "No matching assets" with the text searched for.
  A failed load shows "Assets could not be loaded" with a Retry action inside
  the table panel (the search box stays usable); it is never shown as an empty
  list.

## Asset details

- Opening an asset shows its name (or external ID when unnamed) as the page
  title with a back button, plus status and criticality badges when present.
  Pill colours follow the data: an Operating status is blue with a check
  icon, a maintenance status is amber and any other status is grey.
  Criticality is shown as its own value (for example "A - High criticality")
  with a colour by class: A red, B amber, C green, anything else grey.
- Five tabs: Properties ("Asset ID: <external ID>", exactly as stored, then the
  asset's properties in the same grid of label and value cells as each equipment), Equipments (the
  `Equipment` nodes whose `asset` relation points to the asset, up to 1000,
  with a count badge on the tab), Timeseries (see below), Notes and Documents (see below). Each equipment is a card with its name,
  "Equipment ID: <external ID>" and its properties as a grid of label and value
  cells. With no linked equipment the tab shows
  "No equipment linked".
- Properties are every non-relation, non-JSON property the view defines and
  that has a value, labelled with the view property name. System and
  source-tracking properties (for example `source`, `sourceId`, `uid`,
  `createdByUser`) are hidden.
- Loading shows a skeleton of the page (kicker, title with badges, tab bar and a card of property cells,
  announced as "Loading asset and equipment properties..."), with no back button. A failed
  load shows "Asset details could not be loaded" with Retry and the back
  button; the page is never shown with partial or fabricated data.

## Asset timeseries

- The Timeseries tab, between Equipments and Notes, lists the time series linked to the open asset: the
  `PI_Timeseries` nodes (`sp-dm-idi-rmdm`, `v1`, referenced by the `Asset_Passport` model) whose `assets`
  relation list contains the asset, up to 200, sorted by name.
- The cards are laid out two to a row (one on a narrow screen). Each series is a card with its name (or its
  external ID if it has none), a preview of its last 6 months, and its properties
  as a grid of label and value cells, labelled with the view property name. The published view carries
  around fifty PI point settings (compression, exception, scan...), so the card shows only: description, tag,
  engineering units, type, step series, plant, unit and train name, equipment type, typical value, zero, span
  and the OWE, DLE and trip limits, whichever have a value. A view that holds none of these shows every
  property instead.
- The preview is a glowing area chart of the series' average per 2 days over the last 6 months (the datapoints
  API, one request per 50 series), with "6 months ago" and "Now" under it and four readings beneath: Latest, Min,
  Max and Avg, each with the series' engineering unit (`engunits`) when it has one. While the readings load it
  shows a placeholder. A series whose `type` is `string` or `state` is not requested and shows "Not a numeric
  series: there is no trend to draw."; a series with no `type` is treated as numeric; a series with no readings in the window shows "No readings in the last 6 months."; if the
  readings cannot be loaded the preview says "The preview could not be loaded." and the rest of the card
  stays. The chart has a text alternative giving the latest, lowest and highest reading.
- Clicking a series' preview (a hover hint reads "Open chart"; non-numeric series have no preview to click) opens that
  series in the trend chart over the whole screen, showing the last 6 months until another range is picked in the
  chart. The chart is the shared `@flows/trend-chart` package
  (`packages/trend-chart`, linked as an npm workspace, shared as source): it adds series, sets the window,
  axes and layers, shows statistics and exports CSV and PNG. Only the numeric series of the open asset can be
  added, up to the chart's limit. Readings are averages at a step chosen from the window so a window never
  exceeds 1000 points (1 minute up to 1 day). A series' own limits are drawn as lines, labelled with the
  source's term: `tripLimitMax` and `tripLimitMin` as danger lines (Trip high / Trip low), `oweLimit*` and
  `dleLimit*` as alert lines (OWE / DLE high / low); a limit with no value is not drawn. The Asset Passport
  model has no alerts, connected files or events, so the chart shows none. A series whose readings cannot be
  loaded shows the error with a Retry in the series table, and the other series stay; a failed read is never shown
  as a series without data. Live mode is off.
- The open chart is host-synced: its setup (series, window, title, layers, styles) is stored with the page state,
  so a reload or shared link reopens the same chart. It is dropped when the asset or the tab changes or the chart
  is closed. In mock mode the readings are generated and the chart marks the source as simulated.
- Loading shows "Loading timeseries..." in a plain card; a failed load shows "Timeseries could not be loaded"
  with Retry; no series shows "No timeseries linked".
- The relation and fields follow RMDM's published schema (`end-to-end-asset-passport/schema.graphql`):
  `PI_Timeseries.assets` is the direct relation list to `Asset` (its reverse is `Asset.timeSeries`), `type` is
  `numeric`, `string` or `state`, and the unit is `engunits`. `unitName` is the plant unit the point belongs to,
  not a measurement unit. The `Files` view of the same schema links to assets through its own `assets` list (reverse
  `Asset.files`); it is a different view from the app's `Document`, and its files are listed under Documents
  read-only (see Asset documents).

## Asset notes

- The Notes tab lists the notes written against the open asset, newest first,
  up to 50. Each note shows its title, text, author (or "Unknown author") and
  the date it was added. Loading shows a status message; a failed load shows
  "Notes could not be loaded" with Retry; no notes shows "No notes yet".
- An "Add note" bar sits above the list, laid out like the document upload bar:
  a short hint on the left and an "Add note" button on the right. The button
  opens an "Add note" dialog with a required Title (up to 100 characters) and
  an optional Note text (up to 2000 characters), and Cancel and "Save note"
  buttons. "Save note" is disabled while the title is empty or while saving.
  A saved note closes the dialog and appears in the list at once. A failed
  save shows "The note could not be saved" with the reason inside the dialog,
  keeps what was typed, and never shows the note in the list. Cancelling or
  closing the dialog drops what was typed. While the note is saving, both
  dialog buttons are disabled.
- A note is a node of the `Note` view (`sp-asset-passport`, `v1`) written to
  the instance space `sp-asset-passport-data` with a generated external ID
  (`note-<uuid>`). Its `asset` property is a direct relation to the asset
  node. Missing target nodes are never auto-created, so a wrong asset
  reference fails instead of creating an empty asset.
- The author and author ID come from the signed-in user's profile. If the
  profile cannot be read the note is still saved, without an author.
- Each note has an Edit and a Delete icon button, named "Edit <title>" and "Delete <title>".
  Edit turns the note into a form in place, with the Title (required, up to 100 characters) and Note text (up to
  2000) filled in, and Save and Cancel. Save is disabled while the title is empty or while saving; a saved edit
  goes back to the note and the list is reloaded. Only the title and text are written, so the note keeps its
  asset, author and date; an emptied text is saved as an empty string and shows as no text. A failed save shows
  "The note could not be saved" with the reason inside the form and keeps what was typed; Cancel drops the edit.
- Delete asks "Delete note?" with Cancel and a destructive "Delete note" button, then removes the note node
  permanently. A failure shows "The note could not be deleted" with the reason and keeps the note. Any signed-in
  user who can open the asset sees both buttons; whether the write is allowed is decided by CDF access, and a
  refusal is shown as the failure above.

## Asset documents

- The Documents tab lists the documents uploaded against the open asset, newest
  first, up to 100, and after them the files that already exist for the asset in RMDM (the `Files` view, matched
  through its `assets` relation, newest first, up to 100; the app reads RMDM's `Files` view `sp-dm-idi-rmdm` `v1`
  directly by reference, it is not part of the `Asset_Passport` model). An existing file shows an "Existing file" pill and can
  be viewed but not deleted, and it cannot be replaced or renamed here; uploads always create a `Document`. A
  file linked to equipment only, not to the asset, is not listed. The existing files are read separately: if they
  cannot be read, "Existing files could not be loaded" with Retry shows above the list and the uploaded
  documents stay; nothing at all shows "No documents yet" only when both are empty and both loaded. Each row shows an icon for the kind of file (PDF, image,
  spreadsheet, document, presentation, data or a generic file), its name, a type
  pill (PDF, PNG, Word and so on, otherwise "File") and "Uploaded <date>", or an
  amber "Upload incomplete" pill when the file content never arrived. Loading shows a status message; a failed load shows
  "Documents could not be loaded" with Retry; none shows "No documents yet".
- An "Upload documents" control sits above the list. One or more files can be
  chosen at once, each up to 50 MB and not empty. Files are uploaded in
  parallel; afterwards a toast confirms "N document(s) uploaded." and the tab
  lists each file that failed with the reason ("Some documents could not be
  uploaded"), which stays on screen until the next upload. The list refreshes
  whether or not every file succeeded. While files are uploading, each one shows
  at the top of the list as a card with its name and an "Uploading..." status; it
  is replaced by the real document once the list has been re-read, and it stays
  visible if the user leaves the tab and comes back. CDF marks a file as
  uploaded a moment after its content arrives, so a document created in the last
  two minutes that is not yet marked uploaded shows "Processing..." and is re-read
  every 2 seconds until it is; View then enables on its own, with no reload. Only
  a document older than that which was never marked shows "Upload incomplete"
  (and is no longer re-read).
- A document is a node of the `Document` view (`sp-asset-passport`, `v1`, a
  `CogniteFile` extension) written to `sp-asset-passport-data` with a generated
  external ID (`doc-<uuid>`). Its `asset` property is a direct relation to the
  asset node. The file content is sent with the Files API upload link for that
  node (`POST /files/uploadlink`, then a `PUT` of the bytes). If the content
  cannot be uploaded the node is removed again, so no empty documents remain.
- Row actions are small icon-only buttons, each with a tooltip and an
  accessible name that includes the file name: View (outlined) and Delete (the
  red destructive style, the same as the confirmation button).
- View opens the document in a large dialog titled with the file name, so the
  user stays on the asset. The file viewer shows PDFs, images, Office
  documents and text files. Below the page are Zoom out, a percentage button
  (Reset zoom, back to 100%) and Zoom in, in steps of 25% between 25% and 500%;
  pinch and Ctrl/Cmd plus the wheel zoom too and keep the percentage in step.
  Pressing the left (or middle) mouse button on the page and moving drags it: it pans a zoomed-in page and
  scrolls a page at 100% or less. Zooming never resizes the dialog or moves these controls.
  A PDF or document with several pages also gets Previous and Next buttons and
  a "Page 1 of 3" label. The viewer highlights the diagram annotations of a
  file that has them, such as the P&ID boxes of a contextualised drawing
  (read from `CogniteDiagramAnnotation` edges); a file without them shows no
  boxes. Clicking anywhere inside a box that links to an asset opens a popover
  pointing at that box, in the same chamfered glass style as the dialogs. It shows the asset's name, status and
  criticality, functional location, plant and description, and an "Open asset" button that closes the preview and
  opens that asset in the register. Pressing the box again keeps it open; the close button, Escape, a press elsewhere,
  a zoom or a page change closes it. While the asset loads it says so, and a failed load offers Retry. A box that
  links to something else does nothing when clicked. The viewer reads the
  file through CDF by the document's instance ID and is only downloaded the
  first time a document is viewed. View is disabled for a document whose
  upload is incomplete. A file the viewer cannot show, or cannot read, shows
  the viewer's own message in the dialog.
- Delete asks "Delete document?" with Cancel and a destructive "Delete
  document" button. Deleting the node also deletes the file content. A failure
  shows "The document could not be deleted" with the reason and keeps the row.
- Documents cannot be renamed or edited. In mock mode there is no CDF client
  to read files with, so the preview dialog says "Preview is not available
  here."; the document list, upload and delete still work.

## Agent helper

- A small robot mascot floats in the bottom-left corner of every screen (it is
  hidden on phone-width screens): the ADNOC field robot, in a white ADNOC hard
  hat and coverall, with a glowing face on a dark visor. Its size follows the
  window width: 6.5rem up to a 1280px window, growing to 8rem on wide screens.
  It bobs gently and its
  smiling eyes blink every few seconds; while hovered or focused it raises its
  arm softly and tilts its hand a little from side to side at the wrist, each
  tilt smaller than the one before (about two seconds, only the arm moves), then
  holds the hand up until the pointer or focus leaves and lowers it just as
  softly; with reduced motion the arm stays down. While an agent is answering its eyes turn round and look from
  side to side. It is decoration for assistive technology; the button around it
  is named "AI assistant".
- Choosing the button opens a panel that grows out of the corner, up to the
  full height of the corner (22rem while loading, 34rem for the chat, never taller
  than the window). The mascot flies up into the panel's header corner, small,
  so the panel uses the space it took; closing (the mascot, the close button or
  Escape) shrinks the panel away and the mascot flies back. Animations are
  skipped with reduced motion.
- The helper talks to one CDF agent only, the one with external ID
  `FOCUSED_AGENT_EXTERNAL_ID` (`src/constants/agents.ts`); other agents of the
  project are neither listed nor fetched. The panel looks up just that agent (`POST /ai/agents/byids`): loading
  shows "Loading assistant..."; a failed load shows "The assistant could not be
  loaded" with Retry; if the project has no such agent it says "The assistant is
  not available in this project.". Once found, the chat opens by itself.
- The chat is shown in the same panel. It is not handed over to the Atlas panel in Fusion and works the same
  outside Fusion. A message box with the button shape (cut corners, lit bottom line;
  Enter sends, Shift+Enter adds a line) and a
  Send button sit under the conversation; while the agent answers the box
  cannot send and a thinking line shows: a spinner and a playful plant-floor phrase that
  changes every couple of seconds ("Reading the gauges...", "Checking the valves...").
  Screen readers hear "Thinking..." once. New chat
  starts the conversation over. An empty chat suggests four sample questions
  (for example "Which assets have high criticality?"); choosing one sends it and
  they disappear once the conversation has started. A microphone button next to
  Send dictates the question: while it is on it shows a stop sign instead of the microphone ("Stop dictation", pressed, with a light running around its outline)
  the spoken words are typed into the message box as they are recognised, after
  anything already typed, and can be edited before sending; pressing it again or
  sending stops it. It uses the browser's speech recognition in the browser's
  language, so it is hidden where the browser has none (for example Firefox),
  and in Chrome and Edge the audio is sent to the browser vendor's speech service.
  A blocked microphone shows "Microphone access is blocked. Allow it in the
  browser to dictate."; Fusion must allow the microphone for the app's frame. A failed answer shows "The agent could not
  answer" with the reason and keeps the question.
- Each agent reply ends with a small copy icon ("Copy response"). It copies the reply's text, then shows a check
  ("Copied") for about two seconds; if the browser refuses the clipboard it shows "Could not copy". Your own
  questions have no copy icon.
- The conversation is kept while the app is open (it is not synced
  to the URL and is gone after a reload). Replies are shown as plain text.
- An agent that needs approval to run a tool cannot be answered: the chat says
  "This agent needs approval to run a tool, which this chat cannot give." Tools
  that run without approval work as usual.
- The agent is looked up and asked through the Agents API (`POST /ai/agents/byids`
  and `POST /ai/agents/chat`, beta) with the SDK client, following the conversation
  by the reply's cursor. The signed-in user needs access to the agents in the
  project. The mascot is cut from its reference pictures
  (`design/mascot/adnoc-mascot-reference.png`, and
  `adnoc-mascot-wave-reference.webp` for the raised arm) by
  `design/mascot/cut_sprites.py` into five PNG layers in `src/assets/agent`
  (the robot at rest, the same robot with its arm raised up to the wrist, the
  raised hand by itself so it can turn at the wrist, its smiling
  eyes and its round thinking eyes), bundled with the app and served from the app itself,
  so `manifest.json` keeps `permissions.network` empty. Mock mode has a dummy
  agent with that ID that gives a fixed dummy reply.

## Shared state and look

- The selected asset and the active tab are host-synced: they are restored
  from the Fusion `initialState` and pushed with `syncInternalState` on every
  change, so reloads and shared links open the same screen. Tab values are
  `PROPERTIES`, `EQUIPMENTS`, `TIMESERIES`, `NOTES` and `DOCUMENTS`; unknown or malformed state falls back to the
  register on the Properties tab. A failed sync is logged and does not block
  navigation.
- The topbar shows the white ADNOC Gas logo (the app name "Asset Passport" is
  shown instead if the image cannot load) and a breadcrumb with the selected
  asset name when one is open.
- The app is dark only, with the control-room HUD look: electric blue on deep
  navy, an engineering grid behind the page with a few short lights running along its lines, and a mono kicker
  line above each page title. There is no light mode or theme switcher.

## Mock mode

- `VITE_MOCK_MODE=true` (default `false`; see `.env.example`) serves dummy data
  instead of calling CDF, for local development outside Fusion. It skips the
  Fusion host connection, so no authentication is needed and the selected
  asset and tab are not synced to the URL.
- The dummy data lives in `src/mocks/` and answers the same requests the app
  sends (data model lookup, the paged `assets` query, the `asset` plus
  `equipment` details query, the `notes`, `documents` and `timeseries` queries, the
  timeseries datapoints (smooth, deterministic dummy readings), note
  creation, document upload and deletion and the user profile) with CDF-shaped
  responses, so the real services and UI run unchanged. Notes and documents
  added in mock mode are kept in memory only; mock file links are local. With the flag off the app behaves exactly as before.
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
  `NeonStage` (grid, rings and short lights that run along the grid lines from one crossing to another, slowly and
  one or two at a time; they are decoration and are hidden with reduced motion).
- Every notice (load errors, the connection error, the mock-mode banner) uses
  one app-owned alert, `AppAlert`: a tinted, bordered row with an icon, an
  optional title, a message and an optional action. Variants are error,
  warning, info and success, taken from Aura's semantic colour tokens. Errors
  and warnings are announced as alerts; info and success as status.
- Toasts (short confirmations such as "1 document uploaded.") use the same
  glass, chamfered look and appear bottom-right; errors stay inline.
- The page back button is a square pill, like the other buttons.
- Dialogs are chamfered glass panels with a lit cyan edge, like the cards,
  split by full-width dividers into a header (title), a body and a footer of
  actions. Their close button and action buttons use the same pill shape and
  type as the rest of the app; a destructive action is the red pill.
- Stack panels on small screens without page overflow.
- Cards, tiles and page headers are still: they appear at once and nothing on them moves (no entrance, no sweeping
  scan line, no hover lift, no travelling border light, no pulsing dot). The motion on a page is the lights on the
  background grid, plus the agent helper.
- The agent helper's panel is a chamfered glass panel like the tooltips and toasts.

## CDF data and host

- Use the existing `CogniteSdkProvider` for authentication; never hardcode the
  project, base URL or token.
- Resolve the `Asset`, `Equipment`, `PI_Timeseries`, `Note` and `Document` views from the `Asset_Passport`
  data model (`sp-asset-passport`, version `1`, views inlined) at run time and query
  through `client.instances.query()` with TanStack Query. Query keys include
  the project, data model, view and cursor or asset identity.
- Throttled (429) and temporary gateway (502, 503, 504) responses are retried
  up to 3 times with exponential backoff and jitter, capped at 15 seconds;
  other errors are shown at once.
- An unexpected rendering error shows "Something went wrong" with a Retry
  action instead of a blank page.
- The only writes are note and document instances in `sp-asset-passport-data`
  (and the file content of documents); never create views, spaces or
  containers. Document content is sent to a temporary upload link on a
  `cognitedata.com` storage host, and read through temporary download links
  on `cognitedata.com` hosts; the baseline Content Security Policy already
  allows both, and the PDF worker is bundled with the app, so
  `manifest.json` keeps `permissions.network` empty. The
  signed-in user needs `dataModelsAcl` read on
  `sp-asset-passport` and `sp-dm-idi-rmdm`, `dataModelInstancesAcl` read on
  the spaces holding the asset and equipment nodes, and `dataModelInstancesAcl`
  write on `sp-asset-passport-data`.

## Engineering and acceptance

- Follow `PROJECT_CONVENTIONS.md`.
- Mock CDF boundaries in tests; never require live services in automated tests.
- Run lint, type-check, build and tests before release.

## Out of scope

CDF writes other than adding, editing and deleting notes and uploading or deleting documents
(notes or documents on equipment or TFN row items,
renaming documents), search beyond the asset register (equipment, notes, documents), signals and time series,
SAP integration, health or risk scoring, reports and 3D.
