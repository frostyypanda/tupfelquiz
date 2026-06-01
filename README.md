# Tüpfelquiz

A static quiz app for practicing qualitative spot-test observations from `Tüpfeltabelle.xlsx`.

Published site:

https://frostyypanda.github.io/tupfelquiz

## Practice modes

- Reaction drill: answer whether a pair gives nothing visible, a solution, a precipitate, or another observation.
- Color hunt: given one ion and one color, select every matching reagent in that row.
- Source table: search the normalized reaction data and compare it with the original observation note.

## Development

```bash
npm test
npm run serve
```

Then open `http://localhost:4173`.

## Data

The app data is generated from the workbook's `RAW` sheet into `src/data.js`.

```bash
python3 tools/build-data.py
```

Blank and whitespace-only cells are normalized as no visible reaction. Cells describing gas, odor, pH, flame color, oxidation, and other non-color clues are classified as `other observation`.
