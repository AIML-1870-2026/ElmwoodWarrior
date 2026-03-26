# Weather Dashboard — Complete Project Specification

---

## 1. Project Summary

A single-page weather dashboard where users search any city worldwide and see current conditions plus a 4-day forecast. Supports toggling between Celsius and Fahrenheit. Built with HTML, CSS, and vanilla JavaScript — no frameworks required.

---

## 2. API: OpenWeatherMap

### Why This API

OpenWeatherMap is the standard for projects like this: 1,000 free API calls per day, global city coverage, excellent docs, and a straightforward REST interface.

### Getting Your API Key

1. Sign up at [openweathermap.org](https://openweathermap.org/).
2. Go to your profile → **My API Keys**.
3. Copy the default key or generate a new one.
4. **New keys take up to 2 hours to activate.** If your first call returns a `401`, wait and retry.

### Endpoints You Need

**Current Weather**
```
GET https://api.openweathermap.org/data/2.5/weather
    ?q={city_name}
    &appid={YOUR_API_KEY}
    &units={metric|imperial}
```

**5-Day / 3-Hour Forecast**
```
GET https://api.openweathermap.org/data/2.5/forecast
    ?q={city_name}
    &appid={YOUR_API_KEY}
    &units={metric|imperial}
```

**Weather Condition Icons**
```
https://openweathermap.org/img/wn/{icon_code}@2x.png
```

**Geocoding (optional — for disambiguating city names)**
```
GET https://api.openweathermap.org/geo/1.0/direct
    ?q={city_name}
    &limit=5
    &appid={YOUR_API_KEY}
```

### The `units` Parameter

This controls temperature and wind units at the API level — no client-side conversion math needed:

| `units` Value | Temperature | Wind Speed |
|---|---|---|
| `metric` | Celsius (°C) | meters/second |
| `imperial` | Fahrenheit (°F) | miles/hour |
| *(omitted)* | Kelvin (K) | meters/second |

---

## 3. File Structure

```
weather-dashboard/
├── index.html        # Page markup and structure
├── style.css         # All styling
├── app.js            # Logic, API calls, DOM updates
├── config.js         # API key — MUST be gitignored
├── .gitignore        # Includes config.js
└── README.md         # Setup instructions
```

### Protecting Your API Key

Create `config.js`:

```js
// config.js — NEVER commit this file
const CONFIG = {
  API_KEY: "your_key_here",
};
```

Load it before `app.js` in your HTML:

```html
<script src="config.js"></script>
<script src="app.js"></script>
```

Reference in `app.js`:

```js
const API_KEY = CONFIG.API_KEY;
```

Add to `.gitignore`:

```
config.js
```

---

## 4. Core Features — Detailed Implementation

### 4.1 City Search

**User flow:**
1. User types a city name into a text input.
2. Presses Enter or clicks Search.
3. App sends a request to the Current Weather endpoint.
4. Valid city → render data. Invalid → show error.

**Implementation:**

```js
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

function handleSearch() {
  const city = searchInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  fetchWeather(city);
}
```

**Edge cases to handle:**
- Empty or whitespace-only input → show validation message before any API call
- Special characters → use `encodeURIComponent()` when building the URL
- Ambiguous names (e.g., "Springfield" exists in 30+ states) → optionally use the Geocoding API to show a dropdown of matching cities

### 4.2 Current Weather Display

**Key fields in the API response:**

```json
{
  "name": "Omaha",
  "main": {
    "temp": 72.5,
    "feels_like": 70.1,
    "temp_min": 68.0,
    "temp_max": 76.3,
    "humidity": 45,
    "pressure": 1015
  },
  "weather": [
    {
      "main": "Clear",
      "description": "clear sky",
      "icon": "01d"
    }
  ],
  "wind": {
    "speed": 8.5,
    "deg": 220
  },
  "visibility": 10000,
  "sys": {
    "sunrise": 1700000000,
    "sunset": 1700040000
  },
  "timezone": -21600,
  "dt": 1700020000
}
```

**Map fields to your UI like this:**

| UI Element | API Field | Rendering |
|---|---|---|
| City name | `name` | "Omaha" |
| Temperature | `main.temp` | Round to integer, append unit symbol |
| Feels like | `main.feels_like` | "Feels like 70°F" |
| Condition | `weather[0].description` | Capitalize first letter |
| Icon | `weather[0].icon` | `<img src=".../{icon}@2x.png">` |
| High / Low | `main.temp_max` / `main.temp_min` | "H: 76° · L: 68°" |
| Humidity | `main.humidity` | "45%" |
| Wind | `wind.speed` + `wind.deg` | "8.5 mph SW" |
| Pressure | `main.pressure` | "1015 hPa" |
| Visibility | `visibility` | Divide by 1000 for km |
| Sunrise / Sunset | `sys.sunrise` / `sys.sunset` | Convert Unix timestamps |

**Useful helper functions:**

```js
// Convert Unix timestamp to readable time, accounting for city timezone
function formatTime(unixTimestamp, timezoneOffsetSeconds) {
  const localMs = (unixTimestamp + timezoneOffsetSeconds) * 1000;
  const date = new Date(localMs);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  const displayMin = minutes.toString().padStart(2, "0");
  return `${displayHour}:${displayMin} ${ampm}`;
}

// Convert wind degrees to compass direction
function degToCompass(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE",
                "S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}
```

### 4.3 Four-Day Forecast

**The challenge:** The free forecast endpoint doesn't return daily summaries. It returns **40 data points** — one every 3 hours over 5 days. You need to aggregate these into daily summaries yourself.

**Aggregation logic:**

```js
function aggregateDailyForecasts(forecastList) {
  const dailyMap = {};

  forecastList.forEach((entry) => {
    // entry.dt_txt looks like "2025-03-27 15:00:00"
    const dateKey = entry.dt_txt.split(" ")[0];

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { temps: [], icons: [], descriptions: [] };
    }

    dailyMap[dateKey].temps.push(entry.main.temp);
    dailyMap[dateKey].icons.push(entry.weather[0].icon);
    dailyMap[dateKey].descriptions.push(entry.weather[0].description);
  });

  const today = new Date().toISOString().split("T")[0];

  return Object.entries(dailyMap)
    .filter(([date]) => date !== today) // Skip today — already in main card
    .slice(0, 4)                         // Next 4 days only
    .map(([date, data]) => ({
      date,
      dayName: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
      }),
      high: Math.round(Math.max(...data.temps)),
      low: Math.round(Math.min(...data.temps)),
      icon: mostFrequent(data.icons),
      description: mostFrequent(data.descriptions),
    }));
}

// Returns the most frequently occurring value in an array
function mostFrequent(arr) {
  const counts = {};
  arr.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
```

**Why `mostFrequent` for the icon?** A single day has 8 data points (every 3 hours). If 5 of them say "cloudy" and 3 say "rain," the day's representative icon should be "cloudy." This is more honest than picking the noon value or the first entry.

**Why `.slice(0, 4)` after filtering out today?** Because the forecast endpoint covers 5 days, but day 0 is today (shown in the main card), so you want days 1–4.

**Each forecast card should display:**
- Day name (e.g., "Thu", "Fri")
- Weather icon
- High and low temperature
- Short condition description

### 4.4 Celsius / Fahrenheit Toggle

**Recommended approach: re-fetch from the API with the new `units` value.**

This is cleaner than client-side conversion, guarantees accuracy for wind speed too, and avoids rounding drift.

```js
let currentUnits = localStorage.getItem("weather-units") || "imperial";
let currentCity = "";

function toggleUnits(unit) {
  currentUnits = unit;
  localStorage.setItem("weather-units", unit);
  updateToggleUI();
  if (currentCity) fetchWeather(currentCity);
}
```

**Alternative: client-side conversion** (avoids an API call but requires more bookkeeping):

```js
const toFahrenheit = (c) => (c * 9) / 5 + 32;
const toCelsius = (f) => ((f - 32) * 5) / 9;
```

**UI options:**
- A segmented control with `°C` and `°F` buttons, active one highlighted
- A single toggle switch

**Persist the preference** in `localStorage` so returning users keep their setting.

---

## 5. Full Fetch Flow

Here's how the entire data-fetching pipeline connects:

```js
async function fetchWeather(city) {
  showLoading(true);
  clearError();

  try {
    // Fire both requests in parallel
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnits}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnits}`
      ),
    ]);

    if (!currentRes.ok) {
      handleApiError(currentRes.status);
      return;
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    currentCity = currentData.name;
    renderCurrentWeather(currentData);
    renderForecast(aggregateDailyForecasts(forecastData.list));

  } catch (err) {
    showError("Network error. Check your connection and try again.");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

function handleApiError(status) {
  const messages = {
    404: "City not found. Check the spelling and try again.",
    401: "API key error. It may need up to 2 hours to activate.",
    429: "Too many requests. Please wait a moment.",
  };
  showError(messages[status] || "Something went wrong. Please try again.");
}
```

**Key details:**
- `Promise.all` fires both calls simultaneously — nearly 2× faster than sequential
- `encodeURIComponent` handles cities with spaces or accents ("São Paulo", "Zürich")
- `finally` always hides loading state, even on error

---

## 6. Error Handling Matrix

| Scenario | Detection Method | User Message |
|---|---|---|
| Empty input | Check before API call | "Please enter a city name." |
| City not found | API returns `404` | "City not found. Check the spelling and try again." |
| Bad API key | API returns `401` | "API key error. Check your configuration." |
| Rate limited | API returns `429` | "Too many requests. Wait a moment." |
| Network failure | `fetch` throws an error | "Network error. Check your connection." |
| Unexpected error | Any other non-ok status | "Something went wrong. Please try again." |

Always wrap `fetch` calls in `try/catch` and check `response.ok` before parsing JSON.

---

## 7. Responsive Layout Strategy

| Breakpoint | Layout |
|---|---|
| Desktop (> 900px) | Current weather on left, detail card on right. Forecast in a 4-column row. |
| Tablet (600–900px) | Current weather full-width, detail card below. Forecast in a 2×2 grid. |
| Mobile (< 600px) | Everything stacked single-column. Search input and button stack vertically. |

Use CSS Grid for the main layout and Flexbox within cards. Center the container with `max-width: 1100px; margin: 0 auto;`.

---

## 8. Accessibility Checklist

- Weather icon `<img>` tags need descriptive `alt` text pulled from `weather[0].description`.
- Search input needs a visible `<label>` or `aria-label="City search"`.
- Unit toggle should use `<button>` elements with `aria-pressed` state, not decorative divs.
- Color contrast must meet WCAG AA — 4.5:1 for body text, 3:1 for large headings.
- Entire app must be keyboard-navigable: Tab through inputs, Enter to submit, Escape to dismiss errors.
- Error messages should use `role="alert"` so screen readers announce them.

---

## 9. Performance Tips

- **Cache results** in a `Map` keyed by `city + units`. If the user searches the same city again within 10 minutes, serve from cache. Clear stale entries on each new search.
- **Lazy-load forecast icons** with `loading="lazy"` on `<img>` tags.
- **Batch DOM updates** — build the full HTML string for forecast cards before setting `innerHTML` once, rather than appending one card at a time.
- **Debounce** if you add autocomplete later (300ms is a good interval).

---

## 10. Recommended Build Order

This order ensures you have something working at every stage:

1. **Scaffold HTML** — search bar, empty current-weather container, empty forecast container, unit toggle.
2. **Wire up `config.js`** — confirm the API key loads.
3. **Fetch current weather** — get the API call working, log the response to console.
4. **Render current weather** — populate the DOM with response data.
5. **Fetch forecast** — get the 5-day endpoint working, log it.
6. **Aggregate and render forecast** — build the daily summary logic, render 4 cards.
7. **Unit toggle** — implement re-fetch on toggle, persist in `localStorage`.
8. **Error handling** — implement all scenarios from section 6.
9. **Styling** — apply your chosen visual aesthetic.
10. **Responsive** — test and adjust at all three breakpoints.
11. **Polish** — loading states, animations, accessibility audit.

---

## 11. Ideas to Make This Dashboard Stand Out

These go well beyond "display weather in a card." Pick the ones that excite you.

---

### 11.1 — Ambient Background That Matches the Weather

The entire page atmosphere shifts based on the current condition. Clear skies produce a warm gradient with a subtle animated sun glow. Rain triggers CSS particle drops falling across the viewport. Snow uses floating particle animations with slight horizontal drift. Thunderstorms flash the background periodically and use dark purple tones. Fog renders layered parallax mist using overlapping translucent divs.

**Implementation hint:** Use the `weather[0].id` code from the API. Codes 200–299 are thunderstorms, 300–399 drizzle, 500–599 rain, 600–699 snow, 700–799 atmospheric (fog/haze), 800 clear, 801–804 clouds. Map these ranges to CSS classes on a background wrapper element.

---

### 11.2 — Time-Aware Color Theming

Use the `sunrise`, `sunset`, and `timezone` fields from the API to determine whether it's day or night *at the searched city* — not the user's local time. Shift the entire color palette: golden tones for daytime, deep navy for nighttime, pinks and oranges if the local time is near sunrise or sunset. The dashboard becomes a window into that city's actual moment.

---

### 11.3 — "What to Wear" Outfit Advisor

Display a contextual suggestion based on temperature, wind, and precipitation. Use simple threshold logic:

| Condition | Suggestion |
|---|---|
| Temp < 0°C / 32°F | "Full winter gear — heavy coat, gloves, hat, insulated boots." |
| Temp 0–10°C / 32–50°F + wind > 25 km/h | "Wind chill is brutal. Layer up and cover exposed skin." |
| Rain probability > 60% | "Grab an umbrella and waterproof shoes." |
| Temp 20–28°C / 68–82°F, clear | "T-shirt weather. Sunglasses recommended." |
| Temp > 35°C / 95°F | "Stay hydrated. Light, breathable clothing. Seek shade." |

This gives the raw data a *human* meaning that numbers alone don't convey.

---

### 11.4 — Interactive Hourly Temperature Graph

Visualize the raw 3-hour forecast data as a smooth line chart instead of only showing daily summaries. Use `<canvas>` with Chart.js, or draw it manually with SVG for zero dependencies. Let users hover or tap data points to see exact temperatures and conditions. This gives a much richer picture of how the day will unfold — "it's warm now but drops 15 degrees tonight" is immediately visible on a graph but invisible in a daily high/low card.

---

### 11.5 — Geolocation Auto-Detect

On first load, use `navigator.geolocation.getCurrentPosition()` to get the user's coordinates, then hit OpenWeatherMap's coordinate-based endpoint (`?lat=...&lon=...`) to show local weather automatically — no typing needed. Always provide the manual search as fallback since many users deny location permissions. Show a small "Use my location" button near the search bar.

---

### 11.6 — City Comparison Mode

Let users pin two cities side-by-side. Display current weather and forecasts in parallel columns. This is useful for travelers deciding between destinations, people checking on family in other cities, or anyone curious about climate differences. Implement with a "Compare" button that opens a second search bar and splits the layout into two columns.

---

### 11.7 — Air Quality Index (AQI) Panel

OpenWeatherMap offers a free [Air Pollution API](https://openweathermap.org/api/air-pollution). Add an expandable card showing AQI on a color-coded scale (green to maroon) with a plain-language label ("Good," "Moderate," "Unhealthy for Sensitive Groups"). This is genuinely valuable health information, especially for people with respiratory conditions, and most simple weather dashboards don't include it.

**Endpoint:**
```
GET https://api.openweathermap.org/data/2.5/air_pollution
    ?lat={lat}&lon={lon}&appid={API_KEY}
```

You'll need the city's coordinates from the current weather response (`coord.lat`, `coord.lon`).

---

### 11.8 — Micro-Animations on Data Load

When weather data appears, don't just pop it in. The temperature counts up from 0 to its actual value. Humidity fills a circular progress ring. The wind speed spins a small directional arrow that rotates to the correct compass heading. Forecast cards stagger in one by one with a slight upward slide. These details signal craft and make the app feel alive.

**Implementation hint:** Use `requestAnimationFrame` for the number counting animation. For the staggered card entrance, use CSS `animation-delay` incrementing by 80–100ms per card.

---

### 11.9 — Recent Searches with localStorage

Store the last 6–8 searched cities in `localStorage`. Render them as clickable chips below the search bar. One click re-fetches that city instantly. This removes friction for users who check the same cities daily. Deduplicate (case-insensitive) and cap the list length.

---

### 11.10 — UV Index and Sun Position Arc

Draw a semicircular arc representing the sun's path from sunrise to sunset. Plot the current time as a dot along the arc — if it's noon, the dot is at the top; if it's near sunset, it's approaching the right edge. Below it, show the UV index (available via the One Call API or a separate UV endpoint) with a color scale and plain-language label ("Low," "Moderate," "Very High — wear sunscreen").

---

### 11.11 — Weather Map Tile Layer

OpenWeatherMap provides free [map tile layers](https://openweathermap.org/api/weathermap) for precipitation, clouds, temperature, and wind. Embed a small interactive map using Leaflet.js, centered on the searched city, with a precipitation or cloud overlay. This gives spatial context — you can see a storm front approaching, or see that the rain is 50 miles away. It makes the dashboard feel professional and data-rich.

---

### 11.12 — Sound Design (Bold/Optional)

Add subtle ambient audio that matches conditions: light rain patter, wind gusts, birdsong for clear mornings, distant thunder rumbles. Hidden behind a clearly labeled mute/unmute toggle, defaulting to **muted**. This is polarizing — some users love it, some will never enable it. But for a portfolio piece, it's unforgettable and demonstrates attention to multi-sensory experience.

Free ambient sound sources: [freesound.org](https://freesound.org/), [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/).

---

### 11.13 — Shareable Weather Cards

Add a "Share" button that generates a styled screenshot or a pre-formatted card (using `html2canvas` or a custom SVG template) showing the city, temperature, condition, and your branding. Users can download it or copy it to share on social media. This turns your dashboard into a content-creation tool.

---

### 11.14 — Weather Alerts Banner

The OpenWeatherMap One Call API (requires a paid plan, or use an alternative like weather.gov for US cities) can return active severe weather alerts. Display them as a bold, dismissible banner at the top of the page with the alert type, severity, and time range. Even a simple "Severe Thunderstorm Warning until 8:00 PM" banner adds genuine safety value.

---

## 12. Design Direction Notes

Avoid the generic weather dashboard look (white cards, blue gradient, system font). Some distinctive directions to consider:

- **Glassmorphism + Atmospheric Backgrounds:** Frosted-glass cards over dynamic gradient backgrounds that shift with weather conditions. Use `backdrop-filter: blur()` and semi-transparent borders.
- **Retro Analog Instruments:** Style temperature as a circular gauge, wind as a compass rose, humidity as a mercury column. Dark background, amber/green readouts, monospace font. Think vintage avionics.
- **Editorial / Typographic:** Massive display font for the temperature (150–200px+), asymmetric layout, generous whitespace, a single accent color. The weather data becomes a typographic poster.
- **Organic / Soft:** Rounded shapes, pastel gradients, thick-lined custom icons, warm serif font. Gentle and approachable.

Pick one direction and commit fully. A cohesive aesthetic with strong opinions always looks better than a safe design that tries to please everyone.
