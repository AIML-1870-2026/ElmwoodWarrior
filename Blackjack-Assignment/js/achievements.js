// Achievements System
// Defines achievements, tracks stats, handles unlock notifications

const AchievementDefs = [
  { id: 'first-win',     name: 'First Blood',            desc: 'Win your first hand',               icon: '🏆' },
  { id: 'first-bj',      name: 'Natural Born',            desc: 'Get your first Blackjack',          icon: '🃏' },
  { id: 'streak-5',      name: 'On Fire',                 desc: 'Win 5 hands in a row',              icon: '🔥' },
  { id: 'streak-10',     name: 'Unstoppable',             desc: 'Win 10 hands in a row',             icon: '⚡' },
  { id: 'double-win',    name: 'Risk Taker',              desc: 'Win a doubled hand',                icon: '🎲' },
  { id: 'split-both',    name: 'Split Decision',          desc: 'Split and win both hands',          icon: '✂️' },
  { id: 'balance-5k',    name: 'High Roller',             desc: 'Reach $5,000 balance',              icon: '💎' },
  { id: 'balance-10k',   name: 'Whale',                   desc: 'Reach $10,000 balance',             icon: '🐋' },
  { id: 'balance-25k',   name: 'Mogul',                   desc: 'Reach $25,000 balance',             icon: '👑' },
  { id: 'broke-1',       name: 'Down Bad',                desc: 'Go broke for the first time',       icon: '💀' },
  { id: 'broke-5',       name: 'Glutton for Punishment',  desc: 'Go broke 5 times',                  icon: '🪦' },
  { id: 'hands-50',      name: 'Getting Warmed Up',       desc: 'Play 50 hands',                     icon: '🎰' },
  { id: 'hands-200',     name: 'Card Shark',              desc: 'Play 200 hands',                    icon: '🦈' },
  { id: 'hands-500',     name: 'Degenerate',              desc: 'Play 500 hands',                    icon: '😈' },
  { id: 'insurance-win', name: 'Insured!',                desc: 'Win an insurance bet',              icon: '🛡️' },
  { id: 'push-3',        name: 'Stalemate King',          desc: 'Push 3 times in a row',             icon: '🤝' },
  { id: 'bet-max',       name: 'All In Spirit',           desc: 'Place a bet of $500 or more',       icon: '💰' },
  { id: 'gamble-win',    name: 'Double or Nothing',       desc: 'Win a Double or Nothing gamble',    icon: '🎯' },
  { id: 'gamble-3',      name: "Gambler's Rush",          desc: 'Win 3 Double or Nothing in a row',  icon: '🌟' },
  { id: 'perfect-10',    name: 'Perfect Session',         desc: 'Win 10 hands without a single loss',icon: '💫' },
];

const Achievements = {
  unlocked: {},    // { id: timestamp }
  stats: {
    totalHands: 0,
    totalWins: 0,
    totalLosses: 0,
    timesBroke: 0,
    pushStreak: 0,
    gambleStreak: 0,
    maxBalance: 1000,
    perfectRun: 0,  // wins without any loss (resets on loss, not push)
  },

  toastQueue: [],
  toastShowing: false,

  init() {
    const savedAch = localStorage.getItem('blackjack-achievements');
    if (savedAch) this.unlocked = JSON.parse(savedAch);

    const savedStats = localStorage.getItem('blackjack-stats');
    if (savedStats) this.stats = { ...this.stats, ...JSON.parse(savedStats) };
  },

  save() {
    localStorage.setItem('blackjack-achievements', JSON.stringify(this.unlocked));
    localStorage.setItem('blackjack-stats', JSON.stringify(this.stats));
  },

  isUnlocked(id) {
    return !!this.unlocked[id];
  },

  unlock(id) {
    if (this.unlocked[id]) return false; // Already unlocked
    this.unlocked[id] = Date.now();
    this.save();

    const def = AchievementDefs.find(a => a.id === id);
    if (def) {
      this.toastQueue.push(def);
      this.processToastQueue();
    }
    return true;
  },

  processToastQueue() {
    if (this.toastShowing || this.toastQueue.length === 0) return;
    this.toastShowing = true;

    const def = this.toastQueue.shift();
    showAchievementToast(def);

    setTimeout(() => {
      this.toastShowing = false;
      this.processToastQueue();
    }, 3500);
  },

  getUnlockedCount() {
    return Object.keys(this.unlocked).length;
  },

  getTotal() {
    return AchievementDefs.length;
  },

  // Called after each round with context about what happened
  checkAll(context) {
    // context: { hasWin, hasBJ, hasPush, allLost, hasDouble, hasSplit, splitBothWon,
    //            insuranceWon, balance, streak, betAmount, isBroke }

    this.stats.totalHands++;

    if (context.hasWin || context.hasBJ) {
      this.stats.totalWins++;
      this.stats.perfectRun++;
      this.unlock('first-win');
    }
    if (context.hasBJ) {
      this.unlock('first-bj');
    }
    if (context.allLost) {
      this.stats.totalLosses++;
      this.stats.perfectRun = 0;
    }
    if (context.hasPush && !context.hasWin && !context.allLost) {
      this.stats.pushStreak++;
    } else {
      this.stats.pushStreak = 0;
    }
    if (context.hasDouble && context.hasWin) {
      this.unlock('double-win');
    }
    if (context.splitBothWon) {
      this.unlock('split-both');
    }
    if (context.insuranceWon) {
      this.unlock('insurance-win');
    }
    if (context.isBroke) {
      this.stats.timesBroke++;
    }

    // Balance checks
    if (context.balance > this.stats.maxBalance) {
      this.stats.maxBalance = context.balance;
    }
    if (context.balance >= 5000)  this.unlock('balance-5k');
    if (context.balance >= 10000) this.unlock('balance-10k');
    if (context.balance >= 25000) this.unlock('balance-25k');

    // Streak checks
    if (context.streak >= 5)  this.unlock('streak-5');
    if (context.streak >= 10) this.unlock('streak-10');

    // Broke checks
    if (this.stats.timesBroke >= 1) this.unlock('broke-1');
    if (this.stats.timesBroke >= 5) this.unlock('broke-5');

    // Hands played
    if (this.stats.totalHands >= 50)  this.unlock('hands-50');
    if (this.stats.totalHands >= 200) this.unlock('hands-200');
    if (this.stats.totalHands >= 500) this.unlock('hands-500');

    // Push streak
    if (this.stats.pushStreak >= 3) this.unlock('push-3');

    // Bet amount
    if (context.betAmount >= 500) this.unlock('bet-max');

    // Perfect run
    if (this.stats.perfectRun >= 10) this.unlock('perfect-10');

    this.save();
  },

  // Called from gamble system
  checkGamble(won) {
    if (won) {
      this.stats.gambleStreak++;
      this.unlock('gamble-win');
      if (this.stats.gambleStreak >= 3) this.unlock('gamble-3');
    } else {
      this.stats.gambleStreak = 0;
    }
    this.save();
  },

  // Get progress info for a specific achievement (for display)
  getProgress(id) {
    const s = this.stats;
    switch (id) {
      case 'hands-50':  return { current: s.totalHands, target: 50 };
      case 'hands-200': return { current: s.totalHands, target: 200 };
      case 'hands-500': return { current: s.totalHands, target: 500 };
      case 'broke-5':   return { current: s.timesBroke, target: 5 };
      case 'streak-5':  return { current: StreakSystem.bestStreak, target: 5 };
      case 'streak-10': return { current: StreakSystem.bestStreak, target: 10 };
      case 'balance-5k':  return { current: s.maxBalance, target: 5000 };
      case 'balance-10k': return { current: s.maxBalance, target: 10000 };
      case 'balance-25k': return { current: s.maxBalance, target: 25000 };
      default: return null;
    }
  },
};

// Toast UI (renders a slide-in notification)
function showAchievementToast(def) {
  audioManager.play('achievement');

  let container = document.getElementById('achievement-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'achievement-toast-container';
    document.getElementById('app').appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `
    <div class="toast-icon">${def.icon}</div>
    <div class="toast-text">
      <div class="toast-title">Achievement Unlocked!</div>
      <div class="toast-name">${def.name}</div>
      <div class="toast-desc">${def.desc}</div>
    </div>
  `;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
  });

  // Remove after animation
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
