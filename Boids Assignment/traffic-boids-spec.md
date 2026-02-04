# Traffic Boids Simulation — Technical Specification

**Version:** 1.0  
**Type:** Web-Based Interactive Simulation  
**Target Performance:** 1,000+ agents @ 60 FPS

---

## 1. Overview

Traffic Boids is a browser-based simulation that applies Craig Reynolds' classic **Boids flocking algorithm** to a stylized top-down traffic visualization. The simulation demonstrates how simple, local behavioral rules produce emergent complex phenomena—traffic jams, spontaneous lane formation, and coordinated swarms—without any central coordination.

### 1.1 Design Goals

| Goal | Description |
|------|-------------|
| **Emergent Behavior** | Complex traffic patterns arise from three simple steering rules |
| **Performance** | Smooth 60 FPS with 1,000+ simultaneous agents via spatial partitioning |
| **Tunability** | Real-time parameter adjustment through an intuitive control panel |
| **Visual Polish** | Three distinct cinematic themes with trails, lighting effects, and telemetry |

---

## 2. Core Algorithm

Each agent ("Car") computes its velocity every frame by summing three weighted steering forces:

### 2.1 Steering Behaviors

| Behavior | Force Description | Real-World Analogy |
|----------|-------------------|-------------------|
| **Separation** | Steer away from nearby neighbors to avoid collision | Maintaining safe following distance |
| **Alignment** | Steer toward the average heading of nearby neighbors | Matching traffic flow speed/direction |
| **Cohesion** | Steer toward the average position of nearby neighbors | Staying with the group/lane |

### 2.2 Velocity Update Formula

```
acceleration = (separation × wₛ) + (alignment × wₐ) + (cohesion × wc) + flee_force
velocity = clamp(velocity + acceleration, max_speed)
position = position + velocity
heading = atan2(velocity.y, velocity.x)
```

Where `wₛ`, `wₐ`, and `wc` are user-adjustable weights.

---

## 3. User Interface Specification

### 3.1 Control Panel

A collapsible accordion-style settings panel positioned in a corner of the viewport.

| Property | Value |
|----------|-------|
| **Default State** | Collapsed (closed) |
| **Toggle Behavior** | Click header to expand/collapse |
| **Position** | Top-right or top-left corner (fixed) |
| **Width** | ~280–320px when expanded |

### 3.2 Flocking Parameters (Sliders)

All sliders display their current numeric value and update the simulation in real-time.

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| **Separation Weight** | 0.0 – 5.0 | 1.5 | Multiplier for collision avoidance force |
| **Alignment Weight** | 0.0 – 5.0 | 1.0 | Multiplier for velocity matching force |
| **Cohesion Weight** | 0.0 – 5.0 | 1.0 | Multiplier for group centering force |
| **Neighbor Radius** | 20 – 200 px | 75 | Perception distance for detecting neighbors |
| **Max Speed** | 1 – 10 | 4 | Maximum velocity magnitude (px/frame) |
| **Max Force** | 0.01 – 1.0 | 0.1 | Maximum steering force (affects turn radius) |

### 3.3 Preset Configurations

A dropdown or button group that instantly applies tuned parameter sets. **Presets must produce visibly distinct behaviors—not minor tweaks.**

| Preset | Sep | Align | Cohesion | Radius | Max Speed | Behavior |
|--------|-----|-------|----------|--------|-----------|----------|
| **Schooling** | Low (0.5) | High (3.0) | Medium (1.5) | Large (100) | Medium (4) | Synchronized formations moving as a coordinated unit; fish-school behavior |
| **Chaotic Swarm** | Medium (1.2) | Low (0.3) | Low (0.3) | Small (30) | High (6) | Erratic, unpredictable motion; agents barely influence each other; "panicked crowd" |
| **Tight Cluster** | Moderate (1.0) | Medium (1.5) | Very High (4.0) | Medium (75) | Low (3) | Dense blob that moves together; agents constantly pulled toward center mass |

**Validation:** Each preset should be immediately recognizable within 2 seconds of activation. If two presets look similar, adjust weights further apart.

### 3.4 Global Controls

| Control | Type | Behavior |
|---------|------|----------|
| **Boundary Mode** | Toggle: `Wrap` / `Bounce` | **Wrap:** Agents exiting one edge reappear on opposite (toroidal). **Bounce:** Agents reflect off edges (draw visible border line when active). |
| **Pause / Resume** | Button | Freezes simulation logic; rendering continues (allows inspection) |
| **Reset** | Button | Randomizes all agent positions and velocities |
| **Theme Selector** | Cycle Button or Dropdown | Switches between three visual themes (see Section 6) |

### 3.5 Tooltips

Every slider label and control displays a tooltip on hover explaining its function in plain language.

**Example Tooltip for "Separation Weight":**
> *"How strongly cars avoid each other. Higher values = more personal space, lower density."*

---

## 4. Instrumentation Overlay

A semi-transparent heads-up display showing real-time metrics.

| Metric | Description | Update Frequency |
|--------|-------------|------------------|
| **FPS** | Frames rendered per second | Every frame (smoothed) |
| **Agent Count** | Current number of active cars | On change |
| **Avg Speed** | Mean velocity magnitude across all agents | Every 10 frames |
| **Avg Neighbors** | Mean neighbor count per agent | Every 10 frames |

**Display Style:** Monospace font, top-left corner, ~50% opacity background.

---

## 5. Interaction & Logic

### 5.1 Perspective

Strictly **2D top-down** view. No perspective distortion or 3D effects.

### 5.2 Agent Orientation

Each agent rotates to face its velocity vector. Cars do not move sideways—the sprite/shape heading always matches movement direction.

### 5.3 Mouse Interaction — Predator/Roadblock

The mouse cursor acts as a dynamic obstacle.

| Property | Value |
|----------|-------|
| **Effect Radius** | ~100–150 px (configurable) |
| **Force Type** | Strong **Flee** steering force |
| **Behavior** | Agents within radius receive additional acceleration pointing away from cursor |

This creates a "parting wave" effect as cars swerve around the mouse.

---

## 6. Visual Themes

Three selectable rendering styles, each with distinct aesthetic goals.

### 6.1 Theme: Night City (Long Exposure)

*Inspired by slow-shutter traffic photography.*

| Element | Style |
|---------|-------|
| **Background** | Dark asphalt (#0a0a0f) or pure black |
| **Agent Body** | Minimal—small rectangle or hidden |
| **Headlights** | White forward-facing beam/cone |
| **Taillights** | Red fading trail (persistence/blur effect) |
| **Atmosphere** | Cinematic, moody, focus on light trails |

### 6.2 Theme: Rush Hour (GPS View)

*Clean, utilitarian map aesthetic.*

| Element | Style |
|---------|-------|
| **Background** | Light gray (#e8e8e8) map color |
| **Agent Body** | Colored rectangles—varied sizes (sedans, trucks) |
| **Colors** | Muted palette: blues, grays, occasional red/yellow |
| **Trails** | None, or subtle skid marks on sharp turns |
| **Atmosphere** | Clean, informational, navigation-app style |

### 6.3 Theme: Formula 1 (Telemetry)

*Technical racing telemetry aesthetic.*

| Element | Style |
|---------|-------|
| **Background** | Dark technical gray (#1a1a1a) with subtle grid |
| **Agent Body** | Sleek wedge/arrow shapes |
| **Color Coding** | Dynamic: speed-based gradient (Green → Yellow → Red) |
| **Trails** | Optional: brief velocity vector lines |
| **Atmosphere** | High-tech, data-driven, racing HUD style |

---

## 7. Advanced Requirements

### 7.1 Spatial Partitioning (Performance)

**Objective:** Reduce neighbor lookup complexity from O(n²) to approximately O(n).

**Implementation:** Use a **Spatial Hash Grid** (recommended) or Quadtree.

| Specification | Value |
|---------------|-------|
| **Cell Size** | Equal to or slightly larger than `neighbor_radius` |
| **Lookup** | Check only the 9 cells surrounding each agent |
| **Rebuild** | Every frame (agents move continuously) |
| **Performance Target** | 1,000+ agents at stable 60 FPS |

**Algorithm Outline:**
1. Clear grid
2. Insert all agents into cells based on position
3. For each agent, query only adjacent cells for potential neighbors
4. Apply distance check only to candidates in adjacent cells

### 7.2 Perception Cone (Realistic Vision)

**Objective:** Agents only perceive neighbors within a forward-facing field of view, simulating a driver's blind spots.

| Parameter | Value |
|-----------|-------|
| **Field of View** | ~270° (±135° from heading) |
| **Blind Spot** | ~90° directly behind agent |

**Implementation:**
```
// After distance check passes:
to_neighbor = neighbor.position - agent.position
angle_to_neighbor = atan2(to_neighbor.y, to_neighbor.x)
relative_angle = normalize_angle(angle_to_neighbor - agent.heading)
if (abs(relative_angle) > FOV_HALF_ANGLE) then exclude neighbor
```

### 7.3 Optional Enhancements

| Feature | Description |
|---------|-------------|
| **Agent Count Slider** | Dynamically add/remove agents (50–2000 range) |
| **Trail Length Control** | Adjust fade duration for Night City theme |
| **Speed Variance** | Randomize max_speed slightly per agent for realism |
| **Obstacle Placement** | Click to place static obstacles agents must avoid |

---

## 8. Stretch Goals Implementation Status

The spec requires **at least 3** stretch challenges. This document specifies **4**:

| Stretch Goal | Status | Section |
|--------------|--------|---------|
| ✅ **Perception cone** | Implemented | §7.2 — 270° FOV with blind spot |
| ✅ **Leaders / predators** | Implemented | §5.3 — Mouse as predator with flee force |
| ✅ **Spatial partitioning** | Implemented | §7.1 — Spatial hash grid for O(n) lookups |
| ✅ **Trails & themes** | Implemented | §6 — Three distinct visual themes with trails |
| ❌ Obstacle avoidance | Not included | — |
| ❌ Heterogeneous species | Not included | — |
| ❌ Web Workers | Not included | — |
| ❌ Live charting | Not included | — |
| ❌ Preset export (JSON/URL) | Not included | — |

---

## 9. Technical Stack (Recommended)

| Layer | Technology |
|-------|------------|
| **Rendering** | HTML5 Canvas 2D (sufficient for 1k agents) or WebGL for higher counts |
| **Framework** | Vanilla JS, or lightweight libs (p5.js, PixiJS) |
| **UI** | Native HTML/CSS, or minimal framework (no heavy dependencies) |
| **State** | Simple object store; no external state management needed |

---

## 10. File Structure (Suggested)

```
traffic-boids/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js           # Entry point, animation loop
│   ├── boid.js           # Agent class with steering behaviors
│   ├── flock.js          # Collection management, spatial grid
│   ├── spatial-grid.js   # Hash grid implementation
│   ├── renderer.js       # Drawing logic, theme switching
│   ├── ui.js             # Control panel, sliders, presets
│   └── config.js         # Default parameters, presets
└── assets/
    └── (optional sprites)
```

---

## 11. Success Checklist

These criteria define "done" for the implementation:

| # | Criterion | How to Validate |
|---|-----------|-----------------|
| ✅ | **Controls update behavior in real time and feel smooth** | Drag any slider; changes visible within 1 frame, no lag or stutter |
| ✅ | **Presets feel meaningfully different (not tiny tweaks)** | Click each preset; behavior shift is obvious within 2 seconds |
| ✅ | **Readouts are accurate and useful** | FPS matches dev tools; neighbor count makes sense given radius |
| ✅ | **Clear labels/tooltips; no mystery knobs** | Every control has plain-English label; hover shows explanation |
| ✅ | **Boundary toggle works visibly** | Switch Wrap↔Bounce; see border appear/disappear, agents reflect or wrap |
| ✅ | **Pause freezes logic, not rendering** | Pause button stops motion; canvas still renders static state |
| ✅ | **Reset randomizes all agents** | Click Reset; all positions/velocities scrambled |
| ✅ | **Mouse predator creates visible flee response** | Move cursor into swarm; agents part around it |
| ✅ | **1,000 agents at 60 FPS** | Set agent count to 1000; FPS stays ≥55 |
| ✅ | **Perception cone excludes rear neighbors** | Debug view or observe agents not reacting to boids directly behind |

---

## 12. Acceptance Criteria (Detailed)

| # | Criterion | Validation |
|---|-----------|------------|
| 1 | Three steering behaviors (sep/align/cohesion) produce emergent flocking | Visual inspection of group behavior |
| 2 | All six sliders adjust simulation in real-time | Modify each; observe immediate change |
| 3 | Three presets apply correct configurations and look distinct | Select each; verify obviously different behaviors |
| 4 | Wrap/Bounce boundary modes function correctly | Test agents at edges in both modes |
| 5 | Mouse cursor causes flee response | Move cursor through swarm |
| 6 | 1,000 agents maintain 60 FPS | FPS counter with agent count slider maxed |
| 7 | Perception cone excludes agents behind | Visual debug mode or behavior observation |
| 8 | All three themes render correctly | Cycle through; verify distinct aesthetics |
| 9 | Instrumentation displays accurate metrics | Cross-reference with dev tools |
| 10 | Tooltips appear on all controls | Hover test all UI elements |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Boid** | "Bird-oid" — an agent following Reynolds' flocking rules |
| **Steering Force** | A vector influencing an agent's acceleration |
| **Spatial Hash Grid** | Data structure dividing space into cells for fast neighbor lookup |
| **Toroidal Wrapping** | Screen edges connect (exit right → enter left) |
| **Field of View (FOV)** | Angular range within which an agent perceives neighbors |
| **DXA** | Document unit (1/20 of a point); not applicable here but referenced in tooling |

---

## Appendix B: Reference Material

- Craig Reynolds' original Boids paper (1987): *"Flocks, Herds, and Schools: A Distributed Behavioral Model"*
- Spatial hashing tutorial: [Red Blob Games](https://www.redblobgames.com/grids/circle-drawing/)
- Canvas performance optimization: MDN Web Docs

---

*End of Specification*
