# Design Review — Asset Passport — round 7

Round 7 re-checks the app for the 1.0.0 production release. No screen changed since round 6; the release changed how shared-link state and CDF properties are validated (Zod), moved navigation into a hook, split the bundle and removed unused dependencies. The only visible addition is an alert when saving the view to the shared link fails. This round adds a walkthrough on real CDF data in Fusion, which round 6 listed as not done.

## User and tasks

- **Primary user:** Maintenance or reliability engineer, or a business viewer, at a desk on a desktop or laptop in Cognite Fusion; read-only (from `App-Brief.md`, an assumed persona).
- **Tasks evaluated:**
  1. Find an asset (browse, search, list or grid view) and open the passport of its equipment.
  2. Read the equipment's identity, tags and specifications, and switch between equipment items.
  3. Open a linked document from the Documents tab.
- **Context:** Internal demo, no real users yet. Success target in the brief: find an equipment's specifications and a linked document from one screen in under 2 minutes.

## Task walkthrough findings

The walkthrough was done by Claude with Claude in Chrome in the user's signed-in Fusion session, against the app running from the working tree (the 1.0.0 code) and real CDF data (`energy_dm`, project `flows-builder`). Round 6's walkthrough used a throwaway copy with a fake CDF client. Not covered live: switching between several equipment items (the asset opened had no equipment), image and text previews, and a screen reader.

- **Task 1 — Find an asset.** The asset list loaded from CDF. Searching for `compressor` returned matching assets and the shared link updated to hold the search. Opening the Home breadcrumb from an asset returned to the same search results.
- **Task 2 — Read the passport.** An asset without equipment opened its dedicated empty page ("No equipment linked to this asset", with a "View asset files" action) and the Documents tab listed the 5 linked files in the same layout as the other tabs.
- **Task 3 — Open a document.** A real PDF (`PH-ME-P-0003-001.pdf`) rendered in the preview dialog with page controls and zoom, and Escape closed it. Reloading the full shared link restored the asset, the Documents tab and the open file.
- **Hand-edited link.** A link with a valid search but a negative page, an unsupported page size and a malformed selection opened the asset list with the search kept and the invalid fields dropped, without an error.
- **Earlier accessibility scan (round 6, axe-core 4.14.0):** 0 violations on six states after one Label-in-Name fix. No screen changed since, so it was not repeated.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 4 | 25 files import Aura per component subpath; the brand colour is set only through token aliases in `src/styles.css`; no hard-coded hex in app code. Repeated patterns are now single shared components built from Aura primitives (`Alert`, `Button`, `Loader`, `Badge`) rather than copies. Nine deliberate token-based overrides remain on Aura primitives, and Aura's `no-overriding-styles` lint rule is configured but inert with per-component imports. The asset table is still a custom semantic table although Aura 1.x ships `@cognite/aura/data-grid`. | Make the Aura lint rule effective and clear the remaining nine overrides; evaluate `@cognite/aura/data-grid` (not adopted). |
| Q2 Navigation & hierarchy | 5 | One Aura Topbar with an interactive breadcrumb, clear page titles, tabs, an equipment list, and page, view, search, tab, file and equipment all restored from the shared link; a stale saved page offers "Go to first page". Round 7: walked on real CDF data in Fusion; the shared link restores asset, tab and file, and a malformed link degrades by dropping only the invalid fields. | Switching between several equipment items and image previews were not checked live; deep links depend on the host URL state. |
| Q3 Labels & language | 4 | No vague button labels (0 hits); actions are specific ("Open Feed pump", "Show all assets", "Clear search", "View asset files", "Go to first page", "Retry"). This round empty-state titles lost their trailing periods and a missing value is always "—". | The raw view name still appears in the footer note. |
| Q4 Feedback & validation | 4 | Skeletons and loaders while loading (one shared loading notice), error alerts with Retry from one shared component, Aura empty states for no assets, no matches, no equipment, no specifications and no files; `ErrorBoundary` around the dashboard; no mutations. A failed host sync still shows a generic message. | Word the sync message more specifically. |
| Q5 Clickability | 5 | No `onClick` on non-interactive `div`, `span`, `li`, `tr` or `td` elements in a single-line probe; whole rows and cards also contain a real button for the keyboard; each file row is one button; hover and focus states come from Aura. | None. |
| Q6 Error prevention | 5 | Read-only app with no destructive actions. | None. |
| Q7 Responsive | 4 | No horizontal scroll at 375 px on the Documents tab in either theme (scanned this round); the table collapses, the grid reflows, the hero and tiles reflow and the summary column moves below the tabs, as verified in round 5 on the other states. | The smallest controls are 28 px tall (breadcrumb, theme button, tabs), below the 40 px touch guidance; not checked with an on-screen keyboard. |
| Q8 Empty states | 5 | Aura empty states with a hint and, where useful, an action, including a dedicated page for assets without equipment. | None. |
| Q9 Performance | 5 | The PDF viewer and worker load only when a PDF opens (442.75 kB, 132.25 kB gzipped, separate chunk); animation features are a separate 47 kB chunk; every query has a limit and results are cached; text previews are cut at 500,000 characters. The main bundle is now 390.91 kB (125 kB gzipped) after splitting `react`, `cognite-sdk` and `data` into their own chunks, and the build no longer warns about chunk size. | None. |
| Q10 Accessibility | 4 | 27 `aria-label`s (fewer than before because file rows now take their name from visible text), Aura focus rings, decorative icons and avatars hidden from assistive tech, `aria-keyshortcuts` on the search, images with alt text, and a fresh axe scan with 0 violations on six states after one Label-in-Name defect was found and fixed. | Axe covers only part of WCAG and was run on fake data in a subset of states and themes; some touch targets are below 40 px; no test with a real screen reader. |

## Summary

- Average score: 4.5
- Quality level: Good

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

None.

## Nice to Fix (any score 3.8 – 4.4)

- Extend the live walkthrough to an asset with several equipment items and to an image preview, in both themes (Q2, Q7).
- Make the Aura lint rule effective and clear the remaining nine overrides; evaluate `@cognite/aura/data-grid` (Q1).
- Raise small controls to 40 px on touch devices; Aura's own 28 px controls would need an upstream change (Q7, Q10).
- Test with a real screen reader and extend the axe scan to the light theme on every state (Q10).
