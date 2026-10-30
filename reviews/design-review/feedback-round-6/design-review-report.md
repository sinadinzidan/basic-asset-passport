# Design Review — Asset Passport — round 6

Round 6 re-checks the UI after commit `a9f8094`, which made repeated patterns and wording uniform (shared loading, retry, file-row, avatar and asset-name components, one missing-value dash, one file-details format, titles without trailing periods), and after `10f1751`, which fixed an accessibility defect that the uniformity work introduced. The design itself is unchanged; the scores are the same as round 5 and were confirmed by the user.

## User and tasks

- **Primary user:** Maintenance or reliability engineer, or a business viewer, at a desk on a desktop or laptop in Cognite Fusion; read-only (from `App-Brief.md`, an assumed persona).
- **Tasks evaluated:**
  1. Find an asset (browse, search, list or grid view) and open the passport of its equipment.
  2. Read the equipment's identity, tags and specifications, and switch between equipment items.
  3. Open a linked document from the Documents tab.
- **Context:** Internal demo, no real users yet. Success target in the brief: find an equipment's specifications and a linked document from one screen in under 2 minutes.

## Task walkthrough findings

The walkthrough was done by Claude in a throwaway local copy of the app with a fake CDF client; it was not done by the user against real CDF data, so real-data behaviour (real property names, real file downloads and PDF rendering) is untested. The fake client cannot serve file content, so the document dialog was seen in its error-with-Retry state only. The throwaway copy was deleted afterwards.

- **Task 1 — Find an asset.** The list and grid views were scanned and the failed-list state was checked. The same row, name and initials components are now used by the table, the grid and the equipment switcher, so a long or blank name behaves the same in all three.
- **Task 2 — Read the passport.** The Overview and Documents tabs were scanned with awkward data (long names and ids, duplicate properties, four equipment items). Loading, empty and retry states now come from shared components, so they look and read the same on every tab.
- **Task 3 — Open a document.** File rows are one component in both the equipment Documents tab and the asset files card (name, id · revision · date · origin, optional description, Preview badge). The preview dialog was opened and its error-with-Retry state checked.
- **Accessibility scan (axe-core 4.14.0, run in the browser on the throwaway copy):**
  - States scanned: asset list, asset grid, passport Overview, passport Documents, the file dialog (error state) and a failed list request, in the dark theme at desktop width; the Documents tab was also scanned in the light theme and at 375 px in both themes, with no horizontal scroll (375 px page width).
  - **One defect found and fixed:** the file-row buttons had an `aria-label` ("Preview <name>") that did not contain their visible text (WCAG 2.5.3, Label in Name). They now take their accessible name from their visible content (`10f1751`); the scan then reported 0 violations in every state above.
  - **A false alarm was ruled out:** one colour-contrast result on the breadcrumb link appeared because the browser pane was hidden and a colour transition was frozen mid-way; with transitions disabled the same element measured correctly and no violation remained.
  - Not covered: states that need real data, the light theme on the other states, and a screen reader.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 4 | 25 files import Aura per component subpath; the brand colour is set only through token aliases in `src/styles.css`; no hard-coded hex in app code. Repeated patterns are now single shared components built from Aura primitives (`Alert`, `Button`, `Loader`, `Badge`) rather than copies. Nine deliberate token-based overrides remain on Aura primitives, and Aura's `no-overriding-styles` lint rule is configured but inert with per-component imports. The asset table is still a custom semantic table although Aura 1.x ships `@cognite/aura/data-grid`. | Make the Aura lint rule effective and clear the remaining nine overrides; evaluate `@cognite/aura/data-grid` (not adopted). |
| Q2 Navigation & hierarchy | 4 | One Aura Topbar with an interactive breadcrumb, clear page titles, tabs, an equipment list, and page, view, search, tab, file and equipment all restored from the shared link; a stale saved page offers "Go to first page". | Not checked on real data; deep links depend on the host URL state. |
| Q3 Labels & language | 4 | No vague button labels (0 hits); actions are specific ("Open Feed pump", "Show all assets", "Clear search", "View asset files", "Go to first page", "Retry"). This round empty-state titles lost their trailing periods and a missing value is always "—". | The raw view name still appears in the footer note. |
| Q4 Feedback & validation | 4 | Skeletons and loaders while loading (one shared loading notice), error alerts with Retry from one shared component, Aura empty states for no assets, no matches, no equipment, no specifications and no files; `ErrorBoundary` around the dashboard; no mutations. A failed host sync still shows a generic message. | Word the sync message more specifically. |
| Q5 Clickability | 5 | No `onClick` on non-interactive `div`, `span`, `li`, `tr` or `td` elements in a single-line probe; whole rows and cards also contain a real button for the keyboard; each file row is one button; hover and focus states come from Aura. | None. |
| Q6 Error prevention | 5 | Read-only app with no destructive actions. | None. |
| Q7 Responsive | 4 | No horizontal scroll at 375 px on the Documents tab in either theme (scanned this round); the table collapses, the grid reflows, the hero and tiles reflow and the summary column moves below the tabs, as verified in round 5 on the other states. | The smallest controls are 28 px tall (breadcrumb, theme button, tabs), below the 40 px touch guidance; not checked with an on-screen keyboard. |
| Q8 Empty states | 5 | Aura empty states with a hint and, where useful, an action, including a dedicated page for assets without equipment. | None. |
| Q9 Performance | 4 | The PDF viewer and worker load only when a PDF opens (442.75 kB, 132.25 kB gzipped, separate chunk); animation features are a separate 47 kB chunk; every query has a limit and results are cached; text previews are cut at 500,000 characters. The main bundle is 690.75 kB (218.05 kB gzipped) and Vite warns about it. | Split the main bundle further. |
| Q10 Accessibility | 4 | 27 `aria-label`s (fewer than before because file rows now take their name from visible text), Aura focus rings, decorative icons and avatars hidden from assistive tech, `aria-keyshortcuts` on the search, images with alt text, and a fresh axe scan with 0 violations on six states after one Label-in-Name defect was found and fixed. | Axe covers only part of WCAG and was run on fake data in a subset of states and themes; some touch targets are below 40 px; no test with a real screen reader. |

## Summary

- Average score: 4.3
- Quality level: Good

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

None.

## Nice to Fix (any score 3.8 – 4.4)

- Run the walkthrough on real CDF data in Fusion, including a real PDF and a real image, in both themes (Q2, Q7).
- Make the Aura lint rule effective and clear the remaining nine overrides; evaluate `@cognite/aura/data-grid` (Q1).
- Raise small controls to 40 px on touch devices; Aura's own 28 px controls would need an upstream change (Q7, Q10).
- Test with a real screen reader and extend the axe scan to the light theme on every state (Q10).
- Split the main bundle further (Q9).
