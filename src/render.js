import { REACTION_DATA, REACTIONS } from "./data.js";
import {
  COLORS,
  OUTCOMES,
  formatColors,
  formatOutcome,
  reactionPool,
  summarizeReactions,
} from "./quiz.js";

const MAX_TABLE_ROWS = 220;

export function renderApp(state) {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Tüpfeln practice</p>
        <h1>Tüpfelquiz</h1>
      </div>
      <nav class="tabs" aria-label="Practice modes">
        ${tabButton(state, "reaction", "Reaction")}
        ${tabButton(state, "hunt", "Color hunt")}
        ${tabButton(state, "table", "Table")}
      </nav>
    </header>
    <main class="layout">
      <section class="workspace">${renderActivePanel(state)}</section>
      <aside class="sidebar">${renderStats(state)}${renderSource()}</aside>
    </main>
  `;
}

function renderActivePanel(state) {
  if (state.tab === "hunt") return renderHunt(state);
  if (state.tab === "table") return renderTable(state);
  return renderReaction(state);
}

function renderReaction(state) {
  const question = state.reactionQuestion;
  const reaction = question.reaction;
  return `
    <div class="panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Cation + anion drill</p>
          <h2>${escapeHtml(question.prompt)}</h2>
        </div>
        <label class="select-label">
          <span>Focus</span>
          <select id="reaction-mode">${modeOptions(state.reactionMode)}</select>
        </label>
      </div>
      <div class="question-grid">
        <div class="answer-block">
          <h3>What happens?</h3>
          <div class="outcome-grid">${OUTCOMES.map((outcome) => outcomeButton(state, outcome)).join("")}</div>
        </div>
        <div class="answer-block">
          <h3>Color</h3>
          <div class="color-grid">${COLORS.map((color) => colorButton(state, color)).join("")}</div>
        </div>
      </div>
      <div class="actions">
        <button class="primary" data-action="check-reaction" ${state.selectedOutcome ? "" : "disabled"}>Check</button>
        <button data-action="next-reaction">Next</button>
      </div>
      ${state.reactionFeedback ? renderReactionFeedback(state, reaction) : ""}
    </div>
  `;
}

function renderHunt(state) {
  const question = state.huntQuestion;
  const target = COLORS.find((color) => color.id === question.targetColor);
  return `
    <div class="panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Multi-answer color recall</p>
          <h2>${escapeHtml(question.primary)} gives ${target.label.toLowerCase()}</h2>
        </div>
        <span class="swatch-label" style="--swatch:${target.hex};--ink:${target.ink}">
          ${target.german}
        </span>
      </div>
      <div class="option-grid">
        ${question.options.map((option) => huntOptionButton(state, option)).join("")}
      </div>
      <div class="actions">
        <button class="primary" data-action="check-hunt">Check selected</button>
        <button data-action="next-hunt">Next</button>
      </div>
      ${state.huntFeedback ? renderHuntFeedback(state) : ""}
    </div>
  `;
}

function renderTable(state) {
  const rows = filteredRows(state);
  return `
    <div class="panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Source explorer</p>
          <h2>${rows.length} matching entries</h2>
        </div>
      </div>
      <div class="filters">
        <label><span>Search</span><input id="table-search" value="${escapeAttr(state.tableSearch)}" placeholder="Ag+, gelb, Trübung"></label>
        <label><span>Outcome</span><select id="table-outcome">${modeOptions(state.tableOutcome)}</select></label>
        <label><span>Color</span><select id="table-color">${colorOptions(state)}</select></label>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Pair</th><th>Outcome</th><th>Colors</th><th>Observation</th></tr></thead>
          <tbody>${rows.slice(0, MAX_TABLE_ROWS).map(tableRow).join("")}</tbody>
        </table>
      </div>
      ${rows.length > MAX_TABLE_ROWS ? `<p class="muted">Showing first ${MAX_TABLE_ROWS} matches. Narrow the filters for the rest.</p>` : ""}
    </div>
  `;
}

function renderReactionFeedback(state, reaction) {
  const tone = state.reactionFeedback.correct ? "correct" : "wrong";
  const colorNote = ["solution", "precipitate"].includes(reaction.outcome)
    ? `, ${formatColors(reaction.colors).toLowerCase()}`
    : "";
  return `
    <div class="feedback ${tone}">
      <strong>${state.reactionFeedback.correct ? "Correct." : "Not quite."}</strong>
      <span>Expected ${formatOutcome(reaction.outcome).toLowerCase()}${colorNote}.</span>
      <p>${escapeHtml(reaction.observation || "No visible reaction in the source table.")}</p>
      <small>${escapeHtml(reaction.sourceCell)}</small>
    </div>
  `;
}

function renderHuntFeedback(state) {
  const feedback = state.huntFeedback;
  const tone = feedback.correct ? "correct" : "wrong";
  const expectedText = feedback.expected.length ? feedback.expected.join(", ") : "nothing in this row";
  return `
    <div class="feedback ${tone}">
      <strong>${feedback.correct ? "Correct." : "Not quite."}</strong>
      <span>Expected: ${escapeHtml(expectedText)}.</span>
      ${huntObservationList(state, feedback.expected)}
    </div>
  `;
}

function huntObservationList(state, expected) {
  if (!expected.length) return `<p>This was a fake color prompt: no listed pair matches it.</p>`;
  const rows = expected.map((secondary) => {
    const reaction = REACTIONS.find((item) => item.primary === state.huntQuestion.primary && item.secondary === secondary);
    return `<li><b>${escapeHtml(secondary)}</b>: ${escapeHtml(reaction?.observation ?? "")}</li>`;
  });
  return `<ul class="answer-list">${rows.join("")}</ul>`;
}

function renderStats(state) {
  const total = state.stats.reaction.answered + state.stats.hunt.answered;
  const correct = state.stats.reaction.correct + state.stats.hunt.correct;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  return `
    <div class="panel compact">
      <div class="stat-grid">
        ${stat("Answered", total)}
        ${stat("Accuracy", `${accuracy}%`)}
        ${stat("Streak", state.stats.streak)}
        ${stat("Best", state.stats.bestStreak)}
      </div>
      <button class="ghost full" data-action="reset-stats">Reset stats</button>
    </div>
  `;
}

function renderSource() {
  const core = reactionPool(REACTIONS, { coreOnly: true });
  const counts = summarizeReactions(core);
  return `
    <div class="panel compact">
      <p class="eyebrow">Workbook</p>
      <h3>${escapeHtml(REACTION_DATA.source.workbook)}</h3>
      <dl class="source-list">
        <div><dt>Core pairs</dt><dd>${counts.total}</dd></div>
        <div><dt>Nothing</dt><dd>${counts.none}</dd></div>
        <div><dt>Solutions</dt><dd>${counts.solution}</dd></div>
        <div><dt>Precipitates</dt><dd>${counts.precipitate}</dd></div>
        <div><dt>Other</dt><dd>${counts.other}</dd></div>
      </dl>
    </div>
  `;
}

function tabButton(state, tab, label) {
  return `<button class="${state.tab === tab ? "active" : ""}" data-action="tab" data-tab="${tab}">${label}</button>`;
}

function outcomeButton(state, outcome) {
  const active = state.selectedOutcome === outcome.id ? "active" : "";
  return `<button class="${active}" data-action="outcome" data-outcome="${outcome.id}"><b>${outcome.shortLabel}</b><span>${outcome.detail}</span></button>`;
}

function colorButton(state, color) {
  const active = state.selectedColors.has(color.id) ? "active" : "";
  const disabled = !["solution", "precipitate"].includes(state.selectedOutcome) ? "disabled" : "";
  return `<button class="color-chip ${active}" ${disabled} data-action="color" data-color="${color.id}" style="--swatch:${color.hex};--ink:${color.ink}">${color.label}<small>${color.german}</small></button>`;
}

function huntOptionButton(state, option) {
  const active = state.selectedHunt.has(option.id) ? "active" : "";
  return `<button class="${active}" data-action="hunt-option" data-option="${escapeAttr(option.id)}">${escapeHtml(option.label)}</button>`;
}

function tableRow(reaction) {
  const pair = `${reaction.primary} + ${reaction.secondary}`;
  return `
    <tr>
      <td>${escapeHtml(pair)}</td>
      <td>${escapeHtml(formatOutcome(reaction.outcome))}</td>
      <td>${escapeHtml(formatColors(reaction.colors))}</td>
      <td>${escapeHtml(reaction.observation || "No visible reaction")}</td>
    </tr>
  `;
}

function filteredRows(state) {
  const search = state.tableSearch.toLowerCase().trim();
  return REACTIONS.filter((reaction) => {
    if (state.tableOutcome !== "all" && reaction.outcome !== state.tableOutcome) return false;
    if (state.tableColor !== "all" && !reaction.colors.includes(state.tableColor)) return false;
    if (!search) return true;
    const haystack = `${reaction.primary} ${reaction.secondary} ${reaction.observation}`.toLowerCase();
    return haystack.includes(search);
  });
}

function modeOptions(selected) {
  const all = `<option value="all" ${selected === "all" ? "selected" : ""}>All</option>`;
  const options = OUTCOMES.map((outcome) => `<option value="${outcome.id}" ${selected === outcome.id ? "selected" : ""}>${outcome.shortLabel}</option>`);
  return `${all}${options.join("")}`;
}

function colorOptions(state) {
  const all = `<option value="all" ${state.tableColor === "all" ? "selected" : ""}>All</option>`;
  return all + COLORS.map((color) => `<option value="${color.id}" ${state.tableColor === color.id ? "selected" : ""}>${color.label}</option>`).join("");
}

function stat(label, value) {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
