// ============================================================
// providers.js — OpenAI API caller
// Adapted from TEMP-FOLDER-LLM Providers pattern (OpenAI only)
// ============================================================

const Providers = (() => {

  async function callOpenAI({ apiKey, model, systemPrompt, userPrompt, temperature, maxTokens }) {
    const url = "https://api.openai.com/v1/chat/completions";

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: userPrompt });

    const body = {
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 1024
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      usage: data.usage || null
    };
  }

  return { callOpenAI };
})();
