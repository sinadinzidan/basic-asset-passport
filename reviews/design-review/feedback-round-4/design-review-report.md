# Design Review — Asset Passport — round 4

Round 4 covers the project rebuilt on the current Flows template (Aura 1.48, React 18, Node 26). The UI is unchanged in design from round 3; this round checked that it still holds up on the newer Aura version and found four visual and accessibility defects that came with it, all fixed in this round.

## User and tasks

- **Primary user:** Maintenance or reliability engineer, or a business viewer, at a desk on a desktop or laptop in Cognite Fusion; read-only (from `App-Brief.md`, an assumed persona).
- **Tasks evaluated:**
  1. Find an asset (browse, search, list or grid view) and open the passport of its equipment.
  2. Read the equipment's identity, tags and specifications, and switch between equipment items.
  3. Open a linked document from the Documents tab.
- **Context:** Internal demo, no real users yet. Success target in the brief: find an equipment's specifications and a linked document from one screen in under 2 minutes.

## Task walkthrough findings

The walkthrough was done by Claude in a throwaway local copy of the app with a fake CDF client (25 assets, three equipment items, three files), in the light and dark themes at about 1024 px and at 375 px. It was not done by the user against real CDF data, so real-data behaviour (long names, odd properties, real file downloads and PDF rendering) is untested. The fake client cannot serve file content, so the document dialog was seen in its loading and error-with-Retry states only. The throwaway copy was deleted afterwards.

- **Task 1 — Find an asset.** Search for "pump" returned the one match, with "Clear search", a page footer and "Showing 1 (last page)"; opening the row showed the passport and the breadcrumb. The list and grid views both work and look consistent in both themes. No horizontal scroll at 375 px.
- **Task 2 — Read the passport.** The hero, at-a-glance strip, specifications grid and key-fact tiles read clearly in both themes. Switching equipment items is available from the list on the right and is kept in the shared link. An asset without equipment shows its own full-width page with a "View asset files" button.
- **Task 3 — Open a document.** The Documents tab lists files; "Preview" opens the Aura dialog with page, zoom and reset controls; Escape closes it and returns focus to the row that opened it, and the shared link no longer holds the file.
- **Other states checked:** a failed list request (an alert with Retry), a search with no matches, a loading skeleton, and the theme menu (light and dark).
- **Defects found and fixed this round:**
  1. The Documents tab count was invisible in dark mode (dark text on a dark fill): Aura's `TabsTrigger` already wraps its `badge` in a Badge and we nested a second one inside it. Fixed; a test now fails if a second badge is nested.
  2. Icons in the document rows were almost invisible (grey on a pale tile) because Aura buttons colour nested icons with a selector of equal weight. Fixed in `IconTile`.
  3. The selected equipment id used the muted colour on the selected row (3.7:1 in light mode). Fixed.
  4. The previewed image had an empty `alt`, so a screen reader announced nothing for the file content. The viewer now takes an `alt` and the dialog passes the file name.
- **Slow to fail (fixed after the scores were confirmed):** a failed request showed its skeleton for about 7 seconds before the error alert appeared, because TanStack Query's default of three retries applied to every error, including permission errors. Queries now retry at most twice and only for lost connections, timeouts and server errors, so other failures show at once; covered by tests. Not re-walked in the browser.
- **Changed after the scores were confirmed (scores left as confirmed):** the Aura lint audit went from 16 to 9 warnings (the asset search is now an Aura `InputGroup`, padding overrides on Aura cards, table rows and pagination were removed, and the viewer's static inline styles became classes); a `div` was no longer nested inside a `p` in the pagination status; Aura's muted text colour was raised to the next ramp step in light mode (4.45:1 to above 4.5:1) and set explicitly in dark mode; and the animation features now load as a separate chunk. An axe-core 4.14.0 scan of 14 states (list and grid, light and dark, passport tabs, documents, empty, error and dialog states) found 0 violations. These were checked in the same throwaway copy, which was deleted again.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 4 | 24 files import Aura per component subpath; the brand colour is set only through token aliases in `src/styles.css` (light and dark); no hard-coded hex in app code, and the only rgb values are the annotation palette in the vendored viewer. Nine deliberate token-based utility overrides remain on Aura primitives after this round's clean-up (down from 16; the search field and table rows now use Aura's own `InputGroup` and `Item` parts), the viewer keeps only the inline styles that depend on the zoom level, and Aura's `no-overriding-styles` lint rule is configured but inert with per-component imports. The asset table is a custom semantic table although Aura 1.x now ships a virtualised `@cognite/aura/data-grid`. Two of this round's defects came from how Aura's tabs and buttons colour their contents. | Make the Aura lint rule effective and clear the remaining nine overrides; evaluate `@cognite/aura/data-grid` for the asset table (not adopted). |
| Q2 Navigation & hierarchy | 4 | One Aura Topbar with an interactive breadcrumb, clear page titles, tabs, an equipment list, and page, view, search, tab, file and equipment all restored from the shared link. | Not checked on real data; deep links depend on the host URL state. |
| Q3 Labels & language | 4 | No vague button labels; actions are specific ("Open Feed pump", "Show all assets", "Clear search", "View asset files", "Retry"); controls have accessible names. | The raw view name still appears in the footer note. |
| Q4 Feedback & validation | 4 | Skeletons and loaders while loading, error alerts with Retry, Aura empty states for no assets, no matches, no equipment, no specifications and no files; `ErrorBoundary` around the dashboard; no mutations. A failed host sync shows a generic message. (Failed requests used to take about 7 seconds to show their error; fixed after scoring, see above.) | Word the sync message more specifically. |
| Q5 Clickability | 5 | No `onClick` on non-interactive elements; rows and cards also contain a real button for the keyboard; hover and focus states come from Aura. | None. |
| Q6 Error prevention | 5 | Read-only app with no destructive actions. | None. |
| Q7 Responsive | 4 | No horizontal scroll at 375 px; the table collapses, the grid reflows, the hero and tiles reflow and the summary column moves below the tabs. | The smallest controls are 28 px tall (breadcrumb, theme button, tabs), below the 40 px touch guidance; not checked with an on-screen keyboard. |
| Q8 Empty states | 5 | Aura empty states with a hint and, where useful, an action, including a dedicated page for assets without equipment. | None. |
| Q9 Performance | 4 | The PDF viewer and worker load only when a PDF opens (442 kB, 132 kB gzipped, as a separate chunk); every query has a limit and results are cached; the "/" shortcut and view toggle shorten common tasks. The main bundle was about 776 kB (248 kB gzipped) when scored; after this round's split of the animation features into their own chunk (18 kB gzipped) it is about 690 kB (218 kB gzipped). | Split the main bundle further (the animation features are already separate). |
| Q10 Accessibility | 4 | 33 `aria-label`s, Aura focus rings, decorative icons and avatars hidden from assistive tech, a keyboard shortcut with `aria-keyshortcuts`, and the previewed image now has a text alternative. A scripted contrast check of every text and icon found no failures in dark mode, and in light mode only Aura's own muted text colour at 4.45:1 (0.05 under AA) when scored; that token is now raised above 4.5:1. An axe-core scan of 14 states in both themes found 0 violations. | Some touch targets are below 40 px; no test with a real screen reader; the axe scan ran on a fake-data copy, not on real CDF data. |

## Summary

- Average score: 4.3
- Quality level: Good

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

None.

## Nice to Fix (any score 3.8 – 4.4)

- Run the walkthrough on real CDF data in Fusion, including a real PDF and a real image (Q2, Q7).
- Make the Aura lint rule effective and clear the remaining nine overrides; evaluate `@cognite/aura/data-grid` (Q1).
- Raise small controls to 40 px on touch devices; Aura's own 28 px controls would need an upstream change (Q7, Q10).
- Test with a real screen reader (Q10).
