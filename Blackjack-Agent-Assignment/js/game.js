// ============================================================
// game.js — Core Game State Machine
// Phases: BETTING -> DEALING -> PLAYER_TURN -> DEALER_TURN -> PAYOUT -> BETTING
// ============================================================

const GameState = {
  phase: 'BETTING',
  shoe: [],
  balance: 1000,
  startingBalance: 1000,
  currentBet: 0,
  lastBet: 0,
  playerHands: [],       // Array of { cards: [], bet: number, stood: bool, doubled: bool, fromSplit: bool }
  activeHandIndex: 0,
  dealerHand: [],
  numDecks: 1,           // Spec says single-deck
  hitSoft17: true,       // Dealer hits on soft 17
  blackjackPays: 1.5,    // 3:2
  insuranceBet: 0,
  handNumber: 0,
  cardsDealtFromShoe: 0,
  shoeSize: 0,
  lastResult: null,
};

function initGame() {
  const saved = localStorage.getItem('bj-agent-balance');
  if (saved && parseInt(saved) > 0) {
    GameState.balance = parseInt(saved);
  }
  GameState.startingBalance = GameState.balance;

  Analytics.reset();
  Analytics.recordBankroll(GameState.balance);

  reshuffleShoe();
  GameState.phase = 'BETTING';
  renderAll();
}

function reshuffleShoe() {
  GameState.shoe = buildShoe(GameState.numDecks);
  GameState.shoeSize = GameState.shoe.length;
  GameState.cardsDealtFromShoe = 0;
  resetCount();
  showMessage('New shoe shuffled');
}

function saveBalance() {
  localStorage.setItem('bj-agent-balance', GameState.balance);
}

function drawCard(faceDown = false) {
  if (GameState.shoe.length === 0) reshuffleShoe();
  const card = GameState.shoe.pop();
  card.faceDown = faceDown;
  GameState.cardsDealtFromShoe++;

  if (!faceDown) {
    updateCount(card);
  }

  return card;
}

function placeBet(amount) {
  if (GameState.phase !== 'BETTING') return;
  if (GameState.balance < amount) return;
  GameState.currentBet += amount;
  GameState.balance -= amount;
  saveBalance();
  audioManager.play('chip-place');
  renderAll();
}

function clearBet() {
  if (GameState.phase !== 'BETTING') return;
  GameState.balance += GameState.currentBet;
  GameState.currentBet = 0;
  saveBalance();
  renderAll();
}

function repeatBet() {
  if (GameState.phase !== 'BETTING') return;
  if (GameState.lastBet === 0) return;
  clearBet();
  const amount = Math.min(GameState.lastBet, GameState.balance);
  if (amount > 0) placeBet(amount);
}

function quickDeal() {
  if (GameState.phase !== 'BETTING') return;
  audioManager.init();

  if (GameState.currentBet <= 0 && GameState.lastBet > 0) {
    repeatBet();
  }

  if (GameState.currentBet > 0) {
    startDeal();
  }
}

// === DEALING PHASE ===
async function startDeal() {
  if (GameState.phase !== 'BETTING') return;
  if (GameState.currentBet <= 0) return;

  // Check reshuffle
  if (GameState.cardsDealtFromShoe >= getCutCardIndex(GameState.shoeSize)) {
    reshuffleShoe();
  }

  GameState.phase = 'DEALING';
  GameState.lastBet = GameState.currentBet;
  GameState.handNumber++;
  GameState.insuranceBet = 0;
  GameState.dealerHand = [];
  GameState.lastResult = null;
  GameState.playerHands = [{
    cards: [],
    bet: GameState.currentBet,
    stood: false,
    doubled: false,
    fromSplit: false,
  }];
  GameState.activeHandIndex = 0;

  clearMessage();
  hideResultBanner();
  renderAll();

  // Deal cards with animation
  await dealCardAnimated(GameState.playerHands[0].cards, false, 0);
  await dealCardAnimated(GameState.dealerHand, false, 500);
  await dealCardAnimated(GameState.playerHands[0].cards, false, 1000);
  await dealCardAnimated(GameState.dealerHand, true, 1500); // Hole card face down

  renderAll();

  // Check for dealer ace -> insurance
  if (GameState.dealerHand[0].value === 'A') {
    GameState.phase = 'INSURANCE';
    showInsuranceModal();
    return;
  }

  // Check for dealer blackjack
  if (isBlackjack(GameState.dealerHand)) {
    await revealDealerHoleCard();
    endRound();
    return;
  }

  // Check for player blackjack
  if (isBlackjack(GameState.playerHands[0].cards)) {
    showMessage('Blackjack!');
    await revealDealerHoleCard();
    endRound();
    return;
  }

  GameState.phase = 'PLAYER_TURN';
  clearMessage();
  renderAll();

  // Auto-fire Level 1 advisor if selected
  autoAdvisorHint();
}

async function dealCardAnimated(handArray, faceDown, delayMs) {
  return new Promise(resolve => {
    setTimeout(() => {
      const card = drawCard(faceDown);
      if (!faceDown) {
        card.faceDown = true;
        card.pendingReveal = true;
      }
      handArray.push(card);
      audioManager.play('card-deal');
      renderAll();

      if (card.pendingReveal) {
        setTimeout(() => {
          card.faceDown = false;
          card.justRevealed = true;
          card.pendingReveal = false;
          audioManager.play('card-flip');
          renderAll();
        }, 350);
      }

      resolve();
    }, delayMs);
  });
}

// === INSURANCE ===
function acceptInsurance() {
  const maxInsurance = Math.floor(GameState.currentBet / 2);
  if (GameState.balance >= maxInsurance) {
    GameState.insuranceBet = maxInsurance;
    GameState.balance -= maxInsurance;
    saveBalance();
  }
  hideModal();
  afterInsurance();
}

function declineInsurance() {
  GameState.insuranceBet = 0;
  hideModal();
  afterInsurance();
}

async function afterInsurance() {
  if (isBlackjack(GameState.dealerHand)) {
    await revealDealerHoleCard();
    showMessage('Dealer has Blackjack!');
    endRound();
    return;
  }

  if (isBlackjack(GameState.playerHands[0].cards)) {
    showMessage('Blackjack!');
    await revealDealerHoleCard();
    endRound();
    return;
  }

  GameState.phase = 'PLAYER_TURN';
  clearMessage();
  renderAll();
  autoAdvisorHint();
}

// === PLAYER ACTIONS ===
let actionLock = false;

async function playerHit() {
  if (GameState.phase !== 'PLAYER_TURN' || actionLock) return;
  actionLock = true;

  const hand = GameState.playerHands[GameState.activeHandIndex];
  const dealerUp = GameState.dealerHand[0];

  // Record decision for analytics
  Analytics.recordDecision(hand.cards, dealerUp, 'Hit', GameState.handNumber);

  // Fire debate mode if enabled
  if (AdvisorSettings.debateMode) fireDebate('Hit');

  await dealNewCard(hand.cards, false);

  if (isBust(hand.cards)) {
    audioManager.play('bust');
    showMessage('Bust!');
    animateBust(GameState.activeHandIndex);
    advanceHand();
  } else if (getHandValue(hand.cards) === 21) {
    hand.stood = true;
    advanceHand();
  } else {
    renderAll();
    autoAdvisorHint();
  }
  actionLock = false;
}

function playerStand() {
  if (GameState.phase !== 'PLAYER_TURN' || actionLock) return;

  const hand = GameState.playerHands[GameState.activeHandIndex];
  const dealerUp = GameState.dealerHand[0];

  Analytics.recordDecision(hand.cards, dealerUp, 'Stand', GameState.handNumber);
  if (AdvisorSettings.debateMode) fireDebate('Stand');

  hand.stood = true;
  advanceHand();
}

async function playerDouble() {
  if (GameState.phase !== 'PLAYER_TURN' || actionLock) return;
  actionLock = true;

  const hand = GameState.playerHands[GameState.activeHandIndex];
  if (hand.cards.length !== 2) { actionLock = false; return; }
  if (GameState.balance < hand.bet) { actionLock = false; return; }

  const dealerUp = GameState.dealerHand[0];
  Analytics.recordDecision(hand.cards, dealerUp, 'Double', GameState.handNumber);
  if (AdvisorSettings.debateMode) fireDebate('Double');

  GameState.balance -= hand.bet;
  hand.bet *= 2;
  hand.doubled = true;
  saveBalance();

  await dealNewCard(hand.cards, false);

  if (isBust(hand.cards)) {
    audioManager.play('bust');
    showMessage('Bust!');
    animateBust(GameState.activeHandIndex);
  }

  hand.stood = true;
  advanceHand();
  actionLock = false;
}

function playerSplit() {
  if (GameState.phase !== 'PLAYER_TURN') return;
  const hand = GameState.playerHands[GameState.activeHandIndex];
  if (!isPair(hand.cards)) return;
  if (GameState.playerHands.length >= 4) return;
  if (GameState.balance < hand.bet) return;

  const dealerUp = GameState.dealerHand[0];
  Analytics.recordDecision(hand.cards, dealerUp, 'Split', GameState.handNumber);
  if (AdvisorSettings.debateMode) fireDebate('Split');

  const card1 = hand.cards[0];
  const card2 = hand.cards[1];

  const newHand1 = { cards: [card1], bet: hand.bet, stood: false, doubled: false, fromSplit: true };
  const newHand2 = { cards: [card2], bet: hand.bet, stood: false, doubled: false, fromSplit: true };

  GameState.balance -= hand.bet;
  saveBalance();

  GameState.playerHands.splice(GameState.activeHandIndex, 1, newHand1, newHand2);

  newHand1.cards.push(drawCard(false));
  audioManager.play('card-deal');
  newHand2.cards.push(drawCard(false));
  audioManager.play('card-deal');

  if (card1.value === 'A') {
    newHand1.stood = true;
    newHand2.stood = true;
    advanceHand();
  }

  renderAll();
  autoAdvisorHint();
}

function advanceHand() {
  let nextIndex = GameState.activeHandIndex + 1;
  while (nextIndex < GameState.playerHands.length) {
    const h = GameState.playerHands[nextIndex];
    if (!h.stood && !isBust(h.cards)) {
      GameState.activeHandIndex = nextIndex;
      showMessage(`Playing hand ${nextIndex + 1}`);
      renderAll();
      autoAdvisorHint();
      return;
    }
    nextIndex++;
  }

  startDealerTurn();
}

// === DEALER TURN ===
async function startDealerTurn() {
  GameState.phase = 'DEALER_TURN';
  showMessage('Dealer reveals...');
  await revealDealerHoleCard();

  const allBusted = GameState.playerHands.every(h => isBust(h.cards));
  if (allBusted) {
    endRound();
    return;
  }

  while (shouldDealerHit(GameState.dealerHand, GameState.hitSoft17)) {
    await delay(300);
    await dealNewCard(GameState.dealerHand, false);
  }

  await delay(400);
  endRound();
}

async function revealDealerHoleCard() {
  const holeCard = GameState.dealerHand.find(c => c.faceDown);
  if (holeCard) {
    holeCard.faceDown = false;
    holeCard.justRevealed = true;
    updateCount(holeCard);
    audioManager.play('card-flip');
    renderAll();
    await delay(600);
  }
}

// === PAYOUT ===
function endRound() {
  GameState.phase = 'PAYOUT';
  const dealerValue = getHandValueAll(GameState.dealerHand);
  const dealerBJ = isBlackjack(GameState.dealerHand);
  const dealerBust = dealerValue > 21;

  let totalWinnings = 0;
  const results = [];

  for (const hand of GameState.playerHands) {
    const playerValue = getHandValue(hand.cards);
    const playerBJ = isBlackjack(hand.cards) && !hand.fromSplit;
    const playerBust = playerValue > 21;

    let result;
    let payout = 0;

    if (playerBust) {
      result = 'BUST';
      payout = 0;
    } else if (playerBJ && dealerBJ) {
      result = 'PUSH';
      payout = hand.bet;
    } else if (playerBJ) {
      result = 'BLACKJACK';
      payout = hand.bet + hand.bet * GameState.blackjackPays;
    } else if (dealerBJ) {
      result = 'LOSE';
      payout = 0;
    } else if (dealerBust) {
      result = 'WIN';
      payout = hand.bet * 2;
    } else if (playerValue > dealerValue) {
      result = 'WIN';
      payout = hand.bet * 2;
    } else if (playerValue === dealerValue) {
      result = 'PUSH';
      payout = hand.bet;
    } else {
      result = 'LOSE';
      payout = 0;
    }

    totalWinnings += payout;
    results.push({ result, payout, hand });
  }

  // Insurance payout
  if (GameState.insuranceBet > 0 && dealerBJ) {
    totalWinnings += GameState.insuranceBet * 3;
  }

  const hasWin = results.some(r => r.result === 'WIN' || r.result === 'BLACKJACK');
  const hasBJ = results.some(r => r.result === 'BLACKJACK');
  const allLost = results.every(r => r.result === 'LOSE' || r.result === 'BUST');
  const hasPush = results.some(r => r.result === 'PUSH');
  const totalBetsIn = results.reduce((sum, r) => sum + r.hand.bet, 0);

  GameState.balance += totalWinnings;
  saveBalance();

  // Analytics
  const primaryResult = hasBJ ? 'BLACKJACK' : (hasWin ? 'WIN' : (hasPush && !allLost ? 'PUSH' : 'LOSE'));
  Analytics.recordHandResult(primaryResult);
  Analytics.recordBankroll(GameState.balance);

  // Display result
  if (hasBJ) {
    GameState.lastResult = 'blackjack';
    showResultBanner('BLACKJACK!', 'blackjack');
    showMessage(`+$${totalWinnings.toLocaleString()}`);
    audioManager.play('blackjack');
    triggerBlackjackEffect();
  } else if (hasWin) {
    GameState.lastResult = 'win';
    showResultBanner('You Win!', 'win');
    showMessage(`+$${totalWinnings.toLocaleString()}`);
    audioManager.play('win');
    triggerWinEffect();
  } else if (hasPush && !allLost) {
    GameState.lastResult = 'push';
    showResultBanner('Push', 'push');
    showMessage('Bet returned');
    audioManager.play('push');
    triggerPushEffect();
  } else {
    GameState.lastResult = 'lose';
    showResultBanner('Dealer Wins', 'lose');
    showMessage(`-$${totalBetsIn.toLocaleString()}`);
    audioManager.play('bust');
  }

  GameState.currentBet = 0;
  renderAll();
  renderAnalytics();
  renderDebrief();

  if (GameState.balance <= 0) {
    setTimeout(() => showRebuyModal(), 1500);
  }

  setTimeout(() => {
    GameState.phase = 'BETTING';
    if (GameState.balance > 0) {
      showMessage('Place your bet or press ENTER to re-deal');
    }
    renderAll();
  }, 2200);
}

function addFreeMoney() {
  GameState.balance += 1000;
  saveBalance();
  showMessage('+$1,000 free chips!');
  renderAll();
}

function rebuy() {
  GameState.balance = 1000;
  saveBalance();
  hideModal();
  GameState.phase = 'BETTING';
  GameState.lastResult = null;
  hideResultBanner();
  renderAll();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dealNewCard(handArray, faceDown = false) {
  const card = drawCard(faceDown);
  if (!faceDown) {
    card.faceDown = true;
    card.pendingReveal = true;
  }
  card.isNew = true;
  handArray.push(card);
  audioManager.play('card-deal');
  renderAll();

  if (card.pendingReveal) {
    await delay(350);
    card.faceDown = false;
    card.justRevealed = true;
    card.pendingReveal = false;
    audioManager.play('card-flip');
    renderAll();
    await delay(350);
  }

  return card;
}

// === AUTO ADVISOR HINT ===
function autoAdvisorHint() {
  if (GameState.phase !== 'PLAYER_TURN') return;
  // Automatically request advice for the current level
  requestAdvisorAdvice();
}

async function requestAdvisorAdvice() {
  const level = AdvisorSettings.level;
  showAdvisorLoading(true);

  try {
    const result = await callAdvisor(level, GameState, AdvisorSettings);
    displayAdvisorResult(result);
  } catch (err) {
    displayAdvisorResult({
      action: 'Error',
      text: `API Error: ${err.message}`,
      confidence: 'low',
      level
    });
  }

  showAdvisorLoading(false);
  updateStrategyGridHighlight();
}

async function fireDebate(playerMove) {
  if (!AdvisorSettings.debateMode) return;

  try {
    const debateText = await callDebate(playerMove, GameState, AdvisorSettings);
    if (debateText) displayDebateResult(debateText);
  } catch (err) {
    // Silently fail on debate
  }
}
