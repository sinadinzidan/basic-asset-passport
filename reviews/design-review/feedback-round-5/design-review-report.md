# Design Review — Asset Passport — round 5

Round 5 re-checks the UI after commit `13fa7f9`, which fixed layout and edge-case defects found by walking the app with awkward data (very long names and ids, blank values, emoji and right-to-left text, 25 equipment items, 100 files, failing requests). The design itself is unchanged from round 4; the scores are the same and were confirmed by the user.

## User and tasks

- **Primary user:** Maintenance or reliability engineer, or a business viewer, at a desk on a desktop or laptop in Cognite Fusion; read-only (from `App-Brief.md`, an assumed persona).
- **Tasks evaluated:**
  1. Find an asset (browse, search, list or grid view) and open the passport of its equipment.
  2. Read the equipment's identity, tags and specifications, and switch between equipment items.
  3. Open a linked document from the Documents tab.
- **Context:** Internal demo, no real users yet. Success target in the brief: find an equipment's specifications and a linked document from one screen in under 2 minutes.

## Task walkthrough findings

The walkthrough was done by Claude in a throwaway local copy of the app with a fake CDF client, in the dark theme at 1024 px and 375 px. It was not done by the user against real CDF data, so real-data behaviour (real property names, real file downloads and PDF rendering) is untested. The fake client cannot serve file content, so the document dialog was seen in its error-with-Retry state only. The light theme was not re-walked this round and no axe scan was re-run; round 4's scan predates these changes. The throwaway copy was deleted afterwards.

- **Task 1 — Find an asset.** List and grid views, search with no matches, a failed list request and a saved link to a page that no longer exists were checked. Defects found and fixed: long names and ids overflowed the table and made the whole page scroll sideways (including its hidden "Open" header text); a name of only spaces showed an empty row; an initial built from a character outside the Basic Multilingual Plane showed a broken glyph; at 375 px the pagination wrapped "Page 1" and clipped the page-size select; a stale saved page offered only Retry, which repeats the same failure (it now also offers "Go to first page").
- **Task 2 — Read the passport.** Defects found and fixed: long tags, locations and names pushed the hero past the screen edge at 375 px; the Documents count and the hero stat showed 0 while files were still loading or had failed (they now show nothing or "…"); two properties with the same label (`serialNumber`, `serial_number`) gave a duplicate React key and two identical "Serial number" tiles; the 25-item equipment list had no height limit and no note that more may exist.
- **Task 3 — Open a document.** Defects found and fixed: a long file id pushed the Documents tab past the screen edge; a file linked twice from one equipment was listed twice (duplicate key); the 100-file limit was silent; the dialog title and subtitle were truncated with no way to read the full name. Text previews could show a previous file's text, kept stale requests running and had no size limit; images with no intrinsic size could render invisibly.
- **Other states checked:** failed equipment request, failed files request, an asset with no equipment and a blank name, a failed list request.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 4 | 24 files import Aura per component subpath; the brand colour is set only through token aliases in `src/styles.css`; no hard-coded hex in app code and the only rgb values are the annotation palette in the vendored viewer. Nine deliberate token-based overrides remain on Aura primitives (borders on `Card`, `SegmentedControlList` and the dialog header, padding on the hero cards), and Aura's `no-overriding-styles` lint rule is configured but inert with per-component imports. The asset table is a custom semantic table although Aura 1.x ships `@cognite/aura/data-grid`. This round added only utility classes for wrapping and truncation. | Make the Aura lint rule effective and clear the remaining nine overrides; evaluate `@cognite/aura/data-grid` (not adopted). |
| Q2 Navigation & hierarchy | 4 | One Aura Topbar with an interactive breadcrumb, clear page titles, tabs, an equipment list, and page, view, search, tab, file and equipment all restored from the shared link. A saved page that no longer exists now has a way back to the first page. | Not checked on real data; deep links depend on the host URL state. |
| Q3 Labels & language | 4 | No vague button labels (0 hits); actions are specific ("Open Feed pump", "Show all assets", "Clear search", "View asset files", "Go to first page", "Retry"); the one input has an accessible name. | The raw view name still appears in the footer note. |
| Q4 Feedback & validation | 4 | Skeletons and loaders while loading, error alerts with Retry, Aura empty states for no assets, no matches, no equipment, no specifications and no files; `ErrorBoundary` around the dashboard; no mutations. This round a document count is no longer shown as 0 while files load, and a limit that may hide items is now stated. A failed host sync still shows a generic message. | Word the sync message more specifically. |
| Q5 Clickability | 5 | No `onClick` on non-interactive elements except whole rows and cards, which also contain a real button for the keyboard; hover and focus states come from Aura. | None. |
| Q6 Error prevention | 5 | Read-only app with no destructive actions (the only probe hits are "Clear search" and "Reset view"). | None. |
| Q7 Responsive | 4 | No horizontal scroll at 375 px on any state tested after this round's fixes (before them, three states scrolled sideways with long data); the table collapses, the grid reflows, the hero and tiles reflow and the summary column moves below the tabs; the pagination now wraps instead of clipping. | The smallest controls are 28 px tall (breadcrumb, theme button, tabs), below the 40 px touch guidance; not checked with an on-screen keyboard. |
| Q8 Empty states | 5 | Aura empty states with a hint and, where useful, an action, including a dedicated page for assets without equipment. | None. |
| Q9 Performance | 4 | The PDF viewer and worker load only when a PDF opens (442 kB, 132 kB gzipped, separate chunk); animation features are a separate chunk; every query has a limit and results are cached; text previews are cut at 500,000 characters; the "/" shortcut and view toggle shorten common tasks. The main bundle is about 692 kB (218 kB gzipped). | Split the main bundle further. |
| Q10 Accessibility | 4 | 33 `aria-label`s, Aura focus rings, decorative icons and avatars hidden from assistive tech, `aria-keyshortcuts` on the search, both images have alt text (the probe's line-based count misses multi-line tags), no icon-only button without a label, and the muted-text contrast token was fixed in round 4. Full names are now available as tooltips where text is truncated. | Round 4's axe scan (0 violations on 14 states) predates this round's changes and was not re-run; some touch targets are below 40 px; no test with a real screen reader. |

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
- Re-run an axe scan on the current build, and test with a real screen reader (Q10).
- Split the main bundle further (Q9).
