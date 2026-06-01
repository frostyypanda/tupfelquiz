# Feature: Pink Flashcards

## Status
implemented

## Why this exists
The app helps practice the subset of Tüpfeln reactions that are marked pink in the source workbook, using a simple flashcard rhythm instead of multiple-choice grading.

## What it does
- Shows one `cation + anion` pair on the front of a card.
- Flips the card on click to reveal the source-table product or observation.
- Includes only pink-filled reaction cells from the `RAW` sheet.
- Lets the learner enter a fake percentage from `0` to `100`.
- Uses blank source-table pairs as fake cards whose answer is "Nothing happens".

## Boundaries & edge cases
- Non-reaction helper rows and helper columns, such as Eigenfarbe, flame color, pH paper, and extra notes, are excluded from real cards and fake cards.
- Pink-marked means a source cell fill whose RGB hue is between 285 and 345 degrees.
- If the fake percentage is outside `0` to `100`, the app clamps it back into range.
- The source workbook currently yields four pink-marked real cards.

## Testing & verification
- Unit tests cover included cards, fake-rate clamping, forced real/fake selection, and fake card text.
- Browser verification should check flipping, next card, fake percentage input, and responsive layout.

## Decision log
| Date | Decision | Why | Who |
|------|----------|-----|-----|
| 2026-06-01 | Rebuild as click-to-flip flashcards. | The requested workflow is closer to Quizlet recall than graded multiple choice. | Codex |
| 2026-06-01 | Use blank source-table pairs for fake cards. | They preserve realistic ion notation while correctly flipping to no reaction. | Codex |
