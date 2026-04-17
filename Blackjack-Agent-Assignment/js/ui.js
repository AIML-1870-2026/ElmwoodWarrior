// ============================================================
// ui.js — UI Rendering, DOM Manipulation, Event Handlers
// ============================================================

let showCountDisplay = false;
let showDeviationHeatmap = true;
let lastDisplayedBalance = null;

// === CARD IMAGE PATH HELPER ===
const VALUE_TO_NAME = {
  'A': 'ace', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'jack', 'Q': 'queen', 'K': 'king'
};

function getCardImagePath(card) {
  const name = VALUE_TO_NAME[card.value] || card.value;
  return `assets/PNG-cards-1.3/${name}_of_${card.suit}.png`;
}

// === CARD RENDERING (PNG images) ===
function createCardElement(card, dealDelay = 0) {
  const el = document.createElement('div');
  el.className = 'card';

  if (card.justRevealed) {
    el.classList.add('face-down');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.remove('face-down');
        el.classList.add('revealing');
        card.justRevealed = false;
      });
    });
  } else if (card.faceDown) {
    el.classList.add('face-down');
  }

  if (card.isNew) {
    el.classList.add('slide-in');
    card.isNew = false;
  } else if (dealDelay >= 0) {
    el.classList.add('dealing');
    el.style.animationDelay = `${dealDelay}ms`;
  }

  const imgSrc = getCardImagePath(card);

  el.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-front">
        <img src="${imgSrc}" alt="${card.value} of ${card.suit}" class="card-img">
      </div>
      <div class="card-face card-back"></div>
    </div>
  `;
  return el;
}

// === RENDER ALL ===
function renderAll() {
  renderHUD();
  renderDealerHand();
  renderPlayerHands();
  renderControls();
  renderCountDisplay();
  renderShoeIndicator();
  renderDealerHint();
  renderShoeWarning();
}

// === HUD ===
function renderHUD() {
  const balanceEl = document.querySelector('#hud-balance .hud-value');
  const betEl = document.querySelector('#hud-bet .hud-value');
  const handEl = document.querySelector('#hud-hand .hud-value');

  if (balanceEl) {
    const newBalance = GameState.balance;
    if (lastDisplayedBalance !== null && lastDisplayedBalance !== newBalance) {
      animateBalanceChange(balanceEl, lastDisplayedBalance, newBalance);
    } else {
      balanceEl.textContent = `$${newBalance.toLocaleString()}`;
    }
    lastDisplayedBalance = newBalance;
  }
  if (betEl) {
    const betAmount = GameState.currentBet || GameState.lastBet;
    betEl.textContent = GameState.phase === 'BETTING'
      ? `$${GameState.currentBet.toLocaleString()}`
      : `$${betAmount.toLocaleString()}`;
  }
  if (handEl) handEl.textContent = `#${GameState.handNumber}`;

  // Check bankroll-aware auto-shift whenever balance updates
  checkBankrollAutoShift();
}

function animateBalanceChange(el, from, to) {
  const diff = to - from;
  const duration = 600;
  const steps = 20;
  const stepTime = duration / steps;
  let step = 0;

  el.classList.remove('balance-up', 'balance-down');
  el.classList.add(diff > 0 ? 'balance-up' : 'balance-down');

  const interval = setInterval(() => {
    step++;
    const progress = step / steps;
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + diff * eased);
    el.textContent = `$${current.toLocaleString()}`;

    if (step >= steps) {
      clearInterval(interval);
      el.textContent = `$${to.toLocaleString()}`;
      setTimeout(() => {
        el.classList.remove('balance-up', 'balance-down');
      }, 400);
    }
  }, stepTime);
}

// === DEALER HAND ===
function renderDealerHand() {
  const container = document.getElementById('dealer-hand');
  const scoreEl = document.getElementById('dealer-score');
  container.innerHTML = '';

  GameState.dealerHand.forEach((card) => {
    container.appendChild(createCardElement(card, -1));
  });

  const visibleCards = GameState.dealerHand.filter(c => !c.faceDown);
  if (visibleCards.length > 0) {
    const val = getHandValue(visibleCards);
    const allRevealed = GameState.dealerHand.every(c => !c.faceDown);
    scoreEl.textContent = val;
    scoreEl.className = 'score-badge';
    if (allRevealed && val > 21) scoreEl.classList.add('bust');
    if (isBlackjack(GameState.dealerHand) && allRevealed) scoreEl.classList.add('blackjack');
  } else {
    scoreEl.textContent = '';
  }
}

// === PLAYER HANDS ===
function renderPlayerHands() {
  const wrapper = document.getElementById('player-hands');
  wrapper.innerHTML = '';

  GameState.playerHands.forEach((hand, i) => {
    const handWrapper = document.createElement('div');
    handWrapper.className = 'hand-wrapper';
    if (i === GameState.activeHandIndex && GameState.phase === 'PLAYER_TURN') {
      handWrapper.classList.add('active-hand');
    }

    const container = document.createElement('div');
    container.className = 'hand-container';

    hand.cards.forEach((card) => {
      container.appendChild(createCardElement(card, -1));
    });

    handWrapper.appendChild(container);

    const scoreEl = document.createElement('div');
    scoreEl.className = 'score-badge';
    const val = getHandValue(hand.cards);
    if (hand.cards.length > 0) {
      if (isBlackjack(hand.cards) && !hand.fromSplit) {
        scoreEl.textContent = 'BJ';
        scoreEl.classList.add('blackjack');
      } else if (val > 21) {
        scoreEl.textContent = val;
        scoreEl.classList.add('bust');
      } else {
        scoreEl.textContent = val;
        if (isSoft(hand.cards)) scoreEl.textContent += ' (soft)';
      }
    }
    handWrapper.appendChild(scoreEl);

    if (GameState.playerHands.length > 1) {
      const betLabel = document.createElement('div');
      betLabel.className = 'hand-bet-label';
      betLabel.textContent = `$${hand.bet}`;
      handWrapper.appendChild(betLabel);
    }

    wrapper.appendChild(handWrapper);
  });

  if (GameState.playerHands.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'hand-container';
    placeholder.style.minHeight = '120px';
    wrapper.appendChild(placeholder);
  }
}

// === CONTROLS ===
function renderControls() {
  const phase = GameState.phase;
  const hand = GameState.playerHands[GameState.activeHandIndex];

  const sideChips = document.getElementById('side-chips');
  const sideDeal = document.getElementById('side-deal');

  if (phase === 'BETTING') {
    sideChips.classList.remove('hidden');
    sideDeal.classList.remove('hidden');
    document.getElementById('chip-tray').querySelectorAll('.chip').forEach(chip => {
      const val = parseInt(chip.dataset.value);
      chip.disabled = val > GameState.balance;
    });
    document.getElementById('btn-clear').disabled = GameState.currentBet === 0;
    document.getElementById('btn-repeat').disabled = GameState.lastBet === 0 || GameState.lastBet > GameState.balance;
  } else {
    sideChips.classList.add('hidden');
    sideDeal.classList.add('hidden');
  }

  const btnDeal = document.getElementById('btn-deal');
  const btnHit = document.getElementById('btn-hit');
  const btnStand = document.getElementById('btn-stand');
  const btnDouble = document.getElementById('btn-double');
  const btnSplit = document.getElementById('btn-split');
  const btnAdvisor = document.getElementById('btn-advisor');

  btnDeal.style.display = phase === 'BETTING' ? '' : 'none';
  btnDeal.disabled = GameState.currentBet <= 0 && GameState.lastBet <= 0;

  if (phase === 'BETTING' && GameState.currentBet > 0) {
    btnDeal.classList.add('pulse-glow');
  } else {
    btnDeal.classList.remove('pulse-glow');
  }

  const inPlayerTurn = phase === 'PLAYER_TURN';
  btnHit.style.display = inPlayerTurn ? '' : 'none';
  btnStand.style.display = inPlayerTurn ? '' : 'none';
  btnDouble.style.display = inPlayerTurn ? '' : 'none';
  btnSplit.style.display = inPlayerTurn ? '' : 'none';
  btnAdvisor.style.display = inPlayerTurn ? '' : 'none';

  if (inPlayerTurn && hand) {
    btnHit.disabled = false;
    btnStand.disabled = false;
    btnDouble.disabled = hand.cards.length !== 2 || GameState.balance < hand.bet;
    btnSplit.disabled = !isPair(hand.cards) || GameState.playerHands.length >= 4 || GameState.balance < hand.bet;
  }

  const dealLabel = btnDeal.querySelector('.btn-label');
  if (dealLabel) {
    if (GameState.currentBet > 0) {
      dealLabel.textContent = 'Deal';
    } else if (GameState.lastBet > 0) {
      dealLabel.textContent = `Deal ($${GameState.lastBet})`;
    } else {
      dealLabel.textContent = 'Deal';
    }
  }
}

// === COUNT DISPLAY ===
function renderCountDisplay() {
  const el = document.getElementById('count-display');
  if (!showCountDisplay) {
    el.classList.remove('visible');
    return;
  }
  el.classList.add('visible');

  const rc = getRunningCount();
  const tc = getTrueCount();
  const rcColor = getCountColor(rc);
  const tcColor = getCountColor(parseFloat(tc));

  el.innerHTML = `
    <span class="count-item ${rcColor}">RC: ${rc >= 0 ? '+' : ''}${rc}</span>
    <span class="count-item ${tcColor}">TC: ${parseFloat(tc) >= 0 ? '+' : ''}${tc}</span>
  `;
}

// === SHOE INDICATOR ===
function renderShoeIndicator() {
  const fill = document.querySelector('#shoe-indicator .shoe-fill');
  if (!fill) return;
  const pct = GameState.shoeSize > 0
    ? ((GameState.shoeSize - GameState.cardsDealtFromShoe) / GameState.shoeSize * 100)
    : 100;
  fill.style.width = `${pct}%`;
}

// === SHOE WARNING ===
function renderShoeWarning() {
  const container = document.getElementById('shoe-warning');
  if (!container) return;
  const remaining = GameState.shoeSize - GameState.cardsDealtFromShoe;
  const pct = remaining / GameState.shoeSize;
  if (pct < 0.25 && GameState.shoeSize > 0) {
    container.innerHTML = '<div class="shoe-warning">Deck running low — count-based advice less reliable.</div>';
  } else {
    container.innerHTML = '';
  }
}

// === DEALER HINT ===
function renderDealerHint() {
  const el = document.getElementById('dealer-hint');
  if (!el) return;
  if (GameState.phase === 'DEALER_TURN' || GameState.phase === 'PAYOUT') {
    el.textContent = getDealerHint(GameState.dealerHand, GameState.hitSoft17);
  } else {
    el.textContent = '';
  }
}

// === MESSAGE BOX ===
function showMessage(msg) {
  const el = document.getElementById('message-box');
  el.textContent = msg;
  el.style.opacity = '1';
}

function clearMessage() {
  const el = document.getElementById('message-box');
  el.textContent = '';
}

// === RESULT BANNER ===
function showResultBanner(text, type) {
  const banner = document.getElementById('result-banner');
  if (!banner) return;
  banner.textContent = text;
  banner.className = `result-banner visible ${type}`;
}

function hideResultBanner() {
  const banner = document.getElementById('result-banner');
  if (!banner) return;
  banner.className = 'result-banner hidden';
  banner.textContent = '';
}

// === ADVISOR UI ===
function showAdvisorLoading(show) {
  const el = document.getElementById('advisor-loading');
  if (!el) return;
  el.style.display = show ? 'flex' : 'none';
}

function displayAdvisorResult(result) {
  const output = document.getElementById('advice-output');
  if (!output) return;

  output.innerHTML = `
    <div class="advice-header">
      <span class="advice-label">Level ${result.level} Advice</span>
      <span class="confidence-badge ${result.confidence}">${result.confidence}</span>
    </div>
    <div class="advice-text">
      <span class="advice-action">${result.action}</span>
      ${result.text}
    </div>
  `;
}

function displayDebateResult(text) {
  const container = document.getElementById('debate-output');
  if (!container) return;

  // Parse confidence from debate text if present
  let confidence = 'medium';
  const confMatch = text.match(/\[Confidence:\s*(Low|Medium|High|Certain)\]/i);
  if (confMatch) confidence = confMatch[1].toLowerCase();
  const cleanText = text.replace(/\[Confidence:\s*(Low|Medium|High|Certain)\]/i, '').trim();

  container.innerHTML = `
    <div class="debate-output">
      <div class="debate-label">
        Devil's Advocate
        <span class="confidence-badge ${confidence}">${confidence}</span>
      </div>
      <div class="debate-text">${cleanText}</div>
    </div>
  `;
}

function clearAdvisorOutput() {
  const output = document.getElementById('advice-output');
  if (output) {
    output.innerHTML = '<div class="advice-placeholder">Ask for advice during your turn...</div>';
  }
  const debate = document.getElementById('debate-output');
  if (debate) debate.innerHTML = '';
}

// === STRATEGY GRID ===
function renderStrategyGrid() {
  const dealerCols = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const dealerLabels = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
  const colTemplate = `40px repeat(${dealerCols.length}, 1fr)`;

  // --- Hard Totals (5-21) ---
  const hardContainer = document.getElementById('strategy-grid-hard');
  if (hardContainer) {
    const hardRows = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    hardContainer.style.gridTemplateColumns = colTemplate;
    let html = '<div class="sg-cell sg-header"></div>';
    dealerLabels.forEach(l => { html += `<div class="sg-cell sg-header">${l}</div>`; });
    hardRows.forEach(total => {
      html += `<div class="sg-cell sg-header">${total}</div>`;
      dealerCols.forEach(dealerVal => {
        const action = getStrategyCell(total, dealerVal, 'hard');
        const cssClass = getActionCSSClass(action);
        html += `<div class="sg-cell ${cssClass}" id="sg-hard-${total}-${dealerVal}">${action}</div>`;
      });
    });
    hardContainer.innerHTML = html;
  }

  // --- Soft Totals (A+2 through A+10 = soft 13-21) ---
  const softContainer = document.getElementById('strategy-grid-soft');
  if (softContainer) {
    const softRows = [13, 14, 15, 16, 17, 18, 19, 20, 21];
    const softLabels = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9', 'A,10'];
    softContainer.style.gridTemplateColumns = colTemplate;
    let html = '<div class="sg-cell sg-header"></div>';
    dealerLabels.forEach(l => { html += `<div class="sg-cell sg-header">${l}</div>`; });
    softRows.forEach((total, i) => {
      html += `<div class="sg-cell sg-header">${softLabels[i]}</div>`;
      dealerCols.forEach(dealerVal => {
        const action = getStrategyCell(total, dealerVal, 'soft');
        const cssClass = getActionCSSClass(action);
        html += `<div class="sg-cell ${cssClass}" id="sg-soft-${total}-${dealerVal}">${action}</div>`;
      });
    });
    softContainer.innerHTML = html;
  }

  // --- Pairs (2,2 through A,A) ---
  const pairsContainer = document.getElementById('strategy-grid-pairs');
  if (pairsContainer) {
    const pairVals = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const pairLabels = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];
    pairsContainer.style.gridTemplateColumns = colTemplate;
    let html = '<div class="sg-cell sg-header"></div>';
    dealerLabels.forEach(l => { html += `<div class="sg-cell sg-header">${l}</div>`; });
    pairVals.forEach((pairVal, i) => {
      html += `<div class="sg-cell sg-header">${pairLabels[i]}</div>`;
      dealerCols.forEach(dealerVal => {
        const action = getStrategyCell(pairVal, dealerVal, 'pair');
        const cssClass = getActionCSSClass(action);
        html += `<div class="sg-cell ${cssClass}" id="sg-pair-${pairVal}-${dealerVal}">${action}</div>`;
      });
    });
    pairsContainer.innerHTML = html;
  }
}

function getActionCSSClass(action) {
  if (action === 'H') return 'sg-hit';
  if (action === 'S') return 'sg-stand';
  if (action === 'D' || action === 'DS') return 'sg-double';
  if (action === 'SP') return 'sg-split';
  return '';
}

function updateStrategyGridHighlight() {
  // Remove all active highlights
  document.querySelectorAll('.sg-active').forEach(el => el.classList.remove('sg-active'));

  if (GameState.phase !== 'PLAYER_TURN') return;
  const hand = GameState.playerHands[GameState.activeHandIndex];
  if (!hand) return;
  const dealerUp = GameState.dealerHand[0];
  if (!dealerUp) return;

  const total = getHandValue(hand.cards);
  const upVal = normalizeValue(dealerUp.value);
  const soft = isSoft(hand.cards);
  const pair = isPair(hand.cards);

  // Highlight the matching cell in the appropriate grid
  if (pair) {
    const pairVal = normalizeValue(hand.cards[0].value);
    const pairCell = document.getElementById(`sg-pair-${pairVal}-${upVal}`);
    if (pairCell) pairCell.classList.add('sg-active');
  }

  if (soft) {
    const softCell = document.getElementById(`sg-soft-${total}-${upVal}`);
    if (softCell) softCell.classList.add('sg-active');
  }

  const hardCell = document.getElementById(`sg-hard-${total}-${upVal}`);
  if (hardCell) hardCell.classList.add('sg-active');

  // Update deviation heatmap for Level 3/4
  updateDeviationHeatmap();
}

/**
 * Overlay the strategy grid with deviation markers when Level 3/4 is active.
 * Compares count-based deviations against basic strategy and highlights divergent cells.
 */
function updateDeviationHeatmap() {
  // Clear existing deviations
  document.querySelectorAll('.sg-deviation').forEach(el => el.classList.remove('sg-deviation'));

  const level = AdvisorSettings.level;
  if (level < 3 || !showDeviationHeatmap) return; // Only for Counter and Oracle with toggle on

  const tc = parseFloat(getTrueCount());
  const dealerCols = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // Known Hi-Lo count deviations (true count thresholds)
  const deviationMap = [
    { total: 16, dealer: 10, tc: 0,  action: 'S', type: 'hard' },  // Stand 16 vs 10 at TC >= 0
    { total: 15, dealer: 10, tc: 4,  action: 'S', type: 'hard' },  // Stand 15 vs 10 at TC >= +4
    { total: 12, dealer: 2,  tc: 3,  action: 'S', type: 'hard' },  // Stand 12 vs 2 at TC >= +3
    { total: 12, dealer: 3,  tc: 2,  action: 'S', type: 'hard' },  // Stand 12 vs 3 at TC >= +2
    { total: 13, dealer: 2,  tc: -1, action: 'H', type: 'hard', below: true }, // Hit 13 vs 2 at TC <= -1
    { total: 13, dealer: 3,  tc: -2, action: 'H', type: 'hard', below: true }, // Hit 13 vs 3 at TC <= -2
    { total: 10, dealer: 10, tc: 4,  action: 'D', type: 'hard' },  // Double 10 vs 10 at TC >= +4
    { total: 10, dealer: 11, tc: 4,  action: 'D', type: 'hard' },  // Double 10 vs A at TC >= +4
    { total: 9,  dealer: 2,  tc: 1,  action: 'D', type: 'hard' },  // Double 9 vs 2 at TC >= +1
    { total: 9,  dealer: 7,  tc: 3,  action: 'D', type: 'hard' },  // Double 9 vs 7 at TC >= +3
    { total: 11, dealer: 11, tc: 1,  action: 'D', type: 'hard' },  // Double 11 vs A at TC >= +1
  ];

  deviationMap.forEach(dev => {
    const triggered = dev.below ? (tc <= dev.tc) : (tc >= dev.tc);
    if (!triggered) return;

    const basic = getStrategyCell(dev.total, dev.dealer, dev.type);
    if (basic === dev.action) return; // No divergence

    const cellId = `sg-hard-${dev.total}-${dev.dealer}`;
    const cell = document.getElementById(cellId);
    if (cell) cell.classList.add('sg-deviation');
  });
}

// === ANALYTICS RENDERING ===
function renderAnalytics() {
  const el = document.getElementById('analytics-stats');
  if (!el) return;

  const accuracy = Analytics.getAccuracy();
  const ev = Analytics.getSessionEV();
  const decisionEV = Analytics.getDecisionEV();

  el.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">Hands</span>
      <span class="stat-value">${Analytics.handsPlayed}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Won</span>
      <span class="stat-value positive">${Analytics.handsWon}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Lost</span>
      <span class="stat-value negative">${Analytics.handsLost}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Pushed</span>
      <span class="stat-value">${Analytics.handsPushed}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Accuracy</span>
      <span class="stat-value ${accuracy >= 80 ? 'positive' : (accuracy >= 50 ? '' : 'negative')}">${accuracy}%</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">P&L</span>
      <span class="stat-value ${ev >= 0 ? 'positive' : 'negative'}">${ev >= 0 ? '+' : ''}$${ev.toLocaleString()}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Decision EV</span>
      <span class="stat-value ${decisionEV >= 0 ? 'positive' : 'negative'}" title="Estimated EV impact from decision quality vs optimal">${decisionEV >= 0 ? '+' : ''}$${decisionEV.toLocaleString()}</span>
    </div>
  `;

  // Render bankroll chart
  renderBankrollChart();

  // Render mistake log
  renderMistakeLog();
}

function renderBankrollChart() {
  const canvas = document.getElementById('bankroll-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = Analytics.bankrollHistory;

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 80;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (data.length < 2) return;

  const values = data.map(d => d.balance);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.1;
  const range = max - min || 1;

  const w = canvas.width;
  const h = canvas.height;
  const padding = 4;

  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  data.forEach((point, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((point.balance - min) / range) * (h - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  // Fill area under line
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (w - padding * 2);
  ctx.lineTo(lastX, h - padding);
  ctx.lineTo(padding, h - padding);
  ctx.closePath();
  ctx.fillStyle = 'rgba(201, 168, 76, 0.1)';
  ctx.fill();
}

function renderMistakeLog() {
  const el = document.getElementById('mistake-log');
  if (!el) return;

  if (Analytics.mistakeLog.length === 0) {
    el.innerHTML = '<div style="font-size: 0.7rem; color: var(--text-dim); padding: 4px;">No mistakes yet — keep it up!</div>';
    return;
  }

  el.innerHTML = Analytics.mistakeLog.slice(-5).reverse().map(m =>
    `<div class="mistake-entry">${m.message}</div>`
  ).join('');
}

// === POST-HAND DEBRIEF ===
function renderDebrief() {
  const el = document.getElementById('debrief-section');
  if (!el) return;

  const debrief = Analytics.getDebrief();
  if (!debrief || debrief.decisions.length === 0) {
    el.innerHTML = '';
    return;
  }

  let html = `<div class="advisor-section-title">Hand #${debrief.handNumber} Debrief — ${debrief.result}</div>`;
  debrief.decisions.forEach(d => {
    html += `
      <div class="debrief-decision">
        <span class="debrief-badge ${d.rating.toLowerCase()}">${d.rating}</span>
        <span>You chose <strong>${d.playerAction}</strong>${d.isOptimal ? '' : ` (optimal: ${d.optimalAction})`}</span>
      </div>
    `;
  });

  // Show what the Oracle (Level 4) would have done differently, if applicable
  const hasMistakes = debrief.decisions.some(d => !d.isOptimal);
  if (hasMistakes) {
    html += `<div class="debrief-oracle">
      <span class="debrief-oracle-icon">🔮</span>
      <span>The Oracle would have: <strong>${debrief.decisions.filter(d => !d.isOptimal).map(d => `${d.optimalAction} (not ${d.playerAction})`).join(', ')}</strong></span>
    </div>`;
  } else {
    html += `<div class="debrief-oracle perfect">
      <span class="debrief-oracle-icon">✓</span>
      <span>Perfect play — the Oracle agrees with every decision.</span>
    </div>`;
  }

  el.innerHTML = html;
}

// === MODALS ===
function showInsuranceModal() {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  const maxIns = Math.floor(GameState.currentBet / 2);

  content.innerHTML = `
    <div class="modal">
      <h2>Insurance?</h2>
      <p>Dealer shows an Ace. Take insurance for <strong>$${maxIns}</strong>?<br>
      <small>Pays 2:1 if dealer has Blackjack</small></p>
      <div class="modal-buttons">
        <button class="modal-btn modal-btn-yes" onclick="acceptInsurance()">Yes ($${maxIns})</button>
        <button class="modal-btn modal-btn-no" onclick="declineInsurance()">No Thanks</button>
      </div>
    </div>
  `;
  overlay.classList.add('visible');
}

function showRebuyModal() {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <div class="modal">
      <h2>Out of Chips!</h2>
      <p>Your balance has reached $0.<br>Would you like to rebuy for <strong>$1,000</strong>?</p>
      <div class="modal-buttons">
        <button class="modal-btn modal-btn-yes" onclick="rebuy()">Rebuy $1,000</button>
      </div>
    </div>
  `;
  overlay.classList.add('visible');
}

function showSettingsModal() {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <div class="modal settings-modal">
      <h2>Settings</h2>

      <div class="settings-group">
        <label>Number of Decks</label>
        <div class="settings-options" id="deck-options">
          ${[1,2,4,6,8].map(n =>
            `<button class="${GameState.numDecks === n ? 'selected' : ''}"
                     onclick="setSetting('numDecks', ${n})">${n} deck${n > 1 ? 's' : ''}</button>`
          ).join('')}
        </div>
      </div>

      <div class="settings-group">
        <label>Dealer Hits Soft 17</label>
        <div class="settings-toggle" onclick="setSetting('hitSoft17', !GameState.hitSoft17)">
          <div class="toggle-switch ${GameState.hitSoft17 ? 'on' : ''}"></div>
          <span>${GameState.hitSoft17 ? 'H17 — Dealer hits on soft 17' : 'S17 — Dealer stands on soft 17'}</span>
        </div>
      </div>

      <div class="settings-group">
        <label>Blackjack Pays</label>
        <div class="settings-options">
          <button class="${GameState.blackjackPays === 1.5 ? 'selected' : ''}"
                  onclick="setSetting('blackjackPays', 1.5)">3:2 (Better)</button>
          <button class="${GameState.blackjackPays === 1.2 ? 'selected' : ''}"
                  onclick="setSetting('blackjackPays', 1.2)">6:5</button>
        </div>
      </div>

      <div class="settings-group">
        <label>Sound Effects</label>
        <div class="settings-toggle" onclick="toggleSound()">
          <div class="toggle-switch ${!audioManager.muted ? 'on' : ''}"></div>
          <span>${audioManager.muted ? 'Muted' : 'Sound on'}</span>
        </div>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <button class="modal-btn modal-btn-no" onclick="hideModal()">Close</button>
      </div>
    </div>
  `;
  overlay.classList.add('visible');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.remove('visible');
}

function setSetting(key, value) {
  GameState[key] = value;
  if (key === 'numDecks' && GameState.phase === 'BETTING') {
    reshuffleShoe();
  }
  showSettingsModal();
  renderAll();
}

function toggleSound() {
  audioManager.toggleMute();
  showSettingsModal();
}

// === ADVISOR PANEL CONTROLS ===
function setAdvisorLevel(level) {
  AdvisorSettings.level = level;
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
  });
  // Show/hide heatmap toggle for Level 3/4
  const heatmapLabel = document.getElementById('heatmap-toggle-label');
  if (heatmapLabel) heatmapLabel.style.display = level >= 3 ? '' : 'none';
  updateDeviationHeatmap();
  // Re-request advice if in player turn
  if (GameState.phase === 'PLAYER_TURN') {
    requestAdvisorAdvice();
  }
}

function toggleHeatmap() {
  showDeviationHeatmap = document.getElementById('heatmap-toggle')?.checked ?? false;
  updateDeviationHeatmap();
}

function setVerbosity(v) {
  AdvisorSettings.verbosity = v;
  document.querySelectorAll('.verbosity-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.verbosity === v);
  });
}

function setRiskTolerance(r) {
  AdvisorSettings.riskTolerance = r;
  document.querySelectorAll('.risk-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.risk === r);
  });
}

function setPersona(p) {
  AdvisorSettings.persona = p;
  document.querySelectorAll('.persona-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.persona === p);
  });
}

function toggleDebateMode() {
  AdvisorSettings.debateMode = !AdvisorSettings.debateMode;
  const toggle = document.getElementById('debate-toggle');
  if (toggle) {
    toggle.querySelector('.toggle-switch').classList.toggle('on', AdvisorSettings.debateMode);
  }
}

function toggleBankrollAware() {
  AdvisorSettings.bankrollAware = !AdvisorSettings.bankrollAware;
  const toggle = document.getElementById('bankroll-toggle');
  if (toggle) {
    toggle.querySelector('.toggle-switch').classList.toggle('on', AdvisorSettings.bankrollAware);
  }
  checkBankrollAutoShift();
}

/**
 * When bankroll-aware mode is on and balance drops below 20% of starting,
 * auto-shift risk to conservative and lock the UI to show it.
 */
function checkBankrollAutoShift() {
  const warning = document.getElementById('bankroll-warning');
  const riskBtns = document.querySelectorAll('.risk-btn');

  const isCritical = AdvisorSettings.bankrollAware &&
    GameState.balance < GameState.startingBalance * 0.2 &&
    GameState.balance > 0;

  if (isCritical) {
    // Force conservative
    AdvisorSettings.riskTolerance = 'conservative';
    riskBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.risk === 'conservative');
      btn.disabled = true;
      btn.classList.add('locked');
    });
    // Show warning
    if (warning) {
      warning.style.display = '';
      warning.textContent = '⚠ Bankroll critical — auto-shifted to Conservative';
    }
  } else {
    riskBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('locked');
    });
    if (warning) warning.style.display = 'none';
  }
}

function toggleAdvisorPanel() {
  const panel = document.getElementById('advisor-panel');
  panel.classList.toggle('collapsed');
  const btn = document.querySelector('.advisor-toggle-btn');
  if (btn) btn.textContent = panel.classList.contains('collapsed') ? '>' : '<';
}

// === MODEL SELECTOR ===
function populateModelSelector() {
  const select = document.getElementById('model-selector');
  if (!select) return;
  select.innerHTML = '';
  AI_MODELS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.name} (${m.provider})`;
    if (m.id === selectedModelId) opt.selected = true;
    select.appendChild(opt);
  });
}

function handleModelChange(modelId) {
  selectedModelId = modelId;
  const model = getSelectedModel();
  const openaiInput = document.getElementById('api-key-input');
  const anthropicInput = document.getElementById('anthropic-key-input');
  const title = document.getElementById('api-key-title');

  if (model.provider === 'anthropic') {
    if (openaiInput) openaiInput.style.display = 'none';
    if (anthropicInput) anthropicInput.style.display = '';
    if (title) title.textContent = 'Anthropic API Key';
  } else {
    if (openaiInput) openaiInput.style.display = '';
    if (anthropicInput) anthropicInput.style.display = 'none';
    if (title) title.textContent = 'OpenAI API Key';
  }
  updateKeyStatus();
}

// === API KEY HANDLING ===
function handleKeyInput() {
  const input = document.getElementById('api-key-input');
  if (!input) return;
  const val = input.value.trim();
  KeyVault.set(val);
  updateKeyStatus();
}

function handleAnthropicKeyInput() {
  const input = document.getElementById('anthropic-key-input');
  if (!input) return;
  const val = input.value.trim();
  KeyVault.setAnthropic(val);
  updateKeyStatus();
}

function handleKeyFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  KeyVault.loadFromFile(file).then(result => {
    if (result.openai) {
      KeyVault.set(result.openai);
      const input = document.getElementById('api-key-input');
      if (input) input.value = '•'.repeat(result.openai.length);
    }
    if (result.anthropic) {
      KeyVault.setAnthropic(result.anthropic);
      const input = document.getElementById('anthropic-key-input');
      if (input) input.value = '•'.repeat(result.anthropic.length);
    }
    updateKeyStatus();
    // Update the load button to show success
    const btn = document.getElementById('btn-load-env');
    if (btn && (result.openai || result.anthropic)) {
      btn.textContent = '✓ Loaded';
      btn.classList.add('loaded');
      setTimeout(() => {
        btn.textContent = 'Load .env';
        btn.classList.remove('loaded');
      }, 3000);
    }
  });
}

function updateKeyStatus() {
  const el = document.getElementById('key-status');
  if (!el) return;
  const model = getSelectedModel();
  const hasKey = KeyVault.hasForProvider(model.provider);
  const key = KeyVault.getForProvider(model.provider);

  if (hasKey) {
    el.textContent = `Connected ${KeyVault.mask(key)}`;
    el.className = 'key-status connected';
  } else {
    el.textContent = `No ${model.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} key loaded`;
    el.className = 'key-status';
  }
}

// === EVENT LISTENERS ===
function initUI() {
  // Chip clicks
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = parseInt(chip.dataset.value);
      placeBet(val);
    });
  });

  // Bet buttons
  document.getElementById('btn-clear').addEventListener('click', clearBet);
  document.getElementById('btn-repeat').addEventListener('click', repeatBet);

  // Action buttons
  document.getElementById('btn-deal').addEventListener('click', quickDeal);
  document.getElementById('btn-hit').addEventListener('click', playerHit);
  document.getElementById('btn-stand').addEventListener('click', playerStand);
  document.getElementById('btn-double').addEventListener('click', playerDouble);
  document.getElementById('btn-split').addEventListener('click', playerSplit);
  document.getElementById('btn-advisor').addEventListener('click', () => {
    if (GameState.phase === 'PLAYER_TURN') requestAdvisorAdvice();
  });

  // HUD buttons
  document.getElementById('btn-sound').addEventListener('click', () => {
    audioManager.init();
    const muted = audioManager.toggleMute();
    document.getElementById('btn-sound').textContent = muted ? '🔇' : '🔊';
  });

  document.getElementById('btn-count').addEventListener('click', () => {
    showCountDisplay = !showCountDisplay;
    const btn = document.getElementById('btn-count');
    btn.classList.toggle('active', showCountDisplay);
    renderCountDisplay();
  });

  document.getElementById('btn-free-money').addEventListener('click', addFreeMoney);
  document.getElementById('btn-settings').addEventListener('click', showSettingsModal);

  // Export button
  const btnExport = document.getElementById('btn-export');
  if (btnExport) btnExport.addEventListener('click', () => Analytics.exportSession());

  // Advisor level buttons
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => setAdvisorLevel(parseInt(btn.dataset.level)));
  });

  // Verbosity buttons
  document.querySelectorAll('.verbosity-btn').forEach(btn => {
    btn.addEventListener('click', () => setVerbosity(btn.dataset.verbosity));
  });

  // Risk buttons
  document.querySelectorAll('.risk-btn').forEach(btn => {
    btn.addEventListener('click', () => setRiskTolerance(btn.dataset.risk));
  });

  // Persona buttons
  document.querySelectorAll('.persona-btn').forEach(btn => {
    btn.addEventListener('click', () => setPersona(btn.dataset.persona));
  });

  // API keys
  const keyInput = document.getElementById('api-key-input');
  if (keyInput) keyInput.addEventListener('change', handleKeyInput);

  const anthropicKeyInput = document.getElementById('anthropic-key-input');
  if (anthropicKeyInput) anthropicKeyInput.addEventListener('change', handleAnthropicKeyInput);

  const keyFile = document.getElementById('api-key-file');
  if (keyFile) keyFile.addEventListener('change', handleKeyFile);

  // Load .env button triggers the hidden file input
  const btnLoadEnv = document.getElementById('btn-load-env');
  if (btnLoadEnv && keyFile) {
    btnLoadEnv.addEventListener('click', () => keyFile.click());
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('modal-overlay').classList.contains('visible')) return;

    switch (e.key.toLowerCase()) {
      case 'h':
        if (GameState.phase === 'PLAYER_TURN') playerHit();
        break;
      case 's':
        if (GameState.phase === 'PLAYER_TURN') playerStand();
        break;
      case 'd':
        if (GameState.phase === 'PLAYER_TURN') playerDouble();
        break;
      case 'p':
        if (GameState.phase === 'PLAYER_TURN') playerSplit();
        break;
      case 'enter':
      case ' ':
        if (GameState.phase === 'BETTING') {
          e.preventDefault();
          quickDeal();
        }
        break;
    }
  });

  // Initialize advisor panel components
  populateModelSelector();
  handleModelChange(selectedModelId);
  renderStrategyGrid();
  updateKeyStatus();
  renderAnalytics();
}

// === INITIALIZE ===
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initParticles();
  initGame();
});
