// Deck Construction & Shuffle
const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

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

// Get the PNG filename for a card
function getCardImagePath(card) {
  const valueNames = {
    'A': 'ace', '2': '2', '3': '3', '4': '4', '5': '5',
    '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
    'J': 'jack', 'Q': 'queen', 'K': 'king'
  };
  const valueName = valueNames[card.value];
  return `PNG-cards-1.3/PNG-cards-1.3/${valueName}_of_${card.suit}.png`;
}

// Cut card position (~75% through the shoe)
function getCutCardIndex(shoeSize) {
  return Math.floor(shoeSize * 0.75);
}
