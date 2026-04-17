# Blackjack AI Agent — spec.md

## Project Overview

A browser-based blackjack game with a layered AI advisor system. The player can request
help at four escalating levels of intelligence, each powered by the OpenAI API. The app
also includes strategy visualization, performance analytics, explainability controls,
and risk tolerance settings.

This project is a personal assignment. The API key lives in a local `.env` file and is
never committed to version control.

---

## File Structure

```
blackjack-ai-agent/
├── index.html
├── styles.css
├── script.js
├── assets/
│   └── favicon.png          (or .ico)
├── .env                     ← NEVER commit this
├── .gitignore
└── README.md
```

### .gitignore (required entries)

```
.env
TEMP-FOLDER*/
temp/
node_modules/
*.log
```

> **CRITICAL:** The `.env` file and any temp folders must NEVER be pushed to GitHub.
> If accidentally committed, immediately rotate the API key and purge the commit from
> history using `git filter-branch` or BFG Repo-Cleaner.

---

## Favicon

Place `favicon.png` (or `favicon.ico`) in the project root or `assets/` folder.
Link it in the `<head>` of `index.html`:

```html
<link rel="icon" type="image/png" href="assets/favicon.png">
<!-- fallback for older browsers -->
<link rel="shortcut icon" href="assets/favicon.ico">
```

Recommended size: 32×32px or 64×64px.

---

## Build Requirements

- **Vanilla HTML, CSS, and JavaScript only.** No React, no Vue, no frameworks,
  no Tailwind, no build tools.
- Three separate files: `index.html`, `styles.css`, `script.js`.
- All assets in the `assets/` directory.

---

## API Integration

### Provider

**OpenAI only.** No other providers are to be used.

### Authentication

The API key is read from a `.env` file located in the project root on the developer's
local machine:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Reference the key loading pattern from the TEMP-FOLDER in the existing project.
> Access via `process.env.OPENAI_API_KEY` or the equivalent method used there.
> **The key is never hard-coded in JS, never logged, and never committed.**

### Model

Use `gpt-4o`. Store the model name as a constant at the top of `script.js` for easy
swapping:

```js
const OPENAI_MODEL = "gpt-4o";
```

### Request Format

Use the OpenAI Chat Completions endpoint: `POST https://api.openai.com/v1/chat/completions`

Mirror the calling method and API insertion pattern from the existing TEMP-FOLDER project.
The request body follows this structure:

```js
{
  model: OPENAI_MODEL,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  max_tokens: 600
}
```

Parse the response from `data.choices[0].message.content`.

---

## Blackjack Game — Core Rules

Standard single-deck blackjack:

- Player starts with two cards; dealer shows one card face-up, one face-down.
- Player actions: **Hit**, **Stand**, **Double Down**, **Split** (when eligible).
- Dealer hits on soft 16 and below, stands on soft 17 and above.
- Blackjack pays 3:2.
- Aces count as 1 or 11 (soft/hard hand logic required).
- Basic bust and win/loss/push resolution.
- The game must expose its full internal state as a serializable JS object at all
  times (see AI Integration below).

### Deck Management

- Track remaining cards in the shoe throughout the session.
- This is required for Level 3 (Count Aware) and Level 4 (Oracle) AI modes.
- Expose a `getDeckState()` function that returns the current shoe contents as an
  array or frequency map.

---

## AI Advisor — Four Levels of Help

The player can invoke the AI advisor at any decision point (before hitting, standing, etc.).
A level selector (dropdown or segmented control) is always visible in the UI.

### Level 1 — The Textbook

**No API call.** Pure lookup table.

- Implements a standard basic strategy chart in JS.
- Takes player hand total, dealer upcard, and whether the hand is soft/hard/pair.
- Returns the optimal move instantly with no latency.
- Label: *"The Textbook"*

### Level 2 — The Statistician

**API call.** Probabilistic reasoning in plain English.

Prompt includes:
- Player hand total and composition
- Dealer upcard
- Remaining cards in shoe (count by value, not exact contents)
- Current risk tolerance setting

The model reasons about odds and explains *why* — not just what. Output is a short
paragraph of advice.

Label: *"The Statistician"*

### Level 3 — The Counter

**API call.** Count-aware strategy with deviation logic.

Prompt includes everything in Level 2, plus:
- Running count and true count (calculated by the game)
- Count-based deviation flags (e.g., "true count +3, Insurance becomes profitable")

The model advises with count-adjusted deviations from basic strategy and flags when
the count is making a meaningful difference.

Label: *"The Counter"*

### Level 4 — The Oracle**

**API call.** Perfect information. God mode.

Prompt includes everything above, plus:
- **The exact remaining card contents of the shoe** (every card still in play)

The model calculates the mathematically perfect move for this specific hand in this
specific shoe state. This is only possible because the game is self-contained and
the full deck state is accessible.

Label: *"The Oracle"*

> Note: The Oracle does not simulate future dealer draws probabilistically — it
> reasons from exact remaining deck contents to the highest EV move.

---

## Explainability Controls

A settings panel or sidebar controls how the AI communicates:

### Verbosity Toggle

Three levels the player can switch between at any time:

- **Terse** — Single word or short phrase. e.g., *"Hit."*
- **Normal** — One sentence with reasoning. e.g., *"Hit — you can't bust and the dealer likely has 17+."*
- **Verbose** — Full paragraph. Walks through the reasoning step by step.

Include the selected verbosity level in every API prompt as an instruction.

### Debate Mode

After the player makes a move, a toggle can fire a follow-up API call that argues
*the other side* — devil's advocate style. e.g., "Here's why Standing wasn't crazy..."

This is a secondary call, not the primary advice call.

### Confidence Indicator

Display a confidence level alongside each AI recommendation:
- Levels: Low / Medium / High / Certain
- For Levels 1 and 4, confidence is always "Certain" (deterministic / perfect info).
- For Levels 2 and 3, instruct the model to return a confidence tag (parse from response).

---

## Strategy Visualization

### Live Basic Strategy Grid

Display the standard basic strategy matrix (player total vs. dealer upcard) on screen.
Highlight the current hand's cell in real time as the hand plays out.

Color coding:
- Green = Stand
- Red = Hit
- Yellow = Double Down
- Blue = Split
- The active cell pulses or is distinctly highlighted.

### Deviation Heatmap (Level 3 / 4 only)

A toggle that overlays the strategy grid with a heatmap showing where the AI's
count-adjusted or oracle advice *diverges* from basic strategy.
- Cells where advice differs from the chart glow orange.
- Appears only when Level 3 or 4 is selected.

---

## Performance Analytics

Displayed as a collapsible panel or dedicated tab, updating after each hand.

### Metrics to Track

- **Session EV tracker** — Running expected value based on decisions made vs. optimal.
- **Decision accuracy score** — Percentage of moves that matched optimal (Level 1 chart).
- **Bankroll graph** — Line chart of chip count over the session (hand-by-hand).
- **Mistake log** — A scrollable list of every sub-optimal decision with a one-line
  explanation of what the optimal move was and why.
- **Hands played / Won / Lost / Pushed** — Running totals.

### Post-Hand Debrief

After every hand resolves, a collapsible panel appears below the table that:
- Scores each decision in the hand (Optimal / Acceptable / Mistake)
- Highlights the key decision moment
- Shows what the Oracle would have done differently, if anything

---

## Risk Tolerance Settings

A settings control (slider or segmented selector) with three levels:

| Setting | Behavior |
|---|---|
| **Conservative** | Minimize variance. Avoid doubles/splits unless EV advantage is large. Prioritize survival. |
| **Neutral** | Standard EV-maximizing strategy. |
| **Aggressive** | Maximize upside. Favor doubles, splits, and higher-variance plays. |

A fourth toggle:

- **Bankroll-Aware Mode** — When enabled and the player's stack drops below 20% of
  starting chips, the AI automatically shifts toward conservative play regardless of
  the set risk level. AI prompt includes bankroll context when this mode is on.

Pass the risk tolerance setting into every API prompt as a behavioral instruction.

---

## Stretch Features

These are ambitious additions — implement core features first.

### Teaching Mode

The AI never gives the answer directly. Instead it asks:
*"What do you think you should do here, and why?"*
The player types or selects a response. The AI then grades their reasoning and
explains the correct answer. Toggle on/off from settings.

### Personality Skins for the AI Advisor

Three selectable advisor personas that change the tone and style of all API responses:

- **The MIT Counter** — Curt, precise, no small talk. Numbers only.
- **The Vegas Dealer** — Jovial, slightly taunting, entertained by your mistakes.
- **The Nervous Tourist** — Anxious, uncertain, but trying their best. Humanizing and funny.

Include the persona in the system prompt for all API calls.

### Shoe Penetration Warning

When fewer than 25% of cards remain in the shoe, display a visible warning:
*"Deck running low — count-based advice less reliable."*
Optionally prompt a reshuffle.

### Session Export

Export the full session as a `.json` file:
- Every hand played
- Every decision made
- AI recommendations given
- Final analytics summary

Useful for review and self-study.

### Animated Card Dealing

CSS-based card deal animation — cards slide in from a deck position to the table.
No canvas required. Pure CSS `transform` and `transition`.

### WebGL Table Felt

Optional: render the blackjack table felt as a WebGL canvas background with a subtle
cloth texture shader. The rest of the UI sits on top of it. Toggle off for
performance if needed.

### Sound Design

Subtle audio feedback using the Web Audio API (no external files):
- Soft card flip on deal
- Chip clink on bet
- Win/loss tones

---

## UI Design Direction

Research comparable sites: 888 Casino, Bovada, PokerStars, Wizard of Odds strategy
trainer, and Blackjack Apprenticeship.

**Recommended direction:** Dark casino-green felt aesthetic with gold accents.
Cards should look like real playing cards (clean, minimal, legible). The AI advisor
panel lives on the right side or as a drawer. Analytics live below the table or
in a tabbed panel. Avoid garish, Las Vegas-neon overdesign — lean toward a
sophisticated private club feel.

Key UI principles:
- The game table is always the hero element — centered, dominant.
- AI advisor controls are secondary — accessible but not in the way.
- Analytics and settings collapse by default.
- High contrast text on dark backgrounds. No mid-gray muddiness.

---

## Notes for the Builder

- The game's internal state object should be fully serializable at all times.
  The AI levels pass slices of this state object into their prompts.
- Level 1 (Textbook) is synchronous — no loading state needed.
- Levels 2–4 should show a brief loading indicator while the API call resolves.
- All API calls go through a single `callAdvisor(level, gameState, settings)`
  function to keep the calling pattern consistent and easy to modify.
- Verbosity, risk tolerance, and persona settings are passed into every call
  from a global settings object.
- The deck state (for Levels 3 and 4) must be maintained accurately throughout
  the session. A simple array of remaining cards, decremented on each deal, is sufficient.
