# Tüpfelquiz

Quizlet-style flashcards for the reactions selected by pink row and column headers in `Tüpfeltabelle.xlsx`.

Published site:

https://frostyypanda.github.io/tupfelquiz

## What it does

- Shows a `cation + anion` pair on the front of a card.
- Flips on click to show the product or observation.
- Includes reactions at the intersection of pink-filled column-A rows and pink-filled row-1 columns from `Export important`, read from `RAW`.
- Adds fake cards from blank selected intersections according to the fake percentage entered from `0` to `100`.

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
