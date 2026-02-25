# Blackjack Web Game — Full Technical Specification

## Overview & Design Philosophy

This document specifies a complete, production-quality Blackjack game built with vanilla HTML, CSS, and JavaScript (no frameworks required). The design is informed by casino psychology research: warm lighting palette, high-contrast spotlighting on the table, dopamine-triggering win animations, and a seamless "flow state" experience that keeps the player engaged. The goal is an educational showcase for an AI coding class — demonstrating how environmental and psychological design principles translate directly into front-end engineering decisions.

---

## 1. Project Structure

```
/blackjack
  index.html          — Main entry point, full single-page layout
  css/
    reset.css         — CSS reset/normalize
    theme.css         — Casino color palette, typography, CSS variables
    table.css         — Felt table, card zones, layout grid
    cards.css         — Card face/back rendering, flip & slide animations
    ui.css            — Buttons, chip tray, HUD, modals
    particles.css     — Win/confetti particle layer
  js/
    deck.js           — Deck construction, shuffle (Fisher-Yates), multi-deck support
    hand.js           — Hand class: add card, calculate value, split logic
    dealer.js         — Dealer AI: hit-on-soft-17 rule
    game.js           — Core state machine: rounds, phases, payouts
    ui.js             — DOM manipulation, animation orchestration
    counting.js       — Hi-Lo card counting system tracker
    strategy.js       — Basic strategy lookup table + hint engine
    particles.js      — Canvas-based particle system for wins
    audio.js          — Sound management (win jingles, card sounds, chip clicks)
  assets/
    cards/            — SVG card faces (52 cards + back)
    sounds/           — .mp3/.ogg audio assets
    fonts/            — Optional: casino-style web font
```

---

## 2. Visual Design System

### 2.1 Color Palette (CSS Variables)

```css
:root {
  /* Table */
  --felt-green:       #35654d;
  --felt-green-dark:  #1e3d2f;
  --felt-border:      #8B6914;         /* Gold rail */
  --felt-inner:       #2d5a3d;

  /* Lighting/Ambient */
  --bg-dark:          #0a0a0f;
  --spotlight:        rgba(255, 220, 100, 0.06);  /* Warm overhead glow */
  --ambient-red:      rgba(180, 30, 30, 0.08);

  /* UI Chrome */
  --gold:             #c9a84c;
  --gold-light:       #f0d080;
  --text-primary:     #f5f0e0;
  --text-dim:         #8a7a5a;

  /* Cards */
  --card-bg:          #fefefe;
  --card-back:        #1a3a8f;          /* Deep blue back */
  --suit-red:         #cc1111;
  --suit-black:       #111111;

  /* Chips */
  --chip-1:           #ffffff;
  --chip-5:           #e63946;
  --chip-25:          #2d9e4f;
  --chip-100:         #1d3557;
  --chip-500:         #8b008b;
}
```

### 2.2 Typography

Use a serif font for card values (`Georgia` or import `Playfair Display`) and a clean sans-serif (`Inter`) for UI. Casino-style display text for big win messages can use `Cinzel` (Google Fonts).

### 2.3 Background & Spotlight Effect

The page background is near-black (`#0a0a0f`). The table sits centered in the viewport, and a radial gradient "spotlight" is applied above it — warm amber — simulating an overhead casino lamp. This is a pure CSS effect:

```css
.table-spotlight {
  background: radial-gradient(
    ellipse 60% 40% at 50% 30%,
    rgba(255, 210, 80, 0.09) 0%,
    transparent 70%
  );
  pointer-events: none;
  position: absolute;
  inset: 0;
}
```

---

## 3. Table Layout (HTML Structure)

```html
<body>
  <div id="app">
    <div class="table-spotlight"></div>
    <header id="hud"> ... </header>

    <main id="table">
      <section id="zone-dealer">
        <div id="dealer-hand" class="hand-container"></div>
        <div id="dealer-score" class="score-badge"></div>
      </section>

      <section id="zone-info">
        <div id="message-box"></div>          <!-- "Blackjack!", "Bust!", etc. -->
        <div id="count-display"></div>        <!-- Card counting HUD -->
        <div id="hint-display"></div>         <!-- Strategy hint -->
      </section>

      <section id="zone-player">
        <!-- Supports up to 3 split hands -->
        <div id="player-hands">
          <div id="hand-0" class="hand-container active-hand"></div>
          <div id="hand-1" class="hand-container hidden"></div>
          <div id="hand-2" class="hand-container hidden"></div>
        </div>
        <div id="player-score" class="score-badge"></div>
      </section>
    </main>

    <footer id="controls">
      <div id="chip-tray"> ... </div>
      <div id="bet-display"> ... </div>
      <div id="action-buttons"> ... </div>
    </footer>

    <div id="particle-canvas-container">
      <canvas id="particle-canvas"></canvas>
    </div>

    <div id="modal-overlay"> ... </div>  <!-- Insurance / Split prompts -->
  </div>
</body>
```

---

## 4. Card System

### 4.1 Card Asset Strategy

Use SVG card faces. Two recommended approaches:

**Option A (Preferred): Inline SVG generation** — Generate cards programmatically in JS using the suit Unicode symbols (♠ ♥ ♦ ♣) and value text. No external assets needed.

**Option B: SVG sprite sheet** — Download a free CC0 SVG deck (e.g., `svg-cards` by David Bellot, public domain) and reference cards via `<use>` tags.

Each card DOM element:
```html
<div class="card" data-suit="hearts" data-value="A">
  <div class="card-inner">
    <div class="card-face card-front"> ... SVG or HTML content ... </div>
    <div class="card-face card-back"></div>
  </div>
</div>
```

### 4.2 Card CSS Structure

Cards use a `transform-style: preserve-3d` flip mechanism:

```css
.card {
  width: 80px;
  height: 120px;
  perspective: 600px;
  position: relative;
}

.card-inner {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 8px;
}

.card.face-down .card-inner {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.card-back {
  transform: rotateY(180deg);
  background: /* repeating diamond pattern */ ;
}
```

### 4.3 Card Slide-In Animation

When a card is dealt, it should "fly" from the shoe position to the hand zone:

```css
@keyframes card-deal {
  from {
    transform: translate(-300px, -200px) rotate(-15deg) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
}

.card.dealing {
  animation: card-deal 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

Stagger each card deal by 150ms using `animation-delay` applied in JS.

---

## 5. Deck & Game Logic (JavaScript)

### 5.1 `deck.js` — Deck Construction

```js
const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function buildDeck() {
  return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
}

function buildShoe(numDecks = 6) {
  let shoe = [];
  for (let i = 0; i < numDecks; i++) shoe = shoe.concat(buildDeck());
  return fisherYatesShuffle(shoe);
}

function fisherYatesShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

Penetration: Insert a "cut card" at ~75% through the shoe. When reached, reshuffle after the current round.

### 5.2 `hand.js` — Hand Value Calculation

```js
function getHandValue(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.faceDown) continue;  // Dealer hole card not counted
    if (['J','Q','K'].includes(card.value)) total += 10;
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
  // Returns true if hand contains an Ace counting as 11
  let total = 0, aces = 0;
  for (const card of cards) {
    if (['J','Q','K'].includes(card.value)) total += 10;
    else if (card.value === 'A') { total += 11; aces++; }
    else total += parseInt(card.value);
  }
  return aces > 0 && total <= 21;
}
```

### 5.3 Game State Machine

Use a finite state machine with these phases:

```
IDLE → BETTING → DEALING → PLAYER_TURN → DEALER_TURN → PAYOUT → IDLE
```

Key state object:
```js
const state = {
  phase: 'IDLE',
  shoe: [],
  balance: 1000,
  currentBet: 0,
  playerHands: [],       // Array for split support
  activeHandIndex: 0,
  dealerHand: [],
  numDecks: 6,
  insuranceBet: 0,
  history: [],           // For card counting
};
```

---

## 6. Gameplay Features

### 6.1 Standard Actions
- **Hit**: Draw one card. Check bust (>21).
- **Stand**: End player turn for active hand.
- **Deal**: Initiate a new round after bet is placed.

### 6.2 Double Down
- Available only on first two cards (some rule variants: only on 9/10/11).
- Double the bet, receive exactly one more card, then auto-stand.
- UI: Disable all other action buttons; show confirmation.

```js
function doubleDown(handIndex) {
  if (state.balance < state.currentBet) return; // Insufficient funds
  state.balance -= state.currentBet;
  state.playerHands[handIndex].bet *= 2;
  dealCardToHand(handIndex);
  standHand(handIndex);
}
```

### 6.3 Split
- Available when first two cards share the same value.
- Each card becomes the first card of a new hand; a second card is immediately dealt to each.
- Limit: Up to 3 splits (4 hands total). Aces split only receive one card each (no re-split).
- UI: Animate the split — one card slides left, one slides right; new cards deal to each.

```js
function split(handIndex) {
  const hand = state.playerHands[handIndex];
  const card1 = hand.cards[0];
  const card2 = hand.cards[1];

  // Create two new hands
  const newHand1 = createHand([card1], hand.bet);
  const newHand2 = createHand([card2], hand.bet);

  // Deduct extra bet from balance
  state.balance -= hand.bet;

  // Replace original hand with two new hands
  state.playerHands.splice(handIndex, 1, newHand1, newHand2);

  // Deal one card to each new hand
  dealCardToHand(handIndex);
  dealCardToHand(handIndex + 1);
}
```

### 6.4 Insurance
- Offered when dealer's up-card is an Ace.
- Player can bet up to half their original bet.
- Pays 2:1 if dealer has blackjack; otherwise lost.
- Implement as a modal prompt before dealer checks hole card.

```js
function offerInsurance() {
  if (state.dealerHand[0].value !== 'A') return;
  showInsuranceModal(state.currentBet / 2);
  // Pause game phase until player responds
}
```

### 6.5 Payout Table

| Outcome | Payout |
|---|---|
| Player Blackjack | 3:2 |
| Player Win | 1:1 |
| Push (Tie) | Return bet |
| Player Bust | Lose bet |
| Insurance Win | 2:1 |
| Insurance Lose | Lose insurance bet |

---

## 7. Advanced Features

### 7.1 Card Counting Display (Hi-Lo System)

The Hi-Lo system assigns values: 2–6 = +1, 7–9 = 0, 10–A = -1.

```js
// counting.js
const HI_LO_VALUES = {
  '2':+1,'3':+1,'4':+1,'5':+1,'6':+1,
  '7':0,'8':0,'9':0,
  '10':−1,'J':−1,'Q':−1,'K':−1,'A':−1
};

let runningCount = 0;
let cardsDealt = 0;

function updateCount(card) {
  runningCount += HI_LO_VALUES[card.value] ?? 0;
  cardsDealt++;
}

function getTrueCount(decksRemaining) {
  return (runningCount / decksRemaining).toFixed(1);
}

function resetCount() {
  runningCount = 0;
  cardsDealt = 0;
}
```

Display in the HUD:
- **Running Count**: Always visible (e.g., `RC: +4`)
- **True Count**: `TC: +1.8` (running count ÷ decks remaining)
- **Count Color**: Green for positive (player advantage), red for negative, gray for neutral.
- **Shoe Remaining %**: Visual bar showing how deep into the shoe you are.
- Toggle button: Show/hide counting HUD (so player can test themselves).

### 7.2 Basic Strategy Hints

Implement the complete Basic Strategy table as a lookup. The lookup key is `[playerTotal, dealerUpcard, isSoft, isPair]`.

```js
// strategy.js
// Abbreviated example — full table has ~250 entries
const HARD_STRATEGY = {
  // [playerTotal]: { [dealerUp]: action }
  8:  { 2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',A:'H' },
  9:  { 2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',A:'H' },
  10: { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',A:'H' },
  11: { 2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'D',A:'H' },
  12: { 2:'H',3:'H',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',A:'H' },
  // ... etc.
};

const SOFT_STRATEGY = { /* ... */ };
const PAIR_STRATEGY  = { /* ... */ };

function getHint(playerHand, dealerUpCard) {
  const total  = getHandValue(playerHand);
  const upVal  = normalizeValue(dealerUpCard.value); // 10 for J/Q/K
  const soft   = isSoft(playerHand);
  const isPair = playerHand.length === 2 &&
                 normalizeValue(playerHand[0].value) === normalizeValue(playerHand[1].value);

  let action;
  if (isPair)   action = PAIR_STRATEGY[total/2]?.[upVal];
  else if (soft) action = SOFT_STRATEGY[total]?.[upVal];
  else           action = HARD_STRATEGY[total]?.[upVal];

  return expandAction(action); // 'H' → 'Hit', 'S' → 'Stand', 'D' → 'Double', 'SP' → 'Split'
}
```

**Hint UI**: A subtle banner below the player's hand — amber color for "consider", green for "optimal". Show only on demand via a "Hint" button to avoid making it too easy. After the hand, reveal whether the player followed optimal strategy.

### 7.3 Dealer Hints

Display what the dealer *must* do next based on their visible card and standard casino rules (hit on soft 17):

```js
function getDealerHint(dealerHand) {
  const total = getHandValue(dealerHand.filter(c => !c.faceDown));
  const soft  = isSoft(dealerHand.filter(c => !c.faceDown));

  if (total < 17) return 'Dealer must hit.';
  if (total === 17 && soft) return 'Dealer must hit (soft 17 rule).';
  return 'Dealer must stand.';
}
```

Show in a small badge next to the dealer zone. This helps players understand dealer determinism.

---

## 8. Particle Effects System

### 8.1 Canvas Particle Engine (`particles.js`)

```js
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
  }

  burst(options = {}) {
    const { x, y, count = 80, colors, type = 'confetti' } = options;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle({ x, y, colors, type }));
    }
    if (!this.running) this.loop();
  }

  loop() {
    this.running = true;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = this.particles.filter(p => p.alive);
    this.particles.forEach(p => { p.update(); p.draw(this.ctx); });
    if (this.particles.length > 0) requestAnimationFrame(() => this.loop());
    else this.running = false;
  }
}

class Particle {
  constructor({ x, y, colors, type }) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() * -12) - 3;
    this.gravity = 0.4;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.size = Math.random() * 10 + 5;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 12;
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.01;
    this.type = type; // 'confetti' | 'chip' | 'sparkle'
    this.alive = true;
  }

  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.life -= this.decay;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    if (this.type === 'confetti') {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
    } else if (this.type === 'sparkle') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size/2, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }
}
```

### 8.2 Trigger Events

| Event | Effect |
|---|---|
| Regular Win | Gold & green confetti burst from table center |
| Blackjack | Full-screen gold sparkle cascade + screen flash |
| Push | Silver shimmer, no explosion |
| Bust | Brief red flash on player zone (CSS `animation`) |
| Big Win (>5x bet) | Double burst with chip particles |

---

## 9. Sound Design (`audio.js`)

Use the Web Audio API for synthesized sounds (no assets needed) OR load `.mp3` files. Implement a mute toggle.

```js
class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.muted = false;
    this.sounds = {};
  }

  async load(name, url) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    this.sounds[name] = await this.ctx.decodeAudioData(buf);
  }

  play(name, volume = 1.0) {
    if (this.muted || !this.sounds[name]) return;
    const source = this.ctx.createBufferSource();
    const gain   = this.ctx.createGain();
    source.buffer = this.sounds[name];
    gain.gain.value = volume;
    source.connect(gain).connect(this.ctx.destination);
    source.start();
  }
}
```

**Sounds to include:**
- `card-deal.mp3` — Crisp paper/cardboard whoosh
- `card-flip.mp3` — Quick snap
- `chip-place.mp3` — Stack of chips landing
- `win.mp3` — Short triumphant jingle
- `blackjack.mp3` — Fanfare
- `bust.mp3` — Negative tone (brief, not obnoxious)
- `push.mp3` — Neutral chime

Tip: Free casino SFX are available on freesound.org (CC0 license).

---

## 10. HUD & UI Components

### 10.1 Header HUD
```
[ Balance: $1,240 ]  [ Bet: $50 ]  [ Hand #: 14 ]  [ 🔊 ]  [ ♠ Count Mode ]
```

### 10.2 Chip Tray
Clickable chip denominations: $1, $5, $25, $100, $500. Each click adds that value to the current bet and plays `chip-place.mp3`. Implement a "Clear Bet" and "Repeat Last Bet" button.

```html
<div id="chip-tray">
  <button class="chip chip-1"   data-value="1">$1</button>
  <button class="chip chip-5"   data-value="5">$5</button>
  <button class="chip chip-25"  data-value="25">$25</button>
  <button class="chip chip-100" data-value="100">$100</button>
  <button class="chip chip-500" data-value="500">$500</button>
</div>
```

### 10.3 Action Buttons

```html
<div id="action-buttons">
  <button id="btn-deal">Deal</button>
  <button id="btn-hit" disabled>Hit</button>
  <button id="btn-stand" disabled>Stand</button>
  <button id="btn-double" disabled>Double</button>
  <button id="btn-split" disabled>Split</button>
  <button id="btn-hint">💡 Hint</button>
</div>
```

Button visibility rules:
- Deal: Visible only in BETTING phase.
- Hit/Stand: Visible only in PLAYER_TURN phase.
- Double: Enabled only on first 2 cards with sufficient balance.
- Split: Enabled only when first 2 cards are a pair with sufficient balance.
- Hint: Always visible during PLAYER_TURN; toggles hint panel.

---

## 11. Settings Modal

Accessible via a gear icon. Options:
- Number of decks: 1, 2, 4, 6, 8 (radio buttons)
- Dealer hits soft 17: Toggle (H17 vs S17)
- Blackjack pays: 3:2 or 6:5 (radio — 6:5 as a "house rules" option for educational comparison)
- Auto-hints: Always on / On demand / Off
- Card counting display: Always / Toggleable / Hidden
- Sound: On/Off + Volume slider

---

## 12. Responsive Design

Target breakpoints:
- **Desktop (1200px+)**: Full table, side panels for counting HUD
- **Tablet (768–1199px)**: Compact table, bottom sheet for counting info
- **Mobile (< 768px)**: Vertical layout — dealer top, player bottom, action bar fixed at bottom; cards scale to 60px × 90px

---

## 13. Accessibility

- All interactive elements have `aria-label` attributes
- Keyboard navigation: Tab through chips and action buttons; Enter to activate
- Color is not the sole indicator (icons + text labels alongside color coding)
- `prefers-reduced-motion` media query: Disable card animations, keep functional transitions

```css
@media (prefers-reduced-motion: reduce) {
  .card-inner, .card.dealing { transition: none; animation: none; }
}
```

---

## 14. Implementation Roadmap

Recommended build order for a class project:

**Phase 1 — Core Logic (No UI)**
1. `deck.js`: Build and shuffle shoe
2. `hand.js`: Value calculation, soft/hard detection
3. `game.js`: State machine, basic hit/stand/deal/payout

**Phase 2 — Basic UI**
4. `index.html` + `table.css`: Static layout, felt table
5. `ui.js`: Render cards as text, connect buttons to game.js
6. Score display, bet system, balance tracking

**Phase 3 — Visual Polish**
7. `cards.css`: Proper card faces (SVG or CSS-drawn)
8. Card deal animation (`@keyframes card-deal`)
9. Card flip animation for dealer hole card reveal

**Phase 4 — Advanced Gameplay**
10. Double down
11. Split (with animation)
12. Insurance modal

**Phase 5 — Advanced Features**
13. `counting.js`: Hi-Lo running/true count
14. `strategy.js`: Full basic strategy table + hint UI
15. Dealer hint display

**Phase 6 — Effects & Audio**
16. `particles.js`: Win burst system
17. `audio.js`: Sound loading and playback
18. CSS win/bust flash effects

**Phase 7 — Polish**
19. Settings modal
20. Responsive CSS
21. Accessibility pass
22. Animations for chip placement, bet display

---

## 15. Key Technical Notes

**No external libraries required.** Vanilla JS is sufficient for everything specified. Optional enhancement: use `GSAP` for more complex animation sequencing (card flight paths), but the CSS keyframe approach described works well.

**Randomness**: `Math.random()` is sufficient for a classroom project, but note it is not cryptographically secure. For a real casino this would matter; for education, it's fine.

**State persistence**: Use `localStorage` to save the player's balance between sessions. Reset when balance reaches $0 (show a "rebuy" modal).

**Performance**: The particle canvas should be sized to `window.innerWidth × window.innerHeight` and positioned `fixed` with `pointer-events: none` so it overlays everything without blocking clicks.

**The Psychology Connection**: The spec intentionally applies the casino design principles from your research: the warm/dark color palette replicates the "timeless" ambient effect; the spotlight radial gradient mimics overhead casino lighting; particle bursts on wins mirror the "Win Flash" Pavlovian trigger; LDW-style sound design (triumphant sounds even on small wins relative to bet) can be demonstrated as an educational toggle. Consider adding a "Casino Mode vs. Reality Mode" toggle that switches the sound design between LDW behavior and accurate win/loss sounds — this would make an excellent classroom demonstration.
