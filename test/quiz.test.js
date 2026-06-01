import test from "node:test";
import assert from "node:assert/strict";

import { REACTIONS } from "../src/data.js";
import {
  createRng,
  evaluateColorHuntAnswer,
  evaluateReactionAnswer,
  pickColorHuntQuestion,
  reactionPool,
} from "../src/quiz.js";

test("source data includes visible and blank core reaction prompts", () => {
  const core = reactionPool(REACTIONS, { coreOnly: true });
  assert.ok(core.length > 500);
  assert.ok(core.some((reaction) => reaction.outcome === "none"));
  assert.ok(core.some((reaction) => reaction.outcome === "precipitate"));
  assert.ok(core.some((reaction) => reaction.outcome === "solution"));
});

test("reaction answers require the expected outcome and color family", () => {
  const reaction = REACTIONS.find((item) => item.primary === "Ag+" && item.secondary === "Cl-");
  const question = { reaction };

  assert.deepEqual(reaction.colors, ["white", "pink", "gray"]);
  assert.equal(evaluateReactionAnswer(question, { outcome: "precipitate", colors: reaction.colors }).correct, true);
  assert.equal(evaluateReactionAnswer(question, { outcome: "solution", colors: reaction.colors }).correct, false);
  assert.equal(evaluateReactionAnswer(question, { outcome: "precipitate", colors: ["white"] }).correct, false);
});

test("blank source-table cells are accepted as nothing visible", () => {
  const reaction = REACTIONS.find((item) => item.primary === "K+" && item.secondary === "OH-");
  const result = evaluateReactionAnswer({ reaction }, { outcome: "none", colors: [] });

  assert.equal(reaction.observation, "");
  assert.equal(result.correct, true);
});

test("color hunt accepts exactly all expected matches", () => {
  const question = {
    primary: "Fe3+",
    targetColor: "brown",
    matches: ["OH-", "CO32-"],
  };

  assert.equal(evaluateColorHuntAnswer(question, ["CO32-", "OH-"]).correct, true);
  assert.equal(evaluateColorHuntAnswer(question, ["OH-"]).correct, false);
  assert.equal(evaluateColorHuntAnswer(question, ["OH-", "CO32-", "S2-"]).correct, false);
});

test("color hunt can generate fake no-match prompts", () => {
  let fakeQuestion = null;
  for (let seed = 1; seed < 200 && !fakeQuestion; seed += 1) {
    const question = pickColorHuntQuestion(REACTIONS, { allowFakes: true }, createRng(seed));
    if (question.fake) fakeQuestion = question;
  }

  assert.ok(fakeQuestion);
  assert.deepEqual(fakeQuestion.matches, []);
  assert.equal(evaluateColorHuntAnswer(fakeQuestion, []).correct, true);
});
