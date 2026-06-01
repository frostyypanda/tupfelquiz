import test from "node:test";
import assert from "node:assert/strict";

import { FAKE_CARDS, REAL_CARDS } from "../src/data.js";
import { clampFakePercent, createRng, pickFlashcard } from "../src/deck.js";

test("deck only includes the pink-marked real cards", () => {
  assert.equal(REAL_CARDS.length, 4);
  assert.deepEqual(
    REAL_CARDS.map((card) => `${card.cation} + ${card.anion}`),
    ["Ag+ + Cl-", "Fe2+ + NO2-", "Mn2+ + OH-", "Mn2+ + S2-"],
  );
  assert.ok(FAKE_CARDS.length > 500);
});

test("fake percentage is clamped to the 0-100 range", () => {
  assert.equal(clampFakePercent(-20), 0);
  assert.equal(clampFakePercent("45"), 45);
  assert.equal(clampFakePercent(120), 100);
  assert.equal(clampFakePercent("nope"), 0);
});

test("zero percent picks real cards and one hundred percent picks fake cards", () => {
  assert.equal(pickFlashcard(REAL_CARDS, FAKE_CARDS, 0, createRng(1)).fake, false);
  assert.equal(pickFlashcard(REAL_CARDS, FAKE_CARDS, 100, createRng(1)).fake, true);
});

test("fake card backs say nothing happens", () => {
  const card = pickFlashcard(REAL_CARDS, FAKE_CARDS, 100, createRng(2));

  assert.equal(card.fake, true);
  assert.equal(card.back, "Nothing happens");
});
