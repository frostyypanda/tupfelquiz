# Feature: Pink Flashcards

## Status
implemented

## Why this exists
The app helps practice the subset of Tüpfeln reactions selected by pink row and column headers in the source workbook, using a simple flashcard rhythm instead of multiple-choice grading.

## What it does
- Shows one `cation + anion` pair on the front of a card.
- Flips the card on click to reveal the source-table product or observation.
- Includes reactions at intersections where `Export important!A2:A29` row labels and `Export important!B1:AA1` column labels are filled, with products read from `RAW`.
- Lets the learner enter a fake percentage from `0` to `100`.
- Uses blank intersections from that selected sub-table as fake cards whose answer is "Nothing happens".
- After flipping, lets the learner mark real cards as `Know` or `Don't know`.
- Starts the next round with only the real cards marked `Don't know`.
- Keeps fake cards out of round progress and out of the score counts.

## Boundaries & edge cases
- Non-reaction helper rows and helper columns, such as Eigenfarbe, flame color, pH paper, and extra notes, are excluded from real cards and fake cards.
- Pink-marked means a row label in `A2:A29` or column label in `B1:AA1` has a fill in the `Export important` marker sheet.
- Blank fake cards can appear between real cards, but fake cards should not prevent the learner from eventually advancing through the real-card round.
- If the fake percentage is outside `0` to `100`, the app clamps it back into range.
- The source workbook currently yields 19 selected rows, 12 selected columns, 82 real cards, and 146 fake candidates.

## Testing & verification
- Unit tests cover included cards, marker ranges, fake-rate clamping, forced real/fake selection, and fake card text.
- Browser verification should check flipping, `Know` / `Don't know`, missed-card next rounds, fake percentage input, hidden real/fake labels, and responsive layout.

## Decision log
| Date | Decision | Why | Who |
|------|----------|-----|-----|
| 2026-06-01 | Rebuild as click-to-flip flashcards. | The requested workflow is closer to Quizlet recall than graded multiple choice. | Codex |
| 2026-06-01 | Use blank source-table pairs for fake cards. | They preserve realistic ion notation while correctly flipping to no reaction. | Codex |
| 2026-06-01 | Select cards by pink row and column headers instead of pink reaction-cell fills. | The intended marked area is the row/column sub-table, not individual product-cell colors. | Codex |
| 2026-06-01 | Limit marker detection to `A2:A29` and `B1:AA1`. | The marked exercise area does not include later columns such as `SO32-`. | Codex |
| 2026-06-01 | Use missed-card rounds with `Know` / `Don't know` scoring. | The learner wants Quizlet-style review that narrows to missed reactions. | Codex |
