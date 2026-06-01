import test from "node:test";
import assert from "node:assert/strict";

import { DECK_DATA, FAKE_CARDS, REAL_CARDS } from "../src/data.js";
import { clampFakePercent, createRng, pickFlashcard, shouldShowFake } from "../src/deck.js";

test("deck uses pink-marked rows and columns from the marker sheet", () => {
  assert.equal(DECK_DATA.source.markerSheet, "Export important");
  assert.equal(DECK_DATA.source.selectedRowRange, "Export important!A2:A29");
  assert.equal(DECK_DATA.source.selectedColumnRange, "Export important!B1:AA1");
  assert.equal(DECK_DATA.source.selectedRows.length, 19);
  assert.equal(DECK_DATA.source.selectedColumns.length, 12);
  assert.equal(REAL_CARDS.length, 82);
  assert.equal(FAKE_CARDS.length, 146);
  assert.equal(DECK_DATA.source.selectedColumns.includes("SO32-"), false);
  assert.ok(REAL_CARDS.some((card) => card.cation === "Ag+" && card.anion === "Cl-"));
  assert.ok(REAL_CARDS.some((card) => card.cation === "Pb2+" && card.anion === "I-"));
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

test("fake chance helper respects empty fake decks and clamped percentages", () => {
  assert.equal(shouldShowFake([], 100, createRng(1)), false);
  assert.equal(shouldShowFake(FAKE_CARDS, 0, createRng(1)), false);
  assert.equal(shouldShowFake(FAKE_CARDS, 100, createRng(1)), true);
});

test("fake card backs say nothing happens", () => {
  const card = pickFlashcard(REAL_CARDS, FAKE_CARDS, 100, createRng(2));

  assert.equal(card.fake, true);
  assert.equal(card.back, "Nothing happens");
});
