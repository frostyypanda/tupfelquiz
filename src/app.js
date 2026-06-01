import { DECK_DATA, FAKE_CARDS, REAL_CARDS } from "./data.js";
import { clampFakePercent, pickFlashcard } from "./deck.js";

const STORAGE_KEY = "tupfelquiz:flashcards:v1";

const state = {
  fakePercent: loadFakePercent(),
  card: null,
  flipped: false,
  seen: 0,
  realSeen: 0,
  fakeSeen: 0,
};

const app = document.querySelector("#app");

function init() {
  nextCard();
  render();
  app.addEventListener("click", handleClick);
  app.addEventListener("input", handleInput);
}

function handleClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "flip") state.flipped = !state.flipped;
  if (action === "next") nextCard();
  if (action === "reset") resetSession();
  render();
}

function handleInput(event) {
  if (!["fake-percent", "fake-range"].includes(event.target.id)) return;
  state.fakePercent = clampFakePercent(event.target.value);
  saveFakePercent();
  syncInputs();
  render();
}

function syncInputs() {
  const number = document.querySelector("#fake-percent");
  const range = document.querySelector("#fake-range");
  if (number) number.value = state.fakePercent;
  if (range) range.value = state.fakePercent;
}

function nextCard() {
  state.card = pickFlashcard(REAL_CARDS, FAKE_CARDS, state.fakePercent);
  state.flipped = false;
  state.seen += 1;
  if (state.card.fake) state.fakeSeen += 1;
  else state.realSeen += 1;
}

function resetSession() {
  state.seen = 0;
  state.realSeen = 0;
  state.fakeSeen = 0;
  nextCard();
}

function render() {
  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Pink-marked Tüpfeln cards</p>
        <h1>Tüpfelquiz</h1>
      </div>
      <div class="source-pill">${REAL_CARDS.length} real cards</div>
    </header>
    <main class="layout">
      <section class="study-panel">
        ${renderCard()}
        <div class="actions">
          <button class="primary" data-action="next">Next card</button>
          <button data-action="reset">Reset session</button>
        </div>
      </section>
      <aside class="control-panel">
        ${renderFakeControl()}
        ${renderStats()}
        ${renderCardList()}
      </aside>
    </main>
  `;
}

function renderCard() {
  const sideClass = state.flipped ? "flipped" : "";
  const cardType = state.card.fake ? "Fake" : "Real";
  return `
    <button class="flashcard ${sideClass}" data-action="flip" aria-label="Flip flashcard">
      <span class="card-corner">${cardType}</span>
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

function renderFakeControl() {
  return `
    <section class="panel">
      <label for="fake-percent">
        <span>Fake cards</span>
        <input id="fake-percent" type="number" inputmode="numeric" min="0" max="100" value="${state.fakePercent}">
      </label>
      <input id="fake-range" class="range" type="range" min="0" max="100" value="${state.fakePercent}" aria-label="Fake card percentage">
      <p class="muted">${state.fakePercent}% of new cards will be blank-pair fakes.</p>
    </section>
  `;
}

function renderStats() {
  const fakeRate = state.seen ? Math.round((state.fakeSeen / state.seen) * 100) : 0;
  return `
    <section class="panel stat-grid">
      ${stat("Seen", state.seen)}
      ${stat("Real", state.realSeen)}
      ${stat("Fake", state.fakeSeen)}
      ${stat("Run fake rate", `${fakeRate}%`)}
    </section>
  `;
}

function renderCardList() {
  return `
    <section class="panel">
      <p class="eyebrow">Included from ${escapeHtml(DECK_DATA.source.sheet)}</p>
      <div class="mini-list">
        ${REAL_CARDS.map((card) => `<span>${escapeHtml(card.cation)} + ${escapeHtml(card.anion)}</span>`).join("")}
      </div>
    </section>
  `;
}

function stat(label, value) {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
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
