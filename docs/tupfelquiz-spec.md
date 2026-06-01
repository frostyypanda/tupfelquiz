# Feature: Tüpfelquiz

## Status
implemented

## Why this exists
The app helps practice qualitative spot-test observations from `Tüpfeltabelle.xlsx` without needing to scan the whole matrix every time. The main study need is quick recall of whether a pair does nothing, forms a colored solution, forms a colored precipitate, or produces a different visible clue.

## What it does
- Shows a reaction drill for one source-table pair at a time.
- Samples "nothing visible" prompts at about 20% in the default reaction drill.
- Lets the learner answer the outcome type and, for solutions or precipitates, the observed color set.
- Includes blank source-table pairs as "nothing visible" prompts.
- Shows a color hunt mode where a fixed ion plus target color asks for every matching reagent in that row.
- Sometimes uses color hunt prompts with no matches to practice fake cases.
- Provides a searchable source-table explorer with the original observation text and normalized outcome/color labels.

## Boundaries & edge cases
- Blank and whitespace-only cells are treated as no visible reaction.
- Some workbook cells describe gas, odor, pH, flame color, oxidation, or other notes. These are classified as "other observation" instead of forcing them into solution or precipitate.
- Outcome classification is rule-based because the workbook does not explicitly label every observation as solution or precipitate.
- Color answers use normalized color families, not every modifier from the original note. For example, `gelblich` maps to yellow and `blaugrün` maps to blue plus green.

## Testing & verification
- Unit tests cover reaction answer checking, fake color-hunt prompts, core-pool filtering, and source data sanity.
- Local browser verification should check desktop and mobile layouts, mode switching, answer feedback, and table filtering.

## Decision log
| Date | Decision | Why | Who |
|------|----------|-----|-----|
| 2026-06-01 | Publish as a no-build static ES module app from the repo root. | GitHub Pages can serve it directly at `/tupfelquiz` without a build pipeline. | Codex |
| 2026-06-01 | Keep original observations visible after every answer. | Rule-based classification can simplify training, but the raw note is the source of truth. | Codex |
| 2026-06-01 | Cap default reaction-drill "nothing visible" prompts at about 20%. | Uniform table sampling over-represents blanks and makes practice feel too empty. | Codex |
