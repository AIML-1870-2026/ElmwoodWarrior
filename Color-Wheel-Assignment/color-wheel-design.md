# 🎨 Chromatica — Innovative Color Wheel App: Design & Feature Specification

---

## Overview

**Chromatica** is an interactive, visually immersive color exploration tool built around two core modes — **Light (RGB)** and **Ink (CMYK)** — with a sophisticated color mixing interface, palette generation engine, and a visual identity designed to feel like nothing else on the web. It lives in a dark, cosmic UI where color itself is the star.

---

## 1. Core Architecture: Two Color Modes

### 1.1 Light Mode (RGB / Additive Color)
- Standard RGB color wheel rendered on an HTML5 Canvas or WebGL surface
- Based on the **HSL/HSV** model for intuitive hue-angle representation
- Full-spectrum gradient conic fill with smooth anti-aliased edges
- Brightness/saturation control via a central radial gradient (dark at center → pure hue at edge → white overlay option)
- Selecting a color on the wheel updates all downstream components in real time

### 1.2 Ink Mode (CMYK / Subtractive Color)
- A separate, distinct wheel that visualizes **CMY primaries** (Cyan, Magenta, Yellow) with Black (K) as a separate slider
- The color mixing "physics" behave differently — overlapping colors darken rather than brighten
- Visual indicator distinguishes this mode from RGB (different ambient glow color, different ring geometry)
- A tooltip or info badge explains to users *why* this mode exists and how printer ink works differently
- K (black) slider appears separately below the wheel, adding ink density

### 1.3 Mode Toggle
- A sleek pill-shaped toggle switch at the top of the wheel panel labeled **"LIGHT ↔ INK"**
- Switching modes triggers an animated morph transition: the wheel reshuffles its color positions with a liquid ripple effect
- The UI's ambient color temperature subtly shifts (warm/blue-tinted for Light; cool/deep-green-tinted for Ink)

---

## 2. Color Mixing Interface

### 2.1 Dual-Color Mixer
- Two **color wells** (large circular swatches) — Color A and Color B — sit on either side of a mixing zone
- Users pick Color A from the wheel, then pick Color B from the wheel while holding a modifier (or clicking a "set B" button)
- The zone between A and B shows a live gradient blend preview

### 2.2 The Particle Mixing Effect
The centerpiece of the mixer. When a blend is triggered:

- **Hundreds of micro-particles** emit from both color swatches and collide in the center zone
- Particles from Color A are tinted that color; particles from Color B theirs
- Upon collision, particles **merge and recolor** toward the mixed output — creating a visually convincing sense of pigments or light waves combining
- The resulting mixed color "crystallizes" in the center as particles settle
- Particle physics parameters: velocity, spread angle, mass (affects collision behavior), lifetime decay
- Particle style options (unlockable or toggle): **circles**, **hexagons**, **ink drops**, **light sparks**

### 2.3 Slider Control
- A horizontal slider between A and B labeled **"Mix Ratio"** (0% A → 100% B)
- Moving the slider in real time re-emits particles at the new ratio, showing a live animated mix
- The slider track itself is a gradient from Color A to Color B — it updates as colors change
- A center notch snaps to 50/50 with a subtle haptic-style CSS pulse animation

### 2.4 Mix Output Display
- The resulting color appears in a large hex badge below the mixer
- Also shows the RGB and CMYK breakdown of the mixed color
- A "➕ Add to palette" button lets users save mixed results

---

## 3. Hex Code Display & Copy

### 3.1 Hex Display
- Always-visible hex badge in the upper-right corner of the active color panel
- Format: `#RRGGBB` in large monospace font (e.g., JetBrains Mono or Fira Code)
- The badge background is the selected color; the text auto-switches between white and black for legibility (calculated via luminance)
- Secondary values shown below: `RGB(r, g, b)` | `HSL(h°, s%, l%)` | `CMYK(c, m, y, k)` (collapses/expands on click)

### 3.2 Copy to Clipboard
- A **copy icon button** (clipboard or ⌘ symbol) sits inline with the hex code
- On click: value copies to clipboard, icon briefly morphs into a checkmark ✓ with a green flash
- Right-clicking the hex badge opens a **context menu** with options to copy as: `#HEX`, `rgb()`, `hsl()`, `CSS variable`, `rgba() with alpha`
- A subtle floating toast notification confirms the copy: *"#3A7BFF copied"*

---

## 4. Palette Generation

### 4.1 Palette Tab
Palette tools live on a separate **"Palettes"** tab, visually distinct from the main wheel tab.

### 4.2 Palette Types

| Palette | Description |
|---|---|
| **Complementary** | 2 colors — opposite on the wheel (180°) |
| **Analogous** | 3–5 colors — adjacent hues (±30° steps) |
| **Triadic** | 3 colors — equidistant (120° apart) |
| **Split-Complementary** | 3 colors — base + two colors flanking its complement (±30°) |
| **Tetradic / Square** | 4 colors — two complementary pairs (90° intervals) |
| **Monochromatic** | Single hue at varied lightness/saturation steps |
| **Double Split-Complementary** | 6 colors — two split-complementary pairs |
| **Custom N-color** | User-defined count; Chromatica spaces hues evenly |

### 4.3 Palette Display
- Generated palettes render as a horizontal strip of large swatches
- Each swatch shows its hex code underneath and a copy button on hover
- Swatches are draggable — reorder them to adjust the palette composition
- A **"Lock"** icon on any swatch freezes that color while regenerating others
- Export options: **PNG swatch strip**, **JSON**, **CSS variables**, **Adobe ASE file**

### 4.4 Palette Animation
- When a palette is generated, swatches **fly in** from the center of the wheel one by one, each trailing a brief particle streak in their color
- Switching palette types triggers a smooth cross-dissolve + swirl transition

### 4.5 Harmony Rings
- On the main wheel, when a palette is active, the selected harmony positions are shown as **glowing arc segments** on the wheel ring
- Hovering over a palette swatch highlights its corresponding arc on the wheel

---

## 5. Visual Design Language

### 5.1 Overall Aesthetic
The design is **dark matter meets bioluminescence** — a deep space environment where color glows like it has energy. Think: the inside of a nebula, or a microscope view of luminescent cells. Everything feels alive.

- **Background**: Near-black (#0a0a12) with a subtle radial gradient that shifts hue slightly based on the currently selected color — the whole environment "breathes" with the color choice
- **Typography**: Geometric sans-serif (e.g., Outfit, DM Sans) for UI labels; monospace for hex values
- **Depth**: Layered glassmorphism panels — frosted, semi-transparent cards with thin luminous borders
- **Motion**: Every state change has a micro-animation. Nothing snaps; everything flows.
- **Cursor**: Custom cursor — a small glowing orb that leaves a brief color trail matching the current selection

### 5.2 The Wheel Itself
- Not a flat disc — rendered with a **subtle 3D tilt** using CSS perspective or a WebGL shader, giving the sense of a holographic plate floating in space
- The outer ring pulses gently (a slow breathing animation) in the selected color's hue
- Inner radial selector: a crosshair with four small glow arms
- Selection reticle leaves a brief circular ripple on placement (like a drop hitting water)
- A thin **chromatic aberration** effect on the wheel edges (slight RGB channel offset) for a hi-tech feel

### 5.3 Tabs
- Navigation is a floating pill tab bar at the top — **Visualizer | Palettes | History**
- Active tab glows in the current selected color
- Tab switch uses a horizontal slide + fade transition

### 5.4 Color History
- A **History** strip (either a third tab or a collapsible drawer) shows the last 20 selected colors as small circular swatches
- Click any to restore it; hover to preview it overlaid on the wheel
- History persists via localStorage

---

## 6. Additional UI Components

### 6.1 Alpha / Opacity Control
- A separate vertical or horizontal slider for opacity (0–100%)
- The hex display updates to 8-digit hex (`#RRGGBBAA`) when opacity is below 100%

### 6.2 Input Fields
- Users can type directly into hex, RGB, or HSL fields to jump to a specific color
- Parsing is forgiving — accepts `3A7BFF`, `#3a7bff`, `rgb(58, 123, 255)`, etc.

### 6.3 Accessibility Contrast Checker *(see Section 10 for full spec)*
- A small inline badge shows the **WCAG contrast ratio** of the selected color against both white and black at all times
- Color-coded indicator: ✓ AA Pass / ✓ AAA Pass / ✗ Fail — expands to full checker panel on click

### 6.4 Eyedropper Tool
- Where supported (Chrome/Edge), a native eyedropper icon lets users sample any color from their screen
- The sampled color loads into the wheel with a brief "lock-on" animation

---

## 7. Technical Stack Recommendations

| Concern | Recommendation |
|---|---|
| Wheel Rendering | WebGL (Three.js or raw GLSL) or Canvas 2D API |
| Particle System | Canvas 2D with requestAnimationFrame, or PixiJS for GPU acceleration |
| Color Math | `chroma.js` library for accurate color space conversions |
| State Management | Vanilla JS reactive store, or lightweight Zustand/Signals |
| Framework | React or vanilla JS + Web Components |
| Clipboard API | `navigator.clipboard.writeText()` |
| Persistence | localStorage for history and saved palettes |

---

## 8. Tab Summary

| Tab | Contents |
|---|---|
| **Visualizer** | Color wheel (RGB or CMYK mode), color mixer with particle effects, hex/RGB/CMYK display, alpha slider, eyedropper, copy functions |
| **Palettes** | Palette type selector, generated swatches, lock/reorder controls, export options, harmony ring preview, accessible palette mode |
| **Accessibility** | WCAG contrast checker, color blindness simulator, accessible palette builder |
| **History** | Chronological color history, restore/compare tools |

---

## 9. Stretch Goals & Future Ideas (Phase 2+)

- **Sound-to-color mapping** — microphone input drives hue changes in real time
- **AI palette naming** — generate evocative names for palettes ("Dusk Over Mercury", "Deep Kelp Forest")
- **Gradient builder** — chain multiple mix points into a multi-stop CSS gradient, visualized as a flowing animated ribbon
- **Shareable URLs** — encode palette state into a URL hash for easy sharing
- **Dark/Light mode preview panel** — show the selected color applied to a mock UI card component in both modes

---

## 10. WCAG Contrast Checker

### 10.1 Purpose & Placement
The contrast checker is a first-class feature — not a footnote. It lives in a dedicated **Accessibility tab** and also surfaces as a compact floating widget in the Visualizer tab that updates live as colors are selected. Designers and developers using Chromatica for real work need this always available, never buried.

### 10.2 The Math: How Contrast Is Calculated
Chromatica must implement the official WCAG 2.1 algorithm precisely:

**Step 1 — Relative Luminance (L):**
For each RGB channel value (0–255), normalize to 0–1, then apply gamma correction:
- If `c/255 <= 0.04045` → `c_lin = c / 255 / 12.92`
- Else → `c_lin = ((c/255 + 0.055) / 1.055) ^ 2.4`

Then: `L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin`

**Step 2 — Contrast Ratio:**
Given two luminances L1 (lighter) and L2 (darker):
`Contrast = (L1 + 0.05) / (L2 + 0.05)`

Result is a ratio from 1:1 (no contrast) to 21:1 (black on white).

### 10.3 WCAG Pass/Fail Thresholds

| Standard | Normal Text | Large Text (18pt+ or 14pt bold) | UI Components / Graphics |
|---|---|---|---|
| **AA** | ≥ 4.5:1 | ≥ 3:1 | ≥ 3:1 |
| **AAA** | ≥ 7:1 | ≥ 4.5:1 | N/A (advisory only) |

Large text is defined as 18pt (24px) or larger, or 14pt (approximately 18.67px) bold or larger.

### 10.4 Interface Design

**Compact Widget (Visualizer Tab):**
- Floats in the lower-left corner of the wheel panel
- Shows foreground color (current selection) vs. background color (toggleable: white / black / custom)
- Displays ratio as `6.43:1` in large numeral
- Three status pills update instantly: `Normal AA ✓` | `Normal AAA ✗` | `Large AA ✓`
- Clicking the widget expands it into the full checker panel

**Full Checker Panel (Accessibility Tab):**
- Two large color wells — **Foreground** and **Background** — both independently selectable from the wheel or by hex input
- A swap button (↔) exchanges the two colors
- The ratio is displayed as a large, animated number that counts up/down as colors change
- Beneath the ratio: a full pass/fail matrix covering all WCAG criteria (Normal Text AA, Normal Text AAA, Large Text AA, Large Text AAA, UI Components)
- Each row uses a clear ✓ (green glow) or ✗ (red glow) icon — no ambiguous amber states
- A **live preview zone** shows sample text ("The quick brown fox...") rendered at various sizes in the chosen foreground on the chosen background, so designers see the actual visual result, not just a number
- A **"Find Passing Color"** button — if the current combo fails, this auto-adjusts the lightness of the foreground color (preserving hue and saturation as much as possible) until it meets the selected WCAG threshold, then animates the result into the foreground swatch

### 10.5 Contextual Integration
- In the Palettes tab, every swatch pair in a generated palette can show a mini contrast badge (ratio + AA/AAA status) when a **"Show Contrast"** toggle is active
- When the Accessible Palette Mode (Section 12) is running, it feeds off the same contrast engine
- The compact widget updates its background reference color when the user switches between dark/light UI theme

---

## 11. Color Blindness Simulator

### 11.1 Purpose
Color vision deficiency affects approximately 8% of males and 0.5% of females. Chromatica's simulator lets any user — sighted or not — understand how their color choices appear to people with CVD, making it an essential design review tool.

### 11.2 Types of CVD Simulated

| Condition | What's Affected | Prevalence |
|---|---|---|
| **Protanopia** | Red photoreceptors absent — reds appear dark, red-green pairs are indistinguishable | ~1% of males |
| **Deuteranopia** | Green photoreceptors absent — most common form, similar to protanopia perceptually | ~1% of males |
| **Tritanopia** | Blue photoreceptors absent — blues and greens confuse, yellows and pinks confuse | Very rare, ~0.01% |
| **Achromatopsia** *(bonus)* | Complete absence of color perception — full grayscale only | Extremely rare |

### 11.3 The Simulation Math
Accurate CVD simulation requires transforming colors through a specific pipeline using established Brettel/Viénot/Mollon matrices (1997), which are the academic gold standard:

**Pipeline:**
1. Convert sRGB → Linear RGB (gamma decode)
2. Apply a 3×3 CVD simulation matrix (different per condition) — this models which cone cells are missing and what wavelengths get confused
3. Convert Linear RGB → sRGB (gamma re-encode)
4. Clamp to valid gamut

The matrices for each condition (simplified Viénot 1999 values for deuteranopia as an example):
```
Deuteranopia:
[ 0.625, 0.375, 0.000 ]
[ 0.700, 0.300, 0.000 ]
[ 0.000, 0.300, 0.700 ]
```
Full matrices for all three conditions should be sourced from the Brettel et al. (1997) paper for maximum accuracy.

**Implementation note:** The simulation can be applied as a CSS/SVG filter (`feColorMatrix`) on the entire UI canvas, or applied pixel-by-pixel on the wheel canvas via the ImageData API. The SVG/CSS approach is far simpler and near-identical visually.

### 11.4 Interface Design

**Simulator Controls:**
- A segmented button group with five options: **Normal | Protanopia | Deuteranopia | Tritanopia | Achromatopsia**
- Selecting a mode applies the filter to: (a) the color wheel canvas, (b) any active palette swatches, and (c) the live preview zone in the contrast checker
- The selected mode is indicated with a subtle label overlay on the wheel: e.g., *"Viewing as: Deuteranopia"*
- Switching modes uses a brief crossfade transition so the shift is visible and feels intentional

**Side-by-Side Comparison View:**
- A toggle called **"Compare"** splits the color wheel into two halves: left = Normal vision, right = Simulated vision
- A draggable vertical divider lets users scrub between the two states — exactly like the before/after sliders used in photo editing
- The divider handle glows in the current selected hue

**Palette Simulation View:**
- In the Palettes tab, each swatch row can be duplicated into a "simulated" row below it when the simulator is active
- Color labels beneath the simulated swatches show the approximate perceived hex value, so designers know what the CVD user actually sees

**Affected Pairs Warning:**
- When a palette is active and a CVD mode is selected, Chromatica automatically detects **pairs of colors that become indistinguishable** (contrast ratio < 1.5:1 under simulation) and flags them with a warning icon: ⚠️ *"These colors may appear identical to someone with Deuteranopia"*
- This is calculated using the same WCAG luminance engine, applied to the simulated RGB values

### 11.5 Educational Layer
- A small **"?"** icon beside each CVD mode name opens a micro-tooltip explaining: what that condition is, how many people have it, and what color pairs are most commonly confused
- A **"Design Tips"** panel suggests practical strategies: use shape/pattern in addition to color, avoid red-green combinations for critical UI states, ensure luminance contrast even without hue contrast

---

## 12. Accessible Palette Mode

### 12.1 Purpose
Standard palette generation optimizes for aesthetic harmony — complementary hues, balanced saturation. Accessible Palette Mode is a constraint-aware generator: it produces palettes that are beautiful *and* pass WCAG contrast requirements, so the output is immediately usable in a real UI without needing manual adjustments.

### 12.2 Activation
- A toggle in the Palettes tab labeled **"Accessible Mode 🔒"**
- When active, a new configuration panel expands below the palette type selector
- The toggle is visually distinct — it glows in a contrasting accent color and shows a lock icon to signal that a constraint is active

### 12.3 Configuration Options

**Background Color Target:**
- A color well labeled **"Background Color"** — this is the color all palette members will be checked against
- Defaults to white (`#FFFFFF`); user can change to black, any custom color, or pick from the wheel
- Option to check against **both white and black simultaneously** (useful for dark/light theme design)

**WCAG Target Level:**
- Radio buttons: **AA (4.5:1)** | **AAA (7:1)** | **Large Text AA (3:1)**
- Default: AA

**Contrast Enforcement Mode:**
- **"All pairs"** — every color in the palette must have sufficient contrast against every other color (strict mode, useful for UI where colors may appear adjacent)
- **"Against background only"** — each palette color must contrast against the specified background (standard mode)
- **"Role-based"** — user designates roles (Primary, Secondary, Accent, Text, Background) and only certain pairs are required to contrast (most flexible, closest to real design system usage)

### 12.4 Generation Algorithm

When Accessible Mode is active, palette generation follows this process:

1. **Start with the base hue** selected on the wheel
2. **Calculate candidate hues** using the selected harmony type (complementary, triadic, etc.) as normal
3. **For each candidate hue**, find the lightness value (L in HSL) that satisfies the WCAG contrast ratio against the target background while preserving hue and saturation as much as possible — using a binary search from L=0 to L=100
4. **If no valid lightness exists** for that hue (can happen with certain hue/saturation combinations against some backgrounds), flag the slot as **"No valid color"** and offer the nearest passing approximation with a warning
5. **In "all pairs" mode**, after step 3 iteratively test all pairs; if two generated colors are too similar in luminance, nudge one's lightness up or down until all pair constraints are satisfied
6. **Output the constrained palette** — swatches display their contrast ratio badge automatically

### 12.5 Visual Feedback During Generation
- A brief loading animation plays while the algorithm runs (for complex "all pairs" mode it may take 50–200ms)
- Swatches that had to be adjusted from their "ideal" aesthetic position show a small **"Adjusted for accessibility"** indicator (a small shield icon ✦) so designers know a constraint was applied
- Hovering the shield shows a tooltip: *"Original hue was #4A90D9 at L=62. Lightness increased to L=78 to meet 4.5:1 ratio against #FFFFFF"* — full transparency about what changed and why

### 12.6 Contrast Matrix View
- A collapsible **"Show Contrast Matrix"** panel below the palette displays a grid where rows and columns are palette swatches
- Each cell shows the contrast ratio between that color pair, color-coded green (pass) or red (fail)
- The diagonal (color vs. itself) is always shown as "—"
- In accessible mode, all cells should be green; any red cell indicates a constraint violation that the algorithm couldn't resolve

### 12.7 Export with Accessibility Metadata
When exporting a palette generated in Accessible Mode, the export includes WCAG metadata:

**JSON export example:**
```json
{
  "palette": "Accessible Triadic",
  "wcag_level": "AA",
  "background": "#FFFFFF",
  "colors": [
    {
      "hex": "#1A6B9A",
      "contrast_vs_background": 5.82,
      "wcag_normal_text_aa": true,
      "wcag_normal_text_aaa": false,
      "wcag_large_text_aa": true
    }
  ]
}
```

**CSS variable export example:**
```css
/* Chromatica Accessible Palette — WCAG AA on #FFFFFF */
--color-primary: #1A6B9A;   /* contrast: 5.82:1 ✓ AA */
--color-secondary: #7A3B8C; /* contrast: 6.10:1 ✓ AA */
--color-accent: #2E8B57;    /* contrast: 4.73:1 ✓ AA */
```

### 12.8 Integration with Other Features
- The **Color Blindness Simulator** and **Accessible Palette Mode** can run simultaneously — users can check that an accessible palette also holds up under CVD simulation
- The **Contrast Checker** (Section 10) draws its foreground/background color pair from the Accessible Palette Mode configuration when that tab is active, keeping all three tools in sync
- A summary badge in the Palettes tab shows: *"All 4 colors pass AA on #FFFFFF — 2 colors pass AAA"* when Accessible Mode is on

---

## 13. Revised Technical Stack (Accessibility Features)

| Concern | Recommendation |
|---|---|
| WCAG luminance math | Pure JS — implement directly per WCAG 2.1 spec (no library needed, the formula is simple) |
| CVD simulation matrices | Brettel et al. (1997) matrices, applied via Canvas ImageData API or SVG `feColorMatrix` filter |
| Accessible palette search | Binary search on HSL lightness axis; worst case ~7 iterations per color to hit ratio threshold |
| Contrast matrix rendering | CSS Grid with dynamically colored cells; ratios computed on every palette change |
| Simulation performance | SVG filter approach (`feColorMatrix`) is GPU-accelerated and near-zero JS cost; prefer it over pixel-by-pixel for the wheel |

---

## 14. 3D Torus Color Wheel

### 14.1 Concept & Coordinate Mapping

The torus encodes all three dimensions of HSL color space onto a single continuous surface — no flattening, no information loss. The mapping is as follows:

| Torus Axis | Color Dimension | Range |
|---|---|---|
| **Large ring angle** (θ around the tube center) | **Hue** | 0° → 360° |
| **Tube angle — horizontal** (φ around the cross-section) | **Saturation** | Outer edge = 100%, inner edge = 0% |
| **Tube angle — vertical** (φ around the cross-section) | **Lightness** | Top = 100% (white), Bottom = 0% (black), equator = 50% (pure hue) |

The tube cross-section is itself a small circle. As you travel around it: the topmost point is white, the outermost equatorial point is the pure saturated hue, the bottommost point is black, and the innermost equatorial point is neutral gray. This means saturation and lightness are encoded together in φ, which is geometrically elegant — every valid HSL color occupies exactly one point on the surface.

The "hole" at the center of the torus naturally converges toward neutral gray (L=50%, S=0%), which is both geometrically and conceptually correct. It is the only color with no hue.

---

### 14.2 Three.js Scene Setup

**Dependencies:**
```bash
npm install three
# OrbitControls is included in three/examples/jsm — no separate install needed
```

**Basic Scene Skeleton:**
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12); // Chromatica deep space background

const camera = new THREE.PerspectiveCamera(
  45,                                    // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1,                                   // Near clip
  100                                    // Far clip
);
camera.position.set(0, 2.5, 5); // Slight elevation + pull back — shows torus at ~30° tilt

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Richer color rendering
document.getElementById('canvas-container').appendChild(renderer.domElement);
```

**Torus Geometry:**
```javascript
// TorusGeometry(radius, tube, radialSegments, tubularSegments)
// Higher segment counts = smoother color gradients on the surface
const geometry = new THREE.TorusGeometry(
  2.0,   // Radius: distance from center to tube center
  0.75,  // Tube radius: thickness of the tube
  128,   // Radial segments (around the tube cross-section — drives lightness/saturation resolution)
  256    // Tubular segments (around the ring — drives hue resolution)
);
```

Segment count matters significantly for color quality. 128×256 gives smooth gradients with no visible banding. Going lower (e.g., 64×128) saves geometry cost but produces visible color stepping at the hue transitions.

---

### 14.3 The Color Shader

This is the core of the feature. A custom GLSL shader reads UV coordinates and computes the HSL color for each fragment, outputting it as the rendered pixel color.

**Vertex Shader:**
```glsl
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**Fragment Shader:**
```glsl
varying vec2 vUv;
varying vec3 vNormal;

// HSL to RGB conversion — standard algorithm
vec3 hsl2rgb(float h, float s, float l) {
  float c = (1.0 - abs(2.0 * l - 1.0)) * s;
  float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
  float m = l - c / 2.0;
  vec3 rgb;

  if      (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
  else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
  else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
  else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
  else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
  else                   rgb = vec3(c, 0.0, x);

  return rgb + m;
}

void main() {
  // vUv.x = position around the large ring → maps to Hue (0–1 = 0°–360°)
  float hue = vUv.x;

  // vUv.y = position around the tube cross-section → maps to Saturation + Lightness
  // We interpret the tube angle as a circle:
  //   φ = 0.0 → outermost equator (pure hue: S=1, L=0.5)
  //   φ = 0.25 → top of tube (white: S=0, L=1.0)
  //   φ = 0.5 → innermost equator (gray: S=0, L=0.5)
  //   φ = 0.75 → bottom of tube (black: S=0, L=0.0)
  float phi = vUv.y * 2.0 * 3.14159265;

  // Derive saturation and lightness from tube angle
  // Lightness: 0.5 at equator, 1.0 at top, 0.0 at bottom
  float lightness = 0.5 + 0.5 * sin(phi);
  // Saturation: 1.0 at equator, 0.0 at poles
  float saturation = cos(phi) * 0.5 + 0.5;
  // Outer vs inner: outer tube face = high saturation, inner = desaturated
  // cos(phi) is positive on the outer face, negative on inner
  saturation = max(0.0, cos(phi));

  vec3 color = hsl2rgb(hue, saturation, lightness);

  // Soft rim lighting effect — enhances 3D depth perception
  float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
  color += rim * 0.08; // Subtle bright edge

  gl_FragColor = vec4(color, 1.0);
}
```

**Shader Material:**
```javascript
const material = new THREE.ShaderMaterial({
  vertexShader,   // string containing vertex shader source
  fragmentShader, // string containing fragment shader source
  side: THREE.DoubleSide, // Render both faces — essential for seeing inner tube
  transparent: false,
});

const torus = new THREE.Mesh(geometry, material);
scene.add(torus);
```

**Transparency Mode (Holographic Look):**
```javascript
// For the see-through holographic variant
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader, // Modify alpha in shader: gl_FragColor = vec4(color, 0.72);
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false, // Required for correct transparency sorting on torus
});
```

---

### 14.4 Orbit Controls & Camera

```javascript
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;       // Smooth inertia on mouse release
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.8;
controls.zoomSpeed = 0.9;
controls.minDistance = 2.5;         // Don't let camera clip inside the torus
controls.maxDistance = 12;
controls.enablePan = false;         // Pan is disorienting for a color picker — disable it

// Default camera position: tilt shows the torus face + tube thickness
camera.position.set(0, 2.5, 5.5);
controls.target.set(0, 0, 0);
controls.update();
```

**Reset View Button:**
```javascript
import { TWEEN } from 'three/examples/jsm/libs/tween.module.js';

function resetCamera() {
  new TWEEN.Tween(camera.position)
    .to({ x: 0, y: 2.5, z: 5.5 }, 800)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();

  new TWEEN.Tween(controls.target)
    .to({ x: 0, y: 0, z: 0 }, 800)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onUpdate(() => controls.update())
    .start();
}
```

---

### 14.5 Raycasting & Color Selection

Raycasting is how the user picks a color by clicking the torus surface. Three.js handles the heavy geometry math — your job is converting the intersection UV back to HSL.

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  // Normalize mouse coordinates to [-1, 1]
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(torus);

  if (intersects.length > 0) {
    const hit = intersects[0];
    const uv = hit.uv; // THREE.Vector2 with u and v in [0, 1]

    // Convert UV back to HSL using the same mapping as the shader
    const hue = uv.x;                                      // 0–1 → 0°–360°
    const phi = uv.y * 2 * Math.PI;
    const lightness = 0.5 + 0.5 * Math.sin(phi);
    const saturation = Math.max(0, Math.cos(phi));

    // Convert HSL to hex for downstream use
    const hex = hslToHex(hue * 360, saturation * 100, lightness * 100);

    // Update all downstream components
    setSelectedColor(hex);
    placeSelectionMarker(hit.point);
  }
}

renderer.domElement.addEventListener('click', onMouseClick);
```

**Important:** `intersects[0]` gives the first (frontmost) intersection. If the torus is transparent, the user might intend to click a back-face color. In that case, use `intersects[1]` when the user holds a modifier key (Alt/Option) to "click through" to the back face.

---

### 14.6 Selection Marker

A small glowing sphere that sits on the torus surface at the selected point, showing users exactly where their color lives in 3D space.

```javascript
// Marker geometry — small sphere
const markerGeo = new THREE.SphereGeometry(0.06, 16, 16);
const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const marker = new THREE.Mesh(markerGeo, markerMat);
scene.add(marker);

// Outer glow ring (slightly larger, transparent)
const glowGeo = new THREE.SphereGeometry(0.1, 16, 16);
const glowMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.25
});
const glow = new THREE.Mesh(glowGeo, glowMat);
scene.add(glow);

function placeSelectionMarker(point) {
  marker.position.copy(point);
  glow.position.copy(point);

  // Update marker and glow color to match selected color
  const selectedHex = parseInt(currentHex.replace('#', '0x'));
  markerMat.color.setHex(selectedHex);
  glowMat.color.setHex(selectedHex);

  // Brief pulse animation on selection
  new TWEEN.Tween(glow.scale)
    .to({ x: 2.5, y: 2.5, z: 2.5 }, 120)
    .easing(TWEEN.Easing.Quadratic.Out)
    .chain(
      new TWEEN.Tween(glow.scale)
        .to({ x: 1, y: 1, z: 1 }, 200)
        .easing(TWEEN.Easing.Quadratic.In)
    )
    .start();
}
```

---

### 14.7 Render Loop

```javascript
function animate(time) {
  requestAnimationFrame(animate);

  // Slow auto-rotation when user is idle — gives the torus a living quality
  if (!controls.isDragging) {
    torus.rotation.y += 0.0015;
    torus.rotation.x += 0.0003;
  }

  controls.update();   // Required when damping is enabled
  TWEEN.update(time);  // Required for camera tweens and marker animations
  renderer.render(scene, camera);
}

animate();
```

**Responsive Resize:**
```javascript
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

### 14.8 CMYK Mode Shader Variant

When the user switches to Ink (CMYK) mode, swap the fragment shader to use subtractive color logic. The torus geometry stays identical — only the color math changes.

```glsl
// CMYK fragment shader variant
// Map hue → CMY primary angle, tube → K (black) + chroma

vec3 cmy2rgb(float c, float m, float y) {
  return vec3(1.0 - c, 1.0 - m, 1.0 - y);
}

void main() {
  float angle = vUv.x * 2.0 * 3.14159265; // Hue angle → CMY hue
  float phi   = vUv.y * 2.0 * 3.14159265; // Tube → K + chroma

  // Derive CMY from angle (place C, M, Y at 120° intervals)
  float c = max(0.0, cos(angle));
  float m = max(0.0, cos(angle - 2.094)); // 120° offset
  float y = max(0.0, cos(angle - 4.189)); // 240° offset

  // K (black) increases toward the bottom of the tube
  float k = (1.0 - sin(phi)) * 0.5;

  // Apply K: darken all channels
  vec3 rgb = cmy2rgb(c, m, y) * (1.0 - k);

  gl_FragColor = vec4(rgb, 1.0);
}
```

The mode switch can be accompanied by a shader uniform swap or a full material replacement, with a crossfade achieved by briefly fading the canvas opacity to 0 and back.

---

### 14.9 2D ↔ 3D Toggle

Offer both the classic flat wheel and the torus as interchangeable views with a smooth transition.

**Transition approach:**
1. On toggle, fade the WebGL canvas to 0 opacity over 300ms
2. Swap the underlying geometry/view (flat disc canvas vs. Three.js torus scene)
3. Fade back in over 300ms

This is simpler and more reliable than attempting to morph the geometry directly. The brief fade reads as an intentional "mode switch" rather than a glitch.

**Alternatively**, for a more dramatic transition, you can animate `geometry.parameters.tube` (the tube radius) from `0.001` (effectively a flat ring) to `0.75` (full torus) using a TWEEN — this creates a genuine inflation/deflation morph that looks spectacular.

```javascript
function morphToTorus() {
  const params = { tube: 0.001 };
  new TWEEN.Tween(params)
    .to({ tube: 0.75 }, 900)
    .easing(TWEEN.Easing.Elastic.Out)
    .onUpdate(() => {
      // Rebuild geometry at new tube radius each frame
      torus.geometry.dispose();
      torus.geometry = new THREE.TorusGeometry(2.0, params.tube, 128, 256);
    })
    .start();
}
```

Note that rebuilding the geometry every frame during the tween is expensive — it works fine for a one-time transition animation but should not run continuously.

---

### 14.10 Color Blindness Simulator on the Torus

Applying CVD simulation to the torus is elegantly simple — add a uniform to the fragment shader that holds the CVD transformation matrix, and multiply the output color through it before writing `gl_FragColor`.

```glsl
uniform mat3 cvdMatrix;      // Pass the 3x3 Brettel matrix from JS
uniform bool cvdEnabled;

void main() {
  // ... existing HSL/CMYK color computation ...
  vec3 color = hsl2rgb(hue, saturation, lightness);

  if (cvdEnabled) {
    // Apply linear RGB transform (simulate cone cell absence)
    // Note: for accuracy, should gamma-decode before and re-encode after
    color = cvdMatrix * color;
    color = clamp(color, 0.0, 1.0);
  }

  gl_FragColor = vec4(color, 1.0);
}
```

```javascript
// Deuteranopia matrix (Viénot 1999)
const deuteranopiaMatrix = new THREE.Matrix3().set(
  0.625, 0.375, 0.000,
  0.700, 0.300, 0.000,
  0.000, 0.300, 0.700
);

material.uniforms.cvdMatrix = { value: deuteranopiaMatrix };
material.uniforms.cvdEnabled = { value: true };
```

When the CVD simulator is active, the entire torus surface repaints in the simulated color space in real time — no additional rendering passes, no postprocessing. Users can orbit the torus and watch entire hue regions collapse into indistinguishable bands, which is viscerally educational in a way no flat diagram can match.

---

### 14.11 Performance Notes

| Concern | Recommendation |
|---|---|
| Segment count | 128 radial × 256 tubular is the quality sweet spot; drop to 64×128 on mobile |
| Shader complexity | The HSL shader is cheap — well within mobile GPU limits |
| Geometry rebuilding | Only rebuild geometry during the 2D↔3D morph transition; never per-frame otherwise |
| Pixel ratio | Cap at `Math.min(window.devicePixelRatio, 2)` to avoid over-rendering on high-DPI screens |
| Raycasting | Only raycast on click/tap events, never on mousemove (too expensive per-frame) |
| For mousemove hover | Use a throttled mousemove listener (every 32ms / ~30fps) to show a preview color on hover without full raycasting cost |

---

*Document Version: 3.0 | Project: Chromatica Color Engine*
