# Habitat for Humanity Omaha — Home Guide App
## spec.md — Project Specification
**Version 1.0 | April 2026**

---

## 1. Project Overview

A mobile-first React web app built for Habitat for Humanity Omaha families. The app serves as a reference tool — a friendly home maintenance manual users return to when something needs attention, not a course to complete. Content is available in English and Spanish.

The product is designed to be static-deployable (no server required) and content-editable by non-developers via JSON files.

---

## 2. Product Philosophy

- **"Do it as you need."** No locked modules, no progress bars, no streaks. Users browse freely and return when something breaks or a season changes.
- **Visual-first.** Large illustrations, minimal text per step. Designed for users with limited English and varying literacy levels.
- **Bilingual by default.** English and Spanish toggle available on every screen. Language preference persists across sessions via localStorage.
- **Content-editable without code.** All module content lives in JSON files. Habitat staff or volunteers can update text and add modules without touching the codebase.
- **Static-deployable.** No backend required. Can be hosted on GitHub Pages, Netlify, or any static host at zero cost.

---

## 3. Tech Stack

- **Framework:** React 18 with Vite
- **Language:** JavaScript (ES2022). No TypeScript — keep it accessible for student maintainers.
- **Styling:** Plain CSS with CSS custom properties. No Tailwind, no UI framework. Keep dependencies minimal.
- **Drag-and-drop:** `react-draggable` — isolated to interactive modules only.
- **Routing:** React Router v6
- **i18n:** Custom lightweight solution via parallel JSON files (see Section 6). No i18n library needed.
- **Search:** Fuse.js for client-side fuzzy search across module titles and tags.
- **Deployment:** Static. Vite build output. Host on GitHub Pages, Netlify, or Vercel.

---

## 4. File Structure

Build with separate files: one `index.html`, one `styles.css` (global), component-level CSS files, and multiple JS files that break up functions by concern. Do not bundle everything into one script.

```
home-guide/
├── public/
│   ├── favicon.ico              # 32x32 favicon — see Section 5
│   ├── apple-touch-icon.png     # 192x192 for mobile home screen
│   └── og-image.png
├── src/
│   ├── components/
│   │   ├── CategoryGrid/
│   │   │   ├── CategoryGrid.jsx
│   │   │   └── CategoryGrid.css
│   │   ├── ModuleCard/
│   │   │   ├── ModuleCard.jsx
│   │   │   └── ModuleCard.css
│   │   ├── StepViewer/
│   │   │   ├── StepViewer.jsx
│   │   │   └── StepViewer.css
│   │   ├── DragScene/
│   │   │   ├── DragScene.jsx
│   │   │   └── DragScene.css
│   │   ├── ChecklistViewer/
│   │   │   ├── ChecklistViewer.jsx
│   │   │   └── ChecklistViewer.css
│   │   ├── SeasonalChecklist/
│   │   │   ├── SeasonalChecklist.jsx
│   │   │   └── SeasonalChecklist.css
│   │   ├── LanguageToggle/
│   │   │   ├── LanguageToggle.jsx
│   │   │   └── LanguageToggle.css
│   │   ├── SearchBar/
│   │   │   ├── SearchBar.jsx
│   │   │   └── SearchBar.css
│   │   └── NavBar/
│   │       ├── NavBar.jsx
│   │       └── NavBar.css
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Category.jsx
│   │   ├── Module.jsx
│   │   └── NotFound.jsx
│   ├── context/
│   │   └── LanguageContext.jsx
│   ├── hooks/
│   │   ├── useLanguage.js
│   │   └── useSearch.js
│   ├── utils/
│   │   ├── loadModule.js        # Fetches and parses module JSON
│   │   └── seasonal.js          # Returns checklist items for current month
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                # Global CSS custom properties and resets
├── content/
│   ├── modules/
│   │   ├── hvac/
│   │   │   ├── furnace-filter/
│   │   │   │   ├── en.json
│   │   │   │   ├── es.json
│   │   │   │   └── assets/
│   │   │   └── [other modules...]
│   │   ├── plumbing/
│   │   ├── electrical/
│   │   ├── exterior/
│   │   ├── lawn/
│   │   ├── interior/
│   │   ├── safety/
│   │   └── appliances/
│   └── seasonal/
│       ├── en.json
│       └── es.json
├── index.html
├── vite.config.js
├── .gitignore                   # See Section 11
└── README.md
```

---

## 5. Favicon & Tab Icon

Place `favicon.ico` (32x32) and `apple-touch-icon.png` (192x192) in `public/`.

Link both in the `<head>` of `index.html`:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#C8773A" />
```

Suggested icon: a simple house silhouette in the terracotta brand color, or the HFH logo mark if licensed for use.

---

## 6. Content & i18n System

### Language Toggle

A `LanguageToggle` component renders on every screen. The selected language (`'en'` or `'es'`) is stored in `localStorage` and provided app-wide via `LanguageContext`. All content-rendering components consume this context. Default language is `'en'`.

### Module JSON Schema

Each module has two parallel files: `en.json` and `es.json`. Both must follow this schema exactly:

```json
{
  "id": "water-shutoff",
  "category": "plumbing",
  "title": "Water Main Shutoff",
  "summary": "Learn how to turn off your home's main water supply.",
  "tags": ["emergency", "water", "shutoff", "flood"],
  "estimatedMinutes": 5,
  "interactionType": "steps",
  "steps": [
    {
      "stepNumber": 1,
      "headline": "Find the shutoff valve",
      "body": "The main shutoff is usually near the front foundation wall in the basement, or outside near the water meter.",
      "illustration": "assets/step-1.png",
      "tip": "Mark it with a bright tag so you can find it fast in an emergency."
    }
  ]
}
```

The `tip` field is optional. The `illustration` field should always be present — use a large emoji string as a placeholder during development if real assets aren't ready yet.

### Interaction Types

The `interactionType` field tells the app which template to render:

- `"steps"` — Linear illustrated step-by-step. Used for most modules.
- `"drag-scene"` — Interactive drag-and-drop scene. Used for modules where physical identification matters (breaker box, water shutoff location, water heater parts).
- `"checklist"` — Tap-to-complete checklist. Used for seasonal, inspection, and preparedness modules.

### Seasonal Checklist Schema

`content/seasonal/en.json` and `es.json` drive the home screen checklist widget:

```json
{
  "months": {
    "1":  ["Test smoke detectors", "Check furnace filter"],
    "2":  ["Check for ice dams on roof", "Test GFCI outlets"],
    "3":  ["Check window and door caulking", "Inspect sump pump"],
    "4":  ["Turn on outdoor faucets", "Clean gutters", "Service lawn mower"],
    "5":  ["Check AC unit before summer", "Inspect roof for winter damage"],
    "6":  ["Clean dryer vent", "Check fire extinguishers"],
    "7":  ["Water deeply and less frequently", "Inspect deck or patio"],
    "8":  ["Clean refrigerator coils", "Check weatherstripping"],
    "9":  ["Service furnace before winter", "Overseed lawn if needed"],
    "10": ["Winterize outdoor faucets", "Reverse ceiling fans", "Clean gutters"],
    "11": ["Test carbon monoxide detectors", "Check insulation in attic"],
    "12": ["Know your utility emergency contacts", "Check emergency kit supplies"]
  }
}
```

`seasonal.js` reads `new Date().getMonth() + 1` and returns the matching array. The home screen widget renders these as tappable rows that can be marked done — state is in-memory only, resets on reload.

---

## 7. Screens & Components

### Home Screen (`Home.jsx`)

- HFH Omaha branding header with language toggle (EN / ES)
- Seasonal checklist card — "This month in your home" / "Este mes en tu hogar" — driven by seasonal JSON
- Category grid — 8 category cards with icon, label, and module count
- Search bar (Fuse.js) — searches across all module titles and tags in the active language
- No progress indicators. No locked content. All categories freely accessible.

### Category Screen (`Category.jsx`)

- Category header with icon and name
- Grid of `ModuleCard` components for all modules in that category
- Each `ModuleCard` shows: illustration thumbnail, title, estimated time, interaction type badge

### Module Screen (`Module.jsx`)

- Reads `interactionType` from the loaded JSON and renders the correct component:
  - `StepViewer` for `"steps"` modules
  - `DragScene` for `"drag-scene"` modules
  - `ChecklistViewer` for `"checklist"` modules
- Language toggle visible and functional throughout
- Step progress indicator (Step X of Y) — orientation only, not a completion tracker
- Back button to category

### StepViewer Component

- Large illustration (full-width image or SVG placeholder)
- Step number badge in terracotta
- Headline in large text (minimum 20px)
- Body text — short, 2–3 sentences maximum per step
- Optional tip callout box with distinct background
- Back / Next navigation buttons — large tap targets (minimum 48px height)

### DragScene Component

- Background scene image fills the container
- Draggable object images positioned via `react-draggable`
- Object tray below the scene holds unplaced items
- Target zones defined by percentage coordinates in `scene.json` — scale correctly on any screen
- Correct placement: green highlight, label locks in place
- Wrong placement: object snaps back to tray
- Instruction text displayed above the scene in active language
- Touch-enabled — `react-draggable` handles touch events natively

### ChecklistViewer Component

- Renders checklist items as large tappable rows
- Tap toggles a checkmark — in-memory state only
- Links to a related module where applicable (optional `"moduleLink"` field in JSON)

### SeasonalChecklist Component (home screen widget)

- Reads current month on mount
- Renders month's checklist items from seasonal JSON
- Tappable rows, in-memory checked state
- Displays month name in active language

---

## 8. Visual Design

Research basis: Direction 1 — Neighborhood Blueprint. Warm, earthy, community feel. Designed to feel approachable and trustworthy, not clinical or corporate.

Reference sites studied: Habitat for Humanity national site, Red Cross preparedness guides, FEMA home safety content, HomeFixer app UI studies on Behance.

### Color Palette

```css
:root {
  --color-primary:       #C8773A;  /* terracotta — headers, buttons, accents */
  --color-primary-dark:  #A05E2A;  /* hover states */
  --color-primary-light: #F5D9B8;  /* tip boxes, soft highlights */
  --color-bg:            #FDF8F2;  /* warm off-white page background */
  --color-surface:       #FFFFFF;  /* cards and containers */
  --color-border:        #E8D5BC;  /* soft warm border */
  --color-text-primary:  #2C2C2A;  /* main text */
  --color-text-secondary:#9C7A5A;  /* labels, metadata */
  --color-text-on-primary:#FDF3E7; /* text on terracotta backgrounds */
  --color-success:       #3B6D11;  /* correct placement in drag scenes */
}
```

### Typography

- **Font stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` — no Google Fonts dependency, works offline
- **Body:** 16px minimum, `line-height: 1.6`
- **Step headlines:** 20px, font-weight 600
- **Never below 14px** anywhere in the app — accessibility requirement
- **Step number badges:** Large, bold, circular, terracotta background

### Illustrations

Each module step requires one illustration. Use in order of preference:

1. Simple flat SVG illustrations sourced or commissioned per step
2. Free illustration libraries: [unDraw](https://undraw.co) or [Storyset](https://storyset.com) — both free for web use
3. Large emoji rendered at 80px as development placeholders

Illustrations must be understandable without reading the accompanying text. This is a hard accessibility requirement for low-literacy users.

### Responsive Behavior

- Mobile-first. Design and test at 375px width first.
- Category grid: 2 columns on mobile, 4 columns on desktop (≥768px)
- Step illustrations: full-width on mobile, max 480px centered on desktop
- Navigation: bottom tab bar on mobile, top nav bar on desktop (≥768px)
- All tap targets minimum 48×48px

### UI Reference Patterns

Look at the following for design inspiration (do not copy, use as reference):
- Khan Academy mobile app — clean card-based module navigation
- Red Cross emergency app — serious subject matter made approachable
- IKEA instruction manuals — the gold standard for visual-first step-by-step

---

## 9. Full Module Library

38 modules across 8 categories. This is the canonical list. Content agents should use module IDs exactly as written here for consistent routing.

### HVAC & Air Quality
| Module ID | Title | Type |
|-----------|-------|------|
| `furnace-filter` | Furnace Filter Replacement | steps |
| `thermostat-basics` | Thermostat Basics | steps |
| `air-vents` | Air Vents — Cleaning & Unblocking | steps |
| `hvac-when-to-call` | When to Call an HVAC Technician | checklist |

### Plumbing
| Module ID | Title | Type |
|-----------|-------|------|
| `water-shutoff` | Water Main Shutoff | drag-scene |
| `unclog-drains` | Unclogging Drains | steps |
| `running-toilet` | Fixing a Running Toilet | steps |
| `undersink-valves` | Under-Sink Shutoff Valves | drag-scene |
| `water-heater` | Water Heater Basics | steps |
| `frozen-pipes` | Preventing Frozen Pipes | checklist |

### Electrical
| Module ID | Title | Type |
|-----------|-------|------|
| `breaker-box` | Breaker Box Basics | drag-scene |
| `gfci-outlets` | GFCI Outlets | steps |
| `light-switch` | Changing a Light Switch or Outlet | steps |
| `electrical-when-to-call` | When to Call an Electrician | checklist |

### Exterior & Structure
| Module ID | Title | Type |
|-----------|-------|------|
| `gutters` | Gutters — Cleaning & Maintenance | steps |
| `caulking-windows` | Caulking Windows & Doors | steps |
| `roof-basics` | Roof Basics | checklist |
| `driveway-repair` | Driveway & Sidewalk Crack Repair | steps |
| `grading-drainage` | Grading & Drainage | steps |

### Lawn & Outdoor
| Module ID | Title | Type |
|-----------|-------|------|
| `lawn-calendar` | Seasonal Lawn Care Calendar | checklist |
| `mowing` | Mowing Technique & Blade Height | steps |
| `watering` | Watering Basics | steps |
| `mulching` | Mulching & Garden Bed Care | steps |
| `winterize-faucets` | Winterizing Outdoor Faucets & Hoses | steps |

### Interior Maintenance
| Module ID | Title | Type |
|-----------|-------|------|
| `patch-drywall` | Patching Drywall | steps |
| `painting` | Painting a Room | steps |
| `squeaky-door` | Fixing a Squeaky or Sticking Door | steps |
| `caulk-tub` | Caulking a Tub or Shower | steps |
| `replace-tile` | Replacing a Flooring Tile | steps |

### Safety & Preparedness
| Module ID | Title | Type |
|-----------|-------|------|
| `smoke-co-detectors` | Smoke & CO Detector Placement | checklist |
| `fire-extinguisher` | Fire Extinguisher Basics | steps |
| `emergency-kit` | Home Emergency Kit | checklist |
| `power-outage` | What to Do When the Power Goes Out | steps |
| `utility-contacts` | Knowing Your Utility Contacts | checklist |

### Cleaning & Appliances
| Module ID | Title | Type |
|-----------|-------|------|
| `fridge-coils` | Cleaning Refrigerator Coils | steps |
| `dryer-vent` | Dryer Vent Cleaning | steps |
| `dishwasher` | Dishwasher Filter & Spray Arm | steps |
| `garbage-disposal` | Garbage Disposal Care | steps |
| `deep-clean` | Deep Cleaning Basics | checklist |

---

## 10. Drag-Scene Module Spec

Drag-scene modules use a simplified version of the ImageInThat mechanic. The following spec tells agents exactly how to build them.

### How It Works

1. A background scene image is displayed (e.g. a basement corner with a water meter)
2. Labeled object images sit in a tray below the scene
3. User drags objects onto target zones on the scene
4. Correct placement: green highlight, label locks in, object stays
5. Wrong placement: object snaps back to tray
6. Module completes when all objects are correctly placed

### Scene Config Schema (`assets/scene.json`)

```json
{
  "backgroundImage": "assets/scene-bg.png",
  "instruction_en": "Drag each part to where it belongs.",
  "instruction_es": "Arrastra cada parte a donde le corresponde.",
  "objects": [
    {
      "id": "shutoff-valve",
      "label_en": "Shutoff valve",
      "label_es": "Llave de paso",
      "image": "assets/obj-shutoff.png",
      "targetZone": {
        "x": 42,
        "y": 61,
        "width": 12,
        "height": 15
      }
    }
  ]
}
```

All coordinates in `targetZone` are percentages of the background image dimensions so the scene scales correctly on any screen size.

### Authoring a New Drag-Scene

1. Source or photograph a clear image of the home system
2. Identify 3–5 key objects or zones to label — do not exceed 5, cognitive load limit
3. Crop each object as a separate PNG with transparent background
4. Note each object's approximate position as a percentage of the image dimensions
5. Populate `scene.json` following the schema above
6. Test on a 375px wide mobile screen before finalizing coordinates

---

## 11. .gitignore

```
node_modules/
dist/
.env
.env.local
.env.*.local
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
```

Temp folders and `.env` files must **never** be pushed to the repository. If API keys or secrets are ever needed in future, they go in `.env` — which must be added to `.gitignore` before the file is created.

---

## 12. Agent Build Instructions

This project will be built by multiple Claude agents working in parallel. These instructions ensure consistency across all agents.

### Agent Responsibilities

- **Agent A — Core App Shell:** Vite setup, routing, `LanguageContext`, `NavBar`, Home screen layout, `CategoryGrid`, `SeasonalChecklist`, `SearchBar` (Fuse.js integration).
- **Agent B — Module Rendering Engine:** `StepViewer`, `DragScene` (react-draggable), `ChecklistViewer`, `Module` page, `ModuleCard` component.
- **Content Agents (one per category):** Each agent builds all `en.json` and `es.json` files for their assigned category, plus step illustration placeholders (large emoji acceptable for v1).

### Non-Negotiable Rules for All Agents

- Never hardcode content strings in components. All text comes from JSON.
- Every component must render correctly in both English and Spanish.
- No module is locked or requires completing another module first.
- Mobile-first CSS. Test at 375px before 1280px.
- All images must have `alt` attributes sourced from the active language JSON.
- Allowed external dependencies only: `react`, `react-dom`, `react-router-dom`, `react-draggable`, `fuse.js`. No others without explicit approval.
- Content JSON files live in `content/`. Never in `src/`.
- Follow the file structure in Section 4 exactly.
- All CSS custom properties must come from the palette defined in Section 8.

---

## 13. Deployment

- **Build command:** `npm run build`
- **Output:** `dist/` folder — fully static, no server required
- **Recommended hosts:** GitHub Pages or Netlify (both free tier)

For GitHub Pages, set `base` in `vite.config.js` to the repo name if deploying to a subdirectory:
```js
export default { base: '/home-guide/' }
```

For Netlify, add a `_redirects` file to `public/`:
```
/* /index.html 200
```
This handles React Router's client-side routing on page refresh.

---

## 14. Stretch Features

Ambitious ideas for future builds. None are required for v1.

- **House profile.** User answers 5 questions about their home (year built, basement type, gas or electric) and the app surfaces the most relevant modules. Stored in localStorage — no account needed.
- **Offline mode (PWA).** Register a service worker so the app works without internet. Critical for families in areas with unreliable connectivity.
- **Emergency quick-access screen.** "Something is wrong right now" — large tappable tiles for the most urgent scenarios: flooding, power out, gas smell, smoke. Bypasses normal navigation entirely.
- **Illustrated 3D house navigation.** Replace the category grid with a WebGL or CSS 3D house cross-section. Users rotate and tap rooms to navigate. High build effort, extremely memorable.
- **Video module type.** Add a `"video"` interactionType that embeds a short YouTube or self-hosted clip — useful for repairs where motion matters.
- **Print-friendly module sheets.** Each module renders as a clean one-page print layout. Useful for families without reliable smartphone access during a repair.
- **Community tips.** An append-only Habitat-moderated tips section on each module where families share what worked. Requires a minimal backend — Supabase or Airtable would suffice.
- **Contractor contact directory.** A curated list of trusted local contractors for jobs beyond DIY, pre-vetted by Habitat Omaha staff.
