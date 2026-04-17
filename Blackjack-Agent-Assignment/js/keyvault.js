// ============================================================
// keyvault.js — In-memory API key vault + .env file parsing
// Key is NEVER persisted to localStorage or committed to git.
// ============================================================

const KeyVault = (() => {
  const keys = { openai: "", anthropic: "" };

  function set(v)       { keys.openai = (v || "").trim(); }
  function get()        { return keys.openai; }
  function has()        { return !!keys.openai; }

  function setAnthropic(v) { keys.anthropic = (v || "").trim(); }
  function getAnthropic()  { return keys.anthropic; }
  function hasAnthropic()  { return !!keys.anthropic; }

  /** Return the right key for the currently selected model's provider */
  function getForProvider(provider) {
    if (provider === "anthropic") return keys.anthropic;
    return keys.openai;
  }
  function hasForProvider(provider) {
    if (provider === "anthropic") return !!keys.anthropic;
    return !!keys.openai;
  }

  function mask(k) {
    if (!k) return "";
    if (k.length <= 4) return "••••";
    return "••••••••" + k.slice(-4);
  }

  /**
   * Parse a .env or .csv file for API keys.
   * Accepts KEY=VALUE or KEY,VALUE per line. Quotes are stripped.
   */
  function parseFile(text) {
    let openai = "";
    let anthropic = "";
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;

      let k, v;
      if (line.includes("=")) {
        const i = line.indexOf("=");
        k = line.slice(0, i).trim();
        v = line.slice(i + 1).trim();
      } else if (line.includes(",")) {
        const i = line.indexOf(",");
        k = line.slice(0, i).trim();
        v = line.slice(i + 1).trim();
      } else {
        continue;
      }

      // Strip matching quotes
      if ((v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }

      const key = k.toUpperCase();
      if (key === "OPENAI_API_KEY" || key === "OPENAI") openai = v;
      if (key === "ANTHROPIC_API_KEY" || key === "ANTHROPIC") anthropic = v;
    }
    return { openai, anthropic };
  }

  async function loadFromFile(file) {
    return parseFile(await file.text());
  }

  return { set, get, has, setAnthropic, getAnthropic, hasAnthropic, getForProvider, hasForProvider, mask, parseFile, loadFromFile };
})();
