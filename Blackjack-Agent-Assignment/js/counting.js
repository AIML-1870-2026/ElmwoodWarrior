// ============================================================
// counting.js — Hi-Lo Card Counting System
// ============================================================

const HI_LO_VALUES = {
  '2': +1, '3': +1, '4': +1, '5': +1, '6': +1,
  '7': 0, '8': 0, '9': 0,
  '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
};

let runningCount = 0;
let cardsDealt = 0;

function updateCount(card) {
  runningCount += HI_LO_VALUES[card.value] ?? 0;
  cardsDealt++;
}

function getTrueCount() {
  const decksRemaining = Math.max(1, (GameState.shoeSize - GameState.cardsDealtFromShoe) / 52);
  return (runningCount / decksRemaining).toFixed(1);
}

function getRunningCount() {
  return runningCount;
}

function resetCount() {
  runningCount = 0;
  cardsDealt = 0;
}

function getCountColor(count) {
  if (count > 0) return 'count-positive';
  if (count < 0) return 'count-negative';
  return 'count-neutral';
}

/**
 * Returns count-based deviation flags for the AI advisor.
 */
function getCountDeviations() {
  const tc = parseFloat(getTrueCount());
  const deviations = [];

  if (tc >= 3) deviations.push("Insurance becomes profitable (TC >= +3)");
  if (tc >= 1) deviations.push("Stand on 16 vs 10 instead of hit (TC >= +1)");
  if (tc >= 4) deviations.push("Stand on 12 vs 3 (TC >= +4)");
  if (tc >= 0) deviations.push("Stand on 12 vs 2 (TC >= 0)");
  if (tc <= -1) deviations.push("Hit on 13 vs 2 (TC <= -1)");
  if (tc >= 2) deviations.push("Double 10 vs 10 (TC >= +2)");
  if (tc >= 5) deviations.push("Double 10 vs A (TC >= +5)");
  if (tc >= 1) deviations.push("Double 9 vs 2 (TC >= +1)");

  return deviations;
}
