// Hot Streak System
// Tracks consecutive wins and applies payout multipliers

const StreakSystem = {
  winStreak: 0,
  bestStreak: 0,
  pushStreak: 0,

  tiers: [
    { min: 0,  name: 'Cold',        multiplier: 1.0,  cssClass: '' },
    { min: 2,  name: 'Warm',        multiplier: 1.1,  cssClass: 'streak-warm' },
    { min: 4,  name: 'Hot',         multiplier: 1.25, cssClass: 'streak-hot' },
    { min: 6,  name: 'On Fire',     multiplier: 1.5,  cssClass: 'streak-fire' },
    { min: 10, name: 'Unstoppable', multiplier: 2.0,  cssClass: 'streak-unstoppable' },
  ],

  init() {
    const saved = localStorage.getItem('blackjack-streak');
    if (saved) {
      const data = JSON.parse(saved);
      this.winStreak = data.winStreak || 0;
      this.bestStreak = data.bestStreak || 0;
    }
  },

  save() {
    localStorage.setItem('blackjack-streak', JSON.stringify({
      winStreak: this.winStreak,
      bestStreak: this.bestStreak,
    }));
  },

  getCurrentTier() {
    let tier = this.tiers[0];
    for (const t of this.tiers) {
      if (this.winStreak >= t.min) tier = t;
    }
    return tier;
  },

  getMultiplier() {
    return this.getCurrentTier().multiplier;
  },

  // Called after each round with the round result
  update(hasWin, hasPush, allLost) {
    const prevTier = this.getCurrentTier();

    if (hasWin) {
      this.winStreak++;
      this.pushStreak = 0;
      if (this.winStreak > this.bestStreak) {
        this.bestStreak = this.winStreak;
      }
    } else if (hasPush && !allLost) {
      // Push doesn't break streak, doesn't increase it
      this.pushStreak++;
    } else {
      // Loss resets
      this.winStreak = 0;
      this.pushStreak = 0;
    }

    const newTier = this.getCurrentTier();
    this.save();

    // Return tier change info for effects
    return {
      tierChanged: newTier.name !== prevTier.name,
      tierUp: newTier.multiplier > prevTier.multiplier,
      tier: newTier,
      streak: this.winStreak,
    };
  },

  // Get progress to next tier (0-1)
  getProgress() {
    const current = this.getCurrentTier();
    const currentIndex = this.tiers.indexOf(current);
    if (currentIndex >= this.tiers.length - 1) return 1; // Max tier

    const next = this.tiers[currentIndex + 1];
    const range = next.min - current.min;
    const progress = (this.winStreak - current.min) / range;
    return Math.min(1, progress);
  },
};
