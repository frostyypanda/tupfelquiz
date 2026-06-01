import { DECK_DATA, FAKE_CARDS, REAL_CARDS } from "./data.js?v=20260601-ranges";
import {
  clampFakePercent,
  makeRealCard,
  pickFakeCard,
  shouldShowFake,
  shuffle,
} from "./deck.js?v=20260601-ranges";

const STORAGE_KEY = "tupfelquiz:flashcards:v2";

const state = {
  fakePercent: loadFakePercent(),
  round: 0,
  roundCards: [],
  currentIndex: 0,
  known: 0,
  missed: 0,
  missedCards: [],
  card: null,
  flipped: false,
  finished: false,
  lastWasFake: false,
};

const app = document.querySelector("#app");

function init() {
  startRound(REAL_CARDS);
  app.addEventListener("click", handleClick);
  app.addEventListener("input", handleInput);
}

function handleClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "flip" && state.card) state.flipped = true;
  if (action === "know") gradeCurrent(true);
  if (action === "miss") gradeCurrent(false);
  if (action === "reset") startRound(REAL_CARDS, 1);
  render();
}

function handleInput(event) {
  if (!["fake-percent", "fake-range"].includes(event.target.id)) return;
  state.fakePercent = clampFakePercent(event.target.value);
  saveFakePercent();
  syncInputs();
  render();
}

function startRound(cards, round = state.round + 1) {
  state.round = round;
  state.roundCards = shuffle(cards);
  state.currentIndex = 0;
  state.known = 0;
  state.missed = 0;
  state.missedCards = [];
  state.finished = false;
  state.lastWasFake = false;
  drawCard();
  render();
}

function drawCard() {
  state.flipped = false;
  if (state.currentIndex >= state.roundCards.length) {
    finishRound();
    return;
  }
  const useFake = !state.lastWasFake && shouldShowFake(FAKE_CARDS, state.fakePercent);
  state.card = useFake ? pickFakeCard(FAKE_CARDS) : makeRealCard(state.roundCards[state.currentIndex]);
  state.lastWasFake = state.card.fake;
}

function gradeCurrent(knows) {
  if (!state.flipped || !state.card || state.finished) return;
  if (!state.card.fake) {
    const sourceCard = state.roundCards[state.currentIndex];
    state.currentIndex += 1;
    if (knows) state.known += 1;
    else {
      state.missed += 1;
      state.missedCards.push(sourceCard);
    }
  }
  drawCard();
}

function finishRound() {
  if (state.missedCards.length > 0) {
    startRound(state.missedCards, state.round + 1);
    return;
  }
  state.card = null;
  state.finished = true;
}

function render() {
  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Pink-marked Tüpfeln cards</p>
        <h1>Tüpfelquiz</h1>
      </div>
      <div class="source-pill">${REAL_CARDS.length} cards</div>
    </header>
    <main class="layout">
      <section class="study-panel">
        ${state.finished ? renderDone() : renderCard()}
        ${renderActions()}
      </section>
      <aside class="control-panel">
        ${renderFakeControl()}
        ${renderStats()}
        ${renderSource()}
      </aside>
    </main>
  `;
}

function renderCard() {
  const sideClass = state.flipped ? "flipped" : "";
  return `
    <button class="flashcard ${sideClass}" data-action="flip" aria-label="Flip flashcard">
      <span class="card-face card-front">
        <span>Cation + anion</span>
        <strong>${escapeHtml(state.card.front)}</strong>
      </span>
      <span class="card-face card-back">
        <span>Product</span>
        <strong>${escapeHtml(state.card.back)}</strong>
        <small>${escapeHtml(state.card.sourceCell)}</small>
      </span>
    </button>
  `;
}

function renderDone() {
  return `
    <div class="flashcard done-card">
      <span class="card-face">
        <span>Round complete</span>
        <strong>All known</strong>
      </span>
    </div>
  `;
}

function renderActions() {
  if (state.finished) {
    return `<div class="actions"><button class="primary" data-action="reset">Restart all cards</button></div>`;
  }
  return `
    <div class="actions">
      <button class="primary" data-action="know" ${state.flipped ? "" : "disabled"}>Know</button>
      <button data-action="miss" ${state.flipped ? "" : "disabled"}>Don't know</button>
      <button data-action="reset">Reset</button>
    </div>
  `;
}

function renderFakeControl() {
  return `
    <section class="panel">
      <label for="fake-percent">
        <span>Fake cards</span>
        <input id="fake-percent" type="number" inputmode="numeric" min="0" max="100" value="${state.fakePercent}">
      </label>
      <input id="fake-range" class="range" type="range" min="0" max="100" value="${state.fakePercent}" aria-label="Fake card percentage">
      <p class="muted">${state.fakePercent}% fake-card chance.</p>
    </section>
  `;
}

function renderStats() {
  return `
    <section class="panel stat-grid">
      ${stat(`Round ${state.round}`, `${state.currentIndex}/${state.roundCards.length}`)}
      ${stat("Know", state.known)}
      ${stat("Don't know", state.missed)}
      ${stat("Next round", state.missedCards.length)}
    </section>
  `;
}

function renderSource() {
  return `
    <section class="panel">
      <p class="eyebrow">Marked in ${escapeHtml(DECK_DATA.source.markerSheet)}</p>
      <p class="muted">${DECK_DATA.source.selectedRows.length} rows x ${DECK_DATA.source.selectedColumns.length} columns from ${escapeHtml(DECK_DATA.source.selectedRowRange)} and ${escapeHtml(DECK_DATA.source.selectedColumnRange)}, read from ${escapeHtml(DECK_DATA.source.sheet)}.</p>
    </section>
  `;
}

function stat(label, value) {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

function syncInputs() {
  const number = document.querySelector("#fake-percent");
  const range = document.querySelector("#fake-range");
  if (number) number.value = state.fakePercent;
  if (range) range.value = state.fakePercent;
}

function loadFakePercent() {
  try {
    return clampFakePercent(localStorage.getItem(STORAGE_KEY) ?? 20);
  } catch {
    return 20;
  }
}

function saveFakePercent() {
  try {
    localStorage.setItem(STORAGE_KEY, String(state.fakePercent));
  } catch {
    // Storage can be unavailable in strict browser modes; the quiz still works.
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

init();
