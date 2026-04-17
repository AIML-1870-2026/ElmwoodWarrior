// ============================================================
// hand.js — Hand Value Calculation
// ============================================================

function getHandValue(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.faceDown) continue;
    if (['J', 'Q', 'K'].includes(card.value)) total += 10;
    else if (card.value === 'A') { total += 11; aces++; }
    else total += parseInt(card.value);
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function getHandValueAll(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (['J', 'Q', 'K'].includes(card.value)) total += 10;
    else if (card.value === 'A') { total += 11; aces++; }
    else total += parseInt(card.value);
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function isSoft(cards) {
  let total = 0, aces = 0;
  for (const card of cards) {
    if (card.faceDown) continue;
    if (['J', 'Q', 'K'].includes(card.value)) total += 10;
    else if (card.value === 'A') { total += 11; aces++; }
    else total += parseInt(card.value);
  }
  return aces > 0 && total <= 21;
}

function isBust(cards) {
  return getHandValue(cards) > 21;
}

function isBlackjack(cards) {
  return cards.length === 2 && getHandValueAll(cards) === 21;
}

function isPair(cards) {
  if (cards.length !== 2) return false;
  return normalizeValue(cards[0].value) === normalizeValue(cards[1].value);
}

function normalizeValue(value) {
  if (['J', 'Q', 'K'].includes(value)) return 10;
  if (value === 'A') return 11;
  return parseInt(value);
}

/**
 * Returns a human-readable description of a hand for AI prompts.
 */
function describeHand(cards) {
  const values = cards.filter(c => !c.faceDown).map(c => c.value);
  const total = getHandValue(cards);
  const soft = isSoft(cards);
  const pair = isPair(cards);
  let desc = values.join(', ') + ` (total: ${total}`;
  if (soft) desc += ', soft';
  if (pair) desc += ', pair';
  desc += ')';
  return desc;
}
