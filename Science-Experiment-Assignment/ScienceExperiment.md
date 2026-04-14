# ScienceExperiment — spec.md

## Overview

A web application that generates age-appropriate science experiments based on
the user's grade level and available household supplies. Experiments are
generated via the OpenAI API and include safety guidance, supply substitutions,
a "why this works" explanation, and a printable observation worksheet. Saved
experiments persist locally, and a library of common supplies with visual
references makes selection fast.

---

## Tech Stack & File Structure

- **Vanilla HTML, CSS, and JavaScript only.** No frameworks (no React, no Vue,
  no Tailwind, no build step).
- Separate files — all three sit at the project root.

```
/
├── index.html
├── styles.css
├── script.js
├── assets/
│   ├── favicon.svg
│   ├── supplies/            # supply reference images
│   └── textures/            # parchment, ink, paper textures
├── .gitignore
├── .env                     # LOCAL ONLY — NEVER COMMITTED
└── ScienceExperiment.md     # this spec
```

### Favicon
- Place `favicon.svg` in `/assets/`.
- Linked in `<head>` of `index.html`:
  ```html
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
  ```
- Suggested design: an ink-well silhouette or a stylized beaker drawn in the
  same lab-notebook aesthetic as the rest of the site.

### `.gitignore` (required entries)
The following **must never** be pushed to GitHub under any circumstance:

```
# Environment & secrets
.env
.env.*
*.env

# Temp / scratch folders
temp/
tmp/
TEMPFOLDER/
TEMPFOLDERs/
/temp
/scratch

# OS / editor junk
.DS_Store
Thumbs.db
.vscode/
.idea/
*.log
node_modules/
```

---

## Reference Code — Temp Folder

A reference implementation of the API-key-loading pattern lives in the local
temp folder (the "LLM Switchboard" project). **That temp folder is gitignored
and must not be pushed.** The builder should re-implement the pattern
described below rather than import from it.

Key patterns to reuse (do **not** copy files — reimplement):

- **`KeyVault` module** (`keys.js` pattern): an in-memory-only object storing
  `openai` and `anthropic` keys. Never persists. Exposes `set`, `get`, `has`,
  `mask`, `parseFile`, `loadFromFile`.
- **`.env`/`.csv` parsing**: reads `OPENAI_API_KEY=sk-...` lines (also
  supports `OPENAI,sk-...` CSV format). Strips quotes, ignores `#` comments.
- **Provider caller** (`providers.js` pattern): `callOpenAI({ apiKey, model,
  prompt, temperature, maxTokens, systemPrompt })` that POSTs to
  `https://api.openai.com/v1/chat/completions` with `Authorization: Bearer
  <key>`. Returns `{ text, usage }`.
- **Masked input + ✅/❌ status indicator** in the UI for key loading.

The ScienceExperiment app only needs **OpenAI** — drop the Anthropic path.

---

## API Keys

- Loaded at runtime via a **"Load .env"** file-picker button (user selects
  their local `.env` file; browser reads it client-side). Manual paste also
  supported via a masked password input.
- Stored **in memory only** (a module-scoped object). Wiped on page reload.
- **Never** written to `localStorage`, `sessionStorage`, cookies, URL params,
  or anywhere else on disk.
- Send button is disabled until a key is loaded.
- Privacy notice visible near the key input: *"Your key stays in memory only.
  Nothing is saved, logged, or sent anywhere but OpenAI."*

---

## Core Feature: Experiment Generation

### Inputs
1. **Grade Tier** (5 buttons, required):
   - K–2 (Ages 5–7)
   - 3–5 (Ages 8–10)
   - 6–8 (Ages 11–13)
   - 9–12 (Ages 14–18)
   - College / Adult

2. **Available Supplies** (required, at least 1):
   - Quick-select chips for common household supplies (see Predefined
     Supplies List below).
   - Free-text input for supplies not in the predefined list.
   - Selected supplies appear as removable chips.

3. **Optional: Topic/Concept Preference** — free-text field (e.g., "magnets,"
   "surface tension") the user may leave blank for a surprise.

### Output (a single experiment per generation)
- **Title**
- **Concept tag(s)** (chemistry, physics, biology, earth science, engineering)
- **Difficulty rating** (1–5 beakers)
- **Time estimate** (active + total)
- **Mess rating** (1–5 sponges 🧽)
- **Supervision level** (Adult required / Adult recommended / Independent OK)
- **Materials list** (with substitution notes inline)
- **Step-by-step procedure**
- **"Why this works"** — grade-appropriate scientific explanation
- **Safety notes** — explicit cautions for this specific experiment

### Generation Flow
1. User picks grade tier, selects/enters supplies, optionally enters topic.
2. Clicks **Generate**.
3. App sends a structured prompt to OpenAI (model: `gpt-4o-mini` default,
   with a dropdown to upgrade to `gpt-4o`).
4. Response is requested as **JSON** (`response_format: { type:
   "json_object" }`) matching a fixed schema. This ensures reliable parsing.
5. Response is validated client-side against the safety blocklist (see
   below).
6. If safe → render the experiment card.
7. If unsafe → discard, re-prompt the API once with a stronger safety
   constraint, and show a user-facing notice if it still fails.

---

## Safety Framework (first-class requirement)

### 1. Acknowledged Disclaimer (first visit)
On first load, show a modal requiring the user to check:
> *"I understand that AI-generated experiments may contain errors. I will
> review each experiment before performing it, supervise children at all
> times, and never attempt experiments involving listed hazardous
> combinations."*

The acknowledgement is stored in `localStorage` (`science_disclaimer_ack:
true`). If not set, the app is read-only.

### 2. Constrained Prompting
The system prompt sent to OpenAI includes:
- Grade tier → explicit age range and language-level guidance.
- **Hard prohibitions**: no experiments involving bleach, ammonia, drain
  cleaner, acids, bases, open flames without adult supervision, consumption
  of non-food items, electrical mains power, combustion, compressed gases,
  sharp blades for K-5, or pharmaceuticals.
- Require that the model **return** a `supervision_level` field and
  `safety_notes` array — these are non-optional in the JSON schema.

### 3. Post-Generation Blocklist Check
Before rendering, the client scans the materials list and procedure text for
a hardcoded blocklist of dangerous combinations and substances. If any match,
the experiment is rejected and regenerated.

Blocklist seed (expand as needed):
```
bleach + ammonia
bleach + vinegar
bleach + rubbing alcohol
hydrogen peroxide + vinegar + heat
drain cleaner
lye / sodium hydroxide
lithium battery (puncture/heat)
mercury
lead
mothballs
gasoline / lighter fluid (ignited)
pool chlorine
```

### 4. Grade-Appropriate Supervision Flags
Every rendered experiment shows a prominent badge:
- 🟢 Independent OK (age-appropriate for solo work)
- 🟡 Adult Recommended
- 🔴 Adult Required

For K-2 and 3-5 tiers, the system prompt biases toward 🟡/🔴 outputs.

### 5. Disclaimer Footer
Persistent footer: *"AI-generated experiments. Review before performing.
Always supervise children. Not a substitute for professional science
instruction."*

---

## Predefined Supplies List

Organized into collapsible categories. Each supply has a small reference
image (`/assets/supplies/<slug>.png` or `.svg`).

### Kitchen
- Baking soda, vinegar, salt, sugar, cornstarch, food coloring, dish soap,
  vegetable oil, lemon juice, eggs, milk, flour, yeast, coffee filters,
  ziplock bags, paper cups, paper towels, aluminum foil, plastic wrap

### Bathroom
- Hydrogen peroxide (3%), rubbing alcohol, Epsom salt, cotton balls, cotton
  swabs, toothpaste, shampoo, mouthwash

### Craft / Office
- Paper (white, colored, construction), tape (scotch, masking, duct),
  scissors (safety), glue (white, stick), markers, crayons, string/yarn,
  rubber bands, paperclips, balloons, straws, popsicle sticks, pipe cleaners

### Garage / Tools
- Magnets, batteries (AA, 9V), copper wire, LEDs, nails, screws, sandpaper,
  ruler, measuring cups, thermometer

### Outdoors / Natural
- Leaves, rocks, soil, sand, water, ice, sticks, pinecones

Each chip: click to add to selection, click again to remove. A small "?"
button on each chip opens a tooltip with the reference image.

---

## Supply Substitution

When the API returns a materials list, for each item marked with a
`substitutes` array in the JSON response, render a small **"No ___? Try
instead:"** chip-list inline beneath the material. The prompt instructs the
model to provide 1–3 realistic substitutes per item where possible.

Example:
> **Baking soda** — *No baking soda? Try: baking powder (use 3× the amount),
> Alka-Seltzer tablet.*

---

## Saved Experiments

- Stored in `localStorage` under `science_experiments`.
- **Cap: 25 experiments.** When full, adding a 26th evicts the oldest (FIFO).
- Each saved entry stores: the full experiment JSON, generation timestamp,
  grade tier, and a user-editable nickname.
- **Saved Experiments drawer** slides in from the right:
  - List view with title, grade tier pill, concept tags, difficulty beakers,
    and date saved.
  - Click to re-open in the main view.
  - **Filter by concept tag** (chemistry / physics / biology / etc.).
  - **Search** across titles.
  - Delete button per item (with confirmation).
  - **Export All** button → downloads JSON backup of all saved experiments.

---

## Printable Observation Worksheet

Each experiment has a **"Print Worksheet"** button that opens a
print-optimized view (`@media print` CSS). The worksheet uses the scientific
method as scaffolding:

1. **Header** — experiment title, student name field, date field, grade
2. **Question** — what are we trying to find out? (auto-filled from the
   experiment's core question)
3. **Hypothesis** — lined space for the student to write a prediction
4. **Materials** — bulleted list from the generated experiment
5. **Procedure** — numbered steps from the generated experiment
6. **Observations** — grid of lined boxes for notes + sketch area
7. **Results / Data** — blank table the student fills in
8. **Conclusion** — lined space for the student's findings
9. **"Why this works"** section — included only on the teacher/parent copy
   (toggle button: Student Copy vs. Teacher Copy)

Print styles: clean black-on-white, serif body font, no background
textures, generous margins, page-break controls between sections.

---

## Remix Feature

On any rendered experiment, a **🔀 Remix** button re-calls the API with:
- Same supplies
- Same grade tier
- Prompt modifier: *"Generate a different experiment exploring a different
  scientific concept using the same materials."*
- Optional "Keep concept, change approach" toggle.

---

## Voice-Read Procedure

Each procedure step has a small **🔊** button. Uses the browser's
`SpeechSynthesis` Web API (no external service).
- Global **"Read all steps"** button reads the full procedure sequentially,
  pausing briefly between steps.
- **Stop** button always visible during playback.
- Voice and rate selectable in a small settings popover (uses
  `speechSynthesis.getVoices()`).

---

## UI Direction: "The Lab Notebook"

### Aesthetic
A warm, tactile Victorian naturalist's notebook. Cream parchment
backgrounds, subtle paper grain texture, hand-inked borders, serif display
type paired with monospace for step-by-step "typewritten" procedure text.

### Palette
- Parchment cream: `#F4EDDF`
- Aged paper shadow: `#E8DFC9`
- Ink black: `#1E1A14`
- Sepia secondary text: `#6B5B45`
- Oxblood accent (buttons, ratings, alerts): `#7A2E2E`
- Ink-blue accent (links, info): `#2E4A7A`
- Rule-line muted: `#C4B8A0`

### Typography
- **Display / headers:** A classical serif — *Libre Caslon Text*, *Cormorant
  Garamond*, or *EB Garamond* (Google Fonts, free).
- **Body:** *Lora* or *Crimson Pro*.
- **Procedure steps / "typed" content:** *Special Elite* or *Courier Prime*
  for a typewriter feel.
- **Grade-level badges / tags:** Small caps, letter-spaced.

### Key UI Elements
- **Parchment page container** with subtle shadow, dog-eared corner on
  hover, faint horizontal rule-lines behind body text.
- **Grade tier selector** styled as ink-stamp badges ("K-2", "3-5", etc.)
  with a slight rotation for hand-placed feel.
- **Supply chips** as torn-paper tags with twine-like borders.
- **Generate button** styled as a wax seal — circular, oxblood, with an
  embossed "G" or beaker icon.
- **Difficulty rating**: 1–5 inked beaker icons.
- **Mess rating**: 1–5 inked sponge icons.
- **Concept tags**: rubber-stamp style (slightly rotated, slightly faded
  ink).
- **Saved drawer**: slides in as a ribbon bookmark from the right edge.
- **Worksheet preview**: actual lined-paper background with a red margin
  line, blue horizontal rules.

### Signature Touch
Streamed API responses "write themselves" onto the page character-by-character,
as if being inked in real time. A small ink-pen SVG "writes" along the
current line. Pauses between paragraphs as if the author is thinking.

### Micro-interactions
- Hover on an experiment card: the dog-eared corner lifts slightly.
- Click Remix: a subtle page-flip animation.
- Errors appear as small red ink blotches with a crossed-out word.

---

## OpenAI Request Schema

**Model:** `gpt-4o-mini` (default), `gpt-4o` (upgrade option).

**Request:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "<system prompt with grade-tier constraints, safety prohibitions, JSON-only directive>" },
    { "role": "user", "content": "<user prompt with supplies, grade tier, optional topic>" }
  ],
  "response_format": { "type": "json_object" },
  "temperature": 0.8,
  "max_tokens": 1500
}
```

**Expected JSON response shape:**
```json
{
  "title": "string",
  "concept_tags": ["chemistry" | "physics" | "biology" | "earth_science" | "engineering"],
  "difficulty": 1,
  "time_active_minutes": 15,
  "time_total_minutes": 30,
  "mess_rating": 2,
  "supervision_level": "adult_required" | "adult_recommended" | "independent_ok",
  "grade_tier": "K-2" | "3-5" | "6-8" | "9-12" | "college",
  "question": "string — the scientific question being explored",
  "hypothesis_prompt": "string — what the student should predict",
  "materials": [
    {
      "name": "string",
      "quantity": "string",
      "substitutes": ["string"]
    }
  ],
  "procedure": ["string", "string", "..."],
  "expected_observations": "string",
  "why_it_works": "string — grade-appropriate explanation",
  "safety_notes": ["string", "..."]
}
```

Client-side validator (lifted from the Switchboard's `SchemaValidator`
pattern) confirms all required fields exist before rendering. Missing or
malformed → one retry, then user-facing error.

---

## Error Handling

| Scenario | User-Facing Message |
|---|---|
| No API key | "Load your OpenAI key to start generating experiments." |
| Invalid key (401) | "Your API key was rejected. Check it and try again." |
| Rate limit (429) | "You've hit OpenAI's rate limit. Wait a moment and retry." |
| Network timeout | "Request timed out. Check your connection." |
| Safety blocklist hit | "The generated experiment didn't pass our safety check. Trying again..." (auto-retry once) |
| Malformed JSON | "Got an unexpected response. Trying again..." (auto-retry once) |
| No supplies selected | "Add at least one supply to get started." |
| localStorage full (>25) | "Your saved experiments are full. Oldest will be replaced — continue?" |

---

## Stretch Features (all required for this build)

1. **Save & Display Previously Generated Experiments** — localStorage, cap
   25, FIFO eviction. Drawer UI with filter & search.
2. **Predefined Household Supplies Quick-Select** — categorized chip list.
3. **Supply Reference Images** — each predefined supply has a small
   illustrative image shown in tooltips and the worksheet.
4. **Supply Substitution** — API-driven alternatives rendered inline beneath
   each material.
5. **Printable Observation Worksheet** — `@media print` scientific-method
   scaffold, Student Copy and Teacher Copy variants.
6. **Difficulty Ratings** — 1–5 inked beakers, rendered and filterable.
7. **Remix** — regenerate with same supplies + tier.
8. **Scientific Method Scaffolding** — baked into the worksheet.
9. **Time Estimate & Mess Rating** — visible on every experiment card.
10. **"Why this works" Expandable Section** — collapsed by default on the
    card, always included in worksheet Teacher Copy.
11. **Printable Experiment Cards** — a PDF/PNG-style card with nice
    typography for the fridge (use `window.print()` on a single-card
    layout or `html2canvas` if needed — but prefer print CSS).
12. **Concept Tagging + Filterable Saved View** — tags rendered as
    rubber-stamp chips, filter dropdown in the saved drawer.
13. **Voice-Read Procedure** — Web Speech API, per-step and read-all.

---

## Deliverable

- `index.html`, `styles.css`, `script.js`, and `assets/` folder.
- `.gitignore` configured per spec.
- `.env` present locally, excluded from git.
- Deployed to GitHub Pages (or equivalent static host).
- Safety disclaimer acknowledgment gate on first visit.
