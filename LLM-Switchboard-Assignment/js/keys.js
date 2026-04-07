// ============================================================
// keys.js — In-memory API key vault + .env/.csv file parsing
// ============================================================

const KeyVault = (() => {
  // In-memory only. Not persisted. Wiped on reload.
  const keys = { openai: "", anthropic: "" };

  function set(provider, value) {
    keys[provider] = (value || "").trim();
  }

  function get(provider) {
    return keys[provider] || "";
  }

  function has(provider) {
    return !!keys[provider];
  }

  function mask(key) {
    if (!key) return "";
    if (key.length <= 4) return "••••";
    return "••••••••" + key.slice(-4);
  }

  /**
   * Parse a .env or .csv file for OPENAI_API_KEY / ANTHROPIC_API_KEY.
   * Accepts KEY=VALUE or KEY,VALUE per line. Quotes are stripped.
   */
  function parseFile(text) {
    const out = {};
    const lines = text.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;

      let k, v;
      if (line.includes("=")) {
        const idx = line.indexOf("=");
        k = line.slice(0, idx).trim();
        v = line.slice(idx + 1).trim();
      } else if (line.includes(",")) {
        const idx = line.indexOf(",");
        k = line.slice(0, idx).trim();
        v = line.slice(idx + 1).trim();
      } else {
        continue;
      }

      // Strip matching quotes
      if ((v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }

      const key = k.toUpperCase();
      if (key === "OPENAI_API_KEY" || key === "OPENAI") out.openai = v;
      if (key === "ANTHROPIC_API_KEY" || key === "ANTHROPIC") out.anthropic = v;
    }
    return out;
  }

  async function loadFromFile(file) {
    const text = await file.text();
    return parseFile(text);
  }

  return { set, get, has, mask, parseFile, loadFromFile };
})();
