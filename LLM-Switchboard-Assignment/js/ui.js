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

  function renderResponse({ text, structured }) {
    const area = $("response-area");
    $("copy-btn").disabled = !text;

    if (!text) {
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
      area.innerHTML = `<div>${escapeHtml(text)}</div>`;
    }
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
    setSchemaValid
  };
})();
