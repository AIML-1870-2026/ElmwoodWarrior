# Sleep or Suffer: An Interactive Perceptron Experience

## Overview

"Sleep or Suffer" is an immersive, visual perceptron demonstration that answers: **"Should I sleep?"** 

A dominant **abstract neural network visualization** occupies 60%+ of the viewport. Glowing pathways dim and fade as sleep probability rises. Ethereal particle streams flow from input sliders into brain regions. When probability exceeds 95%, the entire screen fades to black — you've crashed out.

---

## Core Decision

- **Yes (Sleep):** "Crash Out 💤"
- **No (Awake):** "Stay Conscious ⚡"
- **Bias Name:** "Sleep Paralysis Preview" — your baseline pull toward unconsciousness
- **Bias Range:** -3 to +3 (starts at +0.3)

---

## Inputs (5 Total)

All inputs: **higher value = more likely to sleep**

| Input | Range | Units | Weight | Brain Region | Description |
|-------|-------|-------|--------|--------------|-------------|
| **Body Exhaustion** | 0-10 | scale | +0.40 | Brainstem (bottom) | Physical fatigue. 0 = fresh, 10 = can't move |
| **Brain Mush** | 0-10 | scale | +0.30 | Prefrontal (top) | Mental fog. 0 = sharp, 10 = thoughts are soup |
| **Caffeine Crash** | 0-8 | hours | +0.25 | Reticular (center) | Hours since caffeine. 0 = just had coffee, 8 = wore off |
| **Schedule Emptiness** | 0-24 | hours | +0.20 | Temporal (left) | Hours until obligation. 0 = now, 24 = nothing today |
| **Boredom Level** | 0-10 | scale | +0.35 | Parietal (right) | Engagement. 0 = hyperfocused, 10 = nothing interesting |

---

## Central Visualization: Abstract Neural Network

### Structure
An abstract network of glowing nodes and pathways — not anatomically realistic, but evocative of neural activity:

```
                    ╭───╮
          ╭───╮────│ ● │────╭───╮          ← Prefrontal (Brain Mush)
          │ ● │    ╰─┬─╯    │ ● │
          ╰─┬─╯      │      ╰─┬─╯
    ╭───╮───┴────────┴────────┴───╭───╮
    │ ● │                          │ ● │   ← Left: Schedule / Right: Boredom
    ╰─┬─╯     ╭───────────────╮   ╰─┬─╯
      │       │               │     │
      ├───────│   ◉ THE GATE  │─────┤      ← Central gate (Bias)
      │       │               │     │
    ╭─┴─╮     ╰───────────────╯   ╭─┴─╮
    │ ● │            │            │ ● │    ← Reticular (Caffeine)
    ╰─┬─╯            │            ╰─┬─╯
      ╰──────────────┴──────────────╯
                     │
                  ╭──┴──╮
                  │ ● ● │                   ← Brainstem (Body Exhaustion)
                  ╰─────╯
```

### Node & Pathway Behavior

**Fully Awake (0-20%):**
- All nodes: bright white/cyan glow with purple edges
- Pathways: rapid pulse animation (1s cycle)
- Full color saturation
- The Gate: wide, bright, open

**Getting Drowsy (20-50%):**
- Peripheral nodes dim 30%
- Pulse slows to 1.5s cycle
- Slight desaturation (15%)
- Faint vignette appears

**The Drift (50-75%):**
- Only core pathways lit
- Pulse at 2.5s cycle (lazy)
- Prefrontal region mostly dark
- Edge blur begins (4px)
- Vignette deepens

**Fighting Sleep (75-90%):**
- Only brainstem + gate glowing
- Pulse at 4s (breathing rhythm)
- Heavy blur (8px edges)
- Strong grain overlay
- Occasional flicker (nodding off)

**Lights Out (90-100%):**
- Gate constricts and dims
- Nodes fade sequentially
- At 95%: crash transition triggers

---

## Particle Streams

Each slider emits particles flowing into its brain region:

| Input | Particle Color | Behavior |
|-------|---------------|----------|
| Body Exhaustion | Deep purple `#7c3aed` | Heavy, slow, gravitational |
| Brain Mush | Foggy gray `#9ca3af` | Scattered, chaotic paths |
| Caffeine Crash | Amber `#d97706` | Fading, dissolving mid-flight |
| Schedule Emptiness | Soft blue `#60a5fa` | Calm, drifting arcs |
| Boredom Level | Muted green `#4ade80` | Sluggish, sparse |

**Properties:**
- Stream thickness scales with input value (0 = none, max = dense)
- Particles follow curved bezier paths
- Speed decreases as sleep probability rises
- Particles fade/absorb into nodes on arrival
- 10-60 particles per active stream

---

## Full-Page Visual Effects

All effects scale with sleep probability (p = 0 to 1):

| Effect | CSS/Implementation | Purpose |
|--------|-------------------|---------|
| **Blur** | `blur(calc(p * 12px))` via radial mask | Heavy eyelids |
| **Vignette** | `box-shadow: inset 0 0 calc(p * 250px) rgba(0,0,0,p*0.9)` | Tunnel vision |
| **Desaturation** | `saturate(calc(1 - p * 0.85))` | Color draining |
| **Darkening** | Overlay: `rgba(5,5,15, p * 0.75)` | Lights dimming |
| **Grain** | SVG noise filter, `opacity: p * 0.35` | Brain fog |
| **Drift** | `translateY(sin(t) * p * 8px)` | Elements floating |
| **Slowdown** | Animation duration × `(1 + p * 2)` | Time stretching |

---

## The Crash Transition (≥95%)

### Sequence

1. **Escalation (500ms)**
   - Blur snaps to 20px
   - Vignette closes rapidly
   - Full desaturation

2. **Network Shutdown (800ms)**
   - All nodes flash once
   - Pathways fade outer → inner
   - Gate shrinks and dims

3. **Blackout (600ms)**
   - Screen fades to `#050508`
   - All particles freeze and fade

4. **Sleep State (sustained)**
   - Network outline at 10% opacity
   - Slow "sleep wave" pulse (6s cycle)
   - Floating dream particles (soft pastels)
   - Subtle nebula/starfield background
   - Text: *"You have entered sleep paralysis preview mode..."*
   - "Wake Up" button fades in after 2s

5. **Wake Up (on click)**
   - Reverse sequence over 1.5s
   - Network reignites node by node

---

## Feature 1: Multi-Scenario Neuron

### Presets

| Scenario | Emoji | Yes / No | Sample Inputs |
|----------|-------|----------|---------------|
| Sleep or Suffer | 😴 | Crash Out / Stay Conscious | Body Exhaustion, Brain Mush, Caffeine Crash, Schedule Emptiness, Boredom |
| Choose a College | 🎓 | Apply / Skip | Academic Fit, Financial Aid, Distance, Campus Vibe, Career Prospects |
| Adopt a Pet | 🐕 | Adopt / Wait | Time Available, Living Space, Budget, Allergies, Emotional Readiness |
| Road Trip? | 🚗 | Go / Stay | Gas Money, Days Off, Car Condition, Friends In, Weather |
| Tech Upgrade | 💻 | Buy / Hold | Current Pain, Need Features, Budget, Sale Active, Resale Value |

### Scenario Switcher
- Dropdown in header: `[😴 Sleep or Suffer ▼]`
- Switching updates all labels, weights, ranges, colors, celebration text

### Create Your Own
Modal with:
- Title + emoji picker
- Yes/No labels
- 3-7 inputs with name, range, weight sign
- Celebration text for threshold crossing

---

## Feature 2: Decision Boundary Visualizer

### 2D Heatmap
- **X-axis:** Selectable input (default: Caffeine Crash)
- **Y-axis:** Selectable input (default: Body Exhaustion)
- **Colors:** Blue (awake) → White (50%) → Purple (sleep)
- **Resolution:** 50×50 grid, smooth interpolation

### Decision Boundary
- Gold contour line `#fbbf24` at 50% probability
- Subtle glow animation
- Shifts when bias or other inputs change

### Current Position
- Crosshair dot at current slider values
- Color matches output probability
- Gentle pulse, faint trail on movement

### Controls
```
X-Axis: [Caffeine Crash    ▼]
Y-Axis: [Body Exhaustion   ▼]
(Other inputs held at current values)
```

---

## Feature 3: Activation Function Showdown

### Functions

| Function | Formula | Output Range | Visual Effect |
|----------|---------|--------------|---------------|
| **Sigmoid** | 1/(1+e^(-z)) | 0 to 1 | Smooth transitions |
| **Step** | z ≥ 0 ? 1 : 0 | 0 or 1 | Snap on/off at 50% |
| **ReLU** | max(0, z) | 0 to ∞ (clamped) | Linear after threshold |

### UI
- Radio buttons to select function
- Checkbox: "Compare all" overlays all curves
- Live curve plot with current z marker
- Math display updates: `z = Σ(wx) + b → f(z) = output`

### Curve Colors
- Sigmoid: Purple `#a855f7`
- Step: Orange `#f97316`
- ReLU: Cyan `#06b6d4`

---

## Feature 4: Two-Neuron Chain

### Architecture

```
┌──────────────────┐              ┌──────────────────┐
│    NEURON 1      │    w₁₂      │    NEURON 2      │
│   "Body Check"   │═══════════▶│  "Final Verdict" │
├──────────────────┤              ├──────────────────┤
│ • Body Exhaustion│              │ • Neuron 1 Output│
│ • Brain Mush     │              │ • Bed Accessible │
│ • Caffeine Crash │              │ • Social Cost    │
│ • Schedule Empty │              │ • Tomorrow Free  │
│ • Boredom Level  │              │                  │
├──────────────────┤              ├──────────────────┤
│ Bias: Sleep      │              │ Bias: Decision   │
│ Paralysis Preview│              │ Paralysis        │
└──────────────────┘              └──────────────────┘
        ↓                                  ↓
   z₁ → σ(z₁) = a₁  ──────────▶  z₂ = w₁₂·a₁ + ... → σ(z₂)
```

### Neuron 2 Additional Inputs

| Input | Range | Description |
|-------|-------|-------------|
| Bed Accessible | 0-10 | 0 = nowhere to lie down, 10 = already in bed |
| Social Cost | 0-10 | 0 = people judging, 10 = no one cares |
| Tomorrow Free | 0-10 | 0 = early alarm, 10 = can sleep in |

### Visual
- Two neuron "blobs" connected by animated synapse
- Synapse thickness = connection weight
- Pulse travels along synapse showing signal
- Both neurons show internal state
- Math display: `z₁ → a₁ → z₂ → output`

### Synapse Weight
- Adjustable slider: -2 to +2
- Affects how much Neuron 1 influences Neuron 2

---

## Feature 5: Sensitivity Analysis

### Line Chart Mode
- One line per input
- X-axis: normalized input value (0 to 1)
- Y-axis: output probability
- Each line shows: "If I sweep this input while holding others constant..."
- Steep line = high influence
- Vertical markers show current slider positions

### Bar Chart Mode
- Ranks inputs by absolute weight magnitude
- Visual bars with numeric values
- Shows: "Which inputs actually matter?"

### Display
```
┌─────────────────────────────────────────────────────┐
│ SENSITIVITY ANALYSIS          [Lines ▼] [Bars]     │
├─────────────────────────────────────────────────────┤
│  1.0 ┤    ╱───── Body Exhaustion                   │
│      │   ╱   ╱── Boredom                           │
│  0.5 ┤──╱───╱─── Brain Mush                        │
│      │ ╱   ╱     ╱─ Caffeine                       │
│  0.0 ┤╱───╱─────╱── Schedule                       │
│      0         0.5         1.0                     │
│                                                    │
│  Most Influential: Body Exhaustion (0.40)          │
│  Least Influential: Schedule Emptiness (0.20)      │
└─────────────────────────────────────────────────────┘
```

---

## Training Mode

### Adding Points
- Click on Decision Boundary heatmap to add training examples
- Two-button or toggle: "Sleep" vs "Awake" label
- Points appear as colored dots (blue = awake, purple = sleep)

### Controls
- **Step:** Single gradient descent iteration with animation
- **Train 10x:** Run 10 iterations automatically
- **Reset:** Clear points and reset weights to defaults

### Feedback
- Current accuracy percentage
- Step counter
- Misclassified points highlighted
- Weight values update live
- Decision boundary animates as it shifts

---

## UI Layout

### Desktop (≥1024px)

```
┌────────────────────────────────────────────────────────────────────┐
│ [😴 Sleep or Suffer ▼]                            [⚙️] [?]        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌────────────┐                                    ┌────────────┐  │
│ │BODY EXHAUS.│                                    │BOREDOM     │  │
│ │ ●━━━━━━━━░ │  ═══▶  ╭─●─╮     ╭─●─╮  ◀═══  │ ░━━━●━━━━━ │  │
│ │ 7/10       │        │   ╲   ╱   │        │ 5/10       │  │
│ ├────────────┤        ●    ╲ ╱    ●        ├────────────┤  │
│ │BRAIN MUSH  │        │     ◉     │        │SCHEDULE    │  │
│ │ ●━━━━━━━░░ │  ═══▶  │    ╱ ╲    │  ◀═══  │ ░━━●━━━━━━ │  │
│ │ 8/10       │        ●   ╱   ╲   ●        │ 12 hrs     │  │
│ ├────────────┤        ╰─●─╯     ╰─●─╯        └────────────┘  │
│ │CAFFEINE    │            │   │                              │
│ │ ░━━━●━━━━━ │  ═══▶     ╭─●─╮                              │
│ │ 3 hrs      │                                               │
│ └────────────┘      THE NEURAL NETWORK                       │
│                                                                │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ SLEEP PARALYSIS PREVIEW:  ░░░░░●━━━━━━━━  +0.3            ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌────────────────────────────┐│
│ │OUTPUT: 67%  │ │ [Sigmoid ▼] │ │  Function Curve            ││
│ │ ████████░░░ │ │ ○Step ○ReLU │ │       ╭────                ││
│ │ 😴 Drowsy   │ │ □Compare    │ │   ────╯ ●                  ││
│ └─────────────┘ └─────────────┘ └────────────────────────────┘│
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ [Decision Boundary] [Sensitivity] [Two-Neuron] [Training]     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│              (Expandable panel for selected tab)               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
- Neural network: top 45% of viewport
- Sliders: vertical stack below
- Tabs: horizontal scroll
- Panels: full-width accordion

---

## Visual Design System

### Colors

**Base Palette (Dark Mode Only):**
```
Background:      #0a0a0f
Surface:         #141420
Surface Raised:  #1e1e2e
Border:          rgba(255,255,255,0.1)
Text Primary:    #e8e8f0
Text Secondary:  #9ca3af
Accent Purple:   #a78bfa
Accent Cyan:     #22d3ee
Alert Gold:      #fbbf24
Sleep Deep:      #312e81
```

**Sleep-Shifted (as probability rises):**
```
Background:      #050508
Surface:         #0a0a12
Text:            #6b6b80
Accent:          #7c3aed
```

### Typography
- **Headers:** "Space Grotesk" or "Outfit" — modern, rounded
- **Body:** "Inter" or "DM Sans" — clean, readable
- **Data/Numbers:** "JetBrains Mono" — precise, technical

### Components

**Sliders:**
- Track: 8px height, rounded, gradient fill (purple → deep blue)
- Thumb: Glowing orb with soft shadow
- Value tooltip above thumb while dragging
- Particle emitter at thumb position

**Cards/Panels:**
- Border-radius: 16px
- Glass effect: `backdrop-filter: blur(12px)`
- Border: 1px solid `rgba(255,255,255,0.08)`
- Subtle shadow spreading outward

**Buttons:**
- Pill-shaped (full rounded)
- Gradient background
- Hover: lift (-2px) + glow
- Active: press down + ripple

**Tabs:**
- Underline indicator (animated slide)
- Active tab: full opacity + accent color
- Inactive: 60% opacity

### Micro-interactions
- All color transitions: 300ms ease-out
- Layout shifts: 400ms with slight overshoot
- Effect intensity: 150ms (responsive)
- Hover states: subtle lift + glow
- Sliders: value appears above thumb

---

## Technical Implementation Notes

### Rendering
- Neural network: SVG or Canvas (Canvas preferred for particle performance)
- Particle system: requestAnimationFrame loop, 60fps target
- Heatmap: Canvas with offscreen rendering for performance
- Effects: CSS filters where possible, canvas overlay for grain

### State Management
- Central store for all input values, weights, bias
- Computed probability updates on any change
- Effect intensities derived from probability
- Scenario switching resets store to preset values

### Animation Priorities
1. Particle streams (continuous)
2. Node pulses (continuous)
3. Effect transitions (on probability change)
4. UI interactions (on user input)

### Responsive Breakpoints
- Desktop: ≥1024px (full layout)
- Tablet: 768-1023px (adjusted proportions)
- Mobile: <768px (stacked layout)

### Accessibility
- Respect `prefers-reduced-motion`: disable particle streams, simplify effects
- Keyboard navigation for all controls
- Screen reader labels for all inputs and outputs
- Sufficient color contrast in all states

---

## Celebration / Threshold Events

### Sleep Threshold (≥95%)
- Trigger crash transition
- Display: *"You have entered sleep paralysis preview mode..."*
- Optional: play soft ambient sound

### Wake Threshold (returning to <30%)
- Display: *"Welcome back to consciousness"*
- Network fully reignites

### Training Milestones
- 100% accuracy: *"The neuron has learned your sleep patterns!"*
- Boundary shift animation celebration

---

## File Structure (Suggested)

```
/src
  /components
    NeuralNetwork.jsx       # Main brain visualization
    ParticleStream.jsx      # Particle system per input
    Slider.jsx              # Custom input slider with emitter
    DecisionBoundary.jsx    # Heatmap visualization
    ActivationPlot.jsx      # Function curve display
    NeuronChain.jsx         # Two-neuron visualization
    SensitivityChart.jsx    # Line/bar sensitivity display
    TrainingControls.jsx    # Training mode UI
    ScenarioSelector.jsx    # Dropdown + custom creator
  /hooks
    usePerceptron.js        # Core math + state
    useParticles.js         # Particle physics
    useEffects.js           # Full-page effect calculations
  /data
    scenarios.js            # Preset scenario definitions
  /styles
    globals.css             # Base styles + CSS variables
    effects.css             # Sleep effect classes
  App.jsx
  index.jsx
```

---

## Summary

This spec defines an immersive perceptron experience where:

1. **Central neural network** dominates the viewport, with glowing nodes and pathways that dim as you drift toward sleep
2. **Ethereal particle streams** flow from sliders into brain regions
3. **Full-page effects** (blur, vignette, desaturation, grain, drift) intensify with sleep probability
4. **Crash transition** blacks out the screen when you fully succumb
5. **Five stretch features** extend the educational value:
   - Multi-scenario support with custom creator
   - 2D decision boundary heatmap
   - Activation function comparison
   - Two-neuron chain demonstration
   - Sensitivity analysis charts

The "Sleep Paralysis Preview" bias anchors the experience with humor while teaching real ML concepts through visceral, visual feedback.
