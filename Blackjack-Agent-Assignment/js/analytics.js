// ============================================================
// analytics.js — Performance Analytics & Session Tracking
// ============================================================

const Analytics = {
  handsPlayed: 0,
  handsWon: 0,
  handsLost: 0,
  handsPushed: 0,
  correctDecisions: 0,
  totalDecisions: 0,
  bankrollHistory: [],
  mistakeLog: [],
  handDecisions: [],     // decisions in current hand
  sessionExport: [],     // full session data

  reset() {
    this.handsPlayed = 0;
    this.handsWon = 0;
    this.handsLost = 0;
    this.handsPushed = 0;
    this.correctDecisions = 0;
    this.totalDecisions = 0;
    this.bankrollHistory = [];
    this.mistakeLog = [];
    this.handDecisions = [];
    this.sessionExport = [];
  },

  recordBankroll(balance) {
    this.bankrollHistory.push({
      hand: this.handsPlayed,
      balance
    });
  },

  /**
   * Record a player decision and check against basic strategy.
   */
  recordDecision(playerCards, dealerUpCard, playerAction, handNumber) {
    const optimal = getOptimalAction(playerCards, dealerUpCard);
    const optimalExpanded = expandAction(optimal);

    // Normalize the player action to match strategy codes
    const actionMap = { 'hit': 'H', 'stand': 'S', 'double': 'D', 'split': 'SP' };
    const playerCode = actionMap[playerAction.toLowerCase()] || playerAction;

    // Check if action matches (D/DS both count as correct for Double)
    let isOptimal = false;
    if (playerCode === optimal) {
      isOptimal = true;
    } else if (playerCode === 'D' && optimal === 'DS') {
      isOptimal = true;
    } else if (playerCode === 'S' && optimal === 'DS') {
      isOptimal = true; // Standing when DS is acceptable
    }

    this.totalDecisions++;
    if (isOptimal) this.correctDecisions++;

    const decision = {
      hand: handNumber,
      playerCards: playerCards.map(c => c.value).join(', '),
      playerTotal: getHandValue(playerCards),
      dealerUp: dealerUpCard.value,
      playerAction: playerAction,
      optimalAction: optimalExpanded,
      isOptimal,
      rating: isOptimal ? 'Optimal' : (playerCode === 'S' && optimal === 'H' ? 'Acceptable' : 'Mistake')
    };

    this.handDecisions.push(decision);

    if (!isOptimal) {
      this.mistakeLog.push({
        hand: handNumber,
        message: `Hand #${handNumber}: You chose ${playerAction} but optimal was ${optimalExpanded} (${describeHand(playerCards)} vs ${dealerUpCard.value})`
      });
    }

    return decision;
  },

  recordHandResult(result) {
    this.handsPlayed++;
    if (result === 'WIN' || result === 'BLACKJACK') this.handsWon++;
    else if (result === 'LOSE' || result === 'BUST') this.handsLost++;
    else if (result === 'PUSH') this.handsPushed++;

    // Save hand data for export
    this.sessionExport.push({
      handNumber: this.handsPlayed,
      result,
      decisions: [...this.handDecisions],
      bankroll: GameState.balance
    });

    // Reset current hand decisions
    this.handDecisions = [];
  },

  getAccuracy() {
    if (this.totalDecisions === 0) return 100;
    return Math.round((this.correctDecisions / this.totalDecisions) * 100);
  },

  getSessionEV() {
    if (this.bankrollHistory.length < 2) return 0;
    const start = this.bankrollHistory[0].balance;
    const current = this.bankrollHistory[this.bankrollHistory.length - 1].balance;
    return current - start;
  },

  /**
   * Decision quality score: measures how many decisions matched optimal basic strategy,
   * weighted by estimated EV cost of mistakes.
   * Returns a +/- dollar estimate of EV gained/lost from decision quality.
   */
  getDecisionEV() {
    let evImpact = 0;
    const avgBet = this.handsPlayed > 0
      ? (this.bankrollHistory.length > 1 ? Math.abs(this.bankrollHistory[1].balance - this.bankrollHistory[0].balance) : 25)
      : 25;

    for (const hand of this.sessionExport) {
      for (const d of hand.decisions) {
        if (d.isOptimal) continue;
        // Rough EV cost estimate per mistake type
        // Standing when should hit or vice versa ~ 5-8% of bet
        // Missing a double ~ 10% of bet
        // Missing a split ~ 5% of bet
        const cost = (d.optimalAction === 'Double') ? 0.10 : 0.06;
        evImpact -= cost * (hand.decisions.length > 0 ? avgBet : 25);
      }
    }
    return Math.round(evImpact);
  },

  /**
   * Export full session as JSON.
   */
  exportSession() {
    const data = {
      timestamp: new Date().toISOString(),
      summary: {
        handsPlayed: this.handsPlayed,
        handsWon: this.handsWon,
        handsLost: this.handsLost,
        handsPushed: this.handsPushed,
        decisionAccuracy: this.getAccuracy() + '%',
        sessionEV: this.getSessionEV(),
        finalBalance: GameState.balance
      },
      hands: this.sessionExport,
      mistakes: this.mistakeLog
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackjack-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Get post-hand debrief for the last hand.
   */
  getDebrief() {
    if (this.sessionExport.length === 0) return null;
    const lastHand = this.sessionExport[this.sessionExport.length - 1];
    return {
      handNumber: lastHand.handNumber,
      result: lastHand.result,
      decisions: lastHand.decisions
    };
  }
};
