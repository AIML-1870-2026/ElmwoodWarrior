// UI Rendering & DOM Manipulation

let showCountDisplay = false;
let hintVisible = false;
let lastDisplayedBalance = null;

// === CARD RENDERING ===
function createCardElement(card, dealDelay = 0) {
  const el = document.createElement('div');
  el.className = 'card';

  // If the card was just revealed (flipped from face-down to face-up),
  // start it as face-down and trigger the revealing animation
  if (card.justRevealed) {
    el.classList.add('face-down');
    // Force the browser to render the face-down state first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.remove('face-down');
        el.classList.add('revealing');
        // Clean up the flag after animation
        card.justRevealed = false;
      });
    });
  } else if (card.faceDown) {
    el.classList.add('face-down');
  }

  // Slide-in animation for cards dealt during gameplay (hit, double, dealer draw)
  if (card.isNew) {
    el.classList.add('slide-in');
    card.isNew = false;
  } else if (dealDelay >= 0) {
    el.classList.add('dealing');
    el.style.animationDelay = `${dealDelay}ms`;
  }

  el.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-front">
        <img src="${getCardImagePath(card)}" alt="${card.value} of ${card.suit}"
             draggable="false" loading="eager">
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
  updateStreakBodyClass();
}

// === HUD ===
function renderHUD() {
  const balanceEl = document.querySelector('#hud-balance .hud-value');
  const betEl = document.querySelector('#hud-bet .hud-value');
  const handEl = document.querySelector('#hud-hand .hud-value');

  if (balanceEl) {
    const newBalance = GameState.balance;
    // Animate balance changes
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

  // Update achievement button counter
  const achBtn = document.getElementById('btn-achievements');
  if (achBtn) {
    const count = Achievements.getUnlockedCount();
    const total = Achievements.getTotal();
    achBtn.textContent = `🏆 ${count}/${total}`;
  }
}

// Animate balance counting up/down
function animateBalanceChange(el, from, to) {
  const diff = to - from;
  const duration = 600;
  const steps = 20;
  const stepTime = duration / steps;
  let step = 0;

  // Add visual class
  el.classList.remove('balance-up', 'balance-down');
  el.classList.add(diff > 0 ? 'balance-up' : 'balance-down');

  const interval = setInterval(() => {
    step++;
    const progress = step / steps;
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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

    // Score badge
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

    // Bet label for split hands
    if (GameState.playerHands.length > 1) {
      const betLabel = document.createElement('div');
      betLabel.className = 'hand-bet-label';
      betLabel.textContent = `$${hand.bet}`;
      handWrapper.appendChild(betLabel);
    }

    wrapper.appendChild(handWrapper);
  });

  // Empty placeholder
  if (GameState.playerHands.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'hand-container';
    placeholder.style.minHeight = '120px';
    wrapper.appendChild(placeholder);
  }

  const mainScore = document.getElementById('player-score');
  if (mainScore) mainScore.textContent = '';
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

  // Action buttons
  const btnDeal = document.getElementById('btn-deal');
  const btnHit = document.getElementById('btn-hit');
  const btnStand = document.getElementById('btn-stand');
  const btnDouble = document.getElementById('btn-double');
  const btnSplit = document.getElementById('btn-split');
  const btnHint = document.getElementById('btn-hint');

  btnDeal.style.display = phase === 'BETTING' ? '' : 'none';
  btnDeal.disabled = GameState.currentBet <= 0 && GameState.lastBet <= 0;

  // Pulse deal button when bet is placed
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
  btnHint.style.display = inPlayerTurn ? '' : 'none';

  if (inPlayerTurn && hand) {
    btnHit.disabled = false;
    btnStand.disabled = false;
    btnDouble.disabled = hand.cards.length !== 2 || GameState.balance < hand.bet;
    btnSplit.disabled = !isPair(hand.cards) || GameState.playerHands.length >= 4 || GameState.balance < hand.bet;
  }

  // Update deal button label based on context
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

// === STREAK METER ===
function renderStreakMeter() {
  const meter = document.getElementById('streak-meter');
  if (!meter) return;

  const tier = StreakSystem.getCurrentTier();
  const streak = StreakSystem.winStreak;
  const progress = StreakSystem.getProgress();

  const streakCount = meter.querySelector('.streak-count');
  const tierName = meter.querySelector('.streak-tier-name');
  const multiplier = meter.querySelector('.streak-multiplier');
  const fill = meter.querySelector('.streak-fill');

  if (streakCount) streakCount.textContent = streak;
  if (tierName) tierName.textContent = tier.name;
  if (multiplier) {
    multiplier.textContent = tier.multiplier > 1 ? `${tier.multiplier}x` : '';
  }
  if (fill) fill.style.width = `${progress * 100}%`;

  // Show/hide based on streak
  if (streak > 0) {
    meter.classList.add('active');
    meter.className = `streak-meter active ${tier.cssClass}`;
  } else {
    meter.className = 'streak-meter';
  }
}

function updateStreakBodyClass() {
  const app = document.getElementById('app');
  // Remove old streak classes
  app.classList.remove('streak-warm', 'streak-hot', 'streak-fire', 'streak-unstoppable');
  const tier = StreakSystem.getCurrentTier();
  if (tier.cssClass) {
    app.classList.add(tier.cssClass);
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

// === HINT ===
function toggleHint() {
  const el = document.getElementById('hint-display');
  if (GameState.phase !== 'PLAYER_TURN') return;

  hintVisible = !hintVisible;
  if (hintVisible) {
    const hand = GameState.playerHands[GameState.activeHandIndex];
    const dealerUp = GameState.dealerHand[0];
    if (hand && dealerUp) {
      const hint = getHint(hand.cards, dealerUp);
      el.textContent = `Strategy suggests: ${hint}`;
      el.classList.add('visible');
    }
  } else {
    el.classList.remove('visible');
    el.textContent = '';
  }
}

function hideHint() {
  hintVisible = false;
  const el = document.getElementById('hint-display');
  el.classList.remove('visible');
  el.textContent = '';
}

// === GAMBLE UI ===
function showGambleUI(winnings, chainCount) {
  const container = document.getElementById('gamble-container');
  if (!container) return;

  const potential = winnings * 2;
  const chainLabel = chainCount > 0 ? ` (${Math.pow(2, chainCount)}x original!)` : '';

  container.innerHTML = `
    <div class="gamble-panel">
      <div class="gamble-title">DOUBLE OR NOTHING?</div>
      <div class="gamble-stakes">
        <span class="gamble-current">Current: <strong>$${winnings.toLocaleString()}</strong>${chainLabel}</span>
        <span class="gamble-potential">Potential: <strong>$${potential.toLocaleString()}</strong></span>
      </div>
      <div class="gamble-card-area" id="gamble-card-area">
        <div class="gamble-hint">Red wins, Black loses</div>
      </div>
      <div class="gamble-chain">
        ${Array.from({length: GambleSystem.maxChain}, (_, i) =>
          `<div class="chain-dot ${i < chainCount ? 'filled' : ''}">${i < chainCount ? '✓' : (i + 1)}</div>`
        ).join('')}
      </div>
      <div class="gamble-buttons">
        <button class="action-btn gamble-btn pulse-glow" onclick="GambleSystem.doGamble()">
          <span class="btn-label">GAMBLE</span>
        </button>
        <button class="action-btn collect-btn" onclick="GambleSystem.collect()">
          <span class="btn-label">COLLECT $${winnings.toLocaleString()}</span>
        </button>
      </div>
    </div>
  `;
  container.classList.add('visible');
}

function renderGambleCard(card) {
  const area = document.getElementById('gamble-card-area');
  if (!area) return;

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

  if (card.faceDown) {
    area.innerHTML = `
      <div class="gamble-card face-down">
        <div class="gamble-card-inner">
          <div class="gamble-card-back">?</div>
        </div>
      </div>
    `;
  } else {
    area.innerHTML = `
      <div class="gamble-card ${isRed ? 'red' : 'black'} flip-reveal">
        <div class="gamble-card-inner">
          <div class="gamble-card-front">
            <span class="gamble-card-value">${card.value}</span>
            <span class="gamble-card-suit">${suitSymbols[card.suit]}</span>
          </div>
        </div>
      </div>
    `;
  }
}

function showGambleResult(won, amount, maxChain) {
  const area = document.getElementById('gamble-card-area');
  if (!area) return;

  if (won) {
    area.innerHTML += `<div class="gamble-result win">DOUBLED! $${amount.toLocaleString()}${maxChain ? ' MAX!' : ''}</div>`;
  } else {
    area.innerHTML += `<div class="gamble-result lose">LOST!</div>`;
  }
}

function hideGambleUI() {
  const container = document.getElementById('gamble-container');
  if (container) {
    container.classList.remove('visible');
    container.innerHTML = '';
  }
}

// === ACHIEVEMENT MODAL ===
function showAchievementsModal() {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  const unlocked = Achievements.getUnlockedCount();
  const total = Achievements.getTotal();

  const cards = AchievementDefs.map(def => {
    const isUnlocked = Achievements.isUnlocked(def.id);
    const progress = !isUnlocked ? Achievements.getProgress(def.id) : null;
    const progressBar = progress
      ? `<div class="ach-progress"><div class="ach-progress-fill" style="width:${Math.min(100, (progress.current / progress.target) * 100)}%"></div><span>${progress.current}/${progress.target}</span></div>`
      : '';

    return `
      <div class="ach-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="ach-icon">${isUnlocked ? def.icon : '?'}</div>
        <div class="ach-info">
          <div class="ach-name">${isUnlocked ? def.name : '???'}</div>
          <div class="ach-desc">${def.desc}</div>
          ${progressBar}
        </div>
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <div class="modal achievements-modal">
      <h2>Achievements</h2>
      <div class="ach-summary">${unlocked} / ${total} Unlocked</div>
      <div class="ach-grid">${cards}</div>
      <div style="margin-top: 20px; text-align: center;">
        <button class="modal-btn modal-btn-no" onclick="hideModal()">Close</button>
      </div>
    </div>
  `;
  overlay.classList.add('visible');
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
        <label>Card Counting (Hi-Lo)</label>
        <div class="settings-toggle" onclick="toggleCountDisplay()">
          <div class="toggle-switch ${showCountDisplay ? 'on' : ''}"></div>
          <span>${showCountDisplay ? 'Showing running & true count' : 'Hidden'}</span>
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

function toggleCountDisplay() {
  showCountDisplay = !showCountDisplay;
  showSettingsModal();
  renderAll();
}

function toggleSound() {
  audioManager.toggleMute();
  showSettingsModal();
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
  document.getElementById('btn-deal').addEventListener('click', () => {
    quickDeal();
  });
  document.getElementById('btn-hit').addEventListener('click', playerHit);
  document.getElementById('btn-stand').addEventListener('click', playerStand);
  document.getElementById('btn-double').addEventListener('click', playerDouble);
  document.getElementById('btn-split').addEventListener('click', playerSplit);
  document.getElementById('btn-hint').addEventListener('click', toggleHint);

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
  document.getElementById('btn-achievements').addEventListener('click', showAchievementsModal);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('modal-overlay').classList.contains('visible')) return;

    // Gamble phase shortcuts
    if (GameState.phase === 'GAMBLE' && GambleSystem.active) {
      if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        GambleSystem.doGamble();
        return;
      }
      if (e.key.toLowerCase() === 'c' || e.key === 'Escape') {
        e.preventDefault();
        GambleSystem.collect();
        return;
      }
    }

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
}

// === INITIALIZE ===
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initParticles();
  initGame();
});
