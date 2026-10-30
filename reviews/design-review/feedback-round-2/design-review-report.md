# Design Review — Asset Passport — round 2

Round 2 covers the version without signals and with the UI rebuilt from Aura components only.

## User and tasks

- **Primary user:** Maintenance or reliability engineer, or a business viewer, at a desk on a desktop or laptop in Cognite Fusion; read-only (from `App-Brief.md`, an assumed persona).
- **Tasks evaluated:**
  1. Find an asset (browse or search) and open the passport of its equipment.
  2. Read the equipment's identity, tags and specifications on the Overview tab.
  3. Open a linked document from the Documents tab.
- **Context:** Internal demo, no real users yet. Success target in the brief: find an equipment's specifications and a linked document from one screen in under 2 minutes.

## Task walkthrough findings

The walkthrough was done by Claude in a local copy of the app with a fake CDF client (ten assets, two equipment items with specifications, three files), in the light and dark themes, at about 800 px and at 375 px width. It was not done by the user against real CDF data, so real-data behaviour (long names, odd properties, real file downloads and PDF rendering) is untested.

- **Task 1 — Find an asset.** The Assets page shows a header, a search bar and a table with a coloured initials avatar, name, identifier, plant area and description. On a phone the table collapses to the name column with the area under it. Opening a row shows a skeleton while equipment loads, then the passport. The Topbar breadcrumb shows where the user is and the app name returns to the list.
- **Task 2 — Read the passport.** A hero card shows the equipment name, description, location and decorative tag badges (class, system, area, facility), then "key facts" tiles and the full specifications card. With several equipment items a segmented control switches between them and keeps the active tab.
- **Task 3 — Open a document.** The Documents tab lists files with revision, date and origin. Opening one shows an Aura dialog with page and zoom controls and a read-only footer. In the fake client the file download fails, so the dialog showed its error state with Retry; PDF rendering itself was verified in an earlier round only.
- **Defects found and fixed in this round:** the hero content stacked vertically because Aura's `CardContent` is a column by default; document rows did not stretch to the card width; asset names truncated on phones; the header element duplicated the Topbar's banner landmark; two hard-coded colours remained in the viewer's default states.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 5 | 16 files import Aura components per subpath. No theme stylesheet: `src/styles.css` only imports Aura. Colour, type, spacing, gradients and decorative colours come from Aura tokens; no hard-coded hex in app code. The semantic table is custom only because this Aura version has no public table. | The vendored viewer still uses inline layout styles and a fixed annotation colour palette. |
| Q2 Navigation & hierarchy | 4 | One Aura Topbar with an interactive breadcrumb, one way back, tabs for Overview and Documents, a segmented control for equipment, and a clear page title on every screen. | State is host-synced single page, so deep links depend on the host URL; not checked on real data. |
| Q3 Labels & language | 4 | Actions are specific ("Open Feed pump", "Show all assets", "Preview", "Retry", "Clear search"). Search and controls have accessible names. | The list description shows the raw view name `energy_dm.EnergyAsset/v1`. |
| Q4 Feedback & validation | 4 | Skeleton or loader while loading, error alerts with Retry, Aura empty states for no assets, no matches, no equipment, no specifications and no files; `ErrorBoundary` wraps the dashboard; no mutations. | Failed host sync shows a generic message. |
| Q5 Clickability | 5 | No `onClick` on non-interactive elements; rows, buttons and tabs use Aura components with hover and focus states, and rows also have a real button for the keyboard. | None. |
| Q6 Error prevention | 5 | Read-only app with no destructive actions. | None. |
| Q7 Responsive | 4 | Viewport allows zoom; the table adapts to phone width; the hero and tiles reflow; the file dialog is near full-screen on small widths. No horizontal scroll at 375 px. | Aura default controls are 28–36 px tall, below the 40 px touch guidance; the dialog was not tested with an on-screen keyboard. |
| Q8 Empty states | 5 | Aura `EmptyState` with a hint and, where useful, an action for each empty case. | None. |
| Q9 Performance | 4 | The PDF viewer and worker load only when a PDF opens. Main bundle is about 738 kB (236 kB gzipped). Every query has a limit and results are cached; search asks only for the matches a page needs. | Split the main bundle further (the Aura components and motion). |
| Q10 Accessibility | 4 | 22 `aria-label`s, Aura focus rings, zoom allowed, icon buttons have names, decorative avatars and icons are hidden from assistive tech, colours come from tokens that were checked in both light and dark themes. | No automated axe run; touch targets are below 40 px. |

## Summary

- Average score: 4.4
- Quality level: Good

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

None.

## Nice to Fix (any score 3.8 – 4.4)

- Run the walkthrough on real CDF data in Fusion, including a real PDF (Q2, Q7).
- Remove the raw view name from the list description (Q3).
- Split the main bundle (Q9).
- Raise control sizes to 40 px on touch devices and run an axe scan (Q7, Q10).
