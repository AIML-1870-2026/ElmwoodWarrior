/* ---------- KeyVault: in-memory only ---------- */
const KeyVault = (() => {
  const keys = { openai: "" };
  function set(v)       { keys.openai = (v || "").trim(); }
  function get()        { return keys.openai; }
  function has()        { return !!keys.openai; }
  function mask(k)      { if (!k) return ""; if (k.length <= 4) return "••••"; return "••••••••" + k.slice(-4); }
  function parseFile(text) {
    let openai = "";
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      let k, v;
      if (line.includes("=")) { const i = line.indexOf("="); k = line.slice(0, i).trim(); v = line.slice(i + 1).trim(); }
      else if (line.includes(",")) { const i = line.indexOf(","); k = line.slice(0, i).trim(); v = line.slice(i + 1).trim(); }
      else continue;
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      const key = k.toUpperCase();
      if (key === "OPENAI_API_KEY" || key === "OPENAI") openai = v;
    }
    return { openai };
  }
  async function loadFromFile(file) { return parseFile(await file.text()); }
  return { set, get, has, mask, parseFile, loadFromFile };
})();

/* ---------- OpenAI caller ---------- */
async function callOpenAI({ apiKey, model, prompt, systemPrompt, temperature = 0.8, maxTokens = 1500 }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature,
      max_tokens: maxTokens
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    const e = new Error(msg); e.status = res.status; throw e;
  }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content ?? "", usage: data.usage || null };
}
