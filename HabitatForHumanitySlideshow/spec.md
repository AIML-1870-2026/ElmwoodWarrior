# Habitat Central — Presentation Slideshow Spec

## Purpose

A 10–15 minute group presentation deck for the final project: the Habitat Central
website built for Habitat for Humanity Omaha. The deck tells the story from
community need → design → build → live demo → impact → reflection.

Live site the deck is about: https://dawson-gibbons.github.io/HabitatForHumanity/

## Audience

Classmates and instructor. Non-technical framing is fine; the "agentic workflow"
thread (design → spec → build → ship) should be visible but not dominant.

## Format

Keyboard- and click-navigable web slideshow, single-page HTML. No build step —
it opens by double-clicking `index.html`. Runs offline. Works fullscreen (press `F`).

## Slide Inventory (14 slides)

| # | Slide | Role |
|---|---|---|
| 1 | Title | Set the tone: calm, green, welcoming |
| 2 | Our Partner | Who Habitat Omaha is |
| 3 | The Need | Three problems we identified |
| 4 | Our Vision | Introduce the two pillars |
| 5 | Design Principles | Four choices that shaped everything |
| 6 | Pillar 1 — Home Maintenance | Feature walkthrough + mock preview |
| 7 | Pillar 2 — Community Board | Feature walkthrough + mock preview |
| 8 | Under the Hood | Design → Spec → Build → Ship |
| 9 | Live Demo | Full-bleed green slide; switch to the real site |
| 10 | Impact | Who benefits and how |
| 11 | Reflection | What we learned |
| 12 | What's Next | Honest "with more time…" list |
| 13 | Thank You | Close out |
| 14 | Questions | Prompt Q&A |

## Pacing target (≈12 min without questions)

- Slides 1–2 · 60s (opening, partner context)
- Slides 3–5 · 3 min (need + vision + principles)
- Slides 6–7 · 3 min (both pillars, with the mock previews on screen)
- Slide 8 · 1 min (workflow)
- Slide 9 · 3–4 min (live demo — the longest section)
- Slides 10–12 · 2 min (impact + reflection + next)
- Slides 13–14 · under 1 min, then Q&A

Presenters speak a little longer, landing the talk at 12–15 minutes.

## Visual System

- Palette: Habitat blue (`#005596`), deep blue (`#003a6a`), cream (`#f4f1ea`).
  The demo slide inverts to solid blue for dramatic handoff to the live site.
- Typography: system sans (`-apple-system`, Segoe UI, Inter). Large, confident
  headings; comfortable body text.
- Layout: cards with soft shadows and green accent borders. Generous whitespace.
- Mock browsers on the pillar slides stand in for screenshots — they render crisply
  at any projector resolution, no broken image links.

## Design Principles (also reflected in slide 5)

1. **Plain over polished** — clear language beats clever copy.
2. **Bilingual-visible** — English/Spanish support is called out, matching the site.
3. **Low-pressure browsing** — no animations that demand attention.
4. **One unified product** — the deck looks like the site, so the handoff to the
   live demo feels continuous.

## Interactions

- `←` / `→` · previous / next
- `Space` / `PageDown` · next
- `PageUp` · previous
- `Home` / `End` · first / last slide
- `F` · toggle fullscreen
- Click arrows in the bottom control bar; counter shows current slide
- Touch swipe on mobile/tablet
- Progress bar across the top of the screen

## Non-goals

- No build tooling, bundlers, or frameworks. Plain HTML/CSS/JS.
- No speaker notes view (the deck is the visible artifact; presenters rehearse).
- No dependency on internet access — the deck runs from the file system.

## Files

- `index.html` — all 14 slides
- `styles.css` — design system + slide-specific styles
- `script.js` — navigation, keyboard, swipe, progress
- `spec.md` — this document
