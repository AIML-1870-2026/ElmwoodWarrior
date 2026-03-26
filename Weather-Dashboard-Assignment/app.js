// ===== Configuration =====
const API_KEY = CONFIG.API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ===== State =====
let currentUnits = localStorage.getItem("weather-units") || "imperial";
let currentCity = "";
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
});

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

        if (!currentRes.ok) {
          handleApiError(currentRes.status);
          return;
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        currentCity = currentData.name;
        searchInput.value = currentCity;
        addRecentSearch(currentCity);
        renderCurrentWeather(currentData);
        renderForecast(aggregateDailyForecasts(forecastData.list));
        updateAmbientBackground(currentData);
        weatherContent.classList.remove("hidden");
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

  // Check cache
  const cacheKey = `${city.toLowerCase()}_${currentUnits}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    currentCity = cached.currentData.name;
    renderCurrentWeather(cached.currentData);
    renderForecast(aggregateDailyForecasts(cached.forecastData.list));
    updateAmbientBackground(cached.currentData);
    weatherContent.classList.remove("hidden");
    showLoading(false);
    return;
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnits}`),
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnits}`)
    ]);

    if (!currentRes.ok) {
      handleApiError(currentRes.status);
      return;
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    // Store in cache
    cache.set(cacheKey, { currentData, forecastData, timestamp: Date.now() });

    // Clean stale cache entries
    for (const [key, value] of cache) {
      if (Date.now() - value.timestamp > CACHE_TTL) cache.delete(key);
    }

    currentCity = currentData.name;
    searchInput.value = currentCity;
    addRecentSearch(currentCity);
    renderCurrentWeather(currentData);
    renderForecast(aggregateDailyForecasts(forecastData.list));
    updateAmbientBackground(currentData);
    weatherContent.classList.remove("hidden");
  } catch (err) {
    showError("Network error. Check your connection and try again.");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// ===== Render Current Weather =====
function renderCurrentWeather(data) {
  const unitSymbol = currentUnits === "metric" ? "°C" : "°F";
  const windUnit = currentUnits === "metric" ? "m/s" : "mph";

  document.getElementById("city-name").textContent = data.name;
  document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  const iconEl = document.getElementById("current-icon");
  iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  iconEl.alt = data.weather[0].description;

  // Animate temperature
  animateNumber("current-temp", Math.round(data.main.temp));
  document.getElementById("temp-unit").textContent = unitSymbol;

  document.getElementById("current-desc").textContent = capitalizeFirst(data.weather[0].description);
  document.getElementById("feels-like").textContent = `Feels like ${Math.round(data.main.feels_like)}${unitSymbol}`;
  document.getElementById("temp-high").textContent = `H: ${Math.round(data.main.temp_max)}°`;
  document.getElementById("temp-low").textContent = `L: ${Math.round(data.main.temp_min)}°`;

  // Details
  const humidityVal = data.main.humidity;
  document.getElementById("humidity").textContent = `${humidityVal}%`;
  setTimeout(() => {
    document.getElementById("humidity-fill").style.width = `${humidityVal}%`;
  }, 100);

  document.getElementById("wind").textContent = `${data.wind.speed} ${windUnit} ${degToCompass(data.wind.deg)}`;
  document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;

  const visMiles = currentUnits === "imperial"
    ? `${(data.visibility / 1609.34).toFixed(1)} mi`
    : `${(data.visibility / 1000).toFixed(1)} km`;
  document.getElementById("visibility").textContent = visMiles;

  document.getElementById("sunrise").textContent = formatTime(data.sys.sunrise, data.timezone);
  document.getElementById("sunset").textContent = formatTime(data.sys.sunset, data.timezone);

  // Outfit advisor
  renderOutfitAdvice(data);
}

// ===== Render Forecast =====
function renderForecast(days) {
  const unitSymbol = currentUnits === "metric" ? "°" : "°";
  const container = document.getElementById("forecast-cards");

  const html = days.map((day) => `
    <div class="forecast-card">
      <p class="forecast-day">${day.dayName}</p>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" loading="lazy">
      <p class="forecast-temps">
        <span class="high">${day.high}${unitSymbol}</span>
        <span class="low"> ${day.low}${unitSymbol}</span>
      </p>
      <p class="forecast-desc">${capitalizeFirst(day.description)}</p>
    </div>
  `).join("");

  container.innerHTML = html;
}

// ===== Aggregate Forecast =====
function aggregateDailyForecasts(forecastList) {
  const dailyMap = {};

  forecastList.forEach((entry) => {
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
    .filter(([date]) => date !== today)
    .slice(0, 4)
    .map(([date, data]) => ({
      date,
      dayName: new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
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

  if (tempC < 0) {
    advice = "Full winter gear — heavy coat, gloves, hat, and insulated boots.";
  } else if (tempC < 10 && windSpeed > 7) {
    advice = "Wind chill is brutal. Layer up and cover exposed skin.";
  } else if (tempC < 10) {
    advice = "Chilly out — a warm jacket and layers are your best bet.";
  } else if (isSnow) {
    advice = "Snow on the ground — waterproof boots and a warm coat.";
  } else if (isRain) {
    advice = "Rain expected — grab an umbrella and waterproof shoes.";
  } else if (tempC >= 20 && tempC <= 28) {
    advice = "T-shirt weather! Sunglasses recommended.";
  } else if (tempC > 35) {
    advice = "Stay hydrated. Light, breathable clothing. Seek shade.";
  } else if (tempC > 28) {
    advice = "It's warm — shorts and light clothes. Don't forget sunscreen!";
  } else {
    advice = "Mild conditions — a light layer should do the trick.";
  }

  document.getElementById("outfit-advice").textContent = advice;
}

// ===== Ambient Background =====
function updateAmbientBackground(data) {
  const weatherId = data.weather[0].id;
  const iconCode = data.weather[0].icon;
  const isNight = iconCode.endsWith("n");

  // Determine time of day at the city
  const cityNow = data.dt + data.timezone;
  const sunrise = data.sys.sunrise + data.timezone;
  const sunset = data.sys.sunset + data.timezone;
  const goldenMargin = 3600; // 1 hour

  let timeClass = "ambient-day";
  if (isNight) {
    timeClass = "ambient-night";
  } else if (Math.abs(cityNow - sunrise) < goldenMargin || Math.abs(cityNow - sunset) < goldenMargin) {
    timeClass = "ambient-golden";
  }

  // Determine weather condition
  let weatherClass = "ambient-clear";
  if (weatherId >= 200 && weatherId < 300) weatherClass = "ambient-thunderstorm";
  else if (weatherId >= 300 && weatherId < 400) weatherClass = "ambient-drizzle";
  else if (weatherId >= 500 && weatherId < 600) weatherClass = "ambient-rain";
  else if (weatherId >= 600 && weatherId < 700) weatherClass = "ambient-snow";
  else if (weatherId >= 700 && weatherId < 800) weatherClass = "ambient-atmosphere";
  else if (weatherId >= 801) weatherClass = "ambient-clouds";

  // Apply classes
  ambientBg.className = `ambient-bg ${weatherClass} ${timeClass}`;

  // Particles
  clearParticles();
  if (weatherClass === "ambient-rain" || weatherClass === "ambient-drizzle") {
    createRainParticles();
  } else if (weatherClass === "ambient-snow") {
    createSnowParticles();
  } else if (weatherClass === "ambient-thunderstorm") {
    createRainParticles();
    startThunderFlashes();
  }
}

function clearParticles() {
  particlesContainer.innerHTML = "";
  if (window._thunderInterval) {
    clearInterval(window._thunderInterval);
    window._thunderInterval = null;
  }
}

function createRainParticles() {
  const count = 80;
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.className = "rain-drop";
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.height = `${15 + Math.random() * 20}px`;
    drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    drop.style.opacity = 0.3 + Math.random() * 0.4;
    particlesContainer.appendChild(drop);
  }
}

function createSnowParticles() {
  const count = 50;
  for (let i = 0; i < count; i++) {
    const flake = document.createElement("div");
    flake.className = "snow-flake";
    flake.style.left = `${Math.random() * 100}%`;
    const size = 3 + Math.random() * 6;
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    flake.style.animationDuration = `${3 + Math.random() * 5}s`;
    flake.style.animationDelay = `${Math.random() * 5}s`;
    flake.style.opacity = 0.4 + Math.random() * 0.5;
    particlesContainer.appendChild(flake);
  }
}

function startThunderFlashes() {
  window._thunderInterval = setInterval(() => {
    if (Math.random() > 0.6) {
      const flash = document.createElement("div");
      flash.className = "thunder-flash";
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 200);
    }
  }, 3000);
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
  try {
    return JSON.parse(localStorage.getItem("weather-recent") || "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(city) {
  let recent = getRecentSearches();
  recent = recent.filter((c) => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  recent = recent.slice(0, 6);
  localStorage.setItem("weather-recent", JSON.stringify(recent));
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById("recent-searches");
  const recent = getRecentSearches();

  if (recent.length === 0) {
    container.innerHTML = "";
    return;
  }

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
  if (show) {
    loading.classList.remove("hidden");
    weatherContent.classList.add("hidden");
  } else {
    loading.classList.add("hidden");
  }
}

// ===== Helpers =====
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

function degToCompass(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE",
                "S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  const duration = 800;
  const start = performance.now();
  const from = 0;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
