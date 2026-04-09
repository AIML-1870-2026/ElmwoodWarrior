// ============================================================
// ui.js — DOM rendering & small UI helpers
// ============================================================

const UI = (() => {
  const $ = (id) => document.getElementById(id);

  function populateSelect(selectEl, items, getValue, getLabel, keepFirst = true) {
    const first = keepFirst ? selectEl.querySelector("option") : null;
    selectEl.innerHTML = "";
    if (first) selectEl.appendChild(first);
    items.forEach((item, i) => {
      const opt = document.createElement("option");
      opt.value = getValue(item, i);
      opt.textContent = getLabel(item, i);
      selectEl.appendChild(opt);
    });
  }

  function populateModels(provider) {
    const sel = $("model-select");
    sel.innerHTML = "";
    MODELS[provider].forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      sel.appendChild(opt);
    });
  }

  function populateExamples() {
    populateSelect(
      $("example-select"),
      EXAMPLE_PROMPTS,
      (_, i) => i,
      (p) => p.label
    );
  }

  function populateSchemas() {
    populateSelect(
      $("schema-select"),
      SCHEMA_TEMPLATES,
      (_, i) => i,
      (s) => s.label
    );
  }

  function setKeyStatus(provider, hasKey, keyValue) {
    const el = $(`${provider}-status`);
    if (hasKey) {
      el.textContent = `✅ ${KeyVault.mask(keyValue)}`;
      el.style.color = "#86efac";
    } else {
      el.textContent = "❌ no key";
      el.style.color = "#94a3b8";
    }
  }

  function setStatus(message, type = "") {
    const bar = $("status-bar");
    bar.className = "status-bar" + (type ? " " + type : "");
    bar.textContent = message || "";
  }

  function setLoading(isLoading) {
    const btn = $("send-btn");
    const label = btn.querySelector(".send-label");
    const spinner = btn.querySelector(".spinner");
    btn.disabled = isLoading || !State.canSend();
    if (isLoading) {
      label.textContent = "Sending…";
      spinner.classList.remove("hidden");
    } else {
      label.textContent = "Send";
      spinner.classList.add("hidden");
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  // Very small JSON syntax highlighter
  function highlightJson(obj) {
    const json = JSON.stringify(obj, null, 2);
    return escapeHtml(json).replace(
      /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-string";
        } else if (/true|false/.test(match)) {
          cls = "json-bool";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }

  let _typingTimer = null;
  function stopTyping() { if (_typingTimer) { clearInterval(_typingTimer); _typingTimer = null; } }

  function typeInto(el, text, speed = 8) {
    stopTyping();
    el.textContent = "";
    let i = 0;
    const chunk = Math.max(1, Math.floor(text.length / 600));
    _typingTimer = setInterval(() => {
      i += chunk;
      el.textContent = text.slice(0, i);
      const area = $("response-area");
      area.scrollTop = area.scrollHeight;
      if (i >= text.length) { stopTyping(); el.textContent = text; }
    }, speed);
  }

  function renderResponse({ text, structured, animate = true }) {
    const area = $("response-area");
    $("copy-btn").disabled = !text;

    if (!text) {
      stopTyping();
      area.innerHTML = `<div class="empty-state"><div class="empty-icon">✨</div><p>Your AI response will appear here</p></div>`;
      return;
    }

    if (structured) {
      try {
        const parsed = JSON.parse(text);
        area.innerHTML = `<pre style="margin:0;white-space:pre-wrap;">${highlightJson(parsed)}</pre>`;
        return { validJson: true };
      } catch (e) {
        area.innerHTML =
          `<div style="color:#fcd34d;margin-bottom:10px;">⚠️ The model did not return valid JSON. Displaying raw response.</div>` +
          `<div>${escapeHtml(text)}</div>`;
        return { validJson: false };
      }
    } else {
      area.innerHTML = `<div class="typed"></div>`;
      const target = area.querySelector(".typed");
      if (animate) typeInto(target, text);
      else target.textContent = text;
    }
  }

  // ---------- Token + cost estimation ----------
  function estimateTokens(str) {
    if (!str) return 0;
    return Math.max(1, Math.ceil(str.length / 4));
  }
  function estimateCost(model, inTokens, outTokens) {
    const p = MODEL_PRICING[model];
    if (!p) return 0;
    return (inTokens * p[0] + outTokens * p[1]) / 1_000_000;
  }
  function formatCost(c) {
    if (c === 0) return "$0";
    if (c < 0.0001) return "<$0.0001";
    if (c < 0.01)   return "$" + c.toFixed(4);
    return "$" + c.toFixed(3);
  }

  // ---------- Metrics chips ----------
  function renderMetrics({ model, ms, inTok, outTok, cost, valid }) {
    const bar = $("metrics-bar");
    if (!bar) return;
    bar.innerHTML = "";
    const chips = [
      { icon: "🧠", label: model },
      { icon: "⏱️", label: ms + " ms" },
      { icon: "⬆️", label: inTok + " in" },
      { icon: "⬇️", label: outTok + " out" },
      { icon: "💰", label: formatCost(cost) }
    ];
    if (valid === true)  chips.push({ icon: "✅", label: "valid JSON", cls: "ok" });
    if (valid === false) chips.push({ icon: "⚠️", label: "invalid JSON", cls: "warn" });
    chips.forEach((c) => {
      const el = document.createElement("span");
      el.className = "chip" + (c.cls ? " chip-" + c.cls : "");
      el.innerHTML = `<span class="chip-i">${c.icon}</span>${escapeHtml(c.label)}`;
      bar.appendChild(el);
    });
    bar.classList.remove("hidden");
  }
  function clearMetrics() {
    const bar = $("metrics-bar");
    if (bar) { bar.innerHTML = ""; bar.classList.add("hidden"); }
  }

  // ---------- Schema Validator Report Card ----------
  function renderSchemaReport(report) {
    const el = $("schema-report");
    if (!el) return;
    el.innerHTML = "";

    if (report.parseError) {
      el.classList.remove("hidden");
      el.innerHTML = `
        <div class="report-head">
          <div class="report-title">📋 Schema Compliance</div>
          <div class="report-score score-bad">JSON parse failed</div>
        </div>
        <div class="report-error">${escapeHtml(report.parseError)}</div>
      `;
      return;
    }

    const scoreCls = report.score >= 100 ? "score-good"
                    : report.score >= 60 ? "score-warn"
                    : "score-bad";

    const summary = `${report.matched} / ${report.total} fields matched`;

    let rowsHtml = "";
    report.rows.forEach((r) => {
      const icon =
        r.status === "matched"          ? "✅" :
        r.status === "missing"          ? "❌" :
        r.status === "missing-optional" ? "➖" :
        r.status === "wrong-type"       ? "⚠️" :
        /* extra */                       "➕";
      const rowCls =
        r.status === "matched"          ? "row-ok" :
        r.status === "missing"          ? "row-bad" :
        r.status === "missing-optional" ? "row-dim" :
        r.status === "wrong-type"       ? "row-warn" :
                                          "row-info";
      const note =
        r.status === "matched"          ? `type ${escapeHtml(String(r.actual))} ✓` :
        r.status === "missing"          ? `expected ${escapeHtml(String(r.expected))}, missing (required)` :
        r.status === "missing-optional" ? `expected ${escapeHtml(String(r.expected))}, missing (optional)` :
        r.status === "wrong-type"       ? `expected ${escapeHtml(String(r.expected))}, got ${escapeHtml(String(r.actual))}` :
                                          `extra field of type ${escapeHtml(String(r.actual))}`;
      rowsHtml += `
        <div class="report-row ${rowCls}">
          <span class="report-row-icon">${icon}</span>
          <span class="report-row-key">${escapeHtml(r.path)}${r.required ? '<span class="req-star" title="required">*</span>' : ""}</span>
          <span class="report-row-note">${note}</span>
        </div>
      `;
    });

    if (!rowsHtml) {
      rowsHtml = `<div class="report-row row-dim"><span class="report-row-note">Schema has no properties to validate.</span></div>`;
    }

    el.innerHTML = `
      <div class="report-head">
        <div class="report-title">📋 Schema Compliance</div>
        <div class="report-score ${scoreCls}">${report.score}% • ${summary}</div>
      </div>
      <div class="report-rows">${rowsHtml}</div>
    `;
    el.classList.remove("hidden");
  }
  function clearSchemaReport() {
    const el = $("schema-report");
    if (el) { el.innerHTML = ""; el.classList.add("hidden"); }
  }

  // ---------- Prompt Library ----------
  function renderLibrary(items, { onLoad, onDelete }) {
    const list = $("library-list");
    if (!list) return;
    list.innerHTML = "";

    if (!items.length) {
      list.innerHTML = `
        <div class="empty-state" style="padding:30px 0;">
          <div class="empty-icon">📭</div>
          <p>No saved prompts yet. Hit ⭐ Save next to a prompt to add one.</p>
        </div>
      `;
      return;
    }

    items.forEach((it) => {
      const card = document.createElement("div");
      card.className = "library-card";
      const snippet = (it.prompt || "").slice(0, 160);
      const modeBadge = it.mode === "structured" ? '<span class="lib-badge lib-badge-struct">JSON</span>' : '<span class="lib-badge">TEXT</span>';
      card.innerHTML = `
        <div class="lib-card-head">
          <div class="lib-name">${escapeHtml(it.name)}</div>
          <div class="lib-meta">
            ${modeBadge}
            <span class="lib-meta-item">${escapeHtml(it.provider || "")}</span>
            <span class="lib-meta-item">${escapeHtml(it.model || "")}</span>
          </div>
        </div>
        <div class="lib-snippet">${escapeHtml(snippet)}${it.prompt && it.prompt.length > 160 ? "…" : ""}</div>
        <div class="lib-actions">
          <button class="btn btn-ghost btn-sm" data-act="load">↩️ Load</button>
          <button class="btn btn-ghost btn-sm" data-act="delete">🗑️ Delete</button>
        </div>
      `;
      card.querySelector('[data-act="load"]').addEventListener("click", () => onLoad(it.id));
      card.querySelector('[data-act="delete"]').addEventListener("click", () => onDelete(it.id));
      list.appendChild(card);
    });
  }
  function setLibraryCount(n) {
    const el = $("library-count");
    if (el) el.textContent = String(n);
  }

  // ---------- Mascot ----------
  function setMascot(mood) {
    const logo = document.querySelector(".logo");
    if (!logo) return;
    logo.dataset.mood = mood; // idle | thinking | happy | error
  }

  // ---------- Confetti ----------
  function confetti() {
    const layer = $("confetti-layer");
    if (!layer) return;
    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#fbbf24", "#86efac"];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 0.3) + "s";
      piece.style.animationDuration = (1.6 + Math.random() * 1.2) + "s";
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }

  // ---------- Sound (Web Audio synthesized) ----------
  let _audioCtx = null;
  let _soundOn = false;
  function setSoundOn(v) { _soundOn = v; localStorage.setItem("lls_sound", v ? "1" : "0"); }
  function isSoundOn() { return _soundOn; }
  function initSound() {
    _soundOn = localStorage.getItem("lls_sound") === "1";
  }
  function _ctx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    return _audioCtx;
  }
  function beep(freq = 440, dur = 0.08, type = "sine", gain = 0.05) {
    if (!_soundOn) return;
    const ctx = _ctx(); if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.stop(ctx.currentTime + dur);
  }
  const sfx = {
    click:   () => beep(620, 0.04, "square", 0.03),
    send:    () => { beep(440, 0.06, "sine", 0.04); setTimeout(() => beep(660, 0.08, "sine", 0.04), 60); },
    success: () => { beep(523, 0.07); setTimeout(() => beep(659, 0.07), 70); setTimeout(() => beep(784, 0.12), 140); },
    error:   () => beep(180, 0.18, "sawtooth", 0.05),
    pop:     () => beep(880, 0.05, "triangle", 0.04)
  };

  // ---------- Theme ----------
  function applyTheme(name) {
    document.documentElement.dataset.theme = name;
    localStorage.setItem("lls_theme", name);
    const label = $("theme-label");
    if (label) label.textContent = name;
  }
  function loadTheme() {
    const t = localStorage.getItem("lls_theme") || "dark";
    applyTheme(t);
    return t;
  }
  function cycleTheme() {
    const cur = document.documentElement.dataset.theme || "dark";
    const i = THEMES.indexOf(cur);
    const next = THEMES[(i + 1) % THEMES.length];
    applyTheme(next);
    return next;
  }

  // ---------- Toast (achievements) ----------
  function toast(icon, title, desc) {
    const layer = $("toast-layer");
    if (!layer) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-body"><div class="toast-title">${escapeHtml(title)}</div><div class="toast-desc">${escapeHtml(desc)}</div></div>`;
    layer.appendChild(t);
    setTimeout(() => t.classList.add("show"), 20);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 4200);
  }

  function renderEmpty() {
    renderResponse({ text: "", structured: false });
  }

  function showModal() { $("keys-modal").classList.remove("hidden"); }
  function hideModal() { $("keys-modal").classList.add("hidden"); }

  function setSchemaValid(valid) {
    const el = $("schema-valid");
    if (valid) {
      el.textContent = "✅ valid";
      el.style.color = "#86efac";
    } else {
      el.textContent = "❌ invalid";
      el.style.color = "#fca5a5";
    }
  }

  return {
    $,
    escapeHtml,
    populateModels,
    populateExamples,
    populateSchemas,
    setKeyStatus,
    setStatus,
    setLoading,
    renderResponse,
    renderEmpty,
    showModal,
    hideModal,
    setSchemaValid,
    // new
    estimateTokens,
    estimateCost,
    formatCost,
    renderMetrics,
    clearMetrics,
    renderSchemaReport,
    clearSchemaReport,
    renderLibrary,
    setLibraryCount,
    setMascot,
    confetti,
    sfx,
    initSound,
    setSoundOn,
    isSoundOn,
    applyTheme,
    loadTheme,
    cycleTheme,
    toast,
    highlightJson,
    stopTyping
  };
})();
