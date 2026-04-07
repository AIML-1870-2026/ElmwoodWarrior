// ============================================================
// app.js — Wires up state, events, and the request lifecycle
// ============================================================

const State = {
  provider: "openai",
  mode: "unstructured",
  canSend() {
    return KeyVault.has(this.provider) && UI.$("prompt-input").value.trim().length > 0;
  }
};

function refreshSendEnabled() {
  UI.$("send-btn").disabled = !State.canSend();
}

function setProvider(p) {
  State.provider = p;
  document.querySelectorAll("#provider-pills .pill").forEach((el) => {
    el.classList.toggle("active", el.dataset.provider === p);
  });
  UI.populateModels(p);

  if (p === "anthropic") {
    UI.setStatus(
      "⚠️ Anthropic's API is CORS-restricted in browsers — requests will fail. OpenAI works directly.",
      "warn"
    );
  } else {
    UI.setStatus("");
  }
  refreshSendEnabled();
}

function setMode(m) {
  State.mode = m;
  document.querySelectorAll("#mode-pills .pill").forEach((el) => {
    el.classList.toggle("active", el.dataset.mode === m);
  });
  UI.$("schema-wrap").classList.toggle("hidden", m !== "structured");
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

async function handleSend() {
  const prompt = UI.$("prompt-input").value.trim();
  if (!prompt) return;

  if (!KeyVault.has(State.provider)) {
    UI.setStatus(
      `Please enter your ${State.provider === "openai" ? "OpenAI" : "Anthropic"} API key to send a request.`,
      "error"
    );
    return;
  }

  let schema = null;
  const structured = State.mode === "structured";
  if (structured) {
    if (!validateSchema()) {
      UI.setStatus("Your schema is not valid JSON. Please fix it before sending.", "error");
      return;
    }
    schema = JSON.parse(UI.$("schema-input").value);
  }

  UI.setLoading(true);
  UI.setStatus("Sending request…");
  UI.renderEmpty();

  const startedAt = performance.now();
  try {
    const { text, usage } = await Providers.send(State.provider, {
      apiKey: KeyVault.get(State.provider),
      model: UI.$("model-select").value,
      prompt,
      structured,
      schema
    });

    const elapsed = Math.round(performance.now() - startedAt);
    const result = UI.renderResponse({ text, structured });

    const chars = text.length;
    const tokens = usage
      ? ` • ${usage.total_tokens || (usage.input_tokens + usage.output_tokens) || "?"} tokens`
      : "";
    const jsonNote = structured && result && result.validJson === false ? " • ⚠️ invalid JSON" : "";
    UI.setStatus(`✅ Done in ${elapsed} ms • ${chars} chars${tokens}${jsonNote}`, "success");
  } catch (err) {
    let msg;
    if (err.isCORS) {
      msg = err.message;
    } else if (err.status === 401) {
      msg = "Your API key was rejected. Please check it and try again.";
    } else if (err.status === 429) {
      msg = "You've hit the rate limit. Please wait a moment and try again.";
    } else if (err.name === "AbortError" || /timeout/i.test(err.message)) {
      msg = "The request timed out. Check your connection and retry.";
    } else {
      msg = err.message || "Something went wrong.";
    }
    UI.setStatus("❌ " + msg, "error");
  } finally {
    UI.setLoading(false);
  }
}

// ---------- File handlers ----------
async function handleKeyFile(provider, file) {
  try {
    const parsed = await KeyVault.loadFromFile(file);
    let applied = false;
    if (parsed.openai) {
      KeyVault.set("openai", parsed.openai);
      UI.$("openai-key").value = parsed.openai;
      UI.setKeyStatus("openai", true, parsed.openai);
      applied = true;
    }
    if (parsed.anthropic) {
      KeyVault.set("anthropic", parsed.anthropic);
      UI.$("anthropic-key").value = parsed.anthropic;
      UI.setKeyStatus("anthropic", true, parsed.anthropic);
      applied = true;
    }
    if (!applied) {
      UI.setStatus("No OPENAI_API_KEY or ANTHROPIC_API_KEY found in that file.", "error");
    } else {
      UI.setStatus("✅ Keys loaded from file into memory.", "success");
    }
    refreshSendEnabled();
  } catch (e) {
    UI.setStatus("Could not read file: " + e.message, "error");
  }
}

// ---------- Init ----------
function init() {
  // Populate data-driven widgets
  UI.populateModels("openai");
  UI.populateExamples();
  UI.populateSchemas();
  UI.$("schema-input").value = JSON.stringify(DEFAULT_SCHEMA, null, 2);

  // Provider pills
  document.querySelectorAll("#provider-pills .pill").forEach((el) => {
    el.addEventListener("click", () => setProvider(el.dataset.provider));
  });

  // Mode pills
  document.querySelectorAll("#mode-pills .pill").forEach((el) => {
    el.addEventListener("click", () => setMode(el.dataset.mode));
  });

  // Example prompts
  UI.$("example-select").addEventListener("change", (e) => {
    const i = e.target.value;
    if (i === "") return;
    UI.$("prompt-input").value = EXAMPLE_PROMPTS[i].prompt;
    UI.$("char-count").textContent = `${UI.$("prompt-input").value.length} chars`;
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
  UI.$("prompt-input").addEventListener("input", (e) => {
    UI.$("char-count").textContent = `${e.target.value.length} chars`;
    refreshSendEnabled();
  });

  // Send
  UI.$("send-btn").addEventListener("click", handleSend);

  // Copy
  UI.$("copy-btn").addEventListener("click", async () => {
    const text = UI.$("response-area").innerText;
    try {
      await navigator.clipboard.writeText(text);
      UI.setStatus("📋 Copied to clipboard", "success");
    } catch {
      UI.setStatus("Could not copy to clipboard.", "error");
    }
  });

  // Keys modal
  UI.$("keys-toggle").addEventListener("click", UI.showModal);
  UI.$("keys-close").addEventListener("click", UI.hideModal);
  UI.$("keys-modal").addEventListener("click", (e) => {
    if (e.target.id === "keys-modal") UI.hideModal();
  });

  // Key inputs
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

  // Initial state
  setProvider("openai");
  setMode("unstructured");
  refreshSendEnabled();
}

document.addEventListener("DOMContentLoaded", init);
