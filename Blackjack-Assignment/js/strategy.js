// Basic Strategy Lookup Table & Hint Engine

// H = Hit, S = Stand, D = Double (hit if can't), SP = Split, DS = Double (stand if can't)
// Keys: player total -> { dealer up card: action }

const HARD_STRATEGY = {
  5:  { 2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H' },
  6:  { 2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H' },
  7:  { 2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H' },
  8:  { 2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H' },
  9:  { 2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H' },
  10: { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',11:'H' },
  11: { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'D',11:'D' },
  12: { 2:'H',3:'H',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H' },
  13: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H' },
  14: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H' },
  15: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H' },
  16: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H' },
  17: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S' },
  18: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S' },
  19: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S' },
  20: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S' },
  21: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S' },
};

// Soft totals (Ace counted as 11)
const SOFT_STRATEGY = {
  13: { 2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H' },
  14: { 2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H' },
  15: { 2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H' },
  16: { 2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H' },
  17: { 2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H' },
  18: { 2:'DS',3:'DS',4:'DS',5:'DS',6:'DS',7:'S',8:'S',9:'H',10:'H',11:'H' },
  19: { 2:'S',3:'S',4:'S',5:'S',6:'DS',7:'S',8:'S',9:'S',10:'S',11:'S' },
  20: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S' },
  21: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S' },
};

// Pair splitting (value of one card)
const PAIR_STRATEGY = {
  2:  { 2:'SP',3:'SP',4:'SP',5:'SP',6:'SP',7:'SP',8:'H',9:'H',10:'H',11:'H' },
  3:  { 2:'SP',3:'SP',4:'SP',5:'SP',6:'SP',7:'SP',8:'H',9:'H',10:'H',11:'H' },
  4:  { 2:'H',3:'H',4:'H',5:'SP',6:'SP',7:'H',8:'H',9:'H',10:'H',11:'H' },
  5:  { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',11:'H' },
  6:  { 2:'SP',3:'SP',4:'SP',5:'SP',6:'SP',7:'H',8:'H',9:'H',10:'H',11:'H' },
  7:  { 2:'SP',3:'SP',4:'SP',5:'SP',6:'SP',7:'SP',8:'H',9:'H',10:'H',11:'H' },
  8:  { 2:'SP',3:'SP',4:'SP',5:'SP',6:'SP',7:'SP',8:'SP',9:'SP',10:'SP',11:'SP' },
  9:  { 2:'SP',3:'SP',4:'SP',5:'SP',6:'SP',7:'S',8:'SP',9:'SP',10:'S',11:'S' },
  10: { 2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S' },
  11: { 2:'SP',3:'SP',4:'SP',5:'SP',6:'SP',7:'SP',8:'SP',9:'SP',10:'SP',11:'SP' },
};

function getHint(playerCards, dealerUpCard) {
  const total = getHandValue(playerCards);
  const upVal = normalizeValue(dealerUpCard.value);
  const soft = isSoft(playerCards);
  const pair = isPair(playerCards);

  let action;
  if (pair) {
    const pairVal = normalizeValue(playerCards[0].value);
    action = PAIR_STRATEGY[pairVal]?.[upVal];
  }

  if (!action && soft) {
    action = SOFT_STRATEGY[total]?.[upVal];
  }

  if (!action) {
    action = HARD_STRATEGY[total]?.[upVal];
  }

  return expandAction(action || 'S');
}

function expandAction(code) {
  const map = {
    'H': 'Hit',
    'S': 'Stand',
    'D': 'Double',
    'DS': 'Double (Stand)',
    'SP': 'Split',
  };
  return map[code] || code;
}
