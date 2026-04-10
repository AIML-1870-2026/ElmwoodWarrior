// ============================================================
// app.js — ReviewCraft AI main application logic
// Wires up state, events, API calls, history, themes
// ============================================================

const $ = (id) => document.getElementById(id);

// ---------- State ----------
const State = {
  lastRawMarkdown: "",
  history: [], // { id, productName, markdown, timestamp, inputs }
  nextId: 1,
  model: "gpt-4o-mini"
};

// ---------- Tone / Length label maps ----------
const TONE_LABELS = { 1: "Casual", 2: "Semi-Casual", 3: "Neutral", 4: "Semi-Formal", 5: "Formal" };
const LENGTH_LABELS = { 1: "Brief", 2: "Short", 3: "Medium", 4: "Long", 5: "Detailed" };

// ---------- Review Templates ----------
const TEMPLATES = {
  amazon: {
    label: "Amazon Review",
    personality: "Casual / Conversational",
    tone: 2,
    length: 3,
    price: 6,
    features: 7,
    usability: 7
  },
  tech: {
    label: "Tech Deep-Dive",
    personality: "Technical / Detailed",
    tone: 4,
    length: 5,
    price: 5,
    features: 5,
    usability: 5
  },
  roast: {
    label: "Snarky Roast",
    personality: "Sarcastic / Witty",
    tone: 1,
    length: 3,
    price: 3,
    features: 3,
    usability: 3
  },
  hype: {
    label: "Hype Beast",
    personality: "Enthusiastic",
    tone: 1,
    length: 4,
    price: 9,
    features: 10,
    usability: 9
  },
  minimal: {
    label: "Minimalist",
    personality: "Minimalist / Brief",
    tone: 3,
    length: 1,
    price: 5,
    features: 5,
    usability: 5
  }
};

// ---------- Helpers ----------
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function relativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";
  return new Date(ts).toLocaleDateString();
}

function wordCount(str) {
  return str.trim() ? str.trim().split(/\s+/).length : 0;
}

// ---------- Markdown rendering via marked.js ----------
// Supports headings, bold, italic, strikethrough, lists, blockquotes,
// code blocks, inline code, links, images, tables, horizontal rules, etc.
function renderMarkdown(md) {
  return marked.parse(md);
}

// ---------- Theme ----------
function loadTheme() {
  const saved = localStorage.getItem("rc_theme");
  const preferred = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  const theme = saved || preferred;
  applyTheme(theme);
}

function applyTheme(name) {
  document.documentElement.dataset.theme = name;
  localStorage.setItem("rc_theme", name);
  $("theme-icon").textContent = name === "light" ? "\u2600\uFE0F" : "\uD83C\uDF19";
}

function toggleTheme() {
  const cur = document.documentElement.dataset.theme || "dark";
  applyTheme(cur === "dark" ? "light" : "dark");
}

// ---------- UI Updates ----------
function refreshGenerateEnabled() {
  $("generate-btn").disabled = !KeyVault.has("openai") || !$("product-name").value.trim();
}

function setStatus(msg, type = "") {
  const bar = $("status-bar");
  bar.className = "status-bar" + (type ? " " + type : "");
  bar.textContent = msg || "";
}

function setLoading(isLoading) {
  const btn = $("generate-btn");
  const label = btn.querySelector(".send-label");
  const spinner = btn.querySelector(".spinner");
  if (isLoading) {
    btn.disabled = true;
    label.textContent = "Generating...";
    spinner.classList.remove("hidden");
  } else {
    label.textContent = "Generate Review";
    spinner.classList.add("hidden");
    refreshGenerateEnabled();
  }
}

function updateWordCharCount() {
  const text = State.lastRawMarkdown;
  const words = wordCount(text);
  const chars = text.length;
  $("word-char-count").textContent = `Words: ${words} | Characters: ${chars}`;
}

function updateSliderDisplays() {
  $("price-value").textContent = $("price-slider").value;
  $("features-value").textContent = $("features-slider").value;
  $("usability-value").textContent = $("usability-slider").value;
  $("tone-value").textContent = TONE_LABELS[$("tone-slider").value];
  $("length-value").textContent = LENGTH_LABELS[$("length-slider").value];
}

function renderSentimentBadges(price, features, usability) {
  const container = $("sentiment-badges");
  function badgeClass(v) {
    if (v <= 3) return "badge-low";
    if (v <= 6) return "badge-mid";
    return "badge-high";
  }
  container.innerHTML = `
    <span class="badge ${badgeClass(price)}">Price: ${price}/10</span>
    <span class="badge ${badgeClass(features)}">Features: ${features}/10</span>
    <span class="badge ${badgeClass(usability)}">Usability: ${usability}/10</span>
  `;
  container.classList.remove("hidden");
}

// ---------- Templates ----------
function applyTemplate(key) {
  const t = TEMPLATES[key];
  if (!t) return;

  $("personality-select").value = t.personality;
  $("tone-slider").value = t.tone;
  $("length-slider").value = t.length;
  $("price-slider").value = t.price;
  $("features-slider").value = t.features;
  $("usability-slider").value = t.usability;
  updateSliderDisplays();

  // Highlight the active chip
  document.querySelectorAll(".template-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.template === key);
  });
}

// ---------- Tab Switching ----------
function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  $("output-rendered").classList.toggle("hidden", tab !== "rendered");
  $("output-raw").classList.toggle("hidden", tab !== "raw");
}

// ---------- Display Review ----------
function displayReview(markdown, price, features, usability) {
  State.lastRawMarkdown = markdown;

  // Rendered view
  $("output-rendered").innerHTML = renderMarkdown(markdown);

  // Raw view
  $("raw-markdown").textContent = markdown;

  // Badges
  renderSentimentBadges(price, features, usability);

  // Enable action buttons
  $("copy-btn").disabled = false;
  $("export-btn").disabled = false;

  // Word/char count
  updateWordCharCount();
}

// ---------- Build Prompt ----------
function buildPrompt() {
  const productName = $("product-name").value.trim();
  const complaints = $("complaints-likes").value.trim();
  const category = $("category-select").value;
  const personality = $("personality-select").value;
  const price = $("price-slider").value;
  const features = $("features-slider").value;
  const usability = $("usability-slider").value;
  const tone = TONE_LABELS[$("tone-slider").value];
  const length = LENGTH_LABELS[$("length-slider").value];

  const systemPrompt = `You are a ${personality} product reviewer. Write in a ${tone.toLowerCase()} style. Your review should be ${length.toLowerCase()} in length. Output your review in markdown format. Do not use any rigid template. Write naturally and vary your structure.`;

  const userPrompt = `Write a review for the following product.
Product: ${productName}
Category: ${category}
User notes (likes and complaints): ${complaints || "No specific notes provided."}
Sentiment breakdown:
- Price satisfaction: ${price}/10
- Features satisfaction: ${features}/10
- Usability satisfaction: ${usability}/10`;

  return { systemPrompt, userPrompt, productName, price, features, usability };
}

// ---------- Generate Review ----------
async function handleGenerate() {
  if (!KeyVault.has("openai")) {
    setStatus("Please enter your OpenAI API key first.", "error");
    return;
  }

  const productName = $("product-name").value.trim();
  if (!productName) {
    setStatus("Please enter a product name.", "error");
    return;
  }

  const { systemPrompt, userPrompt, price, features, usability } = buildPrompt();

  setLoading(true);
  setStatus("Generating your review...");
  $("output-rendered").innerHTML = `<div class="empty-state"><div class="empty-icon">&#9203;</div><p>Generating review...</p></div>`;
  $("raw-markdown").textContent = "";
  $("sentiment-badges").classList.add("hidden");

  const startedAt = performance.now();

  try {
    const maxTokens = { Brief: 300, Short: 500, Medium: 800, Long: 1200, Detailed: 2000 };
    const lengthLabel = LENGTH_LABELS[$("length-slider").value];

    const { text } = await Providers.callOpenAI({
      apiKey: KeyVault.get("openai"),
      model: State.model,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: maxTokens[lengthLabel] || 800
    });

    const elapsed = Math.round(performance.now() - startedAt);
    displayReview(text, parseInt(price), parseInt(features), parseInt(usability));
    setStatus(`Done in ${elapsed} ms`, "success");

    // Add to history
    addToHistory(productName, text, {
      category: $("category-select").value,
      personality: $("personality-select").value,
      price, features, usability
    });

  } catch (err) {
    let msg;
    if (err.status === 401) msg = "Your API key was rejected. Please check it and try again.";
    else if (err.status === 429) msg = "Rate limit hit. Please wait a moment and try again.";
    else if (err.name === "AbortError" || /timeout/i.test(err.message)) msg = "Request timed out. Check your connection.";
    else msg = err.message || "Something went wrong.";
    setStatus(msg, "error");
    $("output-rendered").innerHTML = `<div class="empty-state"><div class="empty-icon">&#10060;</div><p>Generation failed</p></div>`;
  } finally {
    setLoading(false);
  }
}

// ---------- History ----------
function addToHistory(productName, markdown, inputs) {
  const entry = {
    id: State.nextId++,
    productName,
    markdown,
    timestamp: Date.now(),
    inputs
  };
  State.history.unshift(entry);
  renderHistory();
}

function renderHistory() {
  const list = $("history-list");
  if (!State.history.length) {
    list.innerHTML = '<p class="dim">No reviews yet.</p>';
    return;
  }
  list.innerHTML = State.history.map((entry) => `
    <div class="history-entry" data-id="${entry.id}">
      <div class="history-entry-name">${escapeHtml(entry.productName)}</div>
      <div class="history-entry-time">${relativeTime(entry.timestamp)}</div>
    </div>
  `).join("");

  list.querySelectorAll(".history-entry").forEach((el) => {
    el.addEventListener("click", () => {
      const entry = State.history.find((h) => h.id === parseInt(el.dataset.id));
      if (entry) {
        const p = parseInt(entry.inputs.price) || 5;
        const f = parseInt(entry.inputs.features) || 5;
        const u = parseInt(entry.inputs.usability) || 5;
        displayReview(entry.markdown, p, f, u);
        switchTab("rendered");
      }
    });
  });
}

function clearHistory() {
  State.history = [];
  renderHistory();
}

// ---------- Copy & Export ----------
async function copyToClipboard() {
  if (!State.lastRawMarkdown) return;
  try {
    await navigator.clipboard.writeText(State.lastRawMarkdown);
    const btn = $("copy-btn");
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = "Copy"; }, 2000);
  } catch {
    setStatus("Could not copy to clipboard.", "error");
  }
}

function exportMarkdown() {
  if (!State.lastRawMarkdown) return;
  const productName = $("product-name").value.trim() || "review";
  const safeName = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `${safeName}-review.md`;

  const blob = new Blob([State.lastRawMarkdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ---------- API Key Handlers ----------
async function handleKeyFile(file) {
  try {
    const parsed = await KeyVault.loadFromFile(file);
    if (parsed.openai) {
      KeyVault.set("openai", parsed.openai);
      $("openai-key").value = parsed.openai;
      updateKeyStatus();
      setStatus("Key loaded from file into memory.", "success");
    } else {
      setStatus("No OPENAI_API_KEY found in that file.", "error");
    }
    refreshGenerateEnabled();
  } catch (e) {
    setStatus("Could not read file: " + e.message, "error");
  }
}

function updateKeyStatus() {
  const el = $("openai-status");
  if (KeyVault.has("openai")) {
    el.textContent = KeyVault.mask(KeyVault.get("openai"));
    el.style.color = "var(--success)";
  } else {
    el.textContent = "no key";
    el.style.color = "var(--text-dim)";
  }
}

// ---------- Init ----------
function init() {
  // Theme
  loadTheme();

  // Slider displays
  updateSliderDisplays();

  // Event listeners — sliders
  ["price-slider", "features-slider", "usability-slider", "tone-slider", "length-slider"].forEach((id) => {
    $(id).addEventListener("input", updateSliderDisplays);
  });

  // Template chips
  document.querySelectorAll(".template-chip").forEach((chip) => {
    chip.addEventListener("click", () => applyTemplate(chip.dataset.template));
  });

  // Product name input
  $("product-name").addEventListener("input", refreshGenerateEnabled);

  // Generate button
  $("generate-btn").addEventListener("click", handleGenerate);

  // Tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  // Copy & Export
  $("copy-btn").addEventListener("click", copyToClipboard);
  $("export-btn").addEventListener("click", exportMarkdown);

  // Theme toggle
  $("theme-toggle").addEventListener("click", toggleTheme);

  // History toggle
  $("history-toggle").addEventListener("click", () => {
    $("history-panel").classList.toggle("hidden");
  });
  $("clear-history").addEventListener("click", clearHistory);
  $("history-close").addEventListener("click", () => {
    $("history-panel").classList.add("hidden");
  });

  // API Key modal
  $("keys-toggle").addEventListener("click", () => $("keys-modal").classList.remove("hidden"));
  $("keys-close").addEventListener("click", () => $("keys-modal").classList.add("hidden"));
  $("keys-modal").addEventListener("click", (e) => {
    if (e.target.id === "keys-modal") $("keys-modal").classList.add("hidden");
  });

  // API Key input
  $("openai-key").addEventListener("input", () => {
    KeyVault.set("openai", $("openai-key").value);
    updateKeyStatus();
    refreshGenerateEnabled();
  });
  $("openai-file").addEventListener("change", (e) => {
    if (e.target.files[0]) handleKeyFile(e.target.files[0]);
  });
  $("keys-save").addEventListener("click", () => {
    $("keys-modal").classList.add("hidden");
    setStatus("Key saved in memory (will be cleared on reload).", "success");
  });

  // Keyboard shortcut: Escape closes modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $("keys-modal").classList.add("hidden");
      $("history-panel").classList.add("hidden");
    }
  });

  // Initial state
  refreshGenerateEnabled();
  updateWordCharCount();
}

document.addEventListener("DOMContentLoaded", init);
