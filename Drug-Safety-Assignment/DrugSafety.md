# DrugSafety.md — Product Specification

## 1. Project Overview

**Name:** DrugLens  
**Tagline:** "See the safety picture. Compare with clarity."  
**One-liner:** A client-side drug safety explorer that lets users search, inspect, and compare FDA safety data for prescription and OTC drugs — all powered by free, open APIs with no backend required.

### 1.1 Core Philosophy

This tool exists at the intersection of two truths: (1) drug safety data is publicly available but practically inaccessible to most people, and (2) the data itself is messy, incomplete, and easily misinterpreted. DrugLens must make the data **approachable without making it misleading**. Every design decision flows from this tension.

The tool is **not** a clinical decision-support system. It is an **exploration and literacy tool** — designed to help users (patients, caregivers, students, journalists, researchers) understand what the FDA knows about a drug's safety profile, and to compare that profile against other drugs in an honest, contextualized way.

### 1.2 Technical Constraints

- **Entirely client-side.** No backend server. All API calls happen in the browser via `fetch()`.
- **No API key required.** OpenFDA allows up to 240 requests/minute and 1,000/day without a key. The tool must stay within these limits through intelligent caching, debouncing, and query batching.
- **Single-page React application** (`.jsx` artifact) with all HTML/CSS/JS in one file.
- **CORS-friendly.** OpenFDA supports direct browser requests.
- **Data source:** OpenFDA is the primary API. RxNorm/RxNav may be used for drug name resolution as a supplementary source.

---

## 2. Information Architecture

### 2.1 Primary User Flow

The application has **three modes**, accessible from a unified search interface:

```
┌─────────────────────────────────────────────┐
│              SEARCH BAR (persistent)         │
│  "Search any drug by name..."                │
│  [Drug chips appear as user adds drugs]      │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
   SINGLE   COMPARE   EXPLORE
   DRUG     DRUGS     (Discovery)
   VIEW     VIEW      VIEW
```

**Mode 1 — Single Drug Deep Dive** (1 drug selected)  
The default when a user searches for and selects one drug. Shows the complete safety profile for that drug.

**Mode 2 — Side-by-Side Comparison** (2–4 drugs selected)  
Activated when the user adds a second drug. The interface restructures into a comparison layout. Maximum 4 drugs to prevent visual overload and API rate-limit issues.

**Mode 3 — Explore / Discover** (no drug selected)  
The landing state. Shows curated entry points: "Most reported adverse events this quarter," "Recently recalled drugs," or category-based browsing (e.g., "Pain relievers," "Blood pressure medications"). This mode gives users who don't have a specific drug in mind a reason to engage.

### 2.2 Why This Three-Mode Approach

A comparison-only tool alienates users who just want to look up one drug. A single-drug-only tool misses the most powerful use case (understanding relative risk). The explore mode solves the cold-start problem — most users don't arrive knowing exactly which drugs they want to compare. The interface should fluidly transition between these modes based on how many drugs are in the search bar's "chip tray."

---

## 3. Data Strategy

### 3.1 OpenFDA Endpoints Used

#### Primary Endpoints

| Endpoint | Base URL | What We Extract | Priority |
|---|---|---|---|
| **Drug Labels** | `https://api.fda.gov/drug/label.json` | Warnings, boxed warnings, adverse reactions, contraindications, drug interactions, indications, dosage, pregnancy category, geriatric/pediatric use | **Critical** |
| **Adverse Events (FAERS)** | `https://api.fda.gov/drug/event.json` | Reported reactions (with counts), outcome severity, patient demographics, reporting trends over time | **Critical** |
| **Enforcement / Recalls** | `https://api.fda.gov/drug/enforcement.json` | Recall history, classification (Class I/II/III), reason for recall, distribution scope | **High** |
| **Drugs@FDA** | `https://api.fda.gov/drug/drugsfda.json` | Approval date, application type (NDA/ANDA), sponsor, active ingredients | **Medium** |
| **NDC Directory** | `https://api.fda.gov/drug/ndc.json` | Dosage forms, routes of administration, brand vs. generic mapping, marketing status | **Medium** |

#### Supplementary (Stretch)

| Source | URL | Purpose |
|---|---|---|
| **RxNorm (NLM)** | `https://lhncbc.nlm.nih.gov/RxNav/APIs/` | Drug name normalization — maps brand names to generics and vice versa. Helps resolve search ambiguity. Free, no key required. |

### 3.2 Key Label Fields to Extract

From `/drug/label.json`, the following fields form the core of the safety profile display:

**Safety-Critical Fields:**
- `boxed_warning` — The most severe FDA warning (the "black box"). Presence alone is significant.
- `warnings` / `warnings_and_cautions` — General safety warnings.
- `adverse_reactions` — Listed adverse reactions from clinical trials and post-marketing.
- `drug_interactions` — Known interactions with other substances.
- `contraindications` — Conditions/situations where the drug must not be used.
- `overdosage` — What happens in overdose and how to treat it.

**Context Fields:**
- `indications_and_usage` — What the drug is approved for (important for comparison context).
- `dosage_and_administration` — Standard dosing (helps users understand what "normal use" means).
- `pregnancy` / `pregnancy_or_breast_feeding` — Pregnancy risk information.
- `geriatric_use` / `pediatric_use` — Age-specific safety considerations.
- `mechanism_of_action` — How the drug works (aids understanding).
- `clinical_pharmacology` — Pharmacological context.

**Identity Fields (from `openfda` sub-object):**
- `openfda.brand_name` — Brand name(s).
- `openfda.generic_name` — Generic/active ingredient name(s).
- `openfda.manufacturer_name` — Who makes it.
- `openfda.product_type` — Prescription vs. OTC.
- `openfda.route` — How it's administered.
- `openfda.pharm_class_epc` — Pharmacologic class (e.g., "Nonsteroidal Anti-inflammatory Drug").
- `openfda.substance_name` — Active substance.

### 3.3 Key Adverse Event Fields to Extract

From `/drug/event.json`, using the `count` parameter for aggregation:

**Reaction Counts:**
```
GET /drug/event.json?search=patient.drug.openfda.generic_name.exact:"IBUPROFEN"&count=patient.reaction.reactionmeddrapt.exact
```
Returns the top 1000 most frequently reported reactions and their counts.

**Outcome Severity:**
```
GET /drug/event.json?search=patient.drug.openfda.generic_name.exact:"IBUPROFEN"&count=serious
```
Returns count of serious (1) vs. non-serious (2) reports.

**Seriousness Breakdown:**
- `seriousnessdeath` — Reports where patient died
- `seriousnesshospitalization` — Reports involving hospitalization
- `seriousnesslifethreatening` — Life-threatening reports
- `seriousnessdisabling` — Reports involving disability

**Demographics:**
```
&count=patient.patientsex
```
Returns gender distribution of reporters (1=male, 2=female, 0=unknown).

**Temporal Trends:**
```
&count=receivedate
```
Returns report counts by date — useful for showing reporting trends over time.

**Total Report Count:**
```
GET /drug/event.json?search=patient.drug.openfda.generic_name.exact:"IBUPROFEN"&limit=1
```
The `meta.results.total` field gives total number of adverse event reports.

### 3.4 Enforcement/Recall Fields

From `/drug/enforcement.json`:

- `classification` — Class I (most serious), Class II, Class III
- `reason_for_recall` — Free-text description
- `recall_initiation_date` — When the recall started
- `status` — Ongoing, Completed, Terminated
- `distribution_pattern` — Geographic scope
- `product_description` — What was recalled

### 3.5 Handling Data Quality Issues

This is the hardest part of the project. The data is messy in predictable ways:

**Problem 1: Drug Name Ambiguity**  
Users type "Advil" but the API indexes by generic name "IBUPROFEN". Brand names may map to multiple generics (combination drugs). Generics may have dozens of brand names.

*Solution:* Search across multiple fields: `openfda.brand_name`, `openfda.generic_name`, and `openfda.substance_name`. Present a disambiguation step if multiple distinct drugs match. Use RxNorm API as a fallback for name resolution. Display both brand and generic names prominently so users know what they're looking at.

**Problem 2: Label Content Varies Wildly**  
Some labels have rich, structured data in every field. Others have almost nothing. OTC drug labels tend to be sparser than prescription drug labels. Some fields contain raw HTML or poorly formatted text.

*Solution:* Before rendering any label section, check if it exists and has meaningful content (not just whitespace or boilerplate). Show a "No data available for this section" message rather than hiding the section entirely — hidden sections could make users think the data doesn't exist. Strip HTML tags and normalize formatting. For comparison view, clearly indicate when one drug has data that another lacks.

**Problem 3: FAERS Data Is Noisy and Misleading**  
Adverse event counts are **not** incidence rates. A drug with 50,000 reports isn't necessarily more dangerous than one with 500 — it may just be more widely prescribed. Reports are voluntarily submitted, creating massive reporting bias. Multiple drugs in a single report means no causal link can be established.

*Solution:* This requires **aggressive, persistent contextualization**:
- Never show raw adverse event counts without the disclaimer that these are report counts, not incidence rates.
- Show a persistent, non-dismissible banner on any FAERS-derived data: "These numbers reflect reports submitted to the FDA, not confirmed cases. A higher count does not mean a drug is more dangerous."
- In comparison mode, warn explicitly: "Comparing report counts between drugs is unreliable because reporting rates vary by drug popularity, patient population, and reporting culture."
- Provide the total report count alongside any reaction count so users can see proportions.
- Where possible, show the top reactions as a percentage of total reports for that drug, not absolute numbers. This gives a slightly more meaningful (though still flawed) relative picture.

**Problem 4: Enforcement Data Is Sparse**  
Many drugs have never been recalled. The enforcement endpoint covers 2004–present only.

*Solution:* Treat recall data as a bonus signal, not a core feature. Show "No recalls found in FDA database (2004–present)" with appropriate framing rather than implying a clean record.

**Problem 5: Multiple Label Records Per Drug**  
The same drug may have dozens of label entries (different manufacturers, dosage forms, formulations). 

*Solution:* When multiple labels exist, prefer: (1) the most recently updated label, (2) labels from the brand-name manufacturer if identifiable, (3) labels with the most populated fields. In comparison mode, ensure the same selection logic is applied to all drugs for fairness.

---

## 4. Page-by-Page UI Specification

### 4.1 Design Direction

**Aesthetic:** Clinical-editorial. Think of the visual language of a well-designed medical reference — not a flashy consumer app, not a sterile government database. The design communicates: "This is serious information, presented with care."

**Typography:** 
- Headlines: A serif or slab-serif with authority (e.g., `Playfair Display`, `Bitter`, `Zilla Slab`). 
- Body: A highly legible sans-serif at generous size — minimum 16px for body text (e.g., `Source Sans 3`, `IBM Plex Sans`, `Nunito Sans`). Medical data demands readability.
- Monospace for drug codes, NDC numbers, dates: `IBM Plex Mono` or `JetBrains Mono`.

**Color Palette:**
- Background: Warm off-white (`#FAFAF7`) — softer than pure white, easier on eyes for dense reading.
- Primary text: Near-black (`#1A1A2E`).
- Accent / interactive: Deep teal (`#0D7377`) — medical without being cold.
- Warning / severity scale:
  - Boxed warning (most severe): Deep red background strip (`#B91C1C`) with white text.
  - High severity: Amber (`#D97706`).
  - Moderate: Muted gold (`#CA8A04`).
  - Low / informational: Slate blue (`#475569`).
- Comparison drug colors (assigned per drug): Teal (`#0D7377`), Indigo (`#4338CA`), Rose (`#BE185D`), Amber (`#B45309`). Distinct, colorblind-safe, and readable at small sizes.

**Layout Principles:**
- Maximum content width: 1200px centered. Dense data needs controlled line lengths.
- Generous vertical spacing between sections. White space is a feature, not waste.
- Card-based sections with subtle borders (`1px solid #E5E5E0`), not heavy shadows.
- Sticky search bar at top so users can always add/remove drugs.
- Left-aligned text. Never center-align body copy or data.

### 4.2 Landing / Explore View (No Drugs Selected)

```
┌──────────────────────────────────────────────────────┐
│  DrugLens                                            │
│  ─────────────────────────────────────               │
│  Explore FDA drug safety data.                       │
│  Compare medications side by side.                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🔍  Search by drug name (brand or generic)...│    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ RECENTLY RECALLED ──────────────────────────┐    │
│  │  [Card] [Card] [Card]                        │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ BROWSE BY CATEGORY ─────────────────────────┐    │
│  │  Pain & Inflammation  │  Blood Pressure       │    │
│  │  Diabetes             │  Cholesterol           │    │
│  │  Mental Health        │  Antibiotics           │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ⚠ DATA DISCLAIMER (persistent footer)               │
│  This tool uses public FDA data for educational      │
│  purposes only. Do not use it to make medical        │
│  decisions. Always consult your healthcare provider.  │
└──────────────────────────────────────────────────────┘
```

**Explore Features:**
- **Recent Recalls:** Pull the latest 3–5 enforcement actions from `/drug/enforcement.json?sort=recall_initiation_date:desc&limit=5`. Show as horizontal scrollable cards with classification badge, drug name, and reason snippet.
- **Browse by Category:** Pre-defined pharmacologic class searches. Clicking a category runs a search like `openfda.pharm_class_epc:"Nonsteroidal+Anti-inflammatory+Drug"` and shows common drugs in that class.
- **Search Autocomplete:** As the user types, query `/drug/label.json?search=openfda.brand_name:"{query}"*&limit=5` to show matching drugs. Debounce at 300ms. Show both brand and generic name in dropdown results.

### 4.3 Single Drug Deep Dive (1 Drug Selected)

When the user selects one drug, the page displays a comprehensive safety profile organized into collapsible sections. The architecture prioritizes the most safety-relevant information at the top.

```
┌──────────────────────────────────────────────────────┐
│  🔍  [Ibuprofen ×]  Add another drug to compare...  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  IBUPROFEN (Advil, Motrin, ...)                      │
│  NSAID · Oral Tablet · OTC / Prescription            │
│  ─────────────────────────────────────               │
│                                                      │
│  ┌─ ⬛ BOXED WARNING ──────────────────────────┐     │
│  │  [Red banner with black box warning text]    │     │
│  │  (Only shown if boxed_warning exists)        │     │
│  └──────────────────────────────────────────────┘     │
│                                                      │
│  ┌─ SAFETY SNAPSHOT ────────────────────────────┐    │
│  │                                              │    │
│  │  Total FAERS Reports: 182,431                │    │
│  │  [Donut: Serious vs Non-Serious]             │    │
│  │  [Bar: Seriousness breakdown]                │    │
│  │                                              │    │
│  │  ⚠ Report counts ≠ incidence rates.          │    │
│  │  See "Understanding This Data" below.        │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ TOP REPORTED REACTIONS ─────────────────────┐    │
│  │  Horizontal bar chart — top 15 reactions     │    │
│  │  Each bar shows count + % of total reports   │    │
│  │  Color-coded by outcome severity             │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ FROM THE LABEL ─────────────────────────────┐    │
│  │  [Tab: Warnings] [Tab: Adverse Reactions]    │    │
│  │  [Tab: Interactions] [Tab: Contraindications]│    │
│  │  [Tab: Pregnancy] [Tab: Dosage]              │    │
│  │                                              │    │
│  │  (Rendered text from selected label section)  │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ RECALL HISTORY ────────────────────────────┐     │
│  │  Timeline of recalls with severity badges    │     │
│  │  (or "No recalls found" message)             │     │
│  └──────────────────────────────────────────────┘     │
│                                                      │
│  ┌─ REPORTING TRENDS ──────────────────────────┐     │
│  │  Line chart: FAERS reports over time (by yr) │     │
│  │  (With note: increases may reflect           │     │
│  │   improved reporting, not more events)       │     │
│  └──────────────────────────────────────────────┘     │
│                                                      │
│  ┌─ DRUG IDENTITY ─────────────────────────────┐     │
│  │  Brand names, manufacturer, NDC codes,       │     │
│  │  approval date, application type             │     │
│  └──────────────────────────────────────────────┘     │
│                                                      │
│  ┌─ UNDERSTANDING THIS DATA ───────────────────┐     │
│  │  Expanded explanation of FAERS limitations,  │     │
│  │  what "adverse event report" means,          │     │
│  │  why counts aren't rates, and how to         │     │
│  │  interpret label information correctly.       │     │
│  └──────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

**Section Details:**

**Boxed Warning Banner:**  
If `boxed_warning` field exists, render it as a prominent red-bordered section at the very top, styled to visually evoke the actual black-box warning on drug packaging. This is the most critical safety signal and should never be buried.

**Safety Snapshot:**  
A quick-glance summary panel showing:
- Total adverse event reports from FAERS
- Donut chart: serious vs. non-serious split
- Stacked horizontal bar: breakdown of seriousness categories (death, hospitalization, life-threatening, disabling, other serious)
- A persistent inline disclaimer

**Top Reported Reactions:**  
A horizontal bar chart of the 15 most frequently reported reactions. Each bar displays:
- Reaction name (MedDRA preferred term)
- Count
- Percentage of total reports
Sorted descending by count. Uses the `count` parameter on the adverse events endpoint.

**From the Label:**  
A tabbed interface showing the actual FDA label text, organized into tabs. This is the authoritative information. Content is pulled directly from the label endpoint fields. HTML is stripped, text is cleaned and formatted into readable paragraphs. Sections with no data show "This section is not available for this drug product."

**Recall History:**  
A vertical timeline showing any enforcement actions from `/drug/enforcement.json`. Each entry shows the recall classification badge (Class I = red, Class II = amber, Class III = blue-gray), date, reason, and status. If no recalls exist, show an informational card: "No recall records found in the FDA database (records available from 2004–present)."

**Reporting Trends:**  
A line chart showing FAERS report volume over time, aggregated by year. Uses `count=receivedate` and groups by year on the client side. Includes an annotation: "Increases in report volume often reflect improved reporting practices rather than increased adverse events."

### 4.4 Comparison View (2–4 Drugs Selected)

This is the most complex and most valuable view. The interface restructures into a column-based comparison layout.

```
┌───────────────────────────────────────────────────────┐
│  🔍 [Ibuprofen ×] [Naproxen ×] [Acetaminophen ×]    │
│      Add another drug...                              │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌─ AT A GLANCE ─────────────────────────────────┐   │
│  │          Ibuprofen    Naproxen    Acetaminophen│   │
│  │  Type:   NSAID        NSAID       Analgesic    │   │
│  │  OTC:    Yes          Yes         Yes          │   │
│  │  Route:  Oral         Oral        Oral         │   │
│  │  Box     YES ⚠       YES ⚠      No           │   │
│  │  Warn:                                         │   │
│  │  Reports: 182,431    94,217      301,556       │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ BOXED WARNINGS COMPARISON ───────────────────┐   │
│  │  Side-by-side boxed warning text for drugs     │   │
│  │  that have them. Others marked "None."         │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ TOP REACTIONS — SIDE BY SIDE ────────────────┐   │
│  │  Grouped horizontal bar chart                  │   │
│  │  Shows top 10 reactions across all drugs        │   │
│  │  Each drug gets its own colored bar             │   │
│  │  Reactions sorted by highest combined count     │   │
│  │                                                │   │
│  │  ⚠ Comparing report counts across drugs is     │   │
│  │  unreliable. See data limitations.             │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ SEVERITY COMPARISON ─────────────────────────┐   │
│  │  Stacked bar chart per drug showing            │   │
│  │  % of reports by seriousness category          │   │
│  │  (Percentages, not raw counts — fairer)        │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ LABEL SECTIONS COMPARISON ───────────────────┐   │
│  │  [Tab: Warnings] [Tab: Interactions] [...]     │   │
│  │                                                │   │
│  │  Ibuprofen          │  Naproxen               │   │
│  │  (label text)       │  (label text)           │   │
│  │                     │                          │   │
│  │  Acetaminophen      │                          │   │
│  │  (label text)       │                          │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ RECALL HISTORY COMPARISON ───────────────────┐   │
│  │  Merged timeline showing all drugs' recalls    │   │
│  │  Color-coded by drug                           │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ REPORTING TRENDS — OVERLAID ─────────────────┐   │
│  │  Multi-line chart: all drugs' FAERS volumes    │   │
│  │  over time, color-coded                        │   │
│  └───────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

**Comparison-Specific Design Decisions:**

- **"At a Glance" Table:** A summary table at the top gives users the quick comparison. Includes drug type, OTC status, route, whether a boxed warning exists (as a binary flag — very powerful signal), and total FAERS reports.
- **Grouped Bar Charts for Reactions:** Instead of separate charts per drug, show a single grouped chart. For each reaction, group bars by drug. This makes direct comparison instantaneous. Use the union of each drug's top 10 reactions, then query all drugs for those same reactions to ensure apples-to-apples comparison.
- **Severity as Percentages:** In comparison mode, convert seriousness counts to percentages of total reports. This is more meaningful than raw counts since drugs with more total reports will naturally have more of everything.
- **Label Text Side-by-Side:** In a tabbed panel, show the same label section for all drugs in columns. On mobile, this collapses to a stacked accordion. This lets users read the actual FDA language for each drug in context.
- **Merged Recall Timeline:** A single timeline with color-coded markers per drug. Makes it immediately visible which drugs have had more (or more severe) recall activity.

### 4.5 Mobile Responsiveness

At viewport widths below 768px:
- Comparison columns collapse to stacked cards with a drug-selector tab bar.
- Grouped bar charts switch to individual charts per drug, swipeable.
- Label comparison uses an accordion pattern — tap a drug name to expand its section.
- The search bar becomes a collapsible icon that expands to full width.
- Charts use horizontal scrolling rather than squishing.

---

## 5. Data Communication & Limitations Strategy

### 5.1 The Disclaimer Hierarchy

Communicating data limitations is not a one-time footnote — it must be woven into the interface at multiple levels:

**Level 1 — Global Disclaimer (always visible):**  
A persistent footer bar present on every view:  
> "DrugLens uses publicly available FDA data for educational exploration only. This is not medical advice. Always consult a healthcare provider before making decisions about medications."

**Level 2 — Section-Level Caveats (contextual):**  
Each data section has its own inline caveat, styled as a subtle but readable note:
- On FAERS data: "Adverse event reports are voluntarily submitted. A report does not prove the drug caused the event. Report counts cannot be used to estimate how common an event actually is."
- On comparison charts: "Comparing report counts between drugs is misleading because drugs differ in how widely they are prescribed and how actively their adverse events are reported."
- On label data: "Label information reflects what manufacturers have submitted to the FDA. It may not match the labeling on currently distributed products."
- On recall data: "FDA recall records in this database cover 2004–present. Absence of recalls does not guarantee a drug has never been recalled."

**Level 3 — Educational Explainer (opt-in):**  
The "Understanding This Data" section at the bottom of every view provides a thorough, plain-language explanation of: what FAERS is and how it works, why report counts aren't incidence rates, the concept of reporting bias, what a boxed warning means, what recall classifications mean, and how to have a productive conversation with a doctor using this data. This section is expanded by default on first visit and collapsible thereafter.

### 5.2 Visual Cues for Data Quality

- **Missing data indicator:** When a label field is empty or missing, show a dashed-border placeholder with italic text: *"Not available for this product."* Do not hide the section.
- **Data freshness:** Show a small "Data as of [date]" tag based on the `meta.last_updated` field from the API response.
- **Confidence indicator for FAERS data:** Next to any FAERS-derived number, show a small info icon (ⓘ) that on hover/tap reveals the relevant limitation text. This keeps the interface clean while ensuring the caveat is always one interaction away.

---

## 6. Visual & Chart Specifications

### 6.1 Charts Used

All charts will be built using **Recharts** (available in React artifacts).

| Chart | Where Used | Purpose |
|---|---|---|
| **Horizontal bar chart** | Top reactions (single drug) | Show ranked reaction frequency |
| **Grouped horizontal bar chart** | Top reactions (comparison) | Compare reaction frequency across drugs |
| **Donut chart** | Safety snapshot | Serious vs. non-serious split |
| **Stacked bar chart** | Severity comparison | Seriousness breakdown per drug (as %) |
| **Line chart** | Reporting trends | FAERS volume over time |
| **Timeline** | Recall history | Chronological recall events |

### 6.2 Chart Design Principles

- **No 3D effects.** Flat, clean, minimal.
- **Always label axes.** Never rely on legend alone.
- **Tooltips on hover/tap** showing exact values.
- **Muted gridlines** (`#E5E5E0`) — visible but not distracting.
- **Drug-assigned colors** used consistently across all charts in a comparison.
- **Accessible color contrast** — all text on chart backgrounds must meet WCAG AA (4.5:1 ratio minimum).
- **No pie charts** for comparing across drugs — grouped bars are always more readable for comparison.

---

## 7. API Query Patterns

### 7.1 Search / Autocomplete

```
GET /drug/label.json?search=(openfda.brand_name:"{query}"*+openfda.generic_name:"{query}"*)&limit=10
```
Debounced at 300ms. Returns drug name suggestions with brand/generic disambiguation.

### 7.2 Fetching a Drug's Label

```
GET /drug/label.json?search=openfda.generic_name.exact:"{GENERIC_NAME}"&limit=5
```
Fetch up to 5 labels, then select the best one (most fields populated, most recent `effective_time`).

### 7.3 Adverse Event Counts — Top Reactions

```
GET /drug/event.json?search=patient.drug.openfda.generic_name.exact:"{GENERIC_NAME}"&count=patient.reaction.reactionmeddrapt.exact
```
Returns up to 1000 reaction terms with counts.

### 7.4 Adverse Event Counts — Seriousness

```
GET /drug/event.json?search=patient.drug.openfda.generic_name.exact:"{GENERIC_NAME}"&count=serious
```

For detailed seriousness breakdown, make separate count queries for each category:
```
&count=seriousnessdeath
&count=seriousnesshospitalization
&count=seriousnesslifethreatening
&count=seriousnessdisabling
```

### 7.5 Adverse Event Counts — Demographics

```
GET /drug/event.json?search=patient.drug.openfda.generic_name.exact:"{GENERIC_NAME}"&count=patient.patientsex
```

### 7.6 Adverse Event Counts — Temporal

```
GET /drug/event.json?search=patient.drug.openfda.generic_name.exact:"{GENERIC_NAME}"&count=receivedate
```
Client-side: group by year, trim to recent 10–15 years.

### 7.7 Total Report Count

```
GET /drug/event.json?search=patient.drug.openfda.generic_name.exact:"{GENERIC_NAME}"&limit=1
```
Use `meta.results.total` from the response.

### 7.8 Enforcement / Recalls

```
GET /drug/enforcement.json?search=openfda.generic_name.exact:"{GENERIC_NAME}"&sort=recall_initiation_date:desc&limit=10
```

### 7.9 Drug Identity / Approval Info

```
GET /drug/drugsfda.json?search=openfda.generic_name.exact:"{GENERIC_NAME}"&limit=1
```

### 7.10 Rate Limiting Strategy

- **Debounce** all user-initiated searches by 300ms.
- **Cache** all API responses in a client-side `Map` keyed by the full query URL. Cached responses persist for the session (cleared on page reload). This prevents duplicate calls when users toggle between drugs or re-visit sections.
- **Batch awareness:** When a user adds a new drug in comparison mode, only fetch data for the new drug — don't re-fetch existing drugs.
- **Parallel requests:** Use `Promise.all()` to fire multiple endpoint queries for a single drug simultaneously (label + events + enforcement), but stagger drug-level batches to avoid bursting past 240/min.
- **Graceful degradation:** If a 429 (rate limit) response is received, show a user-friendly message: "We've made too many requests. Please wait a moment and try again." Do not retry automatically in a tight loop.

---

## 8. State Management

### 8.1 Application State Shape

```javascript
{
  // Search & Selection
  searchQuery: "",
  searchResults: [],          // Autocomplete results
  selectedDrugs: [],          // Array of { genericName, brandNames, ... }
  
  // Per-Drug Data Cache (keyed by generic name)
  drugData: {
    "IBUPROFEN": {
      label: { ... },         // Best-matched label record
      reactions: [ ... ],     // Top reactions with counts
      seriousness: { ... },   // Serious/non-serious breakdown
      totalReports: 182431,
      demographics: { ... },
      reportingTrend: [ ... ],
      recalls: [ ... ],
      approvalInfo: { ... },
      loading: {              // Per-section loading states
        label: false,
        reactions: true,
        recalls: false,
        ...
      },
      errors: {               // Per-section error states
        label: null,
        reactions: "Rate limit exceeded",
        ...
      }
    }
  },
  
  // UI State
  activeView: "explore" | "single" | "compare",
  activeLabelTab: "warnings",
  expandedSections: Set(),
  
  // Explore View
  recentRecalls: [],
  exploreLoading: false
}
```

### 8.2 Loading States

Each data section has its own independent loading state. This allows the page to render progressively — label data that arrives first is shown immediately while adverse event data is still loading. Each section shows a skeleton loader (pulsing placeholder lines) while its data is in flight.

---

## 9. Accessibility Requirements

- **Keyboard navigation:** All interactive elements reachable and operable via keyboard. Tab order follows visual order. Focus indicators are visible (2px solid teal outline).
- **Screen reader support:** All charts have `aria-label` descriptions summarizing the data. Data tables are used alongside charts for screen reader access to the underlying numbers.
- **Color is never the only differentiator.** Chart bars use patterns/textures in addition to color. Drug comparison uses both color and label/icon.
- **Text sizing:** Body text minimum 16px. No text below 12px anywhere. All text scales with browser zoom.
- **Reduced motion:** Respect `prefers-reduced-motion` media query — disable chart animations and transitions.
- **Contrast:** All text meets WCAG AA contrast ratios against its background.

---

## 10. Error Handling

| Scenario | User-Facing Behavior |
|---|---|
| Drug not found in labels | "No FDA label data found for '{query}'. Try searching by generic name (e.g., 'ibuprofen' instead of 'Advil')." |
| Drug found in labels but not in FAERS | Show label data; show "No adverse event reports found for this drug in the FDA database" in FAERS sections. |
| API timeout (>10s) | "The FDA database is taking longer than usual to respond. Please try again in a moment." |
| Rate limit (429) | "We've reached the request limit for the FDA database. Please wait 30 seconds and try again." |
| Network error | "Unable to connect to the FDA database. Please check your internet connection." |
| Malformed response | Log to console; show "Unexpected data format received. Some information may be incomplete." |

---

## 11. Performance Targets

- **First meaningful paint:** < 1.5s (skeleton UI visible).
- **Search autocomplete response:** < 500ms perceived (with debounce).
- **Full single-drug profile load:** < 3s for all sections (parallel fetches).
- **Comparison: adding a drug:** < 3s for the new drug's data (existing drugs cached).
- **Bundle size:** Target < 200KB gzipped (React + Recharts + app code).

---

## 12. Implementation Phases

### Phase 1 — Core (MVP)
- Search with autocomplete
- Single drug view: label data (warnings, adverse reactions, interactions, contraindications)
- Single drug view: FAERS top reactions chart + total reports
- All disclaimers and data limitation messaging
- Mobile-responsive layout

### Phase 2 — Comparison
- Multi-drug selection (2–4 drugs)
- Comparison "At a Glance" table
- Grouped bar chart for top reactions comparison
- Severity comparison chart
- Side-by-side label sections

### Phase 3 — Enrichment
- Explore/landing page with recent recalls and category browsing
- Recall history timeline
- Reporting trends line chart
- Demographics breakdown
- Drug identity/approval info section
- RxNorm integration for improved search resolution

### Phase 4 — Polish
- Skeleton loading states
- Full accessibility audit and fixes
- Performance optimization (lazy loading chart sections)
- "Share comparison" via URL parameters
- Print-friendly view

---

## 13. Non-Goals (Out of Scope)

- **Dosage calculator or recommendation engine.** This tool does not suggest doses.
- **Drug-drug interaction checker.** While we show interaction info from labels, we do not build a multi-drug interaction matrix. (This is what DDInter or DrugBank do better.)
- **Clinical decision support.** This is an exploration tool, not a prescribing aid.
- **User accounts or saved comparisons.** Session-only for simplicity.
- **Backend server or database.** Everything runs in the browser.
- **Real-time FAERS monitoring or alerting.**

---

## 14. Open Questions for Development

1. **Search fallback strategy:** If a drug isn't found via `openfda.generic_name`, should we automatically try `openfda.brand_name`, `openfda.substance_name`, and free-text search in that order? Or present all as parallel results?

2. **Label selection heuristic:** When multiple labels match, what's the ideal tiebreaker beyond recency and field completeness? Should we prefer NDA (new drug application) labels over ANDA (generic) labels?

3. **FAERS count normalization:** Is there any reasonable normalization we can do (e.g., using NDC prescription volume data if available)? Or is it always safer to show raw counts with caveats?

4. **Chart interactivity depth:** Should clicking a reaction in the bar chart drill down to show the FAERS reports mentioning that reaction? This could be powerful but adds significant complexity and API calls.

5. **Offline / PWA capability:** Worth adding a service worker for caching previously viewed drugs? Low priority but could improve UX for repeat users.

---

## 15. References

- **OpenFDA API Documentation:** https://open.fda.gov/apis/drug/
- **OpenFDA Drug Label Endpoint:** https://open.fda.gov/apis/drug/label/
- **OpenFDA Drug Adverse Events:** https://open.fda.gov/apis/drug/event/
- **OpenFDA Drug Enforcement:** https://open.fda.gov/apis/drug/enforcement/
- **OpenFDA Drugs@FDA:** https://open.fda.gov/apis/drug/drugsfda/
- **OpenFDA NDC Directory:** https://open.fda.gov/apis/drug/ndc/
- **OpenFDA Query Syntax:** https://open.fda.gov/apis/query-syntax/
- **RxNorm / RxNav APIs:** https://lhncbc.nlm.nih.gov/RxNav/APIs/
- **FAERS Public Dashboard:** https://fis.fda.gov/extensions/FPD-QDE-FAERS/FPD-QDE-FAERS.html
- **DDInter 2.0:** https://ddinter.scbdd.com/
- **DrugBank:** https://go.drugbank.com/

---

*Spec version: 1.0 — April 2, 2026*
