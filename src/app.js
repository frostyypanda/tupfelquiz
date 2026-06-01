import { REACTIONS } from "./data.js";
import {
  evaluateColorHuntAnswer,
  evaluateReactionAnswer,
  pickColorHuntQuestion,
  pickReactionQuestion,
} from "./quiz.js";
import { renderApp } from "./render.js";

const STORAGE_KEY = "tupfelquiz:v1";

const state = {
  tab: "reaction",
  reactionMode: "all",
  reactionQuestion: null,
  reactionFeedback: null,
  selectedOutcome: null,
  selectedColors: new Set(),
  huntQuestion: null,
  huntFeedback: null,
  selectedHunt: new Set(),
  tableSearch: "",
  tableOutcome: "all",
  tableColor: "all",
  stats: loadStats(),
};

const app = document.querySelector("#app");

function init() {
  nextReaction();
  nextHunt();
  render();
  app.addEventListener("click", handleClick);
  app.addEventListener("input", handleInput);
  app.addEventListener("change", handleInput);
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const { action } = target.dataset;
  if (action === "tab") state.tab = target.dataset.tab;
  if (action === "outcome") selectOutcome(target.dataset.outcome);
  if (action === "color") toggleSetValue(state.selectedColors, target.dataset.color);
  if (action === "hunt-option") toggleSetValue(state.selectedHunt, target.dataset.option);
  if (action === "check-reaction") checkReaction();
  if (action === "check-hunt") checkHunt();
  if (action === "next-reaction") nextReaction();
  if (action === "next-hunt") nextHunt();
  if (action === "reset-stats") resetStats();
  render();
}

function handleInput(event) {
  const { id, value } = event.target;
  if (id === "reaction-mode") {
    state.reactionMode = value;
    nextReaction();
  }
  if (id === "table-search") state.tableSearch = value;
  if (id === "table-outcome") state.tableOutcome = value;
  if (id === "table-color") state.tableColor = value;
  render();
}

function selectOutcome(outcome) {
  state.selectedOutcome = outcome;
  state.reactionFeedback = null;
  if (!["solution", "precipitate"].includes(outcome)) state.selectedColors.clear();
}

function nextReaction() {
  state.reactionQuestion = pickReactionQuestion(REACTIONS, { outcome: state.reactionMode });
  state.reactionFeedback = null;
  state.selectedOutcome = null;
  state.selectedColors.clear();
}

function nextHunt() {
  state.huntQuestion = pickColorHuntQuestion(REACTIONS);
  state.huntFeedback = null;
  state.selectedHunt.clear();
}

function checkReaction() {
  if (!state.selectedOutcome) return;
  const answer = { outcome: state.selectedOutcome, colors: [...state.selectedColors] };
  state.reactionFeedback = evaluateReactionAnswer(state.reactionQuestion, answer);
  record("reaction", state.reactionFeedback.correct);
}

function checkHunt() {
  state.huntFeedback = evaluateColorHuntAnswer(state.huntQuestion, [...state.selectedHunt]);
  record("hunt", state.huntFeedback.correct);
}

function record(kind, correct) {
  const stats = state.stats[kind];
  stats.answered += 1;
  stats.correct += correct ? 1 : 0;
  state.stats.streak = correct ? state.stats.streak + 1 : 0;
  state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
  saveStats();
}

function resetStats() {
  state.stats = defaultStats();
  saveStats();
}

function toggleSetValue(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
  state.reactionFeedback = null;
  state.huntFeedback = null;
}

function render() {
  app.innerHTML = renderApp(state);
}

function loadStats() {
  try {
    return mergeStats(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return defaultStats();
  }
}

function mergeStats(saved) {
  const fallback = defaultStats();
  if (!saved) return fallback;
  return {
    reaction: { ...fallback.reaction, ...saved.reaction },
    hunt: { ...fallback.hunt, ...saved.hunt },
    streak: saved.streak ?? 0,
    bestStreak: saved.bestStreak ?? 0,
  };
}

function saveStats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));
}

function defaultStats() {
  return {
    reaction: { answered: 0, correct: 0 },
    hunt: { answered: 0, correct: 0 },
    streak: 0,
    bestStreak: 0,
  };
}

init();
