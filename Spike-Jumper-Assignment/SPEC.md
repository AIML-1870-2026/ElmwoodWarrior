# NEURO-RUN // CYBER SPRINT — Game Specification

**Document Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-02-26

---

## 1. Overview

NEURO-RUN is a side-scrolling endless runner with rhythm mechanics, procedural world theming, asynchronous ghost multiplayer, and escalating difficulty. The player controls a robotic humanoid navigating a cyberpunk cityscape that gradually transforms into wilderness. The game is built as a single HTML file with no external dependencies beyond Google Fonts.

---

## 2. Core Gameplay Loop

The player runs continuously from left to right. Obstacles spawn from the right and scroll left. The player's only active input is jumping (and optionally crouching). Survival time and rhythm accuracy determine score. Each minute of survival triggers a difficulty escalation and a boss encounter. The world theme shifts over time. Death is impactful and cinematic. After death, run data is saved as a ghost for asynchronous racing.

---

## 3. Player Character

### 3.1 Design
- Robotic humanoid silhouette inspired by the aesthetic of *I, Robot*
- Rendered via HTML5 Canvas using geometric shapes (no external sprite sheets)
- Visible joints, limb segments, visor/optic lens, chest panel detail
- Color palette: matte dark chassis with neon cyan accent lighting

### 3.2 Animation States
| State | Description |
|---|---|
| `run` | Cyclic leg and arm swing, ~12 FPS |
| `jump_rise` | Body stretches vertically, arms raised |
| `jump_fall` | Body contracts slightly, arms down |
| `land` | Squash compression on Y-axis, rapid recovery |
| `duck` | Crouch, reduced hitbox height |
| `death` | Full ragdoll-style disassembly sequence |

### 3.3 Feel
- **Jump sound:** Synthesized servo/thruster burst (Web Audio API)
- **Land sound:** Metallic clank with subtle bass thud
- **Land particles:** 6–10 small sparks emitting outward from feet, short lifespan (200ms), cyan/white tinted
- **Screen shake on land:** Magnitude 3px, duration 150ms, decaying
- **Compression on land:** scaleY briefly drops to 0.75, snaps back over 100ms

---

## 4. Controls

| Input | Action |
|---|---|
| `Space` / `ArrowUp` / `W` | Jump (hold for higher jump, max 300ms) |
| `ArrowDown` / `S` | Duck / slide |
| `Touch tap` | Jump |
| `Touch swipe down` | Duck |

---

## 5. Obstacles & Hazards

All obstacles are procedurally selected from a **pattern library** (see Section 6).

### 5.1 Ground Obstacles
| Obstacle | Description | Zone |
|---|---|---|
| Ground Car | Low-poly neon sedan, moving left | City |
| Barricade | Police tape + concrete block | City |
| Debris Pile | Rubble and scrap | City / Wasteland |
| Log / Rock | Natural obstacles | Forest |
| Tree Stump | Low obstacle requiring jump | Forest |

### 5.2 Aerial Obstacles
| Obstacle | Description | Zone |
|---|---|---|
| Flying Car | Hovers at mid-height, requires duck or timing | City |
| Drone | Fast-moving, small hitbox | City / Wasteland |
| Low-flying Bird | Organic aerial obstacle | Forest |
| Falling Branch | Drops from above | Forest |

### 5.3 Boss Encounters (end of each minute)
Bosses are special sequences that last ~15 seconds and do not follow normal pattern rules.

| Minute | Boss Name | Behavior |
|---|---|---|
| 1 | POLICE CRUISER | Hovers screen-wide, fires warning beams, player must dodge gaps |
| 2 | CONSTRUCTION MECH | Large walker dropping debris in patterns |
| 3 | SWARM DRONE CLUSTER | Dense grid of drones requiring precise timing |
| 4 | CORPORATE GUNSHIP | Combination of aerial and ground attacks |
| 5+ | CORRUPTED FOREST SPIRIT | Organic boss, vines and roots erupting from ground |

Bosses are preceded by a full-screen warning flash and a boss name card with sound effect.

---

## 6. Pattern Library

Obstacles spawn via a weighted pattern library rather than pure randomness. This ensures fair challenge escalation and rhythm compatibility.

### 6.1 Pattern Format
Each pattern is an object describing:
- A sequence of obstacle spawn timings (relative ms offsets)
- Obstacle types per slot
- Required gap time before pattern begins
- Minimum difficulty tier to unlock

```
Pattern {
  id: string,
  tier: 1–5,
  gaps: number[],          // ms before each obstacle in sequence
  types: ObstacleType[],   // obstacle per gap slot
  airborne: boolean[],     // whether each obstacle is aerial
  rhythmAligned: boolean,  // whether this pattern is beat-synced
}
```

### 6.2 Example Patterns
| Pattern ID | Tier | Description |
|---|---|---|
| `single_low` | 1 | Single ground car, generous gap |
| `double_low` | 1 | Two ground cars close together |
| `high_low` | 2 | Flying car followed immediately by ground car |
| `triple_stagger` | 2 | Three obstacles with increasing gap compression |
| `aerial_sweep` | 3 | Two flying cars at different heights |
| `sandwich` | 3 | Ground obstacle, flying obstacle, ground obstacle |
| `rhythm_burst` | 4 | 4 obstacles spaced exactly to music beat interval |
| `boss_wave` | 5 | Boss-tier wall of obstacles requiring perfect execution |

Pattern selection uses a weighted random draw. Higher-tier patterns unlock as difficulty increases. Recent patterns are excluded from re-selection to prevent repetition.

---

## 7. Rhythm System

### 7.1 Beat Detection
- A procedurally generated background music track is synthesized using the Web Audio API
- BPM is fixed at **128 BPM** for tiers 1–3, increasing to **140 BPM** at tier 4, **155 BPM** at tier 5
- Beat timestamps are pre-calculated as `beatInterval = 60000 / BPM` ms
- Obstacles tagged `rhythmAligned: true` spawn exactly on beat boundaries

### 7.2 Rhythm Jump Scoring
When the player jumps, the engine compares jump timestamp to the nearest beat:

| Timing Window | Label | Bonus Points | Visual Feedback |
|---|---|---|---|
| ±50ms | PERFECT | +100 | Gold flash, "PERFECT" text |
| ±120ms | GOOD | +40 | Cyan flash, "GOOD" text |
| ±200ms | OK | +10 | White flash, "OK" text |
| Outside window | MISS | 0 | No feedback |

### 7.3 Visual Beat Feedback
- A horizontal rhythm bar is displayed at the bottom of the screen
- A moving marker sweeps left-to-right in sync with the beat
- A center window highlights the "perfect" timing zone
- Beat pulses cause a subtle vignette flash on the screen edges

### 7.4 Combo Multiplier
- 3 consecutive PERFECT or GOOD jumps: **1.5× score multiplier**
- 6 consecutive: **2×**
- 10 consecutive: **3×** with visual aura effect on player
- Any MISS or non-rhythmic jump resets combo

---

## 8. Difficulty Progression

Difficulty is time-based, escalating every 60 seconds. Each tier has a distinct visual identity via procedural theming (Section 9).

| Tier | Time | Speed Multiplier | Pattern Pool | Obstacle Frequency |
|---|---|---|---|---|
| 1 | 0:00 – 1:00 | 1.0× | Tier 1 only | Low |
| 2 | 1:00 – 2:00 | 1.2× | Tier 1–2 | Medium |
| 3 | 2:00 – 3:00 | 1.4× | Tier 1–3 | Medium-High |
| 4 | 3:00 – 4:00 | 1.6× | Tier 1–4 | High |
| 5+ | 4:00+ | 1.8× + 0.05×/min | All | Very High |

Speed affects both obstacle scroll speed and parallax layer speeds. Ground particles and background elements scale with speed for visual cohesion.

---

## 9. Procedural World Theming

The world gradually transitions from dense cyberpunk city to desolate forest. Transitions occur at tier boundaries over a 10-second interpolation period.

### 9.1 Theme Zones

| Tier | Zone Name | Sky Color | Building Density | Ground Color | Special Elements |
|---|---|---|---|---|---|
| 1 | Mega City | Deep purple-black | Max — skyscrapers | Dark concrete | Neon signs, hovercars, smog |
| 2 | Mid District | Indigo-black | High — mid-rise | Cracked asphalt | Fewer signs, more decay |
| 3 | Outskirts | Dark teal | Sparse — low-rise | Rubble and dirt | Industrial ruins |
| 4 | Wasteland | Dark green | Very sparse — ruins | Muddy ground | Vines on ruins |
| 5+ | Forest | Deep forest green | None → trees | Mossy earth | Full tree canopy, fireflies |

### 9.2 Parallax Layers (5 layers, each scrolling at different speeds)

| Layer | Content | Speed Multiplier |
|---|---|---|
| 0 (farthest) | Sky gradient, moon/stars | 0.1× |
| 1 | Distant skyline silhouette | 0.2× |
| 2 | Mid-distance buildings/trees | 0.4× |
| 3 | Foreground structures | 0.7× |
| 4 (ground) | Ground plane, obstacles | 1.0× |

Each layer interpolates colors and shapes between themes over the transition period.

### 9.3 Environmental Particles
- City tiers: floating embers, smog drift, neon sign flicker
- Transition: dust and debris
- Forest tiers: falling leaves, fireflies, rain

---

## 10. Death Sequence

Death must feel final and cinematic.

### 10.1 Sequence Timeline
| Time | Event |
|---|---|
| 0ms | Collision detected, gameplay freezes |
| 0ms | Player character disassembles — limbs fly in physics-simulated arcs |
| 0ms | Screen shake: magnitude 12px, duration 800ms |
| 100ms | White flash fills screen (opacity 0.9), fades over 400ms |
| 200ms | Red chromatic aberration effect on canvas |
| 300ms | Explosion particle burst from player position (40+ particles) |
| 400ms | Low-frequency bass hit audio (synthesized via Web Audio) |
| 600ms | Screen slowly desaturates to grayscale |
| 1200ms | "SYSTEM FAILURE" text slams onto screen with glitch animation |
| 1800ms | Score card animates in |
| 2500ms | Ghost save prompt appears |
| 3000ms | Restart prompt appears |

### 10.2 Death Audio
- Synthesized explosion: layered noise burst + sub-bass drop
- High-pitched whine descending (servo failure)
- Static crackle fading out

---

## 11. Scoring System

```
Base Score     = survival time (ms) / 10
Rhythm Bonus   = sum of all rhythm hit bonuses
Multiplier     = current combo multiplier (1.0× – 3.0×)

Final Score    = (Base Score + Rhythm Bonus) × Multiplier
```

Score is displayed live in the HUD. High score is persisted in `localStorage`. Beat accuracy percentage is shown on the death screen.

---

## 12. Ghost Multiplayer (Asynchronous)

### 12.1 Run Data Recording
Every run records a **ghost frame array**:
```
GhostFrame {
  t: number,         // timestamp (ms from run start)
  x: number,         // player x (fixed)
  y: number,         // player y
  state: string,     // animation state
  scaleY: number,    // for squash/stretch
}
```
Frames are captured every 16ms (60 FPS equivalent). The complete array is serialized and stored in `localStorage` under a keyed ghost slot.

### 12.2 Ghost Storage
- Up to **5 ghost runs** stored locally
- Stored as JSON in `localStorage["neurorun_ghosts"]`
- Each entry includes: `name`, `score`, `date`, `theme_reached`, `beat_accuracy`, `frames[]`
- Ghost names default to "GHOST-[4 char hex]" but can be renamed

### 12.3 Ghost Playback
- On run start, all saved ghosts play simultaneously as semi-transparent overlays
- Ghost color: pink/magenta at 40% opacity, no collision
- Ghost position is driven by frame interpolation
- Ghost name tag floats above their position
- If ghost dies (recorded death frame), they flicker out with a small particle burst

### 12.4 Ghost Management UI
- Accessible from the title screen under "GHOSTS"
- List view showing all stored runs with score, date, name, beat accuracy
- Options: rename, delete, export (JSON copy to clipboard), import

---

## 13. UI / UX Standards

The game follows international HCI and accessibility best practices.

### 13.1 HUD Layout
```
┌──────────────────────────────────────────────────────────┐
│  [SCORE]              [ZONE / TIER]             [TIME]   │
│  000000               MEGA CITY T1              01:23    │
│  MULTIPLIER: 1.5×     ████████░░░░ BOSS IN 37s           │
└──────────────────────────────────────────────────────────┘
                    [GHOST PANEL — right side]
                    [RHYTHM BAR — bottom center]
```

### 13.2 Color Contrast
- All HUD text meets WCAG AA contrast ratios against the dark background
- Critical information (score, timer) uses high-luminance neon colors

### 13.3 Keyboard Accessibility
- Full game playable via keyboard alone
- All menus navigable via arrow keys + Enter
- Escape pauses the game

### 13.4 Responsive Layout
- Canvas scales to fit viewport while maintaining 16:9 aspect ratio
- Letterboxed on non-standard ratios
- Touch controls displayed on mobile viewports

### 13.5 Pause Menu
- `Escape` or `P` pauses
- Options: Resume, Restart, Mute Audio, Ghost Management, Quit to Title

---

## 14. Audio System (Web Audio API)

All audio is synthesized — no external files required.

| Sound | Generation Method |
|---|---|
| Jump | Short oscillator burst (sine → triangle), pitch glide up |
| Land | Noise burst + low-pass filter, very short |
| Boss warning | Long descending sine with tremolo |
| Death explosion | Noise + sub-bass, layered |
| Rhythm beat | Subtle kick drum synthesis (sine 60Hz + noise) |
| Background music | Generative 128 BPM track using oscillators + sequencer |
| PERFECT hit | High bell tone, short reverb tail |
| Multiplier up | Ascending arpeggio, 3 notes |

Music volume: 40% default. SFX volume: 80% default. Both adjustable in pause menu. Mute toggle available.

---

## 15. Technical Architecture

### 15.1 File Structure
Single `.html` file containing:
- Inline CSS
- Inline JavaScript (no external dependencies except Google Fonts)
- All game logic, rendering, audio, and data management

### 15.2 Core Systems (JavaScript modules/objects)
```
GameEngine         — main loop, state machine, input
Renderer           — canvas 2D drawing, layer management
PlayerController   — physics, animation state machine
ObstacleManager    — pattern library, spawning, pooling
ParallaxSystem     — 5-layer background, theme interpolation
RhythmEngine       — beat clock, timing windows, feedback
AudioEngine        — Web Audio API synthesis
ScoreSystem        — points, multiplier, combo
GhostSystem        — record, serialize, playback
DeathSequence      — coordinated cinematic death
BossManager        — boss encounter state machine
ThemeManager       — zone transitions, procedural art
UIManager          — HUD, screens, menus
StorageManager     — localStorage read/write, ghost data
```

### 15.3 Game Loop
```
requestAnimationFrame loop at 60 FPS target
  → handle input
  → update physics
  → update rhythm clock
  → update obstacles (pattern library draw)
  → update parallax layers
  → update theme interpolation
  → update ghost playback
  → check collisions
  → update score
  → render all layers
  → render HUD
  → render particles
```

### 15.4 Collision Detection
- Player hitbox: 60% of visual bounding box (forgiveness margin)
- AABB (axis-aligned bounding box) collision for all obstacles
- Separate hitbox for duck state (reduced height)

---

## 16. Performance Targets

| Metric | Target |
|---|---|
| Frame rate | 60 FPS on modern hardware |
| Canvas resolution | 1280×720 logical (scaled to viewport) |
| Object pooling | Obstacles and particles reused, no GC spikes |
| Ghost data size | ≤ 500KB per run (compressed frame deltas) |
| Load time | < 1 second (no network assets) |

---

## 17. Stretch Goals (Future)

- Export ghost data as shareable URL (base64 encoded)
- Leaderboard via a lightweight serverless backend
- Additional player skins unlocked by score milestones
- Procedural music BPM that adapts to player's average jump rhythm
- WebGL renderer for shader-based neon glow effects
- PWA manifest for installable offline play

---

## 18. Out of Scope (v1.0)

- Real-time multiplayer (ghost only, not live)
- Mobile app packaging
- External audio files or sprite assets
- Backend/server infrastructure

---

*End of Specification*
