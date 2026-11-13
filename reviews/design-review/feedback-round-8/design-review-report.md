# Design Review — Asset Passport — round 8

Round 8 is the first design review of the app as it is now. Since round 7 the app gained notes, document upload and delete, timeseries previews with a chart dialog, the Dalil AI assistant and the HUD theme, so every question was scored again from scratch.

**How this round was done.** The owner asked for the review to go ahead without supplying walkthrough notes from Fusion. The walkthrough below was therefore done by Claude with a scripted browser in **mock mode** (dummy data, no CDF, no assistant). The scores are Claude's proposals from the probes and that walkthrough; the owner has not confirmed them one by one. Nothing in this report was observed on real CDF data.

## User and tasks

- **Primary user:** Maintenance or reliability engineer, or a business viewer, at a desk on a desktop or laptop in Cognite Fusion (from `App-Brief.md`, an assumed persona; the brief was updated this round to cover notes, documents and timeseries).
- **Tasks evaluated:**
  1. Find an asset in the register (browse and search), open it, and read its properties and linked equipment.
  2. Open a timeseries chart and preview a document for that asset.
  3. Add a note, edit or delete it, and upload a document.
- **Context:** Internal demo, no real users yet. Success target in the brief: all of the above in under 3 minutes without leaving the app.

## Task walkthrough findings

Mock mode, Chromium, 1440 × 900, with a second pass at 390 px for overflow.

- **Task 1 — Find and read an asset.** The register loaded 10 rows with Previous / Next paging and a page number. Searching `pump` narrowed it to 5 rows. A row is focusable and opens with Enter as well as by click. The asset page shows its name as the page title, a breadcrumb back to "Assets", status and criticality pills, and tabs with counts. The Equipments tab lists the equipment with its properties. Going back through the breadcrumb kept the search. Not seen: restoring the view from a shared link, which needs the Fusion host.
- **Task 2 — Chart and document.** "Open chart" on a timeseries opened the chart dialog; Escape closed it and focus returned to the button that opened it. Opening the dialog logs one console error from the chart's toolbar (a Base UI component given a non-button element). The document list shows type, upload date and state for each file; the preview dialog opened, but mock mode has no file content, so it showed "Preview is not available here." A real PDF was last rendered in round 7 and, after the `react-pdf` upgrade, in a standalone browser check, not in Fusion.
- **Task 3 — Notes and upload.** "Add note" opens a dialog with a visible "Title*" and "Note" label; "Save note" stays disabled until the title is filled. The saved note appeared at the top of the list and the tab count went from 2 to 3. Editing happens in place in the note card. Delete asks first ("Delete note? … will be deleted permanently. This cannot be undone.") with Cancel. Uploading a file listed it and showed "1 document uploaded."; deleting a document asks first in the same way. Adding, editing and deleting a note show no confirmation message of their own; the list changing is the only feedback.
- **Accessibility scan (axe-core 4, WCAG 2.1 A and AA, both themes, 10 states).** Before fixes: zoom disabled on every screen, a heading inside the grid on the empty search, and a name mismatch on the "Open chart" buttons. All three were fixed this round. After fixes: 0 violations on 9 states in both themes. The chart dialog still has 13–14 low-contrast text nodes (3.78–4.36 against a required 4.5) and one invalid `aria-expanded`.
- **Not covered:** real CDF data, the assistant, a real document preview in Fusion, shared-link restore, a screen reader, a touch device.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 3 | 25 files import Aura per component subpath and every control is an Aura primitive; no raw `rgb`/`hsl` and one hex value in app code; `aura/no-overriding-styles` reports nothing. But the HUD theme restyles those primitives with about 3,470 lines of custom CSS (`src/styles.css`), so the app does not look like stock Aura. Kept on purpose by the owner. | Have the HUD look accepted as a brand deviation, or bring it closer to stock Aura. |
| Q2 Navigation & hierarchy | 5 | Page title, breadcrumb, pills and counted tabs make the location clear on every screen; back keeps the search; dialogs close with Escape and return focus. | Shared-link restore was not seen this round (needs Fusion). |
| Q3 Labels & language | 4 | No vague labels (0 hits); actions are specific ("Add note", "Save note", "Delete document", "Upload documents", "Open chart"); form fields have visible labels. | The Status column's menu button is named "flocStatus options" (a raw property name); the tab reads "Equipments". |
| Q4 Feedback & validation | 4 | Loading, error-with-Retry and empty states on every list; required title marked and Save disabled until valid; upload confirms with a message. | Add, edit and delete of a note give no confirmation message; the 2,000-character limit is stated but no running count is shown in the dialog. |
| Q5 Clickability | 5 | No click handler on a non-interactive element (0 hits); table rows show a pointer and hover state and open with Enter; icon buttons have hover and focus styles. | None. |
| Q6 Error prevention | 5 | Both destructive actions (delete note, delete document) ask first, name the item, say it cannot be undone and offer Cancel. | No undo after a delete. |
| Q7 Responsive | 4 | No horizontal overflow at 390 px on any screen; zoom is no longer disabled; the persona is desktop. | 17 of 18 measured controls are under 40 px tall (smallest 28 px); not tried on a touch device. |
| Q8 Empty states | 5 | Every list (assets, no search match, equipment, timeseries, notes, documents) has an empty state with a title and a hint. | None. |
| Q9 Performance | 5 | Main bundle about 200 kB gzipped; the PDF viewer and the chart load only when opened; every query has a limit, a stale time and bounded retries; each task took a few clicks. | Measured in mock mode only; no timing on real CDF data. |
| Q10 Accessibility | 4 | 0 axe violations on 9 of 10 states in both themes after this round's fixes; rows, tabs and dialogs work from the keyboard and focus returns; images and icon buttons are named. | The chart dialog fails text contrast and has one invalid ARIA attribute; no screen-reader test; small touch targets. |

## Summary

- Average score: 4.4
- Quality level: Good

The result meets the `flows-external-app-submit` gate (3.8 or higher).

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

- Q1: decide on the HUD theme — accepted brand deviation, or closer to stock Aura (`src/styles.css`).

## Nice to Fix (any score 3.8 – 4.4)

- Q10: raise the low-contrast text in the chart dialog to 4.5:1 and remove the invalid `aria-expanded` and the Base UI console error (chart toolbar, `packages/trend-chart`).
- Q3: give the Status column menu a readable name instead of "flocStatus options"; consider "Equipment" for the tab.
- Q4: confirm note add, edit and delete with a message, as upload does; show a character count in the note dialog.
- Q7 / Q10: raise small controls toward 40 px on touch devices.
- Walk the three tasks, the assistant and a shared link on real CDF data in Fusion, and try a screen reader.
