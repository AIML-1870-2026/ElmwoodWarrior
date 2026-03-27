// ===== Configuration =====
const API_KEY = CONFIG.API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ===== State =====
let currentUnits = localStorage.getItem("weather-units") || "imperial";
let currentCity = "";
let currentWeatherData = null;
let currentForecastData = null;
let leafletMap = null;
let weatherLayer = null;
let cityMarker = null;
let soundEnabled = false;
let audioCtx = null;
let activeNodes = [];
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// ===== DOM Elements =====
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const geoBtn = document.getElementById("geo-btn");
const errorMsg = document.getElementById("error-msg");
const loading = document.getElementById("loading");
const weatherContent = document.getElementById("weather-content");
const ambientBg = document.getElementById("ambient-bg");
const particlesContainer = document.getElementById("particles");

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  updateToggleUI();
  renderRecentSearches();

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  geoBtn.addEventListener("click", handleGeolocation);

  document.getElementById("btn-imperial").addEventListener("click", () => toggleUnits("imperial"));
  document.getElementById("btn-metric").addEventListener("click", () => toggleUnits("metric"));

  document.getElementById("sound-toggle").addEventListener("click", toggleSound);
  document.getElementById("compare-toggle").addEventListener("click", openCompare);
  document.getElementById("compare-close").addEventListener("click", closeCompare);
  document.getElementById("compare-go").addEventListener("click", runComparison);
  document.getElementById("share-btn").addEventListener("click", generateShareCard);

  // Comparison enter key
  document.getElementById("compare-input-1").addEventListener("keydown", (e) => { if (e.key === "Enter") runComparison(); });
  document.getElementById("compare-input-2").addEventListener("keydown", (e) => { if (e.key === "Enter") runComparison(); });

  // Map layer buttons
  document.querySelectorAll(".map-layer-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchMapLayer(btn));
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Scroll reveal
  setupScrollReveal();

  // Init map
  initMap();
});

// ===== Keyboard Shortcuts =====
function handleKeyboardShortcuts(e) {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "/" || e.key === "s") {
    e.preventDefault();
    searchInput.focus();
  } else if (e.key === "Escape") {
    searchInput.blur();
    closeCompare();
  } else if (e.key === "c" || e.key === "C") {
    const panel = document.getElementById("compare-panel");
    if (panel.classList.contains("hidden")) openCompare();
    else closeCompare();
  }
}

// ===== Scroll Reveal =====
function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// ===== Toast =====
function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Search =====
function handleSearch() {
  const city = searchInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  fetchWeather(city);
}

// ===== Geolocation =====
function handleGeolocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }
  geoBtn.disabled = true;
  showToast("Detecting your location...");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        showLoading(true);
        clearError();
        const [currentRes, forecastRes] = await Promise.all([
          fetch(`${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${currentUnits}`),
          fetch(`${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${currentUnits}`)
        ]);
        if (!currentRes.ok) { handleApiError(currentRes.status); return; }
        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();
        processWeatherData(currentData, forecastData);
      } catch (err) {
        showError("Network error. Check your connection and try again.");
        console.error(err);
      } finally {
        showLoading(false);
        geoBtn.disabled = false;
      }
    },
    () => {
      showError("Location access denied. Please search manually.");
      geoBtn.disabled = false;
    }
  );
}

// ===== Fetch Weather =====
async function fetchWeather(city) {
  showLoading(true);
  clearError();

  const cacheKey = `${city.toLowerCase()}_${currentUnits}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    processWeatherData(cached.currentData, cached.forecastData);
    showLoading(false);
    return;
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnits}`),
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnits}`)
    ]);
    if (!currentRes.ok) { handleApiError(currentRes.status); return; }
    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    cache.set(cacheKey, { currentData, forecastData, timestamp: Date.now() });
    for (const [key, value] of cache) {
      if (Date.now() - value.timestamp > CACHE_TTL) cache.delete(key);
    }

    processWeatherData(currentData, forecastData);
  } catch (err) {
    showError("Network error. Check your connection and try again.");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// ===== Process & Render All =====
function processWeatherData(currentData, forecastData) {
  currentCity = currentData.name;
  currentWeatherData = currentData;
  currentForecastData = forecastData;
  searchInput.value = currentCity;
  addRecentSearch(currentCity);

  // If guess mode is on, show guess challenge first
  if (guessMode) {
    pendingWeatherReveal = { currentData, forecastData };
    weatherContent.classList.add("hidden");
    updateAmbientBackground(currentData);
    updateAmbientSound(currentData);
    showGuessChallenge(currentCity);
    return;
  }

  document.getElementById("temp-guess-section").classList.add("hidden");
  finishWeatherRender(currentData, forecastData);
}

function finishWeatherRender(currentData, forecastData) {
  renderWeatherMood(currentData);
  renderCurrentWeather(currentData);
  renderSunArc(currentData);
  renderHourlyChart(forecastData.list);
  renderForecast(aggregateDailyForecasts(forecastData.list));
  renderOutfitAdvice(currentData);
  fetchAQI(currentData.coord.lat, currentData.coord.lon);
  updateMap(currentData.coord.lat, currentData.coord.lon, currentData.name);
  updateAmbientBackground(currentData);
  updateAmbientSound(currentData);
  updateFavButton();
  startTrivia(currentData);

  weatherContent.classList.remove("hidden");

  // Trigger reveal animations
  setTimeout(() => {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("visible");
    });
  }, 100);
}

// ===== Weather Mood Narrative =====
function renderWeatherMood(data) {
  const temp = Math.round(data.main.temp);
  const desc = data.weather[0].description;
  const name = data.name;
  const unitSym = currentUnits === "metric" ? "°C" : "°F";
  const iconCode = data.weather[0].icon;
  const isNight = iconCode.endsWith("n");
  const weatherId = data.weather[0].id;

  let timeOfDay = isNight ? "tonight" : "right now";
  let mood = "";

  if (weatherId === 800 && !isNight) {
    mood = `A beautiful day in ${name} — clear skies stretch endlessly overhead at ${temp}${unitSym}. Perfect weather to be outside.`;
  } else if (weatherId === 800 && isNight) {
    mood = `A calm, clear night in ${name}. The sky is open at ${temp}${unitSym} — perfect for stargazing.`;
  } else if (weatherId >= 801 && weatherId <= 802) {
    mood = `Partly cloudy skies over ${name} ${timeOfDay} at ${temp}${unitSym}. A few clouds drift lazily overhead.`;
  } else if (weatherId >= 803) {
    mood = `Overcast skies blanket ${name} ${timeOfDay}. It's ${temp}${unitSym} under a thick layer of grey.`;
  } else if (weatherId >= 500 && weatherId < 600) {
    mood = `Rain falls on ${name} — ${desc} at ${temp}${unitSym}. The kind of weather that calls for a warm drink indoors.`;
  } else if (weatherId >= 300 && weatherId < 400) {
    mood = `A light drizzle mists over ${name} at ${temp}${unitSym}. Not quite rain, but enough to feel on your skin.`;
  } else if (weatherId >= 200 && weatherId < 300) {
    mood = `Thunder rumbles over ${name} — ${desc} with temperatures at ${temp}${unitSym}. Stay safe indoors.`;
  } else if (weatherId >= 600 && weatherId < 700) {
    mood = `Snow blankets ${name} at ${temp}${unitSym}. The world outside is quiet and white.`;
  } else if (weatherId >= 700 && weatherId < 800) {
    mood = `${capitalizeFirst(desc)} settles over ${name} at ${temp}${unitSym}. Visibility may be reduced.`;
  } else {
    mood = `It's ${temp}${unitSym} in ${name} ${timeOfDay} with ${desc}.`;
  }

  document.getElementById("weather-mood").textContent = mood;
}

// ===== Render Current Weather =====
function renderCurrentWeather(data) {
  const unitSymbol = currentUnits === "metric" ? "°C" : "°F";
  const windUnit = currentUnits === "metric" ? "m/s" : "mph";

  document.getElementById("city-name").textContent = data.name;
  document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  });

  const iconEl = document.getElementById("current-icon");
  iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  iconEl.alt = data.weather[0].description;

  animateNumber("current-temp", Math.round(data.main.temp));
  document.getElementById("temp-unit").textContent = unitSymbol;
  document.getElementById("current-desc").textContent = capitalizeFirst(data.weather[0].description);
  document.getElementById("feels-like").textContent = `Feels like ${Math.round(data.main.feels_like)}${unitSymbol}`;
  document.getElementById("temp-high").textContent = `H: ${Math.round(data.main.temp_max)}°`;
  document.getElementById("temp-low").textContent = `L: ${Math.round(data.main.temp_min)}°`;

  // Gauges
  const humidity = data.main.humidity;
  setGauge("humidity-arc", humidity / 100);
  document.getElementById("humidity-text").textContent = `${humidity}%`;

  const windDeg = data.wind.deg || 0;
  document.getElementById("wind-arrow").style.transform = `rotate(${windDeg}deg)`;
  document.getElementById("wind-speed-text").textContent = `${data.wind.speed}`;

  const pressure = data.main.pressure;
  const pressureNorm = Math.min(Math.max((pressure - 950) / 100, 0), 1);
  setGauge("pressure-arc", pressureNorm);
  document.getElementById("pressure-text").textContent = pressure;

  const visKm = data.visibility / 1000;
  const visNorm = Math.min(visKm / 20, 1);
  setGauge("visibility-arc", visNorm);
  if (currentUnits === "imperial") {
    document.getElementById("visibility-text").textContent = (data.visibility / 1609.34).toFixed(1);
    document.getElementById("visibility-label").textContent = "miles";
  } else {
    document.getElementById("visibility-text").textContent = visKm.toFixed(1);
    document.getElementById("visibility-label").textContent = "km";
  }
}

function setGauge(id, fraction) {
  const circle = document.getElementById(id);
  const circumference = 2 * Math.PI * 50; // r=50
  const offset = circumference * (1 - fraction);
  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 100);
}

// ===== Sun Arc =====
function renderSunArc(data) {
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;
  const now = data.dt;
  const tz = data.timezone;

  const sunriseLocal = formatTime(sunrise, tz);
  const sunsetLocal = formatTime(sunset, tz);
  document.getElementById("sunrise-label").textContent = sunriseLocal;
  document.getElementById("sunset-label").textContent = sunsetLocal;

  const totalDaylight = sunset - sunrise;
  const elapsed = Math.max(0, Math.min(now - sunrise, totalDaylight));
  const progress = totalDaylight > 0 ? elapsed / totalDaylight : 0;

  const isDay = now >= sunrise && now <= sunset;

  // Calculate position on quadratic bezier: M 30 180 Q 200 -20 370 180
  const t = Math.max(0, Math.min(progress, 1));
  const x = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 200 + t * t * 370;
  const y = (1 - t) * (1 - t) * 180 + 2 * (1 - t) * t * (-20) + t * t * 180;

  const sunDot = document.getElementById("sun-dot");
  const sunGlow = document.getElementById("sun-glow-circle");
  const timeLabel = document.getElementById("sun-time-label");
  const activePath = document.getElementById("sun-path-active");

  if (isDay) {
    sunDot.classList.remove("hidden");
    sunGlow.classList.remove("hidden");
    sunDot.setAttribute("cx", x);
    sunDot.setAttribute("cy", y);
    sunGlow.setAttribute("cx", x);
    sunGlow.setAttribute("cy", y);

    // Build partial path
    const steps = Math.floor(t * 40);
    let pathD = "";
    for (let i = 0; i <= steps; i++) {
      const st = i / 40;
      const px = (1 - st) * (1 - st) * 30 + 2 * (1 - st) * st * 200 + st * st * 370;
      const py = (1 - st) * (1 - st) * 180 + 2 * (1 - st) * st * (-20) + st * st * 180;
      pathD += (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
    }
    activePath.setAttribute("d", pathD);

    const cityNow = (now + tz) * 1000;
    const d = new Date(cityNow);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    timeLabel.textContent = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm} local time`;
  } else {
    sunDot.classList.add("hidden");
    sunGlow.classList.add("hidden");
    activePath.setAttribute("d", "");
    timeLabel.textContent = "Nighttime";
  }
}

// ===== Hourly Chart =====
function renderHourlyChart(forecastList) {
  const svg = document.getElementById("hourly-chart");
  const unitSym = currentUnits === "metric" ? "°C" : "°F";

  // Take first 16 entries (48 hours)
  const entries = forecastList.slice(0, 16);
  const temps = entries.map((e) => e.main.temp);
  const minTemp = Math.min(...temps) - 3;
  const maxTemp = Math.max(...temps) + 3;

  const pad = { top: 30, right: 30, bottom: 50, left: 20 };
  const w = 800 - pad.left - pad.right;
  const h = 250 - pad.top - pad.bottom;

  const xStep = w / (entries.length - 1);
  const yScale = (temp) => pad.top + h - ((temp - minTemp) / (maxTemp - minTemp)) * h;

  // Build points
  const points = entries.map((e, i) => ({
    x: pad.left + i * xStep,
    y: yScale(e.main.temp),
    temp: Math.round(e.main.temp),
    time: e.dt_txt,
    desc: e.weather[0].description,
    icon: e.weather[0].icon,
  }));

  // Build smooth curve (catmull-rom to bezier)
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // Area path
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${pad.top + h} L ${points[0].x} ${pad.top + h} Z`;

  // Grid lines
  let gridLines = "";
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const gy = pad.top + (h / gridSteps) * i;
    gridLines += `<line class="chart-grid-line" x1="${pad.left}" y1="${gy}" x2="${pad.left + w}" y2="${gy}"/>`;
  }

  // Time labels (every other point)
  let timeLabels = "";
  points.forEach((p, i) => {
    if (i % 2 === 0) {
      const dt = new Date(p.time.replace(" ", "T") + "Z");
      const hr = dt.getUTCHours();
      const ampm = hr >= 12 ? "p" : "a";
      const display = `${hr % 12 || 12}${ampm}`;
      timeLabels += `<text class="chart-time-label" x="${p.x}" y="${pad.top + h + 20}" text-anchor="middle">${display}</text>`;
    }
  });

  // Temperature labels on every 3rd point
  let tempLabels = "";
  points.forEach((p, i) => {
    if (i % 3 === 0) {
      tempLabels += `<text class="chart-temp-label" x="${p.x}" y="${p.y - 12}" text-anchor="middle">${p.temp}°</text>`;
    }
  });

  // Dots
  let dots = "";
  points.forEach((p, i) => {
    dots += `<circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="4" data-index="${i}"/>`;
  });

  svg.innerHTML = `
    <defs>
      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#60a5fa" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${gridLines}
    <path class="chart-area" d="${areaPath}" fill="url(#chart-gradient)"/>
    <path class="chart-line" d="${linePath}"/>
    ${timeLabels}
    ${tempLabels}
    ${dots}
  `;

  // Tooltip events
  const tooltip = document.getElementById("chart-tooltip");
  svg.querySelectorAll(".chart-dot").forEach((dot) => {
    dot.addEventListener("mouseenter", (e) => {
      const i = parseInt(dot.dataset.index);
      const p = points[i];
      const dt = new Date(p.time.replace(" ", "T") + "Z");
      const hr = dt.getUTCHours();
      const ampm = hr >= 12 ? "PM" : "AM";
      const timeStr = `${hr % 12 || 12}:${String(dt.getUTCMinutes()).padStart(2, "0")} ${ampm}`;
      tooltip.innerHTML = `<strong>${p.temp}${unitSym}</strong> &middot; ${capitalizeFirst(p.desc)}<br><span style="opacity:0.6">${timeStr}</span>`;
      tooltip.classList.remove("hidden");

      const rect = svg.getBoundingClientRect();
      const containerRect = svg.parentElement.getBoundingClientRect();
      const dotX = (p.x / 800) * rect.width;
      const dotY = (p.y / 250) * rect.height;
      tooltip.style.left = `${dotX - 40 + rect.left - containerRect.left}px`;
      tooltip.style.top = `${dotY - 60 + rect.top - containerRect.top}px`;

      dot.setAttribute("r", "7");
    });
    dot.addEventListener("mouseleave", () => {
      tooltip.classList.add("hidden");
      dot.setAttribute("r", "4");
    });
  });
}

// ===== Forecast =====
function renderForecast(days) {
  const container = document.getElementById("forecast-cards");
  const html = days.map((day) => `
    <div class="forecast-card">
      <p class="forecast-day">${day.dayName}</p>
      <p class="forecast-date-sub">${day.dateSub}</p>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" loading="lazy">
      <p class="forecast-temps">
        <span class="high">${day.high}°</span>
        <span class="low"> ${day.low}°</span>
      </p>
      <p class="forecast-desc">${capitalizeFirst(day.description)}</p>
    </div>
  `).join("");
  container.innerHTML = html;
}

function aggregateDailyForecasts(forecastList) {
  const dailyMap = {};
  forecastList.forEach((entry) => {
    const dateKey = entry.dt_txt.split(" ")[0];
    if (!dailyMap[dateKey]) dailyMap[dateKey] = { temps: [], icons: [], descriptions: [] };
    dailyMap[dateKey].temps.push(entry.main.temp);
    dailyMap[dateKey].icons.push(entry.weather[0].icon);
    dailyMap[dateKey].descriptions.push(entry.weather[0].description);
  });
  const today = new Date().toISOString().split("T")[0];
  return Object.entries(dailyMap)
    .filter(([date]) => date !== today)
    .slice(0, 4)
    .map(([date, data]) => ({
      date,
      dayName: new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
      dateSub: new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      high: Math.round(Math.max(...data.temps)),
      low: Math.round(Math.min(...data.temps)),
      icon: mostFrequent(data.icons),
      description: mostFrequent(data.descriptions),
    }));
}

function mostFrequent(arr) {
  const counts = {};
  arr.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ===== Outfit Advisor =====
function renderOutfitAdvice(data) {
  const tempC = currentUnits === "metric" ? data.main.temp : (data.main.temp - 32) * 5 / 9;
  const windSpeed = data.wind.speed;
  const weatherId = data.weather[0].id;
  const isRain = weatherId >= 200 && weatherId < 600;
  const isSnow = weatherId >= 600 && weatherId < 700;

  let advice = "";
  if (tempC < 0) advice = "Full winter gear — heavy coat, gloves, hat, and insulated boots.";
  else if (tempC < 10 && windSpeed > 7) advice = "Wind chill is brutal. Layer up and cover exposed skin.";
  else if (tempC < 10) advice = "Chilly out — a warm jacket and layers are your best bet.";
  else if (isSnow) advice = "Snow outside — waterproof boots and a warm coat.";
  else if (isRain) advice = "Rain expected — grab an umbrella and waterproof shoes.";
  else if (tempC >= 20 && tempC <= 28) advice = "T-shirt weather! Sunglasses recommended.";
  else if (tempC > 35) advice = "Stay hydrated. Light, breathable clothing. Seek shade.";
  else if (tempC > 28) advice = "It's warm — shorts and light clothes. Don't forget sunscreen!";
  else advice = "Mild conditions — a light layer should do the trick.";

  document.getElementById("outfit-advice").textContent = advice;
}

// ===== Air Quality Index =====
async function fetchAQI(lat, lon) {
  try {
    const res = await fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (!res.ok) return;
    const data = await res.json();
    const aqi = data.list[0].main.aqi; // 1-5 scale
    renderAQI(aqi);
  } catch (err) {
    console.error("AQI fetch failed:", err);
  }
}

function renderAQI(aqi) {
  const labels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };
  const colors = { 1: "#22c55e", 2: "#84cc16", 3: "#eab308", 4: "#f97316", 5: "#ef4444" };
  const descs = {
    1: "Air quality is excellent. Enjoy outdoor activities!",
    2: "Air quality is acceptable. Unusually sensitive people should limit prolonged outdoor exertion.",
    3: "Sensitive groups may experience health effects. Consider reducing outdoor activity.",
    4: "Health effects possible for everyone. Limit outdoor exertion.",
    5: "Health alert — everyone may experience serious health effects. Avoid outdoor activity.",
  };

  const label = labels[aqi] || "--";
  const color = colors[aqi] || "#888";
  const desc = descs[aqi] || "";

  document.getElementById("aqi-value").textContent = aqi;
  document.getElementById("aqi-label").textContent = label;
  document.getElementById("aqi-label").style.color = color;
  document.getElementById("aqi-desc").textContent = desc;

  // Animate arc
  const arc = document.getElementById("aqi-fill");
  arc.style.stroke = color;
  // Arc total length is about half circle = pi * 50 ≈ 157
  const totalLen = 157;
  const progress = aqi / 5;
  arc.style.strokeDasharray = totalLen;
  arc.style.strokeDashoffset = totalLen * (1 - progress);
}

// ===== Weather Map =====
function initMap() {
  leafletMap = L.map("weather-map", {
    center: [40, -95],
    zoom: 4,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 18,
  }).addTo(leafletMap);

  // Default weather layer
  weatherLayer = L.tileLayer(
    `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
    { opacity: 0.6, maxZoom: 18 }
  ).addTo(leafletMap);
}

function updateMap(lat, lon, name) {
  if (!leafletMap) return;
  leafletMap.setView([lat, lon], 8, { animate: true, duration: 1.2 });

  if (cityMarker) leafletMap.removeLayer(cityMarker);
  cityMarker = L.circleMarker([lat, lon], {
    radius: 8,
    fillColor: "#60a5fa",
    fillOpacity: 0.8,
    color: "#fff",
    weight: 2,
  }).addTo(leafletMap).bindPopup(`<b>${name}</b>`);

  // Fix map rendering
  setTimeout(() => leafletMap.invalidateSize(), 300);
}

function switchMapLayer(btn) {
  document.querySelectorAll(".map-layer-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const layer = btn.dataset.layer;

  if (weatherLayer) leafletMap.removeLayer(weatherLayer);
  weatherLayer = L.tileLayer(
    `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${API_KEY}`,
    { opacity: 0.6, maxZoom: 18 }
  ).addTo(leafletMap);
}

// ===== Ambient Background =====
function updateAmbientBackground(data) {
  const weatherId = data.weather[0].id;
  const iconCode = data.weather[0].icon;
  const isNight = iconCode.endsWith("n");

  const cityNow = data.dt + data.timezone;
  const sunrise = data.sys.sunrise + data.timezone;
  const sunset = data.sys.sunset + data.timezone;
  const goldenMargin = 3600;

  let timeClass = "ambient-day";
  if (isNight) timeClass = "ambient-night";
  else if (Math.abs(cityNow - sunrise) < goldenMargin || Math.abs(cityNow - sunset) < goldenMargin)
    timeClass = "ambient-golden";

  let weatherClass = "ambient-clear";
  if (weatherId >= 200 && weatherId < 300) weatherClass = "ambient-thunderstorm";
  else if (weatherId >= 300 && weatherId < 400) weatherClass = "ambient-drizzle";
  else if (weatherId >= 500 && weatherId < 600) weatherClass = "ambient-rain";
  else if (weatherId >= 600 && weatherId < 700) weatherClass = "ambient-snow";
  else if (weatherId >= 700 && weatherId < 800) weatherClass = "ambient-atmosphere";
  else if (weatherId >= 801) weatherClass = "ambient-clouds";

  ambientBg.className = `ambient-bg ${weatherClass} ${timeClass}`;

  clearParticles();
  if (weatherClass === "ambient-rain" || weatherClass === "ambient-drizzle") createRainParticles();
  else if (weatherClass === "ambient-snow") createSnowParticles();
  else if (weatherClass === "ambient-thunderstorm") { createRainParticles(); startThunderFlashes(); }
  else if (isNight && weatherClass === "ambient-clear") createStars();
}

function clearParticles() {
  particlesContainer.innerHTML = "";
  if (window._thunderInterval) { clearInterval(window._thunderInterval); window._thunderInterval = null; }
}

function createRainParticles() {
  for (let i = 0; i < 100; i++) {
    const drop = document.createElement("div");
    drop.className = "rain-drop";
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.height = `${12 + Math.random() * 25}px`;
    drop.style.animationDuration = `${0.4 + Math.random() * 0.5}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    drop.style.opacity = 0.2 + Math.random() * 0.4;
    particlesContainer.appendChild(drop);
  }
}

function createSnowParticles() {
  for (let i = 0; i < 60; i++) {
    const flake = document.createElement("div");
    flake.className = "snow-flake";
    flake.style.left = `${Math.random() * 100}%`;
    const size = 2 + Math.random() * 7;
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    flake.style.animationDuration = `${4 + Math.random() * 8}s`;
    flake.style.animationDelay = `${Math.random() * 6}s`;
    flake.style.opacity = 0.3 + Math.random() * 0.6;
    particlesContainer.appendChild(flake);
  }
}

function createStars() {
  for (let i = 0; i < 80; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 60}%`;
    const size = 1 + Math.random() * 2.5;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.animationDuration = `${1.5 + Math.random() * 3}s`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    particlesContainer.appendChild(star);
  }
}

function startThunderFlashes() {
  window._thunderInterval = setInterval(() => {
    if (Math.random() > 0.5) {
      const flash = document.createElement("div");
      flash.className = "thunder-flash";
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 250);
    }
  }, 3500);
}

// ===== Ambient Sound (Web Audio API) =====
function toggleSound() {
  soundEnabled = !soundEnabled;
  document.getElementById("sound-icon-on").classList.toggle("hidden", !soundEnabled);
  document.getElementById("sound-icon-off").classList.toggle("hidden", soundEnabled);
  document.getElementById("sound-toggle").classList.toggle("active", soundEnabled);

  if (soundEnabled && currentWeatherData) {
    updateAmbientSound(currentWeatherData);
    showToast("Ambient sounds on");
  } else {
    stopAllSounds();
    if (!soundEnabled) showToast("Ambient sounds off");
  }
}

function updateAmbientSound(data) {
  if (!soundEnabled) return;
  stopAllSounds();

  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();

  const weatherId = data.weather[0].id;
  const isNight = data.weather[0].icon.endsWith("n");

  if (weatherId >= 200 && weatherId < 300) {
    createRainSound(0.14, 600, 1.2);  // heavy, dark rain
    createThunderSound();
  } else if (weatherId >= 300 && weatherId < 400) {
    createRainSound(0.08, 1200, 0.3);  // light drizzle — higher freq, quieter
  } else if (weatherId >= 500 && weatherId < 600) {
    const intensity = weatherId >= 502 ? 0.16 : 0.10;
    createRainSound(intensity, 800, 0.7);
  } else if (weatherId >= 600 && weatherId < 700) {
    createWindSound(0.06, 300, 0.15);  // soft snowy wind
    createSnowSound();
  } else if (weatherId >= 700 && weatherId < 800) {
    createWindSound(0.04, 250, 0.1);   // eerie fog
    createFogDrone();
  } else if (weatherId >= 801) {
    createWindSound(0.04, 350, 0.2);   // light wind for clouds
    createNaturePad(isNight);
  } else {
    // Clear sky
    createNaturePad(isNight);
    if (isNight) createCricketSound();
    else createBirdSound();
  }
}

function createRainSound(vol, centerFreq, q) {
  const bufferSize = audioCtx.sampleRate * 4;
  const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
  // Shaped noise — more natural than raw white noise
  for (let ch = 0; ch < 2; ch++) {
    const channelData = buffer.getChannelData(ch);
    let prev = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown-ish noise with occasional patter spikes (raindrop hits)
      prev = prev * 0.97 + white * 0.03;
      const spike = Math.random() > 0.997 ? (Math.random() * 0.8) : 0;
      channelData[i] = (prev * 15 + spike) * 0.5;
    }
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = centerFreq;
  bandpass.Q.value = q;

  // Second layer — higher freq for rain patter texture
  const hipass = audioCtx.createBiquadFilter();
  hipass.type = "highshelf";
  hipass.frequency.value = 2500;
  hipass.gain.value = -6;

  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 3);

  source.connect(bandpass).connect(hipass).connect(gain).connect(audioCtx.destination);
  source.start();
  activeNodes.push({ source, gain });

  // Add a second brighter layer for detail
  const buffer2 = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const d2 = buffer2.getChannelData(0);
  for (let i = 0; i < d2.length; i++) d2[i] = (Math.random() * 2 - 1) * 0.3;

  const src2 = audioCtx.createBufferSource();
  src2.buffer = buffer2;
  src2.loop = true;

  const hp2 = audioCtx.createBiquadFilter();
  hp2.type = "highpass";
  hp2.frequency.value = 3000;

  const g2 = audioCtx.createGain();
  g2.gain.value = 0;
  g2.gain.linearRampToValueAtTime(vol * 0.3, audioCtx.currentTime + 3);

  src2.connect(hp2).connect(g2).connect(audioCtx.destination);
  src2.start();
  activeNodes.push({ source: src2, gain: g2 });
}

function createThunderSound() {
  let thunderTimer = null;
  function rumble() {
    if (!soundEnabled) return;

    // Low sub-bass rumble
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(50 + Math.random() * 30, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 3);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.08, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 2.5);

    // Crackle burst
    const crackleLen = audioCtx.sampleRate * 0.3;
    const crackleBuf = audioCtx.createBuffer(1, crackleLen, audioCtx.sampleRate);
    const cd = crackleBuf.getChannelData(0);
    for (let i = 0; i < crackleLen; i++) {
      const env = Math.exp(-i / (crackleLen * 0.1));
      cd[i] = (Math.random() * 2 - 1) * env;
    }
    const crackleSrc = audioCtx.createBufferSource();
    crackleSrc.buffer = crackleBuf;
    const crackleGain = audioCtx.createGain();
    crackleGain.gain.value = 0.06;
    const crackleFilter = audioCtx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.value = 2000;
    crackleFilter.Q.value = 0.5;
    crackleSrc.connect(crackleFilter).connect(crackleGain).connect(audioCtx.destination);
    crackleSrc.start();

    osc.connect(filter).connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 4);

    thunderTimer = setTimeout(rumble, 4000 + Math.random() * 12000);
  }
  thunderTimer = setTimeout(rumble, 1500 + Math.random() * 3000);
  activeNodes.push({ _timer: thunderTimer });
}

function createWindSound(vol, freq, lfoDepth) {
  const bufferSize = audioCtx.sampleRate * 4;
  const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buffer.getChannelData(ch);
    let prev = 0;
    for (let i = 0; i < bufferSize; i++) {
      prev = prev * 0.98 + (Math.random() * 2 - 1) * 0.02;
      d[i] = prev * 20;
    }
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = freq;

  // Slow LFO modulates filter for "gusting" effect
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.12 + Math.random() * 0.15;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = freq * lfoDepth;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  // Second LFO for volume swells
  const volLfo = audioCtx.createOscillator();
  volLfo.frequency.value = 0.08 + Math.random() * 0.06;
  const volLfoGain = audioCtx.createGain();
  volLfoGain.gain.value = vol * 0.4;
  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 3);
  volLfo.connect(volLfoGain).connect(gain.gain);
  volLfo.start();

  source.connect(filter).connect(gain).connect(audioCtx.destination);
  source.start();
  activeNodes.push({ source, gain, lfo, extra: volLfo });
}

function createSnowSound() {
  // Gentle high-frequency sparkle — like tiny ice crystals
  const bufLen = audioCtx.sampleRate * 3;
  const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    // Sparse tiny clicks
    d[i] = Math.random() > 0.998 ? (Math.random() * 0.4 - 0.2) : 0;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const hp = audioCtx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 4000;

  const reverb = audioCtx.createBiquadFilter();
  reverb.type = "peaking";
  reverb.frequency.value = 6000;
  reverb.gain.value = 8;
  reverb.Q.value = 0.5;

  const g = audioCtx.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 4);

  src.connect(hp).connect(reverb).connect(g).connect(audioCtx.destination);
  src.start();
  activeNodes.push({ source: src, gain: g });
}

function createFogDrone() {
  // Low, evolving drone for misty/foggy atmosphere
  const osc1 = audioCtx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 80;
  const osc2 = audioCtx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 80.7; // slight detune for beating

  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 3;
  lfo.connect(lfoGain).connect(osc1.frequency);
  lfo.connect(lfoGain).connect(osc2.frequency);
  lfo.start();

  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 5);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 200;

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain).connect(audioCtx.destination);
  osc1.start();
  osc2.start();
  activeNodes.push({ source: osc1, gain, extra: osc2, lfo });
}

function createNaturePad(isNight) {
  // Evolving ambient pad — warm major chord feel for day, cool minor for night
  const baseFreqs = isNight
    ? [130.81, 155.56, 196.00, 261.63]   // C3, Eb3, G3, C4 (Cm)
    : [130.81, 164.81, 196.00, 261.63];   // C3, E3, G3, C4 (Cmaj)

  const master = audioCtx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.025, audioCtx.currentTime + 4);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;
  // Slowly open and close the filter
  const filterLfo = audioCtx.createOscillator();
  filterLfo.frequency.value = 0.03;
  const filterLfoGain = audioCtx.createGain();
  filterLfoGain.gain.value = 200;
  filterLfo.connect(filterLfoGain).connect(filter.frequency);
  filterLfo.start();

  filter.connect(master).connect(audioCtx.destination);

  const oscs = baseFreqs.map((freq) => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    // Subtle slow vibrato per voice
    const vib = audioCtx.createOscillator();
    vib.frequency.value = 0.1 + Math.random() * 0.15;
    const vibGain = audioCtx.createGain();
    vibGain.gain.value = 1.5;
    vib.connect(vibGain).connect(osc.frequency);
    vib.start();

    osc.connect(filter);
    osc.start();
    return { osc, vib };
  });

  activeNodes.push({
    source: oscs[0].osc,
    gain: master,
    lfo: filterLfo,
    extra: oscs.map(o => o.osc).concat(oscs.map(o => o.vib)),
  });
}

function createBirdSound() {
  // Synthetic birdsong — short chirps at random intervals
  let birdTimer = null;
  function chirp() {
    if (!soundEnabled) return;
    const t = audioCtx.currentTime;

    // Each chirp is 2-4 rapid notes
    const noteCount = 2 + Math.floor(Math.random() * 3);
    for (let n = 0; n < noteCount; n++) {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      const baseFreq = 2000 + Math.random() * 2500;
      const noteTime = t + n * (0.06 + Math.random() * 0.04);
      osc.frequency.setValueAtTime(baseFreq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (0.8 + Math.random() * 0.5), noteTime + 0.08);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0, noteTime);
      g.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, noteTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.08 + Math.random() * 0.04);

      osc.connect(g).connect(audioCtx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    }

    birdTimer = setTimeout(chirp, 2000 + Math.random() * 6000);
  }
  birdTimer = setTimeout(chirp, 500 + Math.random() * 2000);
  activeNodes.push({ _timer: birdTimer });
}

function createCricketSound() {
  // Synthetic crickets — rhythmic chirring
  let cricketTimer = null;
  function chirr() {
    if (!soundEnabled) return;
    const t = audioCtx.currentTime;
    const chirpCount = 3 + Math.floor(Math.random() * 4);

    for (let n = 0; n < chirpCount; n++) {
      const noteTime = t + n * 0.07;

      const bufLen = Math.floor(audioCtx.sampleRate * 0.05);
      const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      const freq = 4500 + Math.random() * 1000;
      for (let i = 0; i < bufLen; i++) {
        const env = Math.sin(Math.PI * i / bufLen);
        d[i] = Math.sin(2 * Math.PI * freq * i / audioCtx.sampleRate) * env * 0.15;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;

      const g = audioCtx.createGain();
      g.gain.value = 0.04;

      src.connect(g).connect(audioCtx.destination);
      src.start(noteTime);
    }

    cricketTimer = setTimeout(chirr, 800 + Math.random() * 2500);
  }
  cricketTimer = setTimeout(chirr, 300 + Math.random() * 1000);
  activeNodes.push({ _timer: cricketTimer });
}

function stopAllSounds() {
  activeNodes.forEach((node) => {
    try {
      // Clear any scheduled timers (thunder, birds, crickets)
      if (node._timer) clearTimeout(node._timer);
      if (node.gain) node.gain.gain.linearRampToValueAtTime(0, (audioCtx?.currentTime || 0) + 0.5);
      setTimeout(() => {
        try { node.source?.stop(); } catch (e) {}
        try { node.lfo?.stop(); } catch (e) {}
        if (Array.isArray(node.extra)) {
          node.extra.forEach((x) => { try { x.stop(); } catch (e) {} });
        } else if (node.extra) {
          try { node.extra.stop(); } catch (e) {}
        }
      }, 600);
    } catch (e) {}
  });
  activeNodes = [];
}

// ===== City Comparison =====
function openCompare() {
  document.getElementById("compare-panel").classList.remove("hidden");
  document.getElementById("compare-input-1").focus();
  if (currentCity) document.getElementById("compare-input-1").value = currentCity;
}

function closeCompare() {
  document.getElementById("compare-panel").classList.add("hidden");
}

async function runComparison() {
  const city1 = document.getElementById("compare-input-1").value.trim();
  const city2 = document.getElementById("compare-input-2").value.trim();
  if (!city1 || !city2) { showToast("Enter two cities to compare."); return; }

  const container = document.getElementById("compare-results");
  container.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Loading comparison...</p>';

  try {
    const [res1, res2] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city1)}&appid=${API_KEY}&units=${currentUnits}`),
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city2)}&appid=${API_KEY}&units=${currentUnits}`)
    ]);

    if (!res1.ok || !res2.ok) {
      container.innerHTML = '<p style="text-align:center;color:var(--error);grid-column:1/-1;">One or both cities not found. Check spelling.</p>';
      return;
    }

    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
    renderComparison(data1, data2);
  } catch (err) {
    container.innerHTML = '<p style="text-align:center;color:var(--error);grid-column:1/-1;">Network error.</p>';
  }
}

function renderComparison(d1, d2) {
  const unit = currentUnits === "metric" ? "°C" : "°F";
  const windU = currentUnits === "metric" ? "m/s" : "mph";
  const tempDiff = Math.round(d1.main.temp) - Math.round(d2.main.temp);

  function cityCard(d, diffLabel) {
    return `
      <div class="compare-city-card glass-card">
        <p class="compare-city-name">${d.name}</p>
        <img class="compare-city-icon" src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png" alt="${d.weather[0].description}">
        <p class="compare-city-temp">${Math.round(d.main.temp)}${unit} ${diffLabel}</p>
        <p class="compare-city-desc">${capitalizeFirst(d.weather[0].description)}</p>
        <div class="compare-stat-grid">
          <div><p class="compare-stat-label">Feels Like</p><p class="compare-stat-value">${Math.round(d.main.feels_like)}${unit}</p></div>
          <div><p class="compare-stat-label">Humidity</p><p class="compare-stat-value">${d.main.humidity}%</p></div>
          <div><p class="compare-stat-label">Wind</p><p class="compare-stat-value">${d.wind.speed} ${windU} ${degToCompass(d.wind.deg)}</p></div>
          <div><p class="compare-stat-label">Pressure</p><p class="compare-stat-value">${d.main.pressure} hPa</p></div>
        </div>
      </div>`;
  }

  const diff1 = tempDiff > 0 ? `<span class="compare-diff warmer">+${tempDiff}°</span>` : tempDiff < 0 ? `<span class="compare-diff cooler">${tempDiff}°</span>` : "";
  const diff2 = tempDiff < 0 ? `<span class="compare-diff warmer">+${Math.abs(tempDiff)}°</span>` : tempDiff > 0 ? `<span class="compare-diff cooler">-${tempDiff}°</span>` : "";

  document.getElementById("compare-results").innerHTML = cityCard(d1, diff1) + cityCard(d2, diff2);
}

// ===== Share Card =====
function generateShareCard() {
  if (!currentWeatherData) { showToast("Search a city first!"); return; }

  const canvas = document.getElementById("share-canvas");
  const ctx = canvas.getContext("2d");
  const d = currentWeatherData;
  const unit = currentUnits === "metric" ? "°C" : "°F";

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 600, 400);
  const weatherId = d.weather[0].id;
  if (weatherId >= 200 && weatherId < 600) {
    grad.addColorStop(0, "#1e293b"); grad.addColorStop(1, "#475569");
  } else if (weatherId >= 600 && weatherId < 700) {
    grad.addColorStop(0, "#312e81"); grad.addColorStop(1, "#818cf8");
  } else if (weatherId >= 800) {
    grad.addColorStop(0, "#1e40af"); grad.addColorStop(1, "#60a5fa");
  } else {
    grad.addColorStop(0, "#334155"); grad.addColorStop(1, "#64748b");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 400);

  // Glass card effect
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.roundRect(30, 30, 540, 340, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // City name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px 'Space Grotesk', sans-serif";
  ctx.fillText(d.name, 60, 80);

  // Date
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "14px 'Inter', sans-serif";
  ctx.fillText(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }), 60, 105);

  // Temperature
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px 'Space Grotesk', sans-serif";
  ctx.fillText(`${Math.round(d.main.temp)}${unit}`, 60, 200);

  // Description
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(capitalizeFirst(d.weather[0].description), 60, 235);

  // Details
  ctx.font = "14px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const details = [
    `Feels like ${Math.round(d.main.feels_like)}${unit}`,
    `H: ${Math.round(d.main.temp_max)}° / L: ${Math.round(d.main.temp_min)}°`,
    `Humidity: ${d.main.humidity}%`,
    `Wind: ${d.wind.speed} ${currentUnits === "metric" ? "m/s" : "mph"} ${degToCompass(d.wind.deg)}`
  ];
  details.forEach((line, i) => {
    ctx.fillText(line, 60, 275 + i * 22);
  });

  // Branding
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "12px 'Inter', sans-serif";
  ctx.fillText("Weather Dashboard", 60, 360);

  // Download
  const link = document.createElement("a");
  link.download = `weather-${d.name.toLowerCase().replace(/\s/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();

  showToast(`Weather card for ${d.name} downloaded!`);
}

// ===== Unit Toggle =====
function toggleUnits(unit) {
  currentUnits = unit;
  localStorage.setItem("weather-units", unit);
  updateToggleUI();
  cache.clear();
  if (currentCity) fetchWeather(currentCity);
}

function updateToggleUI() {
  const btnImperial = document.getElementById("btn-imperial");
  const btnMetric = document.getElementById("btn-metric");
  btnImperial.classList.toggle("active", currentUnits === "imperial");
  btnMetric.classList.toggle("active", currentUnits === "metric");
  btnImperial.setAttribute("aria-pressed", currentUnits === "imperial");
  btnMetric.setAttribute("aria-pressed", currentUnits === "metric");
}

// ===== Recent Searches =====
function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem("weather-recent") || "[]"); } catch { return []; }
}

function addRecentSearch(city) {
  let recent = getRecentSearches();
  recent = recent.filter((c) => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  recent = recent.slice(0, 8);
  localStorage.setItem("weather-recent", JSON.stringify(recent));
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById("recent-searches");
  const recent = getRecentSearches();
  if (!recent.length) { container.innerHTML = ""; return; }
  container.innerHTML = recent.map((city) =>
    `<button class="recent-chip" onclick="fetchWeather('${city.replace(/'/g, "\\'")}')">${city}</button>`
  ).join("");
}

// ===== Error Handling =====
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.add("visible");
  weatherContent.classList.add("hidden");
}
function clearError() {
  errorMsg.textContent = "";
  errorMsg.classList.remove("visible");
}
function handleApiError(status) {
  const messages = {
    404: "City not found. Check the spelling and try again.",
    401: "API key error. It may need up to 2 hours to activate.",
    429: "Too many requests. Please wait a moment.",
  };
  showError(messages[status] || "Something went wrong. Please try again.");
}

// ===== Loading =====
function showLoading(show) {
  if (show) { loading.classList.remove("hidden"); weatherContent.classList.add("hidden"); }
  else { loading.classList.add("hidden"); }
}

// ===== Helpers =====
function formatTime(unixTimestamp, timezoneOffsetSeconds) {
  const localMs = (unixTimestamp + timezoneOffsetSeconds) * 1000;
  const date = new Date(localMs);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function degToCompass(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  const duration = 1000;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ================================================================
// ===== INTERACTIVE FEATURES =====================================
// ================================================================

// ===== Temperature Guess Game =====
let guessMode = JSON.parse(localStorage.getItem("weather-guess-mode") || "false");
let guessStreak = parseInt(localStorage.getItem("weather-guess-streak") || "0");
let guessBestStreak = parseInt(localStorage.getItem("weather-guess-best") || "0");
let guessTotalScore = parseInt(localStorage.getItem("weather-guess-score") || "0");
let pendingWeatherReveal = null;

function initGuessMode() {
  const toggleBtn = document.getElementById("guess-mode-toggle");
  toggleBtn.addEventListener("click", () => {
    guessMode = !guessMode;
    localStorage.setItem("weather-guess-mode", JSON.stringify(guessMode));
    toggleBtn.classList.toggle("active", guessMode);
    showToast(guessMode ? "Guess Game ON — guess the temp before each search!" : "Guess Game OFF");
  });
  toggleBtn.classList.toggle("active", guessMode);

  const slider = document.getElementById("temp-guess-slider");
  const valueDisplay = document.getElementById("temp-guess-value");
  slider.addEventListener("input", () => {
    valueDisplay.textContent = slider.value;
    // Color the number based on temperature
    const val = parseInt(slider.value);
    if (currentUnits === "metric") {
      valueDisplay.style.color = val < 0 ? "#93c5fd" : val < 15 ? "#60a5fa" : val < 25 ? "#fbbf24" : val < 35 ? "#f97316" : "#ef4444";
    } else {
      valueDisplay.style.color = val < 32 ? "#93c5fd" : val < 60 ? "#60a5fa" : val < 80 ? "#fbbf24" : val < 95 ? "#f97316" : "#ef4444";
    }
  });

  document.getElementById("temp-guess-submit").addEventListener("click", submitGuess);
  document.getElementById("temp-guess-reveal").addEventListener("click", revealWeatherAfterGuess);
}

function showGuessChallenge(cityName) {
  const section = document.getElementById("temp-guess-section");
  const slider = document.getElementById("temp-guess-slider");
  const resultDiv = document.getElementById("temp-guess-result");
  const controls = document.querySelector(".temp-guess-controls");

  document.getElementById("guess-city-name").textContent = cityName;
  document.getElementById("temp-guess-unit").textContent = currentUnits === "metric" ? "°C" : "°F";

  // Set sensible slider range based on units
  if (currentUnits === "metric") {
    slider.min = -40; slider.max = 50; slider.value = 15;
  } else {
    slider.min = -40; slider.max = 120; slider.value = 70;
  }
  document.getElementById("temp-guess-value").textContent = slider.value;
  document.getElementById("temp-guess-value").style.color = "";

  resultDiv.classList.add("hidden");
  controls.style.display = "";
  section.classList.remove("hidden");

  // Update streak displays
  document.getElementById("guess-streak").textContent = guessStreak;
  document.getElementById("guess-best-streak").textContent = guessBestStreak;
  document.getElementById("guess-total-score").textContent = guessTotalScore;
}

function submitGuess() {
  if (!pendingWeatherReveal) return;
  const guess = parseInt(document.getElementById("temp-guess-slider").value);
  const actual = Math.round(pendingWeatherReveal.currentData.main.temp);
  const diff = Math.abs(guess - actual);
  const unit = currentUnits === "metric" ? "°C" : "°F";

  // Score: 100 points for exact, decreasing
  let points = Math.max(0, 100 - diff * 5);
  let accuracy, cssClass, message;

  if (diff === 0) {
    accuracy = "PERFECT!"; cssClass = "perfect"; message = "Incredible — you nailed it exactly!";
    points = 150; // Bonus for perfect
  } else if (diff <= 3) {
    accuracy = "Amazing!"; cssClass = "perfect"; message = `Only ${diff}° off — you're a weather wizard!`;
  } else if (diff <= 8) {
    accuracy = "Pretty Close!"; cssClass = "close"; message = `${diff}° off — solid intuition!`;
  } else if (diff <= 15) {
    accuracy = "Not Bad!"; cssClass = "close"; message = `${diff}° off — getting warmer... or cooler.`;
  } else {
    accuracy = "Way Off!"; cssClass = "far"; message = `${diff}° off — ${guess > actual ? "too hot!" : "too cold!"}`;
  }

  // Update streak
  if (diff <= 8) {
    guessStreak++;
  } else {
    guessStreak = 0;
  }
  if (guessStreak > guessBestStreak) guessBestStreak = guessStreak;
  guessTotalScore += points;

  localStorage.setItem("weather-guess-streak", guessStreak);
  localStorage.setItem("weather-guess-best", guessBestStreak);
  localStorage.setItem("weather-guess-score", guessTotalScore);

  // Show result
  const accuracyEl = document.getElementById("temp-guess-accuracy");
  accuracyEl.textContent = `${accuracy} ${message}`;
  accuracyEl.className = `temp-guess-accuracy ${cssClass}`;

  document.getElementById("guess-yours").textContent = `${guess}${unit}`;
  document.getElementById("guess-actual").textContent = `${actual}${unit}`;
  document.getElementById("guess-streak").textContent = guessStreak;
  document.getElementById("guess-best-streak").textContent = guessBestStreak;
  document.getElementById("guess-total-score").textContent = guessTotalScore;

  // Animate points toast
  if (points > 0) showToast(`+${points} points!`);

  document.querySelector(".temp-guess-controls").style.display = "none";
  document.getElementById("temp-guess-result").classList.remove("hidden");
}

function revealWeatherAfterGuess() {
  if (!pendingWeatherReveal) return;
  const { currentData, forecastData } = pendingWeatherReveal;
  pendingWeatherReveal = null;
  document.getElementById("temp-guess-section").classList.add("hidden");
  finishWeatherRender(currentData, forecastData);
}

// ===== Favorite Cities =====
function getFavorites() {
  try { return JSON.parse(localStorage.getItem("weather-favorites") || "[]"); } catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem("weather-favorites", JSON.stringify(favs));
}

function toggleFavorite(city) {
  let favs = getFavorites();
  const idx = favs.findIndex((f) => f.toLowerCase() === city.toLowerCase());
  if (idx >= 0) {
    favs.splice(idx, 1);
    showToast(`${city} removed from favorites`);
  } else {
    favs.unshift(city);
    if (favs.length > 12) favs = favs.slice(0, 12);
    showToast(`${city} added to favorites!`);
  }
  saveFavorites(favs);
  renderFavorites();
  updateFavButton();
}

function isFavorite(city) {
  return getFavorites().some((f) => f.toLowerCase() === city.toLowerCase());
}

function renderFavorites() {
  const container = document.getElementById("favorite-cities");
  const favs = getFavorites();
  if (!favs.length) { container.innerHTML = ""; return; }
  container.innerHTML = favs.map((city) =>
    `<div class="fav-chip" onclick="fetchWeather('${city.replace(/'/g, "\\'")}')">
      <span class="fav-star">★</span>
      <span>${city}</span>
      <button class="fav-remove" onclick="event.stopPropagation();toggleFavorite('${city.replace(/'/g, "\\'")}')" aria-label="Remove ${city} from favorites">×</button>
    </div>`
  ).join("");
}

function updateFavButton() {
  const btn = document.getElementById("fav-btn");
  const icon = document.getElementById("fav-star-icon");
  if (!currentCity) return;
  const isFav = isFavorite(currentCity);
  btn.classList.toggle("is-fav", isFav);
  icon.setAttribute("fill", isFav ? "currentColor" : "none");
  btn.title = isFav ? "Remove from favorites" : "Add to favorites";
}

function initFavorites() {
  document.getElementById("fav-btn").addEventListener("click", () => {
    if (currentCity) toggleFavorite(currentCity);
  });
  renderFavorites();
}

// ===== Weather Trivia Quiz =====
let triviaScore = 0;
let triviaTotal = 0;
let triviaQuestionPool = [];
let triviaCurrentQuestion = null;

function generateTriviaQuestions(weatherData) {
  const temp = Math.round(weatherData.main.temp);
  const humidity = weatherData.main.humidity;
  const windSpeed = weatherData.wind.speed;
  const weatherId = weatherData.weather[0].id;
  const desc = weatherData.weather[0].description;
  const city = weatherData.name;
  const unit = currentUnits === "metric" ? "°C" : "°F";
  const windUnit = currentUnits === "metric" ? "m/s" : "mph";

  const questions = [];

  // Temperature range question
  const tempRanges = currentUnits === "metric"
    ? [
      { label: "Below 0°C", check: temp < 0 },
      { label: "0–10°C", check: temp >= 0 && temp <= 10 },
      { label: "10–20°C", check: temp > 10 && temp <= 20 },
      { label: "20–30°C", check: temp > 20 && temp <= 30 },
      { label: "Above 30°C", check: temp > 30 },
    ]
    : [
      { label: "Below 32°F", check: temp < 32 },
      { label: "32–50°F", check: temp >= 32 && temp <= 50 },
      { label: "50–70°F", check: temp > 50 && temp <= 70 },
      { label: "70–90°F", check: temp > 70 && temp <= 90 },
      { label: "Above 90°F", check: temp > 90 },
    ];
  const correctRange = tempRanges.find((r) => r.check);
  if (correctRange) {
    const wrongRanges = tempRanges.filter((r) => !r.check);
    const shuffledWrong = wrongRanges.sort(() => Math.random() - 0.5).slice(0, 3);
    questions.push({
      question: `What temperature range is ${city} in right now?`,
      options: shuffle([correctRange.label, ...shuffledWrong.map((r) => r.label)]),
      answer: correctRange.label,
      explanation: `${city} is currently ${temp}${unit}, which falls in the ${correctRange.label} range.`,
    });
  }

  // Humidity question
  const humidityRanges = [
    { label: "Under 30% (Dry)", check: humidity < 30 },
    { label: "30–50% (Comfortable)", check: humidity >= 30 && humidity <= 50 },
    { label: "50–70% (Moderate)", check: humidity > 50 && humidity <= 70 },
    { label: "Above 70% (Humid)", check: humidity > 70 },
  ];
  const correctHumidity = humidityRanges.find((r) => r.check);
  if (correctHumidity) {
    const wrongH = humidityRanges.filter((r) => !r.check);
    questions.push({
      question: `How humid is it in ${city}?`,
      options: shuffle([correctHumidity.label, ...wrongH.map((r) => r.label)]),
      answer: correctHumidity.label,
      explanation: `Humidity in ${city} is ${humidity}%, which is classified as "${correctHumidity.label.split("(")[1]?.replace(")", "") || "normal"}".`,
    });
  }

  // Weather condition question
  const conditions = [
    { label: "Clear skies", check: weatherId === 800 },
    { label: "Cloudy", check: weatherId > 800 },
    { label: "Rain", check: weatherId >= 500 && weatherId < 600 },
    { label: "Snow", check: weatherId >= 600 && weatherId < 700 },
    { label: "Thunderstorm", check: weatherId >= 200 && weatherId < 300 },
    { label: "Drizzle", check: weatherId >= 300 && weatherId < 400 },
    { label: "Fog or Haze", check: weatherId >= 700 && weatherId < 800 },
  ];
  const correctCond = conditions.find((r) => r.check);
  if (correctCond) {
    const wrongC = conditions.filter((r) => !r.check).sort(() => Math.random() - 0.5).slice(0, 3);
    questions.push({
      question: `What is the current weather condition in ${city}?`,
      options: shuffle([correctCond.label, ...wrongC.map((r) => r.label)]),
      answer: correctCond.label,
      explanation: `${city} is currently experiencing "${desc}" — classified as ${correctCond.label}.`,
    });
  }

  // Wind question
  const windRanges = currentUnits === "metric"
    ? [
      { label: "Calm (under 2 m/s)", check: windSpeed < 2 },
      { label: "Light breeze (2–5 m/s)", check: windSpeed >= 2 && windSpeed < 5 },
      { label: "Moderate wind (5–10 m/s)", check: windSpeed >= 5 && windSpeed < 10 },
      { label: "Strong wind (10+ m/s)", check: windSpeed >= 10 },
    ]
    : [
      { label: "Calm (under 5 mph)", check: windSpeed < 5 },
      { label: "Light breeze (5–12 mph)", check: windSpeed >= 5 && windSpeed < 12 },
      { label: "Moderate wind (12–25 mph)", check: windSpeed >= 12 && windSpeed < 25 },
      { label: "Strong wind (25+ mph)", check: windSpeed >= 25 },
    ];
  const correctWind = windRanges.find((r) => r.check);
  if (correctWind) {
    const wrongW = windRanges.filter((r) => !r.check);
    questions.push({
      question: `How windy is it in ${city}?`,
      options: shuffle([correctWind.label, ...wrongW.map((r) => r.label)]),
      answer: correctWind.label,
      explanation: `Wind speed in ${city} is ${windSpeed} ${windUnit}, which is "${correctWind.label.split("(")[0].trim()}".`,
    });
  }

  // Fun general weather knowledge
  const funFacts = [
    {
      question: "What instrument measures atmospheric pressure?",
      options: shuffle(["Barometer", "Thermometer", "Hygrometer", "Anemometer"]),
      answer: "Barometer",
      explanation: "A barometer measures atmospheric pressure. The current pressure in " + city + " is " + weatherData.main.pressure + " hPa.",
    },
    {
      question: "What does 100% humidity mean?",
      options: shuffle(["Air is fully saturated with water vapor", "It's raining heavily", "You're underwater", "Visibility is zero"]),
      answer: "Air is fully saturated with water vapor",
      explanation: "100% humidity means the air is holding the maximum amount of water vapor it can at that temperature — not that it's raining.",
    },
    {
      question: "Which wind speed unit is used at sea?",
      options: shuffle(["Knots", "Miles per hour", "Meters per second", "Kilometers per hour"]),
      answer: "Knots",
      explanation: "Knots (nautical miles per hour) are the standard wind measurement for maritime and aviation use.",
    },
    {
      question: "What causes thunder?",
      options: shuffle(["Rapid air expansion from lightning heat", "Clouds colliding", "Wind shear", "Hail hitting the ground"]),
      answer: "Rapid air expansion from lightning heat",
      explanation: "Lightning heats the air to ~30,000°C, causing rapid expansion that creates the shockwave we hear as thunder.",
    },
    {
      question: "At what temperature do Celsius and Fahrenheit read the same?",
      options: shuffle(["-40°", "0°", "-32°", "100°"]),
      answer: "-40°",
      explanation: "-40°C equals exactly -40°F — the only point where both scales meet.",
    },
    {
      question: "What type of cloud produces thunderstorms?",
      options: shuffle(["Cumulonimbus", "Cirrus", "Stratus", "Altocumulus"]),
      answer: "Cumulonimbus",
      explanation: "Cumulonimbus clouds are tall, dense, and towering — the classic thunderstorm cloud reaching up to 40,000+ feet.",
    },
  ];

  questions.push(...funFacts.sort(() => Math.random() - 0.5).slice(0, 2));

  return questions.sort(() => Math.random() - 0.5);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startTrivia(weatherData) {
  triviaQuestionPool = generateTriviaQuestions(weatherData);
  triviaScore = 0;
  triviaTotal = 0;
  document.getElementById("trivia-score").textContent = 0;
  document.getElementById("trivia-total").textContent = triviaQuestionPool.length;
  showNextTrivia();
}

function showNextTrivia() {
  if (triviaQuestionPool.length === 0) {
    document.getElementById("trivia-question").textContent = `Quiz complete! You scored ${triviaScore}/${triviaTotal}. Search a new city for fresh questions!`;
    document.getElementById("trivia-options").innerHTML = "";
    document.getElementById("trivia-feedback").classList.add("hidden");
    return;
  }

  triviaCurrentQuestion = triviaQuestionPool.shift();
  document.getElementById("trivia-question").textContent = triviaCurrentQuestion.question;
  document.getElementById("trivia-feedback").classList.add("hidden");

  const container = document.getElementById("trivia-options");
  container.innerHTML = triviaCurrentQuestion.options.map((opt) =>
    `<button class="trivia-option" data-answer="${opt.replace(/"/g, '&quot;')}">${opt}</button>`
  ).join("");

  container.querySelectorAll(".trivia-option").forEach((btn) => {
    btn.addEventListener("click", () => handleTriviaAnswer(btn));
  });
}

function handleTriviaAnswer(btn) {
  const selected = btn.dataset.answer;
  const correct = triviaCurrentQuestion.answer;
  const isCorrect = selected === correct;

  triviaTotal++;
  if (isCorrect) triviaScore++;
  document.getElementById("trivia-score").textContent = triviaScore;

  // Mark all buttons
  document.querySelectorAll(".trivia-option").forEach((b) => {
    b.classList.add("selected");
    if (b.dataset.answer === correct) b.classList.add("correct");
    else if (b === btn && !isCorrect) b.classList.add("wrong");
  });

  const feedbackText = document.getElementById("trivia-feedback-text");
  feedbackText.textContent = isCorrect ? "Correct!" : `Wrong — the answer is "${correct}"`;
  feedbackText.style.color = isCorrect ? "#22c55e" : "var(--error)";
  document.getElementById("trivia-explanation").textContent = triviaCurrentQuestion.explanation;
  document.getElementById("trivia-feedback").classList.remove("hidden");
}

function initTrivia() {
  document.getElementById("trivia-next").addEventListener("click", showNextTrivia);
}

// ===== Hook features into init =====
const _origDOMReady = document.readyState;
document.addEventListener("DOMContentLoaded", () => {
  initGuessMode();
  initFavorites();
  initTrivia();
});
