/* ============================================================
   Rendering
   ============================================================ */

/* ---------- Concept icons ---------- */
const CONCEPT_ICONS = {
  chemistry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 3 h6 v2 h-1 v5 l5 10 a2 2 0 0 1 -1.7 3 h-10.6 a2 2 0 0 1 -1.7 -3 l5 -10 v-5 h-1 z"/><circle cx="10" cy="17" r="1" fill="currentColor"/><circle cx="14" cy="15" r="0.7" fill="currentColor"/></svg>`,
  physics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>`,
  biology: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2 C 6 8, 6 14, 12 22 C 18 14, 18 8, 12 2 z"/><path d="M12 4 v18"/></svg>`,
  earth_science: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12 h18 M12 3 C 7 8, 7 16, 12 21 M12 3 C 17 8, 17 16, 12 21"/></svg>`,
  engineering: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2 l2 3 h3 l-2 3 l2 3 h-3 l-2 3 l-2 -3 h-3 l2 -3 l-2 -3 h3 z" transform="translate(0 2)"/><circle cx="12" cy="12" r="2.2" fill="none"/></svg>`
};
function conceptIcon(tag) {
  return CONCEPT_ICONS[tag] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/></svg>`;
}

/* ---------- Circular gauge ---------- */
function gaugeSvg(value, max, cls) {
  const r = 30;
  const C = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dashOffset = C * (1 - pct);
  return `<svg viewBox="0 0 72 72">
    <circle class="gauge-track" cx="36" cy="36" r="${r}"/>
    <circle class="gauge-fill" cx="36" cy="36" r="${r}"
      stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"/>
  </svg>`;
}

function difficultyGauge(n) {
  return `<div class="gauge difficulty">
    <div class="gauge-center">
      ${gaugeSvg(n, 5, "difficulty")}
      <div class="gauge-label">${n}<span class="gauge-sub">of 5</span></div>
    </div>
    <span class="gauge-title">⚗ Difficulty</span>
  </div>`;
}
function messGauge(n) {
  return `<div class="gauge mess">
    <div class="gauge-center">
      ${gaugeSvg(n, 5, "mess")}
      <div class="gauge-label">${n}<span class="gauge-sub">of 5</span></div>
    </div>
    <span class="gauge-title">🧽 Mess</span>
  </div>`;
}
function timeGauge(active, total) {
  const pct = Math.min(1, total / 90); // gauge up to 90min
  const r = 30, C = 2 * Math.PI * r;
  return `<div class="gauge time">
    <div class="gauge-center">
      <svg viewBox="0 0 72 72">
        <circle class="gauge-track" cx="36" cy="36" r="${r}"/>
        <circle class="gauge-fill" cx="36" cy="36" r="${r}"
          stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C*(1-pct)).toFixed(2)}"/>
      </svg>
      <div class="gauge-label">${total}<span class="gauge-sub">min total</span></div>
    </div>
    <span class="gauge-title">⏱ ${active}m active</span>
  </div>`;
}

/* ---------- Supervision shield ---------- */
function supervisionBadge(level) {
  const shield = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 l8 3 v7 c0 5 -3.5 8.5 -8 10 c-4.5 -1.5 -8 -5 -8 -10 v-7 z" opacity="0.25"/><path d="M12 2 l8 3 v7 c0 5 -3.5 8.5 -8 10 c-4.5 -1.5 -8 -5 -8 -10 v-7 z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  if (level === "adult_required")    return `<span class="supervision-shield red">${shield} Adult Required</span>`;
  if (level === "adult_recommended") return `<span class="supervision-shield yellow">${shield} Adult Recommended</span>`;
  return `<span class="supervision-shield green">${shield} Independent OK</span>`;
}

function conceptTagsHtml(tags) {
  return `<span class="concept-tags">${tags.map(t =>
    `<span class="concept-tag">${conceptIcon(t)}${escapeHtml(t.replace(/_/g," "))}</span>`).join("")}</span>`;
}

/* Legacy helper — kept for saved drawer */
function renderIcons(n, icon) {
  const full = Math.max(0, Math.min(5, n|0));
  return icon.repeat(full) + `<span style="opacity:0.25">${icon.repeat(5 - full)}</span>`;
}

/* ---------- Ornamental divider ---------- */
function divider(glyph = "❦") {
  return `<div class="section-divider"><span>${glyph}</span></div>`;
}

function renderExperiment(exp) {
  $("#outputPage").classList.remove("hidden");
  const holder = $("#experimentCard");

  const matsHtml = exp.materials.map(m => {
    const subs = Array.isArray(m.substitutes) && m.substitutes.length
      ? `<span class="subs">No ${escapeHtml(m.name)}? Try: ${m.substitutes.map(s =>
          `<span class="sub-chip">${escapeHtml(s)}</span>`).join(" ")}</span>`
      : "";
    return `<li><strong>${escapeHtml(m.name)}</strong> <span class="mat-qty">— ${escapeHtml(m.quantity || "")}</span>${subs}</li>`;
  }).join("");

  const procHtml = exp.procedure.map((step, i) =>
    `<li data-step="${i}"><button class="speak-btn" title="Read this step" data-read="${i}">🔊</button>${escapeHtml(step)}</li>`
  ).join("");

  const safetyHtml = exp.safety_notes.map(s => `<li>${escapeHtml(s)}</li>`).join("");

  holder.innerHTML = `
    <div class="exp-card">
      <h2 class="exp-title">${escapeHtml(exp.title)}</h2>
      <div class="exp-meta-row">
        <span class="tier-pill">${escapeHtml(exp.grade_tier)}</span>
        ${conceptTagsHtml(exp.concept_tags)}
        ${supervisionBadge(exp.supervision_level)}
      </div>

      <div class="gauge-row">
        ${difficultyGauge(exp.difficulty)}
        ${messGauge(exp.mess_rating)}
        ${timeGauge(exp.time_active_minutes, exp.time_total_minutes)}
      </div>

      <div class="exp-section">
        <h3>The Question</h3>
        <p>${escapeHtml(exp.question)}</p>
      </div>

      <div class="exp-section">
        <h3>Predict It (Hypothesis)</h3>
        <div class="hypothesis-scroll">${escapeHtml(exp.hypothesis_prompt)}</div>
      </div>

      ${divider("⚗")}

      <div class="exp-section">
        <h3>Materials</h3>
        <ul class="mat-list">${matsHtml}</ul>
      </div>

      <div class="exp-section">
        <h3>Procedure
          <button class="btn btn-small" id="readAllBtn" style="float:right">🔊 Read all steps</button>
          <button class="btn btn-small" id="stopReadBtn" style="float:right; margin-right:6px; display:none">⏹ Stop</button>
        </h3>
        <ol class="proc-list">${procHtml}</ol>
      </div>

      ${divider("❦")}

      <div class="exp-section">
        <h3>What You'll Likely See</h3>
        <div class="obs-card">
          <svg class="obs-eye" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 24 C 10 12, 38 12, 45 24 C 38 36, 10 36, 3 24 z"/>
            <circle cx="24" cy="24" r="6" fill="currentColor" opacity="0.2"/>
            <circle cx="24" cy="24" r="3" fill="currentColor"/>
          </svg>
          <p>${escapeHtml(exp.expected_observations)}</p>
        </div>
      </div>

      <details class="why-section exp-section">
        <summary>Why this works</summary>
        <div class="why-body">${escapeHtml(exp.why_it_works)}</div>
      </details>

      <div class="exp-section">
        <h3>Safety Notes</h3>
        <ul class="safety-list">${safetyHtml}</ul>
      </div>

      <div class="exp-actions">
        <button class="btn" id="saveBtn">💾 Save</button>
        <button class="btn" id="remixBtn">🔀 Remix</button>
        <button class="btn" id="printBtn">🖨 Print Worksheet</button>
        <button class="btn" id="printCardBtn">🖼 Print Card</button>
      </div>
    </div>
    <div class="worksheet" id="worksheet"></div>
  `;

  // Wire up card actions
  $("#saveBtn").addEventListener("click", () => saveCurrent());
  $("#remixBtn").addEventListener("click", () => remixCurrent());
  $("#printBtn").addEventListener("click", () => printWorksheet("student"));
  $("#printCardBtn").addEventListener("click", () => window.print());

  // Per-step speak
  holder.querySelectorAll(".speak-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = +btn.dataset.read;
      speak(exp.procedure[idx]);
    });
  });
  $("#readAllBtn").addEventListener("click", () => readAll(exp.procedure));
  $("#stopReadBtn").addEventListener("click", () => stopReading());

  // Ink-writing simulated animation on title
  animateInk($(".exp-title"), exp.title);

  // Scroll to output
  $("#outputPage").scrollIntoView({ behavior: "smooth", block: "start" });
}

function animateInk(el, text) {
  el.textContent = "";
  el.classList.add("ink-writing");
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i);
    i++;
    if (i <= text.length) setTimeout(tick, 22 + (text[i-1] === "." ? 140 : 0));
    else el.classList.remove("ink-writing");
  };
  tick();
}
