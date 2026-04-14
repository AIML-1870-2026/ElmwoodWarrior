/* ============================================================
   Generate
   ============================================================ */
function refreshGenerateButton() {
  const ok = state.disclaimerAck && KeyVault.has() && state.tier && state.supplies.size > 0;
  $("#generateBtn").disabled = !ok;
}

function initGenerate() {
  $("#generateBtn").addEventListener("click", () => generateExperiment({}));
}

async function generateExperiment({ remixNote } = {}) {
  if (!state.disclaimerAck) { toast("Please accept the disclaimer first."); return; }
  if (!KeyVault.has())       { toast("Load your OpenAI key to start generating experiments."); return; }
  if (!state.tier)           { toast("Pick a grade tier."); return; }
  if (state.supplies.size === 0) { toast("Add at least one supply to get started."); return; }

  const status = $("#generateStatus");
  status.textContent = "Mixing ink…";
  $("#generateBtn").disabled = true;

  const supplies = [...state.supplies];
  const tier = state.tier;
  const topic = $("#topicInput").value.trim();
  const systemPrompt = buildSystemPrompt(tier);

  let safetyRetry = false;
  let parseRetry = false;
  let attempt = 0;

  try {
    while (attempt < 3) {
      attempt++;
      const userPrompt = buildUserPrompt({
        supplies, tier, topic,
        remixNote: remixNote || (safetyRetry
          ? "Your prior attempt was rejected by our safety filter. Generate a different experiment that strictly avoids all prohibited substances and combinations."
          : null)
      });

      status.textContent = `Writing experiment… (attempt ${attempt})`;
      let resp;
      try {
        resp = await callOpenAI({
          apiKey: KeyVault.get(),
          model: state.model,
          prompt: userPrompt,
          systemPrompt,
          temperature: 0.8,
          maxTokens: 1500
        });
      } catch (err) {
        handleApiError(err, status); return;
      }

      let parsed;
      try { parsed = JSON.parse(resp.text); }
      catch {
        if (!parseRetry) { parseRetry = true; status.textContent = "Got an unexpected response. Trying again…"; continue; }
        showBlot("Got an unexpected response twice. Please try again.");
        status.textContent = ""; refreshGenerateButton(); return;
      }

      const vErr = validateExperiment(parsed);
      if (vErr) {
        if (!parseRetry) { parseRetry = true; status.textContent = `Malformed (${vErr}). Trying again…`; continue; }
        showBlot("Response was malformed. Please try again.");
        status.textContent = ""; refreshGenerateButton(); return;
      }

      const safe = safetyScan(parsed);
      if (safe) {
        if (!safetyRetry) {
          safetyRetry = true;
          status.textContent = `The generated experiment didn't pass our safety check. Trying again… (${safe})`;
          continue;
        }
        showBlot("We couldn't produce a safe experiment for this combination. Try different supplies.");
        status.textContent = ""; refreshGenerateButton(); return;
      }

      // Success
      parsed.__generated_at = Date.now();
      parsed.__supplies_used = supplies.slice();
      state.current = parsed;
      renderExperiment(parsed);
      status.textContent = "Freshly inked.";
      setTimeout(() => { if (status.textContent === "Freshly inked.") status.textContent = ""; }, 3000);
      refreshGenerateButton();
      return;
    }
  } finally {
    refreshGenerateButton();
  }
}

function handleApiError(err, statusEl) {
  let msg = "Something went wrong.";
  if (err.status === 401) msg = "Your API key was rejected. Check it and try again.";
  else if (err.status === 429) msg = "You've hit OpenAI's rate limit. Wait a moment and retry.";
  else if (err.message && /timeout|network/i.test(err.message)) msg = "Request timed out. Check your connection.";
  else if (err.message) msg = err.message;
  showBlot(msg);
  statusEl.textContent = "";
  refreshGenerateButton();
}

function showBlot(msg) {
  const holder = $("#experimentCard");
  $("#outputPage").classList.remove("hidden");
  holder.innerHTML = `<div class="ink-blot">✗ ${escapeHtml(msg)}</div>`;
}
