# NEO Sentinel — Near-Earth Object Dashboard
## Specification Document v1.0

---

## 1. Overview

**NEO Sentinel** is a single-page interactive web dashboard that visualizes live near-Earth object data from NASA/JPL APIs. The application features four tabs, each presenting a distinct perspective on asteroid and comet activity near Earth — from a 3D orbital visualization to detailed risk assessment tables.

The dashboard is built as a single HTML file using React (JSX), Three.js for 3D rendering, Recharts for data visualization, and Tailwind CSS for layout utilities.

---

## 2. Design System — "Mission Control Noir"

### 2.1 Color Palette

| Token                | Hex         | Usage                                      |
|----------------------|-------------|---------------------------------------------|
| `--bg-primary`       | `#080c16`   | Page background, deepest layer              |
| `--bg-card`          | `#0d1220`   | Card/panel backgrounds                      |
| `--bg-card-hover`    | `#131a2e`   | Card hover states                           |
| `--bg-surface`       | `#111827`   | Slightly elevated surfaces, table rows      |
| `--border-subtle`    | `#1e293b`   | Subtle borders, dividers                    |
| `--border-active`    | `#00b4d8`   | Active/focused borders                      |
| `--text-primary`     | `#e2e8f0`   | Primary body text                           |
| `--text-secondary`   | `#94a3b8`   | Secondary/muted text                        |
| `--text-dim`         | `#475569`   | Disabled, tertiary text                     |
| `--accent-blue`      | `#00b4d8`   | Primary accent — links, active tab, highlights |
| `--accent-blue-glow` | `#00b4d833` | Glow/shadow variant of accent blue          |
| `--accent-amber`     | `#f59e0b`   | Warning — potentially hazardous asteroids   |
| `--accent-red`       | `#ef4444`   | Danger — high-risk Sentry objects           |
| `--accent-green`     | `#22c55e`   | Safe/nominal indicators                     |
| `--accent-purple`    | `#a78bfa`   | Tertiary accent for chart variety           |

### 2.2 Typography

- **Display / Headings**: `'Orbitron', sans-serif` — geometric, space-age display font (loaded from Google Fonts)
- **Body / Data**: `'JetBrains Mono', monospace` — crisp monospace for telemetry/data feel (loaded from Google Fonts)
- **UI Labels / Navigation**: `'Exo 2', sans-serif` — clean, slightly futuristic sans-serif (loaded from Google Fonts)

### 2.3 Component Styling

- **Cards**: `background: var(--bg-card)`, `border: 1px solid var(--border-subtle)`, `border-radius: 12px`, subtle backdrop-blur if layered
- **Tables**: Dark alternating rows (`--bg-card` / `--bg-surface`), hover row glow with `--accent-blue-glow`, monospace data cells
- **Buttons/Filters**: Outlined style with `--border-subtle`, hover fills to `--bg-card-hover`, active state uses `--accent-blue`
- **Tooltips**: Dark card style with `--accent-blue` left border accent
- **Loading States**: Pulsing skeleton rectangles in `--bg-surface` with shimmer animation
- **Scrollbars**: Custom thin scrollbar styled to match dark theme

### 2.4 Motion & Animation

- Tab transitions: Fade + subtle translateY on content switch (200ms ease-out)
- Data load-in: Staggered row/card reveal with opacity + translateY (50ms stagger per item)
- Chart elements: Animate on mount (Recharts `isAnimationActive`)
- 3D scene: Continuous slow Earth rotation, smooth camera orbit on drag
- Hover states: 150ms transitions on all interactive elements
- Hazard badges: Subtle pulse animation on high-risk items

---

## 3. API Configuration

### 3.1 NeoWs (Near Earth Object Web Service)
- **Base URL**: `https://api.nasa.gov/neo/rest/v1/`
- **Auth**: API key as query parameter `api_key=xiuMYewZyC6JdsrBAMSS3tTtmbhbBdD8HW3yPYki`
- **Endpoints used**:
  - `GET /feed?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&api_key=KEY` — returns NEOs by date range (max 7 days)
- **Data fields of interest**: name, id, estimated_diameter (min/max in meters and km), is_potentially_hazardous_asteroid, close_approach_data (date, relative_velocity in km/s and km/h, miss_distance in km/AU/lunar), absolute_magnitude_h

### 3.2 SBDB Close-Approach Data
- **Base URL**: `https://ssd-api.jpl.nasa.gov/cad.api`
- **Auth**: None required (open public API)
- **Key query params**:
  - `date-min`, `date-max` — date range (YYYY-MM-DD)
  - `dist-max` — max distance in AU (e.g., `0.05`)
  - `sort` — sort field (e.g., `dist`, `date`)
  - `diameter` — include diameter estimates (boolean)
  - `fullname` — include full object name (boolean)
  - `limit` — max results
- **Data returned**: Array of arrays with fields defined by a `fields` key (des, orbit_id, jd, cd, dist, dist_min, dist_max, v_rel, v_inf, t_sigma_f, h, diameter, diameter_sigma, fullname)

### 3.3 Sentry — Impact Monitoring System
- **Base URL**: `https://ssd-api.jpl.nasa.gov/sentry.api`
- **Auth**: None required (open public API)
- **Key query params**:
  - No params = returns full summary list of all monitored objects
  - `des=DESIGNATION` — specific object details
- **Data returned**: Array of objects with fields: des, fullname, ip (impact probability), ps (Palermo Scale), ts (Torino Scale), n_imp (number of potential impacts), last_obs, range (year range of potential impacts), diameter, v_inf, h

---

## 4. Tab Specifications

### 4.1 Tab 0 — "Orbital View" (Landing Page)

**Purpose**: Immersive 3D visualization of this week's near-Earth asteroids relative to Earth.

**Data Source**: NeoWs `/feed` for the current 7-day window.

**3D Scene (Three.js)**:
- **Earth**: Sphere geometry with a realistic blue marble texture (loaded from a public CDN or procedurally generated with shaders — blue/green/white palette). Slow continuous rotation on Y-axis (~0.001 rad/frame). Radius = 1 unit (represents Earth's actual radius for scale reference).
- **Moon**: Sphere at ~0.27 Earth radius, grey textured/colored, positioned at 1 Lunar Distance (LD) from Earth center (~60.3 Earth radii in scene units, but scaled down for visual clarity — use a compressed scale where 1 LD ≈ 30 scene units). Subtle glow ring or label. Must be visually distinct from asteroids — smooth, larger, grey/silver with a soft emissive glow.
- **Asteroids**: Icosahedron or dodecahedron geometries (irregular, rocky look) with a brownish/tan material. Sized relative to their estimated diameter (with a min display size so tiny ones are still visible). Positioned at their miss distance from Earth center, mapped to the same compressed scale as the Moon. Color-coded: amber for potentially hazardous, grey-blue for non-hazardous.
- **Distance Rings**: Concentric translucent rings at 0.5 LD, 1 LD, 2 LD, 5 LD, 10 LD intervals. Very subtle lines with labels.
- **Background**: Dark starfield (particle system or skybox).
- **Camera**: OrbitControls — drag to rotate, scroll to zoom, right-click to pan. Default position looking at Earth with the field of asteroids visible.
- **Interaction**: Hover over asteroid → tooltip appears (HTML overlay) showing name, diameter, velocity, miss distance, hazard status. Click → expands a side detail panel.
- **HUD Overlay**: Top-left shows "This Week: [date range]", count of NEOs, count of hazardous.

**Performance Notes**: Limit asteroid rendering to the top ~50 closest or use LOD. Asteroids beyond camera frustum should not render tooltips.

---

### 4.2 Tab 1 — "Near Earth Watch"

**Purpose**: Real-time/daily tabular and charted view of this week's near-Earth objects.

**Data Source**: NeoWs `/feed` for current 7-day window (same data as Tab 0, cached/shared).

**Layout**:
- **Top Stats Bar**: 4 metric cards in a row:
  - Total NEOs this week (count)
  - Potentially Hazardous count (with amber badge)
  - Closest approach this week (name + distance in LD)
  - Fastest object this week (name + velocity in km/s)

- **Chart Section** (left ~60% width):
  - **Bar Chart**: NEOs per day for the 7-day range (x-axis = date, y-axis = count). Bars split/stacked by hazardous vs. non-hazardous. Recharts BarChart.
  - **Scatter Plot**: Miss distance (LD, y-axis) vs. estimated diameter (m, x-axis) for all objects this week. Color = hazardous/non-hazardous. Dot size = velocity. Hover tooltip with full details. Recharts ScatterChart.

- **Table Section** (full width, below charts):
  - Columns: Name, Date of Closest Approach, Miss Distance (LD), Miss Distance (km), Velocity (km/s), Est. Diameter (m, range), Magnitude, Hazardous (badge)
  - **Sortable** by clicking column headers (toggle asc/desc)
  - **Filterable**: Toggle "Show hazardous only" checkbox, date filter dropdown for specific day
  - Row click → expand inline detail row with additional info (orbit ID, full diameter range, JPL link)
  - Pagination or virtual scroll if >50 rows

---

### 4.3 Tab 2 — "Close Approaches"

**Purpose**: Broader exploration of upcoming close approaches with filtering and time-series analysis.

**Data Source**: SBDB Close-Approach Data API.

**Layout**:
- **Filter Bar** (horizontal, top of tab):
  - Date range picker: Start date / End date (default: today → +365 days)
  - Max distance dropdown: 0.01 AU, 0.02 AU, 0.05 AU, 0.1 AU
  - Min diameter input (optional): Filter out small objects
  - Sort by dropdown: Date, Distance, Velocity, Diameter
  - "Apply Filters" button → re-fetches data
  - Result count badge

- **Timeline Chart** (top section):
  - **Area/Line Chart**: Number of close approaches per month over the selected date range. Recharts AreaChart with gradient fill. Hover shows exact count + date.

- **Scatter/Bubble Chart** (mid section):
  - X-axis: Date of close approach
  - Y-axis: Miss distance (AU)
  - Bubble size: Diameter estimate (where available)
  - Color: Velocity (gradient from blue = slow to red = fast)
  - Hover tooltip with full object details

- **Data Table** (bottom, full width):
  - Columns: Object Designation, Full Name, Close Approach Date, Distance (AU), Distance (LD), Relative Velocity (km/s), Diameter Est. (m), Absolute Magnitude
  - Sortable columns, row expand for more detail
  - "No diameter data" gracefully shown as "—"

---

### 4.4 Tab 3 — "Impact Risk Monitor"

**Purpose**: Display all objects currently being monitored by the Sentry impact monitoring system with non-zero impact probability.

**Data Source**: Sentry API (full summary list).

**Layout**:
- **Alert Banner** (conditional): If any object has Torino Scale > 0, show an amber/red banner at top with object name and scale value. Otherwise, show a green "All Clear" banner stating no current elevated threats.

- **Top Stats Bar**: 4 metric cards:
  - Total monitored objects
  - Highest Palermo Scale value (with object name)
  - Nearest potential impact year
  - Most recently observed object (last_obs date + name)

- **Risk Matrix Visualization**:
  - A custom chart or grid: X-axis = potential impact year range, Y-axis = Palermo Scale. Each dot is an object. Color intensity = impact probability. This gives a visual "threat landscape." Recharts ScatterChart.

- **Data Table** (full width, primary content):
  - Columns: Object Designation, Full Name, Impact Probability, Palermo Scale, Torino Scale, Potential Impacts (count), Year Range, Estimated Diameter (km), Velocity (km/s), Last Observed
  - **Sortable** by all columns
  - **Color-coded rows**: Torino 0 = default, Torino 1+ = amber background, Palermo > -2 = highlighted
  - Row expand → detailed view: individual impact scenario list if available
  - Search/filter input to find specific object by designation

- **Palermo Scale Distribution Chart**:
  - **Histogram**: Distribution of Palermo Scale values across all monitored objects. Most will cluster around -5 to -2. Recharts BarChart with custom bin widths.

---

## 5. Shared Behaviors

### 5.1 Data Fetching
- All API calls made on tab activation (with caching — don't re-fetch if data is <5 minutes old)
- Loading state: Skeleton shimmer on cards, tables, charts
- Error state: Styled error card with retry button and error message
- NeoWs data is shared between Tab 0 and Tab 1 (fetch once, use in both)

### 5.2 Tab Navigation
- Horizontal tab bar fixed at the top, below a slim header showing "NEO SENTINEL" branding + current UTC datetime
- Tabs: 🌍 Orbital View | 📡 Near Earth Watch | 🔭 Close Approaches | ⚠️ Impact Risk
- Active tab: bright `--accent-blue` underline, text color shift
- Tab content area fades in on switch

### 5.3 Responsive Behavior
- Primary target: Desktop (1200px+)
- Tablet (768–1199px): Stack chart + table vertically, reduce 3D scene quality
- Mobile (<768px): 3D view simplified, tables horizontally scrollable, charts full-width stacked
- The 3D tab should gracefully degrade on low-power devices (reduce particle count, lower resolution)

### 5.4 Header
- Left: "NEO SENTINEL" in Orbitron font, small asteroid icon/emoji
- Right: Live UTC clock, last data refresh timestamp
- Thin accent-blue bottom border

---

## 6. Technical Stack

| Layer          | Technology                                  |
|----------------|----------------------------------------------|
| Framework      | React (JSX, rendered in-browser)            |
| 3D Engine      | Three.js (r128 via CDN)                     |
| Charts         | Recharts                                     |
| Styling        | Tailwind CSS utilities + CSS custom properties |
| Fonts          | Google Fonts (Orbitron, JetBrains Mono, Exo 2) |
| Deployment     | Single `.html` file, no build step           |

---

## 7. File Output

Single file: `neo-sentinel.html` — contains all markup, styles, and scripts inline. No external dependencies beyond CDN-hosted libraries and Google Fonts.

Output to: `/mnt/user-data/outputs/neo-sentinel.html`

---

## 8. Non-Goals (Out of Scope)

- User authentication or saved preferences
- Server-side rendering or backend
- Offline support / service worker
- Database or persistent storage
- Push notifications for new hazardous objects
- Detailed orbital trajectory plotting (Keplerian elements)
