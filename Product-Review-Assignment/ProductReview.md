# ReviewCraft AI — Product Review Generator

## Specification Document

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tab Icon](#tab-icon)
3. [Tech Stack & Environment](#tech-stack--environment)
4. [Environment & Sensitive Files](#environment--sensitive-files)
5. [UI Layout & Design](#ui-layout--design)
6. [Core Features](#core-features)
7. [Stretch Features](#stretch-features)
8. [API Integration](#api-integration)
9. [Markdown Rendering](#markdown-rendering)
10. [Review History](#review-history)
11. [Component Breakdown](#component-breakdown)
12. [File Structure](#file-structure)

---

## Project Overview

ReviewCraft AI is a web application that leverages OpenAI language models to generate unique, customisable product reviews. Users provide product details, highlight complaints or liked features, select a category and review personality, then fine-tune sentiment across multiple aspects and adjust tone and length. The application returns an unstructured, markdown-rendered review with no rigid schema templates — allowing the LLM to produce natural, varied output.

---

## Tab Icon

A custom favicon must be added to the project so that the browser tab displays a recognisable icon.

1. Place a `favicon.ico` (or `favicon.png` / `favicon.svg`) file in the project's `public/` directory (or at the root, depending on framework).
2. In the main HTML file (e.g. `index.html`), add the following inside the `<head>` tag:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
```

Or for PNG/SVG formats:

```html
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

3. For best cross-browser support, include multiple sizes:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

4. Recommended: use a tool such as [RealFaviconGenerator](https://realfavicongenerator.net/) to produce all necessary sizes from a single source image.

---

## Tech Stack & Environment

- **Frontend framework:** Developer's choice (React recommended)
- **LLM provider:** OpenAI API only (no other providers)
- **Markdown rendering:** A markdown-to-HTML library (e.g. `react-markdown`, `marked`, or `markdown-it`)
- **Styling:** Developer's choice (Tailwind CSS, CSS Modules, or styled-components all acceptable)
- **Environment variables:** Loaded from a personal `.env` file at the project root

---

## Environment & Sensitive Files

### Critical: Files That Must Never Be Committed or Pushed

The following files and directories must be listed in `.gitignore` and must **never** be pushed to version control under any circumstances:

```gitignore
# Environment variables — contains API keys
.env
.env.local
.env.development
.env.production

# Temporary working folders
TEMP-FOLDER-LLM/

# Dependencies
node_modules/

# Build output
dist/
build/
```

**Directions:**

1. Before your first commit, verify that `.gitignore` exists at the project root and contains all entries listed above.
2. The `TEMP-FOLDER-LLM/` directory exists in the project folder but is **never utilised** by the application. It must remain ignored and must not be committed.
3. The `.env` file holds your personal OpenAI API key(s). It is loaded at runtime but must never leave your local machine.
4. If you have already committed any of these files by mistake, remove them from tracking immediately:

```bash
git rm --cached .env
git rm -r --cached TEMP-FOLDER-LLM/
git commit -m "Remove sensitive files from tracking"
```

### .env File Format

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The application must read `OPENAI_API_KEY` from this `.env` file. No API keys should ever be hardcoded in source files.

---

## UI Layout & Design

### General Structure

The application uses a **two-panel, side-by-side layout**:

- **Left panel — Input controls:** All user inputs, sliders, and dropdowns
- **Right panel — Output area:** The generated review with tabbed markdown view, action buttons, and review history

A **header bar** spans the top of the page containing:
- Application name and logo/icon
- Dark mode / light mode toggle
- History panel toggle

### Header

- App title: "ReviewCraft AI" with a subtitle of "Product review generator"
- Tab icon displayed in the browser tab (see Tab Icon section)
- Dark/light mode toggle button (top right)
- History sidebar toggle button (top right)

### Left Panel — Input Controls

Arranged top to bottom in the following order:

1. **Product name** — A single-line text input field. Placeholder: `e.g. Sony WH-1000XM5 Headphones`

2. **Complaints / liked features** — A multi-line textarea. Placeholder: `e.g. Great noise cancellation, battery lasts all day, a bit tight on large heads...`

3. **Category dropdown** — A select dropdown. Options should include (but are not limited to):
   - Electronics
   - Home & Kitchen
   - Beauty & Personal Care
   - Clothing & Fashion
   - Food & Beverage
   - Software & Apps
   - Books & Media
   - Health & Fitness
   - Automotive
   - Toys & Games

4. **Review personality dropdown** — A select dropdown. Options should include (but are not limited to):
   - Professional
   - Casual / Conversational
   - Enthusiastic
   - Sarcastic / Witty
   - Technical / Detailed
   - Minimalist / Brief

5. **Sentiment aspect sliders** (see Stretch Features — Multi-Layer Sentiment)

6. **Style control sliders** (see Stretch Features — Rich UI Components)

7. **Generate review button** — A prominent, full-width button labelled "Generate review"

8. **Word & character count** — Displayed beneath the generate button, showing counts for the currently generated review

### Right Panel — Output Area

1. **Tabbed toggle** — Two tabs at the top of the output area:
   - **Rendered** (default active) — Shows the review as rendered markdown/HTML
   - **Raw markdown** — Shows the raw markdown source text

2. **Action buttons** — Positioned in the tab bar, right-aligned:
   - **Copy** — Copies the review content to clipboard (raw markdown text)
   - **Export** — Downloads the review as a `.md` file

3. **Review output area** — A bordered container that displays:
   - Product name as a heading
   - Sentiment aspect badges (e.g. "Price: 7/10", "Features: 9/10") colour-coded by score
   - The generated review text, rendered as markdown

4. **Review history panel** — Below the output area, showing a list of previously generated reviews in the current session with product name and timestamp. Clicking an entry reloads that review into the output area.

---

## Core Features

### 1. Product Name Input
A text field where the user types the name of the product being reviewed. This value is passed directly to the LLM prompt.

### 2. Complaints / Liked Features Input
A textarea where the user describes what they liked and disliked about the product. This free-form text is incorporated into the LLM prompt to shape the review content.

### 3. Category Dropdown
A dropdown selector for the product category (e.g. Electronics, Home & Kitchen). This helps the LLM tailor the review's language and focus areas to the appropriate domain.

### 4. Review Personality Dropdown
A dropdown selector for the tone or persona of the review (e.g. Professional, Sarcastic / Witty). This is sent as part of the prompt to instruct the LLM on voice and style.

### 5. Generate Review Button
Triggers the API call to OpenAI. On click:
- Gather all input values (product name, complaints/likes, category, personality, sentiment scores, tone, length)
- Construct the prompt
- Send the request to the OpenAI API
- Display the returned review in the output area
- Show a loading/spinner state while awaiting the response

### 6. Unstructured Response
The LLM response must be **unstructured** — no rigid JSON schema, no template placeholders. The prompt should instruct the model to return a natural, free-flowing review in markdown format. The application does not impose any response schema on the API call.

### 7. Markdown Rendering
The raw markdown returned by the LLM is rendered as formatted HTML in the "Rendered" tab. A markdown rendering library must be used (e.g. `react-markdown`, `marked`, or `markdown-it`). The "Raw markdown" tab displays the unprocessed markdown source.

---

## Stretch Features

### 1. Multi-Layer Sentiment Sliders

Rather than a single overall sentiment value, sentiment is broken down into **aspect-based sliders**:

- **Price** — Slider from 1 (very negative) to 10 (very positive)
- **Features** — Slider from 1 to 10
- **Usability** — Slider from 1 to 10

Each slider displays its current numeric value. Labels at either end read "Negative" and "Positive." These values are sent in the prompt so the LLM can weight each aspect appropriately in the generated review (e.g. a high features score but low price score produces a review that praises functionality but criticises cost).

### 2. Rich UI Components — Tone & Length Sliders

- **Tone slider** — Ranges from "Casual" (left) to "Formal" (right). The current position label updates dynamically (e.g. "Casual," "Neutral," "Formal"). This value instructs the LLM on writing style.

- **Length slider** — Ranges from "Brief" (left) to "Detailed" (right). The current position label updates dynamically (e.g. "Brief," "Medium," "Detailed"). This value sets a target length or verbosity instruction in the prompt.

### 3. Tabbed Markdown View

The output area provides two tabs:

- **Rendered** — The default view. Markdown is parsed and rendered as styled HTML.
- **Raw markdown** — Displays the raw markdown string exactly as returned by the API.

Switching between tabs should be instantaneous (no re-fetch). Both views reference the same stored response string.

### 4. Copy to Clipboard & Export

- **Copy button** — Copies the raw markdown text to the user's clipboard. A brief confirmation state (e.g. button text changes to "Copied!" for 2 seconds) should provide feedback.
- **Export button** — Triggers a file download of the review as a `.md` file. The filename should incorporate the product name (e.g. `sony-wh-1000xm5-review.md`).

### 5. Review History Sidebar

A panel (below the output area, or as a toggleable sidebar) that stores all reviews generated during the current session:

- Each entry shows the product name and a timestamp
- Clicking an entry reloads that review into the output area (both rendered and raw views)
- History is stored in application state (session-only; no persistence required, though localStorage is acceptable as an enhancement)
- A "Clear history" option should be available

### 6. Dark Mode / Light Mode Toggle

A toggle in the header that switches the entire application between a light theme and a dark theme:

- The toggle should respect the user's system preference on first load (`prefers-color-scheme`)
- The user's manual choice should override the system preference and persist (e.g. via localStorage)
- All UI components — inputs, sliders, cards, output area, history panel — must be properly themed in both modes

### 7. Word Count & Character Count Display

Displayed beneath the generate button (or at the bottom of the output panel):

- **Word count** — Total words in the generated review
- **Character count** — Total characters in the generated review
- Both update whenever a new review is generated
- Display "Words: 0 | Characters: 0" as the default state before any review is generated

---

## API Integration

### Provider

**OpenAI only.** No other LLM providers are to be used.

### Authentication

The API key is read from the `.env` file:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Access this via the appropriate environment variable method for your framework (e.g. `process.env.OPENAI_API_KEY` in Node, or `import.meta.env.VITE_OPENAI_API_KEY` for Vite — adjust .env variable naming accordingly).

### Model

Use an OpenAI chat completions model. Recommended: `gpt-4o` or `gpt-4o-mini`. The model name should be easily configurable (e.g. as a constant or environment variable).

### Request Format

Use the OpenAI Chat Completions endpoint (`/v1/chat/completions`). The request should contain:

- A **system message** that sets the persona/personality and general instructions
- A **user message** that contains the product details, complaints/likes, category, sentiment scores, tone, and length preferences

### Prompt Construction

The prompt should be assembled from the user's inputs. Example structure (adapt as needed):

```
System: You are a {personality} product reviewer. Write in a {tone} style.
Your review should be {length} in length. Output your review in markdown format.
Do not use any rigid template. Write naturally and vary your structure.

User: Write a review for the following product.
Product: {product_name}
Category: {category}
User notes (likes and complaints): {complaints_liked_features}
Sentiment breakdown:
- Price satisfaction: {price_score}/10
- Features satisfaction: {features_score}/10
- Usability satisfaction: {usability_score}/10
```

### Response Handling

- The response is **unstructured markdown text** — no JSON parsing of the review content is needed
- Extract the assistant's message content from the API response
- Store the raw markdown string in state
- Render it in the output area via the markdown renderer

### Error Handling

- Display user-friendly error messages if the API call fails (e.g. invalid key, rate limit, network error)
- Show a loading/spinner state while the request is in progress
- Disable the "Generate review" button during loading to prevent duplicate requests

---

## Markdown Rendering

The generated review is returned as raw markdown from the OpenAI API. The application must render this as formatted HTML.

### Requirements

- Use a markdown rendering library such as `react-markdown`, `marked`, or `markdown-it`
- Support standard markdown elements: headings, bold, italic, lists, blockquotes, code blocks, horizontal rules, links
- Rendered output should be styled to match the application's theme (light and dark mode)
- The "Raw markdown" tab shows the exact string returned by the API, displayed in a monospaced font within a code-style container

---

## Review History

### Behaviour

- Every successfully generated review is saved to the history list
- Each history entry stores: product name, timestamp, raw markdown content, and the input parameters used
- Clicking a history entry reloads the review into the output panel
- History is maintained in application state for the duration of the session
- Optional enhancement: persist history to localStorage so it survives page refreshes
- A "Clear history" button removes all entries

### Display

- Shown below the output area (or as a toggleable sidebar)
- Each entry displays: product name (primary text) and relative timestamp (secondary text, e.g. "2 min ago")
- Most recent entries appear at the top

---

## Component Breakdown

A suggested (not mandatory) component architecture:

```
App
├── Header
│   ├── AppTitle / Logo
│   ├── DarkModeToggle
│   └── HistoryToggle
├── MainLayout (two-panel grid)
│   ├── InputPanel (left)
│   │   ├── ProductNameInput
│   │   ├── ComplaintsLikesTextarea
│   │   ├── CategoryDropdown
│   │   ├── PersonalityDropdown
│   │   ├── SentimentSliders
│   │   │   ├── PriceSlider
│   │   │   ├── FeaturesSlider
│   │   │   └── UsabilitySlider
│   │   ├── StyleControls
│   │   │   ├── ToneSlider
│   │   │   └── LengthSlider
│   │   ├── GenerateButton
│   │   └── WordCharCount
│   └── OutputPanel (right)
│       ├── TabBar (Rendered | Raw Markdown)
│       ├── ActionButtons (Copy | Export)
│       ├── ReviewDisplay
│       │   ├── RenderedView
│       │   └── RawMarkdownView
│       └── ReviewHistory
│           ├── HistoryEntry[]
│           └── ClearHistoryButton
```

---

## File Structure

A suggested project file structure:

```
project-root/
├── public/
│   ├── favicon.ico
│   ├── favicon-32x32.png
│   ├── favicon-16x16.png
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header/
│   │   ├── InputPanel/
│   │   ├── OutputPanel/
│   │   ├── SentimentSliders/
│   │   ├── StyleControls/
│   │   ├── ReviewDisplay/
│   │   ├── ReviewHistory/
│   │   └── common/
│   ├── hooks/
│   ├── utils/
│   │   └── openai.js        ← API integration logic
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── .env                      ← NEVER COMMIT
├── .gitignore                ← Must include .env and TEMP-FOLDER-LLM/
├── TEMP-FOLDER-LLM/          ← NEVER COMMIT, never utilised
├── package.json
├── spec.md                   ← This file
└── README.md
```

---

## Summary of "Never Commit" Rules

| Item | Reason |
|---|---|
| `.env` / `.env.*` | Contains personal API keys |
| `TEMP-FOLDER-LLM/` | Temporary folder, never utilised by the application |
| `node_modules/` | Dependency folder, rebuilt from `package.json` |
| `dist/` / `build/` | Generated build output |

Ensure `.gitignore` is properly configured **before the first commit**. If any of these have already been committed, follow the removal instructions in the Environment & Sensitive Files section above.
