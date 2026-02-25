// Dealer AI - Hit on Soft 17 Rule
function shouldDealerHit(dealerHand, hitSoft17 = true) {
  const total = getHandValueAll(dealerHand);
  const soft = isSoftAll(dealerHand);

  if (total < 17) return true;
  if (total === 17 && soft && hitSoft17) return true;
  return false;
}

function isSoftAll(cards) {
  let total = 0, aces = 0;
  for (const card of cards) {
    if (['J', 'Q', 'K'].includes(card.value)) total += 10;
    else if (card.value === 'A') { total += 11; aces++; }
    else total += parseInt(card.value);
  }
  return aces > 0 && total <= 21;
}

function getDealerHint(dealerHand, hitSoft17 = true) {
  const visibleCards = dealerHand.filter(c => !c.faceDown);
  const total = getHandValue(visibleCards);
  const soft = isSoft(visibleCards);

  if (visibleCards.length < dealerHand.length) {
    // Hole card hidden
    return '';
  }

  if (total < 17) return 'Dealer must hit';
  if (total === 17 && soft && hitSoft17) return 'Dealer must hit (soft 17)';
  if (total > 21) return 'Dealer busts!';
  return 'Dealer must stand';
}
