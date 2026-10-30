# Design Review — Asset Passport — round 1

## User and tasks

- **Primary user:** Maintenance or reliability engineer, or a business viewer, at a desk on a desktop or laptop in Cognite Fusion; read-only (from `App-Brief.md`, an assumed persona).
- **Tasks evaluated:**
  1. Find an asset and open the passport of its equipment.
  2. Read live signals for that equipment and open one signal for its detail.
  3. Open a linked document from the Documents tab.
- **Context:** Internal demo, no real users yet. Success target in the brief: find specifications, a live signal and a document from one screen in under 2 minutes.

## Task walkthrough findings

The walkthrough was done by Claude in a local copy of the app with a fake CDF client (three assets, one equipment item, three signals, one file), at 800x600 and 390 px width. It was not done by the user against real CDF data, so real-data behaviour (long names, odd properties, real file downloads) is untested.

- **Task 1 — Find an asset.** The list, search box and pager are clear; selecting a row opens the equipment passport with a back button and a breadcrumb. No dead ends.
- **Task 2 — Read signals.** Signals shows simple cards (value, unit, last reading, 24-hour trend). "View details" opens a dialog with its own range switch, statistics, chart and table. No overflow at 390 px.
- **Task 3 — Open a document.** Documents lists the linked file with revision and date. Opening it needs a real CDF file; in the fake client the file lookup fails and the dialog shows an error state, so PDF rendering was not seen.
- **Defects found and fixed in this round:** text at 9–11 px (below the 12 px metadata size in `SPEC.md`), about 60 hard-coded hex colours including a leftover lavender palette in `styles.css`, and a viewport tag that disabled pinch zoom.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 4 | 11 files import Aura components per subpath. All hex colours now sit in token definitions (`--passport-*`) and Aura semantic tokens are remapped in one place. | Reduce the number of CSS overrides on Aura components. |
| Q2 Navigation & hierarchy | 4 | Breadcrumb, back button, page title and tab bar always show where the user is. State is host-synced so reload and shared links restore the view. | A single-page app with no routes; deep links depend on the host URL state. |
| Q3 Labels & language | 4 | Actions are specific ("Show all assets", "Find signals", "Retry"). Both search inputs have `aria-label`. | The kicker "THE EQUIPMENT DNA" and raw view names in the disclosure line are jargon. |
| Q4 Feedback & validation | 4 | Every fetch has loading, error-with-retry and empty states; `ErrorBoundary` wraps the dashboard; no mutations. | Chart loading shows plain text rather than a skeleton. |
| Q5 Clickability | 4 | 0 `onClick` on non-interactive elements except the signal card, which also has a real "View details" button. Hover and focus states exist. | Make the card itself a keyboard-focusable control or drop its click handler. |
| Q6 Error prevention | 5 | Read-only app with no destructive actions. | None. |
| Q7 Responsive | 4 | Viewport tag allows zoom, media queries at tablet and phone, no horizontal scroll at 390 px, table stacks on phones. | Controls are 36 px tall, below the 40 px touch guidance. |
| Q8 Empty states | 5 | One shared `EmptyState` covers no assets, no matches, no equipment, no specifications, no signals, no readings and no files, each with a hint and an action where one helps. | None. |
| Q9 Performance | 4 | Chart, file viewer and dialogs are lazy-loaded. Main bundle is about 722 kB (about 228 kB gzipped); the 1.4 MB PDF worker loads only when a PDF opens. Every query has a limit and results are cached. | Split the main bundle further. |
| Q10 Accessibility | 4 | 25 `aria-label`s, focus-visible styles, pinch zoom enabled, no text under 12 px after the fix, status regions announce empty states. | The Aura chart tooltip label has 3.7:1 contrast; tap targets are 36 px. |

## Summary

- Average score: 4.2
- Quality level: Good

## Must Fix (any score < 3)

- None.

## Should Fix (any score 3 – 3.7)

- None.

## Nice to Fix (any score 3.8 – 4.4)

- Q1: fewer CSS overrides on Aura components.
- Q3: replace "THE EQUIPMENT DNA" and raw view names with plain wording.
- Q4: skeleton for the chart loading state.
- Q5: make the signal card keyboard-focusable or remove its click handler.
- Q7 / Q10: raise control height to 40 px and fix the chart tooltip contrast.
- Q9: split the main bundle.
- Real-data walkthrough by the user, including opening a PDF.
