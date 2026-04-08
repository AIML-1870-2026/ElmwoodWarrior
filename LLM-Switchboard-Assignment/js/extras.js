// ============================================================
// extras.js — Prompt history (sessionStorage) + Achievements (localStorage)
// ============================================================

const History = (() => {
  const KEY = "lls_history";
  const MAX = 20;
  let cursor = -1;

  function all() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  }
  function add(prompt) {
    const list = all().filter((p) => p !== prompt);
    list.unshift(prompt);
    while (list.length > MAX) list.pop();
    sessionStorage.setItem(KEY, JSON.stringify(list));
    cursor = -1;
  }
  function prev() {
    const list = all();
    if (!list.length) return null;
    cursor = Math.min(cursor + 1, list.length - 1);
    return list[cursor];
  }
  function next() {
    const list = all();
    if (!list.length) return null;
    cursor = Math.max(cursor - 1, -1);
    return cursor === -1 ? "" : list[cursor];
  }
  function reset() { cursor = -1; }
  function clear() { sessionStorage.removeItem(KEY); cursor = -1; }

  return { all, add, prev, next, reset, clear };
})();

const Achievements = (() => {
  const KEY = "lls_achievements";
  const COUNT_KEY = "lls_counts";

  function unlocked() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  }
  function counts() {
    try { return JSON.parse(localStorage.getItem(COUNT_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveCounts(c) { localStorage.setItem(COUNT_KEY, JSON.stringify(c)); }

  function unlock(id) {
    const list = unlocked();
    if (list.includes(id)) return false;
    list.push(id);
    localStorage.setItem(KEY, JSON.stringify(list));
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) UI.toast(a.icon, "Achievement Unlocked: " + a.label, a.desc);
    UI.sfx.success && UI.sfx.success();
    return true;
  }

  function bump(key, amount = 1) {
    const c = counts();
    c[key] = (c[key] || 0) + amount;
    saveCounts(c);
    return c[key];
  }

  // Called from app after each event
  function onPromptSent() {
    const n = bump("prompts");
    unlock("first_prompt");
    if (n >= 10) unlock("ten_prompts");
    if (n >= 50) unlock("fifty_prompts");
  }
  function onStructuredValid() {
    unlock("first_structured");
    const n = bump("structured");
    if (n >= 5) unlock("schema_master");
  }
  function onCompare()      { unlock("first_compare"); }
  function onRoast()        { unlock("roasted"); }
  function onExport()       { unlock("exporter"); }
  function onPersonality(id) {
    if (id === "default") return;
    const c = counts();
    c.personalities = c.personalities || {};
    c.personalities[id] = true;
    saveCounts(c);
    const tried = Object.keys(c.personalities).length;
    const total = PERSONALITIES.filter((p) => p.id !== "default").length;
    if (tried >= total) unlock("all_personalities");
  }
  function onTheme(name) {
    const c = counts();
    c.themes = c.themes || {};
    c.themes[name] = true;
    saveCounts(c);
    if (Object.keys(c.themes).length >= THEMES.length) unlock("themer");
  }

  function progress() {
    const list = unlocked();
    return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: list.includes(a.id) }));
  }

  return {
    unlocked, unlock, progress,
    onPromptSent, onStructuredValid, onCompare, onRoast, onExport,
    onPersonality, onTheme
  };
})();
