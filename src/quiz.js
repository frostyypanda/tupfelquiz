export const OUTCOMES = [
  {
    id: "none",
    label: "Nothing visible",
    shortLabel: "Nothing",
    detail: "No visible reaction is listed in the source table.",
  },
  {
    id: "solution",
    label: "Solution",
    shortLabel: "Solution",
    detail: "The visible clue is mainly a colored solution or solution change.",
  },
  {
    id: "precipitate",
    label: "Precipitate",
    shortLabel: "Precipitate",
    detail: "The visible clue is mainly a solid, turbidity, or precipitate.",
  },
  {
    id: "other",
    label: "Other observation",
    shortLabel: "Other",
    detail: "Gas, odor, pH, flame color, or another non-precipitate clue.",
  },
];

export const COLORS = [
  { id: "white", label: "White", german: "weiß", hex: "#f8fafc", ink: "#111827" },
  { id: "yellow", label: "Yellow", german: "gelb", hex: "#f7d748", ink: "#111827" },
  { id: "orange", label: "Orange", german: "orange", hex: "#f59e0b", ink: "#111827" },
  { id: "brown", label: "Brown", german: "braun", hex: "#8b5e34", ink: "#ffffff" },
  { id: "red", label: "Red", german: "rot", hex: "#c2410c", ink: "#ffffff" },
  { id: "blue", label: "Blue", german: "blau", hex: "#2563eb", ink: "#ffffff" },
  { id: "green", label: "Green", german: "grün", hex: "#16a34a", ink: "#ffffff" },
  { id: "black", label: "Black", german: "schwarz", hex: "#111827", ink: "#ffffff" },
  { id: "purple", label: "Purple", german: "violett/lila", hex: "#7c3aed", ink: "#ffffff" },
  { id: "pink", label: "Pink", german: "rosa", hex: "#f472b6", ink: "#111827" },
  { id: "gray", label: "Gray", german: "grau", hex: "#94a3b8", ink: "#111827" },
  { id: "turquoise", label: "Turquoise", german: "türkis", hex: "#14b8a6", ink: "#111827" },
];

const CORE_OUTCOMES = new Set(["none", "solution", "precipitate", "other"]);

export function colorById(id) {
  return COLORS.find((color) => color.id === id);
}

export function outcomeById(id) {
  return OUTCOMES.find((outcome) => outcome.id === id);
}

export function createRng(seed = Date.now()) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(items, rng = Math.random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function sameSet(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return leftSet.size === rightSet.size && [...leftSet].every((item) => rightSet.has(item));
}

export function reactionPool(reactions, options = {}) {
  const { outcome = "all", coreOnly = true } = options;
  return reactions.filter((reaction) => {
    if (coreOnly && !reaction.inCoreDrill) return false;
    if (!CORE_OUTCOMES.has(reaction.outcome)) return false;
    return outcome === "all" || reaction.outcome === outcome;
  });
}

export function summarizeReactions(reactions) {
  const counts = { total: reactions.length, none: 0, solution: 0, precipitate: 0, other: 0 };
  for (const reaction of reactions) {
    if (counts[reaction.outcome] !== undefined) counts[reaction.outcome] += 1;
  }
  return counts;
}

export function pickReactionQuestion(reactions, options = {}, rng = Math.random) {
  const pool = reactionPool(reactions, options);
  if (pool.length === 0) {
    throw new Error("No reactions match the selected filters.");
  }
  const reaction = pool[Math.floor(rng() * pool.length)];
  return {
    id: `reaction:${reaction.id}:${Date.now()}`,
    kind: "reaction",
    reaction,
    prompt: `${reaction.primary} + ${reaction.secondary}`,
  };
}

export function evaluateReactionAnswer(question, answer) {
  const reaction = question.reaction;
  const expectedColors = reaction.colors;
  const selectedColors = answer.colors ?? [];
  const outcomeCorrect = answer.outcome === reaction.outcome;
  const needsColor = ["solution", "precipitate"].includes(reaction.outcome);
  const colorsCorrect = !needsColor || sameSet(expectedColors, selectedColors);

  return {
    correct: outcomeCorrect && colorsCorrect,
    outcomeCorrect,
    colorsCorrect,
    expected: {
      outcome: reaction.outcome,
      colors: expectedColors,
      observation: reaction.observation || "No visible reaction",
    },
  };
}

export function pickColorHuntQuestion(reactions, options = {}, rng = Math.random) {
  const pool = reactionPool(reactions, { coreOnly: options.coreOnly ?? true, outcome: "all" });
  const grouped = groupByPrimary(pool);
  const candidates = [...grouped.entries()].filter(
    ([, row]) => row.length >= 8 && new Set(row.flatMap((reaction) => reaction.colors)).size > 0,
  );
  if (candidates.length === 0) {
    throw new Error("No color hunt rows are available.");
  }

  const [primary, row] = candidates[Math.floor(rng() * candidates.length)];
  const rowColors = new Set(row.flatMap((reaction) => reaction.colors));
  const fakeColors = COLORS.map((color) => color.id).filter((id) => !rowColors.has(id));
  const useFake = options.allowFakes !== false && fakeColors.length > 0 && rng() < 0.28;
  const targetColor = useFake
    ? fakeColors[Math.floor(rng() * fakeColors.length)]
    : [...rowColors][Math.floor(rng() * rowColors.size)];
  const matches = row.filter((reaction) => reaction.colors.includes(targetColor));

  return {
    id: `hunt:${primary}:${targetColor}:${Date.now()}`,
    kind: "color-hunt",
    primary,
    targetColor,
    fake: matches.length === 0,
    options: row.map((reaction) => ({
      id: reaction.secondary,
      label: reaction.secondary,
      reactionId: reaction.id,
      outcome: reaction.outcome,
      observation: reaction.observation,
    })),
    matches: matches.map((reaction) => reaction.secondary),
  };
}

export function evaluateColorHuntAnswer(question, selectedIds) {
  const expected = question.matches;
  const selected = selectedIds ?? [];
  return {
    correct: sameSet(expected, selected),
    missed: expected.filter((id) => !selected.includes(id)),
    extras: selected.filter((id) => !expected.includes(id)),
    expected,
  };
}

export function formatColors(colorIds) {
  if (!colorIds.length) return "no color";
  return colorIds.map((id) => colorById(id)?.label ?? id).join(", ");
}

export function formatOutcome(outcomeId) {
  return outcomeById(outcomeId)?.label ?? outcomeId;
}

function groupByPrimary(reactions) {
  const grouped = new Map();
  for (const reaction of reactions) {
    if (!grouped.has(reaction.primary)) grouped.set(reaction.primary, []);
    grouped.get(reaction.primary).push(reaction);
  }
  return grouped;
}
