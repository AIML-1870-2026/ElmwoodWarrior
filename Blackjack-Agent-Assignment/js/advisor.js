// ============================================================
// advisor.js — Four-Level AI Advisor System
// Level 1: The Textbook (local lookup, no API)
// Level 2: The Statistician (API - probabilistic reasoning)
// Level 3: The Counter (API - count-aware deviations)
// Level 4: The Oracle (API - perfect information)
// ============================================================

const AdvisorSettings = {
  level: 1,
  verbosity: 'normal',     // 'terse', 'normal', 'verbose'
  riskTolerance: 'neutral', // 'conservative', 'neutral', 'aggressive'
  bankrollAware: false,
  debateMode: false,
  teachingMode: false,
  persona: 'none',          // 'none', 'mit', 'vegas', 'tourist'
};

const PERSONA_PROMPTS = {
  none: '',
  mit: 'You are The MIT Counter — curt, precise, no small talk. Numbers only. Speak like a professional card counter from MIT. Be concise and clinical.',
  vegas: 'You are The Vegas Dealer — jovial, slightly taunting, entertained by the player\'s mistakes. Use colorful Vegas slang. Be fun but still give correct advice.',
  tourist: 'You are The Nervous Tourist — anxious, uncertain, but trying your best. Second-guess yourself. Be endearing and human. Still give correct advice despite your nervousness.',
};

const VERBOSITY_INSTRUCTIONS = {
  terse: 'Respond with ONLY the recommended action as a single word or very short phrase (e.g., "Hit." or "Stand — soft 18 vs dealer 9."). No explanation.',
  normal: 'Respond with the recommended action followed by one sentence of reasoning. Keep it concise.',
  verbose: 'Respond with a full paragraph. Walk through your reasoning step by step. Explain the probabilities and why this is the best play.',
};

const RISK_INSTRUCTIONS = {
  conservative: 'The player prefers CONSERVATIVE play. Minimize variance. Avoid doubles/splits unless the EV advantage is very large. Prioritize survival and bankroll preservation.',
  neutral: 'The player uses NEUTRAL/standard EV-maximizing strategy. Recommend the highest expected value play.',
  aggressive: 'The player prefers AGGRESSIVE play. Maximize upside. Favor doubles, splits, and higher-variance plays when the edge is present.',
};

/**
 * Main entry point: get advice from the selected level.
 * Returns { action, text, confidence, level }
 */
async function callAdvisor(level, gameState, settings) {
  if (level === 1) return callLevel1(gameState);
  const model = getSelectedModel();
  if (!KeyVault.hasForProvider(model.provider)) {
    return {
      action: 'N/A',
      text: `No ${model.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key loaded. Please enter your key or load your .env file to use AI advisor levels 2-4.`,
      confidence: 'low',
      level
    };
  }
  if (level === 2) return callLevel2(gameState, settings);
  if (level === 3) return callLevel3(gameState, settings);
  if (level === 4) return callLevel4(gameState, settings);
}

// ======================== LEVEL 1: THE TEXTBOOK ========================
function callLevel1(gameState) {
  const hand = gameState.playerHands[gameState.activeHandIndex];
  const dealerUp = gameState.dealerHand[0];
  const action = getHint(hand.cards, dealerUp);

  return {
    action,
    text: `Basic strategy says: ${action}`,
    confidence: 'certain',
    level: 1
  };
}

// ======================== LEVEL 2: THE STATISTICIAN ========================
async function callLevel2(gameState, settings) {
  const hand = gameState.playerHands[gameState.activeHandIndex];
  const dealerUp = gameState.dealerHand[0];
  const deckState = getDeckState();

  const systemPrompt = buildSystemPrompt(2, settings);
  const userPrompt = `
Current hand: ${describeHand(hand.cards)}
Dealer showing: ${dealerUp.value}
Remaining cards in shoe (by value): ${JSON.stringify(deckState)}
Cards remaining: ${gameState.shoe.length}
Player balance: $${gameState.balance}
Current bet: $${hand.bet}

What should I do: Hit, Stand, Double, or Split?
Include a confidence tag at the end: [Confidence: Low/Medium/High/Certain]
  `.trim();

  const result = await callAI({
    apiKey: KeyVault.getForProvider(getSelectedModel().provider),
    model: getSelectedModel().id,
    systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
    maxTokens: settings.verbosity === 'verbose' ? 400 : 200
  });

  return parseAdvisorResponse(result.text, 2);
}

// ======================== LEVEL 3: THE COUNTER ========================
async function callLevel3(gameState, settings) {
  const hand = gameState.playerHands[gameState.activeHandIndex];
  const dealerUp = gameState.dealerHand[0];
  const deckState = getDeckState();
  const deviations = getCountDeviations();

  const systemPrompt = buildSystemPrompt(3, settings);
  const userPrompt = `
Current hand: ${describeHand(hand.cards)}
Dealer showing: ${dealerUp.value}
Remaining cards in shoe (by value): ${JSON.stringify(deckState)}
Cards remaining: ${gameState.shoe.length}
Running count: ${getRunningCount()}
True count: ${getTrueCount()}
Active count deviations: ${deviations.length > 0 ? deviations.join('; ') : 'None active'}
Player balance: $${gameState.balance}
Current bet: $${hand.bet}

Based on the count and any applicable deviations from basic strategy, what should I do?
Flag when the count is making a meaningful difference vs basic strategy.
Include a confidence tag at the end: [Confidence: Low/Medium/High/Certain]
  `.trim();

  const result = await callAI({
    apiKey: KeyVault.getForProvider(getSelectedModel().provider),
    model: getSelectedModel().id,
    systemPrompt,
    prompt: userPrompt,
    temperature: 0.6,
    maxTokens: settings.verbosity === 'verbose' ? 500 : 250
  });

  return parseAdvisorResponse(result.text, 3);
}

// ======================== LEVEL 4: THE ORACLE ========================
async function callLevel4(gameState, settings) {
  const hand = gameState.playerHands[gameState.activeHandIndex];
  const dealerUp = gameState.dealerHand[0];
  const deckState = getDeckState();
  const deckContents = getDeckContents();

  const systemPrompt = buildSystemPrompt(4, settings);
  const userPrompt = `
Current hand: ${describeHand(hand.cards)}
Dealer showing: ${dealerUp.value}
Dealer hole card: UNKNOWN (but you know the exact remaining deck)
Running count: ${getRunningCount()}
True count: ${getTrueCount()}
Remaining cards by value: ${JSON.stringify(deckState)}
EXACT remaining deck contents (${deckContents.length} cards): ${deckContents.join(', ')}
Player balance: $${gameState.balance}
Current bet: $${hand.bet}

You have PERFECT information about every card remaining in the shoe.
Calculate the mathematically optimal move considering exact probabilities.
What should I do: Hit, Stand, Double, or Split?
  `.trim();

  const result = await callAI({
    apiKey: KeyVault.getForProvider(getSelectedModel().provider),
    model: getSelectedModel().id,
    systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
    maxTokens: settings.verbosity === 'verbose' ? 600 : 300
  });

  return parseAdvisorResponse(result.text, 4);
}

// ======================== DEBATE MODE ========================
async function callDebate(playerMove, gameState, settings) {
  if (!KeyVault.hasForProvider(getSelectedModel().provider)) return null;

  const hand = gameState.playerHands[gameState.activeHandIndex];
  const dealerUp = gameState.dealerHand[0];

  const systemPrompt = `You are a blackjack devil's advocate. The player just made a move and you must argue the OTHER side — why the opposite move might have been reasonable. Be thought-provoking but fair. ${PERSONA_PROMPTS[settings.persona] || ''} ${VERBOSITY_INSTRUCTIONS[settings.verbosity]}`;

  const userPrompt = `
The player chose to ${playerMove} with hand: ${describeHand(hand.cards)} vs dealer showing ${dealerUp.value}.
Argue why a different move (NOT ${playerMove}) could have been the better choice. Play devil's advocate.
  `.trim();

  const result = await callAI({
    apiKey: KeyVault.getForProvider(getSelectedModel().provider),
    model: getSelectedModel().id,
    systemPrompt,
    prompt: userPrompt,
    temperature: 0.8,
    maxTokens: 200
  });

  return result.text;
}

// ======================== HELPERS ========================
function buildSystemPrompt(level, settings) {
  const parts = [];

  if (level === 2) {
    parts.push("You are an expert blackjack statistician advisor. You analyze probabilities and explain the reasoning behind optimal plays. Focus on the odds and percentages.");
  } else if (level === 3) {
    parts.push("You are an expert blackjack advisor who specializes in card counting (Hi-Lo system). You know when to deviate from basic strategy based on the true count. Flag when the count changes the optimal play.");
  } else if (level === 4) {
    parts.push("You are The Oracle — a blackjack advisor with perfect information. You have access to the EXACT remaining contents of the shoe. Calculate the mathematically perfect move for maximum expected value. Your confidence is always Certain.");
  }

  parts.push(VERBOSITY_INSTRUCTIONS[settings.verbosity]);
  parts.push(RISK_INSTRUCTIONS[settings.riskTolerance]);

  if (settings.bankrollAware && GameState.balance < GameState.startingBalance * 0.2) {
    parts.push("IMPORTANT: The player's bankroll is critically low (below 20% of starting). Shift toward conservative play regardless of their risk setting. Prioritize survival.");
  }

  if (settings.persona && settings.persona !== 'none') {
    parts.push(PERSONA_PROMPTS[settings.persona]);
  }

  parts.push("Always start your response with the recommended action on its own line (e.g., 'Hit', 'Stand', 'Double', 'Split').");

  return parts.join('\n\n');
}

function parseAdvisorResponse(text, level) {
  // Extract the action from the first word/line
  const firstLine = text.split('\n')[0].trim();
  const actionMatch = firstLine.match(/^(Hit|Stand|Double|Split)/i);
  const action = actionMatch ? actionMatch[1] : 'Unknown';

  // Extract confidence tag
  let confidence = level === 4 ? 'certain' : 'medium';
  const confMatch = text.match(/\[Confidence:\s*(Low|Medium|High|Certain)\]/i);
  if (confMatch) {
    confidence = confMatch[1].toLowerCase();
  }

  // Clean the text (remove the confidence tag)
  const cleanText = text.replace(/\[Confidence:\s*(Low|Medium|High|Certain)\]/i, '').trim();

  return { action, text: cleanText, confidence, level };
}
