# Tüpfelquiz

Quizlet-style flashcards for the pink-marked reactions in `Tüpfeltabelle.xlsx`.

Published site:

https://frostyypanda.github.io/tupfelquiz

## What it does

- Shows a `cation + anion` pair on the front of a card.
- Flips on click to show the product or observation.
- Includes only pink-marked reaction cells from the workbook's `RAW` sheet.
- Adds fake cards from blank table pairs according to the fake percentage entered from `0` to `100`.

## Development

```bash
npm test
npm run serve
```

Then open `http://localhost:4173`.

## Data

The app data is generated into `src/data.js`.

```bash
python3 tools/build-data.py
```
