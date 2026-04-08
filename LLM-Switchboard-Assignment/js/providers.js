// ============================================================
// providers.js — OpenAI & Anthropic API callers
// ============================================================

const Providers = (() => {

  /**
   * Build a system message for structured mode that instructs the model
   * to respond ONLY with JSON matching the provided schema.
   */
  function buildStructuredSystem(schema) {
    return (
      "You are a helpful assistant that responds ONLY with valid JSON " +
      "matching this exact JSON schema. Do not include any explanatory " +
      "text, markdown code fences, or commentary — only the raw JSON " +
      "object.\n\nSchema:\n" + JSON.stringify(schema, null, 2)
    );
  }

  // ----------------------------- OpenAI -----------------------------
  async function callOpenAI({ apiKey, model, prompt, structured, schema, temperature, maxTokens, systemPrompt }) {
    const url = "https://api.openai.com/v1/chat/completions";

    const messages = [];
    const systemParts = [];
    if (systemPrompt) systemParts.push(systemPrompt);
    if (structured)   systemParts.push(buildStructuredSystem(schema));
    if (systemParts.length) {
      messages.push({ role: "system", content: systemParts.join("\n\n") });
    }
    messages.push({ role: "user", content: prompt });

    const body = {
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 1024
    };
    if (structured) {
      body.response_format = { type: "json_object" };
    }

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

  // --------------------------- Anthropic ----------------------------
  async function callAnthropic({ apiKey, model, prompt, structured, schema, temperature, maxTokens, systemPrompt }) {
    const url = "https://api.anthropic.com/v1/messages";

    const body = {
      model,
      max_tokens: maxTokens ?? 1024,
      temperature: temperature ?? 0.7,
      messages: [{ role: "user", content: prompt }]
    };
    const systemParts = [];
    if (systemPrompt) systemParts.push(systemPrompt);
    if (structured)   systemParts.push(buildStructuredSystem(schema));
    if (systemParts.length) body.system = systemParts.join("\n\n");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
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
        text: data.content?.[0]?.text ?? "",
        usage: data.usage || null
      };
    } catch (e) {
      // CORS / network failures look like a TypeError with no status
      if (!e.status) {
        const cors = new Error(
          "Anthropic's API cannot be called directly from a browser due to CORS restrictions. OpenAI calls work directly — try switching providers!"
        );
        cors.isCORS = true;
        throw cors;
      }
      throw e;
    }
  }

  async function send(provider, opts) {
    if (provider === "openai")    return callOpenAI(opts);
    if (provider === "anthropic") return callAnthropic(opts);
    throw new Error("Unknown provider: " + provider);
  }

  return { send };
})();
