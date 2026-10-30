# Design Review — Asset Passport — round 3

Round 3 covers the current version: no signals, an Aura-only UI branded through token aliases in `src/styles.css`, a list and card-grid view, a redesigned equipment page and a dedicated no-equipment page.

## User and tasks

- **Primary user:** Maintenance or reliability engineer, or a business viewer, at a desk on a desktop or laptop in Cognite Fusion; read-only (from `App-Brief.md`, an assumed persona).
- **Tasks evaluated:**
  1. Find an asset (browse, search, list or grid view) and open the passport of its equipment.
  2. Read the equipment's identity, tags and specifications, and switch between equipment items.
  3. Open a linked document from the Documents tab.
- **Context:** Internal demo, no real users yet. Success target in the brief: find an equipment's specifications and a linked document from one screen in under 2 minutes.

## Task walkthrough findings

The walkthrough was done by Claude in a local copy of the app with a fake CDF client (ten assets, two equipment items with specifications, three files), in the light theme at 1280 px and at 375 px, and earlier in this round in dark mode. It was not done by the user against real CDF data, so real-data behaviour (long names, odd properties, real file downloads and PDF rendering) is untested. File content cannot be served by the fake client, so the document dialog was seen in its error state with Retry only.

- **Task 1 — Find an asset.** The Assets page has one framed panel: a search bar with a "/" key hint, a list and grid toggle, the results, and a pagination footer with First, Previous, Next, results per page and a "Showing 1–10" range. Opening a row shows a skeleton, then the passport; the Topbar breadcrumb shows the location and the app name returns to the list. No horizontal scroll at 375 px.
- **Task 2 — Read the passport.** A hero card shows the equipment, its parent asset, tags, location and an at-a-glance strip (specifications, documents, equipment). Tabs on the left show the specifications grid; a right column shows key-fact tiles and an equipment list. Choosing another item updated the hero, facts and selection, and the choice is kept in the shared link. On a phone the right column drops below the tabs.
- **Task 3 — Open a document.** The Documents tab lists files with revision, date and origin; the Aura dialog opens with page and zoom controls and a read-only footer.
- **Other states checked:** an asset with no equipment (its own full-width layout with a button to the asset files), a search with no matches, a failed list request, and an equipment item with a single property (the grid fills the row).
- **Defects found and fixed this round:** card edges that blended into the page, an equipment page that looked cut off when it had no key facts, controls of different heights in the toolbar, an invisible active toggle option, and project-convention violations (see the code review).

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 4 | 22 files use Aura components per subpath; the brand colour is set only through token aliases in `src/styles.css` (light and dark); no hard-coded colours in app code. A few token-based utility overrides sit on Aura primitives (`Input`, `Card`, `SegmentedControlList` borders and background), the table is custom because this Aura version has no public table, and the vendored viewer uses inline styles and a fixed annotation palette. | Make `aura/no-overriding-styles` effective, remove the remaining overrides, and replace the viewer's static inline styles. |
| Q2 Navigation & hierarchy | 4 | One Aura Topbar with an interactive breadcrumb, clear page titles, tabs, an equipment list, and page, view, search, tab, file and equipment all restored from the shared link. | Not checked on real data; deep links depend on the host URL state. |
| Q3 Labels & language | 4 | Actions are specific ("Open Feed pump", "Show all assets", "Clear search", "View asset files", "Retry"); controls have accessible names. | The raw view name still appears in the footer note. |
| Q4 Feedback & validation | 4 | Skeletons and loaders while loading, error alerts with Retry, Aura empty states for no assets, no matches, no equipment, no specifications and no files; `ErrorBoundary` around the dashboard; no mutations. | A failed host sync shows a generic message. |
| Q5 Clickability | 5 | No `onClick` on non-interactive elements; rows and cards also contain a real button for the keyboard; hover and focus states come from Aura. | None. |
| Q6 Error prevention | 5 | Read-only app with no destructive actions. | None. |
| Q7 Responsive | 4 | No horizontal scroll at 375 px; the table collapses, the grid reflows, the hero and tiles reflow and the summary column moves below the tabs. | The smallest controls are 28 px tall (breadcrumb button), below the 40 px touch guidance; no check with an on-screen keyboard. |
| Q8 Empty states | 5 | Aura empty states with a hint and, where useful, an action, including a dedicated page for assets without equipment. | None. |
| Q9 Performance | 4 | The PDF viewer and worker load only when a PDF opens; every query has a limit and results are cached; the "/" shortcut and view toggle shorten common tasks. The main bundle is about 772 kB (246 kB gzipped). | Split the main bundle further. |
| Q10 Accessibility | 4 | 33 `aria-label`s, Aura focus rings, decorative icons and avatars hidden from assistive tech, a keyboard shortcut with `aria-keyshortcuts`, and tokens that work in both themes. | No automated axe run; some touch targets are below 40 px; dark-mode contrast was only spot-checked. |

## Summary

- Average score: 4.3
- Quality level: Good

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

None.

## Nice to Fix (any score 3.8 – 4.4)

- Run the walkthrough on real CDF data in Fusion, including a real PDF (Q2, Q7).
- Make the Aura lint rule effective and clear its findings; replace the viewer's inline styles (Q1).
- Raise small controls to 40 px on touch devices and run an axe scan in both themes (Q7, Q10).
- Split the main bundle (Q9).
