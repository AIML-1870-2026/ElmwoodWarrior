// ============================================================
// deck.js — Deck Construction, Shuffle & Card Utilities
// ============================================================

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const SUIT_SYMBOLS = {
  spades: '\u2660',   // ♠
  hearts: '\u2665',   // ♥
  diamonds: '\u2666', // ♦
  clubs: '\u2663'     // ♣
};

const SUIT_COLORS = {
  spades: 'black',
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black'
};

function buildDeck() {
  return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
}

function buildShoe(numDecks = 1) {
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

// Cut card position (~75% through the shoe)
function getCutCardIndex(shoeSize) {
  return Math.floor(shoeSize * 0.75);
}

/**
 * Returns a frequency map of remaining cards in the shoe.
 * { "A": 3, "2": 4, "3": 4, ... "K": 4 }
 */
function getDeckState() {
  const freq = {};
  for (const v of VALUES) freq[v] = 0;
  for (const card of GameState.shoe) {
    freq[card.value]++;
  }
  return freq;
}

/**
 * Returns the full remaining shoe as an array of card descriptions.
 */
function getDeckContents() {
  return GameState.shoe.map(c => `${c.value} of ${c.suit}`);
}
