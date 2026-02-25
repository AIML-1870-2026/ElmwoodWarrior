// Hi-Lo Card Counting System
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
