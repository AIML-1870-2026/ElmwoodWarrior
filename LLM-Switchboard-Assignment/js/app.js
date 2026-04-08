// ============================================================
// app.js — Wires up state, events, and the request lifecycle
// ============================================================

const State = {
  provider: "openai",
  mode: "unstructured",
  personality: "default",
  temperature: 0.7,
  maxTokens: 1024,
  systemPrompt: "",
  lastResponseText: "",
  lastResponseMeta: null,
  canSend() {
    return KeyVault.has(this.provider) && UI.$("prompt-input").value.trim().length > 0;
  }
};

function refreshSendEnabled() {
  UI.$("send-btn").disabled = !State.canSend();
  UI.$("compare-btn").disabled = !State.canSend();
  UI.$("roast-btn").disabled = !UI.$("prompt-input").value.trim().length || !KeyVault.has(State.provider);
}

function updatePromptMetrics() {
  const txt = UI.$("prompt-input").value;
  const chars = txt.length;
  const tokens = UI.estimateTokens(txt);
  const model = UI.$("model-select").value;
  const cost = UI.estimateCost(model, tokens, 512); // assume 512 out for estimate
  UI.$("char-count").textContent = `${chars} chars • ~${tokens} tok • est ${UI.formatCost(cost)}`;
}

function setProvider(p) {
  State.provider = p;
  document.querySelectorAll("#provider-pills .pill").forEach((el) => {
    el.classList.toggle("active", el.dataset.provider === p);
  });
  UI.populateModels(p);
  updatePromptMetrics();

  if (p === "anthropic") {
    UI.setStatus(
      "⚠️ Anthropic's API is CORS-restricted in browsers — requests will fail. OpenAI works directly.",
      "warn"
    );
  } else {
    UI.setStatus("");
  }
  refreshSendEnabled();
  UI.sfx.click();
}

function setMode(m) {
  State.mode = m;
  document.querySelectorAll("#mode-pills .pill").forEach((el) => {
    el.classList.toggle("active", el.dataset.mode === m);
  });
  UI.$("schema-wrap").classList.toggle("hidden", m !== "structured");
  UI.sfx.click();
}

function setPersonality(id) {
  State.personality = id;
  const p = PERSONALITIES.find((x) => x.id === id);
  State.systemPrompt = p ? p.system : "";
  UI.$("system-prompt").value = State.systemPrompt;
  Achievements.onPersonality(id);
  UI.sfx.click();
}

function validateSchema() {
  const txt = UI.$("schema-input").value;
  try {
    JSON.parse(txt);
    UI.setSchemaValid(true);
    return true;
  } catch {
    UI.setSchemaValid(false);
    return false;
  }
}

function buildSendOptions(overrides = {}) {
  return {
    apiKey: KeyVault.get(State.provider),
    model: overrides.model || UI.$("model-select").value,
    prompt: overrides.prompt || UI.$("prompt-input").value.trim(),
    structured: State.mode === "structured",
    schema: State.mode === "structured" ? JSON.parse(UI.$("schema-input").value) : null,
    temperature: State.temperature,
    maxTokens: State.maxTokens,
    systemPrompt: overrides.systemPrompt ?? UI.$("system-prompt").value.trim()
  };
}

async function handleSend() {
  const prompt = UI.$("prompt-input").value.trim();
  if (!prompt) return;

  if (!KeyVault.has(State.provider)) {
    UI.setStatus(`Please enter your ${State.provider === "openai" ? "OpenAI" : "Anthropic"} API key to send a request.`, "error");
    UI.sfx.error();
    return;
  }

  if (State.mode === "structured" && !validateSchema()) {
    UI.setStatus("Your schema is not valid JSON. Please fix it before sending.", "error");
    UI.sfx.error();
    return;
  }

  History.add(prompt);
  History.reset();

  UI.setLoading(true);
  UI.setMascot("thinking");
  UI.setStatus("Sending request…");
  UI.renderEmpty();
  UI.clearMetrics();
  UI.sfx.send();

  const startedAt = performance.now();
  try {
    const opts = buildSendOptions();
    const { text, usage } = await Providers.send(State.provider, opts);
    const elapsed = Math.round(performance.now() - startedAt);
    const result = UI.renderResponse({ text, structured: opts.structured });

    State.lastResponseText = text;

    const inTok  = usage?.prompt_tokens ?? usage?.input_tokens  ?? UI.estimateTokens(prompt);
    const outTok = usage?.completion_tokens ?? usage?.output_tokens ?? UI.estimateTokens(text);
    const cost = UI.estimateCost(opts.model, inTok, outTok);
    const valid = opts.structured ? (result && result.validJson) : undefined;

    UI.renderMetrics({ model: opts.model, ms: elapsed, inTok, outTok, cost, valid });
    State.lastResponseMeta = { model: opts.model, ms: elapsed, inTok, outTok, cost, valid, prompt };

    UI.setStatus(`✅ Done in ${elapsed} ms`, "success");
    UI.setMascot("happy");
    UI.sfx.success();
    Achievements.onPromptSent();
    if (valid === true) { Achievements.onStructuredValid(); UI.confetti(); }
    setTimeout(() => UI.setMascot("idle"), 2200);
  } catch (err) {
    let msg;
    if (err.isCORS) msg = err.message;
    else if (err.status === 401) msg = "Your API key was rejected. Please check it and try again.";
    else if (err.status === 429) msg = "You've hit the rate limit. Please wait a moment and try again.";
    else if (err.name === "AbortError" || /timeout/i.test(err.message)) msg = "The request timed out. Check your connection and retry.";
    else msg = err.message || "Something went wrong.";
    UI.setStatus("❌ " + msg, "error");
    UI.setMascot("error");
    UI.sfx.error();
    setTimeout(() => UI.setMascot("idle"), 2400);
  } finally {
    UI.setLoading(false);
  }
}

// ---------- Compare Mode ----------
async function handleCompare() {
  const prompt = UI.$("prompt-input").value.trim();
  if (!prompt || !KeyVault.has(State.provider)) return;

  if (State.mode === "structured" && !validateSchema()) {
    UI.setStatus("Schema invalid — fix it first.", "error");
    return;
  }

  const models = MODELS[State.provider];
  const a = UI.$("model-select").value;
  const b = models.find((m) => m !== a) || a;

  UI.$("compare-modal").classList.remove("hidden");
  const slotA = UI.$("compare-a"); const slotB = UI.$("compare-b");
  UI.$("compare-a-title").textContent = a;
  UI.$("compare-b-title").textContent = b;
  slotA.innerHTML = `<div class="loading-dots">Calling ${UI.escapeHtml(a)}…</div>`;
  slotB.innerHTML = `<div class="loading-dots">Calling ${UI.escapeHtml(b)}…</div>`;
  UI.sfx.send();

  const start = performance.now();
  const calls = [a, b].map((m) => Providers.send(State.provider, buildSendOptions({ model: m })).catch((e) => ({ error: e })));
  const [resA, resB] = await Promise.all(calls);
  const ms = Math.round(performance.now() - start);

  function fill(slot, model, res) {
    if (res.error) {
      slot.innerHTML = `<div class="cmp-err">❌ ${UI.escapeHtml(res.error.message || "Failed")}</div>`;
      return;
    }
    const inTok = res.usage?.prompt_tokens ?? res.usage?.input_tokens ?? UI.estimateTokens(prompt);
    const outTok = res.usage?.completion_tokens ?? res.usage?.output_tokens ?? UI.estimateTokens(res.text);
    const cost = UI.estimateCost(model, inTok, outTok);
    slot.innerHTML = `
      <div class="cmp-meta">
        <span class="chip">⬆️ ${inTok}</span>
        <span class="chip">⬇️ ${outTok}</span>
        <span class="chip">💰 ${UI.formatCost(cost)}</span>
      </div>
      <div class="cmp-text">${UI.escapeHtml(res.text)}</div>
    `;
  }
  fill(slotA, a, resA);
  fill(slotB, b, resB);
  UI.$("compare-elapsed").textContent = `Both completed in ${ms} ms`;
  Achievements.onCompare();
}

// ---------- Roast My Prompt ----------
async function handleRoast() {
  const prompt = UI.$("prompt-input").value.trim();
  if (!prompt || !KeyVault.has(State.provider)) return;

  UI.setLoading(true);
  UI.setStatus("🌶️ Roasting your prompt…");
  UI.setMascot("thinking");
  UI.renderEmpty();
  UI.clearMetrics();

  const meta = `You are a brutally honest but constructive prompt-engineering critic. The user wrote this prompt:\n\n"""${prompt}"""\n\nDo three things:\n1. ROAST it: in 2-3 sentences, point out exactly what's vague, underspecified, or weak about it. Be witty and a little mean, but accurate.\n2. EXPLAIN: in 2-3 bullets, list the specific issues (missing context, no format, ambiguous terms, etc).\n3. REWRITE: provide a single greatly-improved version of the prompt.\n\nFormat as plain text with clear "ROAST:", "ISSUES:", and "IMPROVED PROMPT:" headings.`;

  try {
    const { text } = await Providers.send(State.provider, {
      apiKey: KeyVault.get(State.provider),
      model: UI.$("model-select").value,
      prompt: meta,
      structured: false,
      schema: null,
      temperature: 0.9,
      maxTokens: 800,
      systemPrompt: ""
    });
    UI.renderResponse({ text, structured: false });
    UI.setStatus("🌶️ Roast complete", "success");
    UI.setMascot("happy");
    UI.sfx.success();
    Achievements.onRoast();
    setTimeout(() => UI.setMascot("idle"), 2200);
  } catch (e) {
    UI.setStatus("❌ " + (e.message || "roast failed"), "error");
    UI.setMascot("error");
    UI.sfx.error();
    setTimeout(() => UI.setMascot("idle"), 2200);
  } finally {
    UI.setLoading(false);
  }
}

// ---------- Export ----------
function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
function exportMarkdown() {
  if (!State.lastResponseText) return;
  const m = State.lastResponseMeta || {};
  const md =
    `# LLM Switchboard Export\n\n` +
    `- **Model:** ${m.model || ""}\n- **Latency:** ${m.ms || "?"} ms\n- **Tokens:** ${m.inTok || "?"} in / ${m.outTok || "?"} out\n- **Cost:** ${UI.formatCost(m.cost || 0)}\n\n` +
    `## Prompt\n\n${m.prompt || ""}\n\n## Response\n\n${State.lastResponseText}\n`;
  downloadFile(`switchboard-${Date.now()}.md`, md, "text/markdown");
  Achievements.onExport();
}
function exportJson() {
  if (!State.lastResponseText) return;
  const m = State.lastResponseMeta || {};
  const data = {
    timestamp: new Date().toISOString(),
    provider: State.provider,
    model: m.model,
    prompt: m.prompt,
    response: State.lastResponseText,
    metrics: { ms: m.ms, in_tokens: m.inTok, out_tokens: m.outTok, cost_usd: m.cost }
  };
  downloadFile(`switchboard-${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json");
  Achievements.onExport();
}

// ---------- File handlers ----------
async function handleKeyFile(provider, file) {
  try {
    const parsed = await KeyVault.loadFromFile(file);
    let applied = false;
    if (parsed.openai) { KeyVault.set("openai", parsed.openai); UI.$("openai-key").value = parsed.openai; UI.setKeyStatus("openai", true, parsed.openai); applied = true; }
    if (parsed.anthropic) { KeyVault.set("anthropic", parsed.anthropic); UI.$("anthropic-key").value = parsed.anthropic; UI.setKeyStatus("anthropic", true, parsed.anthropic); applied = true; }
    if (!applied) UI.setStatus("No OPENAI_API_KEY or ANTHROPIC_API_KEY found in that file.", "error");
    else UI.setStatus("✅ Keys loaded from file into memory.", "success");
    refreshSendEnabled();
  } catch (e) {
    UI.setStatus("Could not read file: " + e.message, "error");
  }
}

// ---------- Achievements modal ----------
function renderAchievements() {
  const grid = UI.$("achievements-grid");
  grid.innerHTML = "";
  Achievements.progress().forEach((a) => {
    const card = document.createElement("div");
    card.className = "ach-card" + (a.unlocked ? " unlocked" : " locked");
    card.innerHTML = `<div class="ach-icon">${a.unlocked ? a.icon : "🔒"}</div><div class="ach-label">${a.label}</div><div class="ach-desc">${a.desc}</div>`;
    grid.appendChild(card);
  });
}

// ---------- Init ----------
function init() {
  // Theme + sound
  UI.loadTheme();
  UI.initSound();
  UI.$("sound-toggle").textContent = UI.isSoundOn() ? "🔊" : "🔇";

  // Populate widgets
  UI.populateModels("openai");
  UI.populateExamples();
  UI.populateSchemas();
  UI.$("schema-input").value = JSON.stringify(DEFAULT_SCHEMA, null, 2);

  // Personality dropdown
  const persSel = UI.$("personality-select");
  PERSONALITIES.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.icon} ${p.label}`;
    persSel.appendChild(opt);
  });
  persSel.addEventListener("change", (e) => setPersonality(e.target.value));

  // Provider/mode pills
  document.querySelectorAll("#provider-pills .pill").forEach((el) => {
    el.addEventListener("click", () => setProvider(el.dataset.provider));
  });
  document.querySelectorAll("#mode-pills .pill").forEach((el) => {
    el.addEventListener("click", () => setMode(el.dataset.mode));
  });

  // Examples
  UI.$("example-select").addEventListener("change", (e) => {
    const i = e.target.value;
    if (i === "") return;
    UI.$("prompt-input").value = EXAMPLE_PROMPTS[i].prompt;
    updatePromptMetrics();
    refreshSendEnabled();
  });

  // Schema templates
  UI.$("schema-select").addEventListener("change", (e) => {
    const i = e.target.value;
    if (i === "") return;
    UI.$("schema-input").value = JSON.stringify(SCHEMA_TEMPLATES[i].schema, null, 2);
    validateSchema();
  });
  UI.$("schema-input").addEventListener("input", validateSchema);

  // Prompt input
  const promptEl = UI.$("prompt-input");
  promptEl.addEventListener("input", () => {
    History.reset();
    updatePromptMetrics();
    refreshSendEnabled();
  });
  // History via arrow keys when at boundary
  promptEl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && (promptEl.selectionStart === 0)) {
      const h = History.prev();
      if (h !== null) { e.preventDefault(); promptEl.value = h; updatePromptMetrics(); refreshSendEnabled(); }
    } else if (e.key === "ArrowDown" && promptEl.selectionStart === promptEl.value.length) {
      const h = History.next();
      if (h !== null) { e.preventDefault(); promptEl.value = h; updatePromptMetrics(); refreshSendEnabled(); }
    }
  });

  // Advanced sliders
  const tempSlider = UI.$("temp-slider");
  const tempVal = UI.$("temp-value");
  tempSlider.addEventListener("input", () => {
    State.temperature = parseFloat(tempSlider.value);
    tempVal.textContent = State.temperature.toFixed(2);
  });
  const maxSlider = UI.$("max-slider");
  const maxVal = UI.$("max-value");
  maxSlider.addEventListener("input", () => {
    State.maxTokens = parseInt(maxSlider.value, 10);
    maxVal.textContent = State.maxTokens;
  });

  // System prompt textarea
  UI.$("system-prompt").addEventListener("input", (e) => { State.systemPrompt = e.target.value; });

  // Advanced toggle
  UI.$("advanced-toggle").addEventListener("click", () => {
    UI.$("advanced-body").classList.toggle("hidden");
    UI.$("advanced-toggle").classList.toggle("open");
  });

  // Buttons
  UI.$("send-btn").addEventListener("click", handleSend);
  UI.$("compare-btn").addEventListener("click", handleCompare);
  UI.$("roast-btn").addEventListener("click", handleRoast);

  UI.$("model-select").addEventListener("change", updatePromptMetrics);

  // Copy
  UI.$("copy-btn").addEventListener("click", async () => {
    const text = UI.$("response-area").innerText;
    try {
      await navigator.clipboard.writeText(text);
      UI.setStatus("📋 Copied to clipboard", "success");
      UI.sfx.pop();
    } catch {
      UI.setStatus("Could not copy to clipboard.", "error");
    }
  });

  // Export
  UI.$("export-md").addEventListener("click", exportMarkdown);
  UI.$("export-json").addEventListener("click", exportJson);

  // Keys modal
  UI.$("keys-toggle").addEventListener("click", UI.showModal);
  UI.$("keys-close").addEventListener("click", UI.hideModal);
  UI.$("keys-modal").addEventListener("click", (e) => { if (e.target.id === "keys-modal") UI.hideModal(); });

  ["openai", "anthropic"].forEach((p) => {
    const input = UI.$(`${p}-key`);
    input.addEventListener("input", () => {
      KeyVault.set(p, input.value);
      UI.setKeyStatus(p, KeyVault.has(p), input.value);
      refreshSendEnabled();
    });
    UI.$(`${p}-file`).addEventListener("change", (e) => {
      if (e.target.files[0]) handleKeyFile(p, e.target.files[0]);
    });
  });
  UI.$("keys-save").addEventListener("click", () => {
    UI.hideModal();
    UI.setStatus("✅ Keys saved in memory (will be cleared on reload).", "success");
  });

  // Theme switcher
  UI.$("theme-toggle").addEventListener("click", () => {
    const t = UI.cycleTheme();
    Achievements.onTheme(t);
    UI.sfx.pop();
  });

  // Sound toggle
  UI.$("sound-toggle").addEventListener("click", () => {
    UI.setSoundOn(!UI.isSoundOn());
    UI.$("sound-toggle").textContent = UI.isSoundOn() ? "🔊" : "🔇";
    if (UI.isSoundOn()) UI.sfx.pop();
  });

  // Achievements modal
  UI.$("ach-toggle").addEventListener("click", () => {
    renderAchievements();
    UI.$("ach-modal").classList.remove("hidden");
  });
  UI.$("ach-close").addEventListener("click", () => UI.$("ach-modal").classList.add("hidden"));
  UI.$("ach-modal").addEventListener("click", (e) => { if (e.target.id === "ach-modal") UI.$("ach-modal").classList.add("hidden"); });

  // Shortcuts modal
  UI.$("shortcuts-toggle").addEventListener("click", () => UI.$("shortcuts-modal").classList.remove("hidden"));
  UI.$("shortcuts-close").addEventListener("click", () => UI.$("shortcuts-modal").classList.add("hidden"));
  UI.$("shortcuts-modal").addEventListener("click", (e) => { if (e.target.id === "shortcuts-modal") UI.$("shortcuts-modal").classList.add("hidden"); });

  // Compare modal
  UI.$("compare-close").addEventListener("click", () => UI.$("compare-modal").classList.add("hidden"));
  UI.$("compare-modal").addEventListener("click", (e) => { if (e.target.id === "compare-modal") UI.$("compare-modal").classList.add("hidden"); });

  // Global keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === "Enter") { e.preventDefault(); handleSend(); }
    else if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); UI.showModal(); }
    else if (mod && e.key === "/") { e.preventDefault(); UI.$("shortcuts-modal").classList.toggle("hidden"); }
    else if (mod && e.key.toLowerCase() === "e") { e.preventDefault(); exportMarkdown(); }
    else if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); handleCompare(); }
    else if (e.key === "Escape") {
      ["keys-modal", "ach-modal", "shortcuts-modal", "compare-modal"].forEach((id) => UI.$(id).classList.add("hidden"));
    }
  });

  // Initial state
  setProvider("openai");
  setMode("unstructured");
  setPersonality("default");
  updatePromptMetrics();
  refreshSendEnabled();
  UI.setMascot("idle");
}

document.addEventListener("DOMContentLoaded", init);
