// ============================================================
// providers.js — AI API caller (OpenAI + Anthropic)
// ============================================================

const AI_MODELS = [
  { id: "gpt-4o",            name: "GPT-4o",            provider: "openai" },
  { id: "gpt-4o-mini",       name: "GPT-4o Mini",       provider: "openai" },
  { id: "gpt-4.1",           name: "GPT-4.1",           provider: "openai" },
  { id: "gpt-4.1-mini",      name: "GPT-4.1 Mini",      provider: "openai" },
  { id: "gpt-4.1-nano",      name: "GPT-4.1 Nano",      provider: "openai" },
  { id: "o3-mini",           name: "o3-mini",            provider: "openai" },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "anthropic" },
];

let selectedModelId = "gpt-4o";

function getSelectedModel() {
  return AI_MODELS.find(m => m.id === selectedModelId) || AI_MODELS[0];
}

async function callAI({ apiKey, model, prompt, systemPrompt, temperature = 0.7, maxTokens = 600 }) {
  const modelInfo = AI_MODELS.find(m => m.id === model) || AI_MODELS[0];

  if (modelInfo.provider === "anthropic") {
    return callAnthropic({ apiKey, model, prompt, systemPrompt, temperature, maxTokens });
  }
  return callOpenAI({ apiKey, model, prompt, systemPrompt, temperature, maxTokens });
}

async function callOpenAI({ apiKey, model, prompt, systemPrompt, temperature = 0.7, maxTokens = 600 }) {
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
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage || null
  };
}

async function callAnthropic({ apiKey, model, prompt, systemPrompt, temperature = 0.7, maxTokens = 600 }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }

  const data = await res.json();
  return {
    text: data.content?.[0]?.text ?? "",
    usage: data.usage || null
  };
}
