# Feature: Pink Flashcards

## Status
implemented

## Why this exists
The app helps practice the subset of Tüpfeln reactions selected by pink row and column headers in the source workbook, using a simple flashcard rhythm instead of multiple-choice grading.

## What it does
- Shows one `cation + anion` pair on the front of a card.
- Flips the card on click to reveal the source-table product or observation.
- Includes reactions at intersections where column A and row 1 are filled in `Export important`, with products read from `RAW`.
- Lets the learner enter a fake percentage from `0` to `100`.
- Uses blank intersections from that selected sub-table as fake cards whose answer is "Nothing happens".

## Boundaries & edge cases
- Non-reaction helper rows and helper columns, such as Eigenfarbe, flame color, pH paper, and extra notes, are excluded from real cards and fake cards.
- Pink-marked means a row label in column A or column label in row 1 has a fill in the `Export important` marker sheet.
- If the fake percentage is outside `0` to `100`, the app clamps it back into range.
- The source workbook currently yields 19 selected rows, 13 selected columns, 86 real cards, and 161 fake candidates.

## Testing & verification
- Unit tests cover included cards, fake-rate clamping, forced real/fake selection, and fake card text.
- Browser verification should check flipping, next card, fake percentage input, and responsive layout.

## Decision log
| Date | Decision | Why | Who |
|------|----------|-----|-----|
| 2026-06-01 | Rebuild as click-to-flip flashcards. | The requested workflow is closer to Quizlet recall than graded multiple choice. | Codex |
| 2026-06-01 | Use blank source-table pairs for fake cards. | They preserve realistic ion notation while correctly flipping to no reaction. | Codex |
| 2026-06-01 | Select cards by pink row and column headers instead of pink reaction-cell fills. | The intended marked area is the row/column sub-table, not individual product-cell colors. | Codex |
