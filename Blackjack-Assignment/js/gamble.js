// Double or Nothing Mini-Game
// After a win, player can gamble winnings on a coin-flip style card draw
// Balance logic: when offered, we subtract winnings from balance (put at risk).
// Win = double it and put at risk again (or collect). Lose = gone. Collect = add back.

const GambleSystem = {
  active: false,
  currentWinnings: 0,   // Amount currently at risk
  originalWinnings: 0,  // What they won from the hand
  chainCount: 0,        // How many times they've doubled (max 3)
  maxChain: 3,
  gambleCard: null,
  gambleLock: false,

  // Start the gamble offer
  offer(winnings) {
    if (winnings <= 0) return false;
    this.active = true;
    this.currentWinnings = winnings;
    this.originalWinnings = winnings;
    this.chainCount = 0;
    this.gambleCard = null;
    this.gambleLock = false;

    // Pull the winnings out of balance (put at risk)
    GameState.balance -= winnings;
    saveBalance();

    showGambleUI(this.currentWinnings, this.chainCount);
    return true;
  },

  // Player chose to gamble
  async doGamble() {
    if (!this.active || this.gambleLock) return;
    this.gambleLock = true;

    // Draw a card from a fresh mini-deck (not the shoe)
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    const isRed = suit === 'hearts' || suit === 'diamonds';

    this.gambleCard = { suit, value, faceDown: true };

    // Show card face down
    renderGambleCard(this.gambleCard);
    audioManager.play('card-deal');

    // Suspenseful pause
    await new Promise(r => setTimeout(r, 800));

    // Flip the card
    this.gambleCard.faceDown = false;
    renderGambleCard(this.gambleCard);
    audioManager.play('card-flip');

    await new Promise(r => setTimeout(r, 600));

    if (isRed) {
      // WIN - double the at-risk amount
      this.chainCount++;
      this.currentWinnings *= 2;

      audioManager.play('gamble-win');
      triggerGambleWinEffect();
      Achievements.checkGamble(true);

      if (this.chainCount >= this.maxChain) {
        // Max chain reached - auto collect
        showGambleResult(true, this.currentWinnings, true);
        await new Promise(r => setTimeout(r, 1500));
        this.collect();
      } else {
        // Offer another gamble
        await new Promise(r => setTimeout(r, 800));
        this.gambleLock = false;
        showGambleUI(this.currentWinnings, this.chainCount);
      }
    } else {
      // LOSE - winnings are gone (already removed from balance)
      audioManager.play('gamble-lose');
      triggerGambleLoseEffect();
      Achievements.checkGamble(false);

      showGambleResult(false, this.currentWinnings, false);
      await new Promise(r => setTimeout(r, 2000));
      this.end();
    }
  },

  // Player chose to collect - add winnings back to balance
  collect() {
    if (!this.active) return;
    GameState.balance += this.currentWinnings;
    saveBalance();
    audioManager.play('collect');
    this.end();
  },

  end() {
    this.active = false;
    this.gambleLock = false;
    hideGambleUI();

    // Resume normal betting phase
    GameState.phase = 'BETTING';
    if (GameState.balance > 0) {
      showMessage('Place your bet or press ENTER to re-deal');
    }
    renderAll();

    if (GameState.balance <= 0) {
      setTimeout(() => showRebuyModal(), 800);
    }
  },
};
