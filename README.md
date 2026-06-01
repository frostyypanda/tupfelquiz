# Tüpfelquiz

Quizlet-style flashcards for the reactions selected by pink row and column headers in `Tüpfeltabelle.xlsx`.

Published site:

https://frostyypanda.github.io/tupfelquiz

## What it does

- Shows a `cation + anion` pair on the front of a card.
- Flips on click to show the product or observation.
- Includes reactions at the intersection of pink-filled `Export important!A2:A29` rows and pink-filled `Export important!B1:AA1` columns, read from `RAW`.
- Adds fake cards from blank selected intersections according to the fake percentage entered from `0` to `100`.
- After flipping, mark each real card as `Know` or `Don't know`; the next round contains only missed cards.

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
