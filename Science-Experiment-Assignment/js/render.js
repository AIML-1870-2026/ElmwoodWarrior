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

/* ---------- Material icon lookup ---------- */
const MATERIAL_ICONS = [
  { re: /water|h2o/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2 C 6 10, 6 16, 12 22 C 18 16, 18 10, 12 2 z"/></svg>` },
  { re: /vinegar|acid|lemon|juice/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 2 h6 v3 h-1 v4 l4 11 a2 2 0 0 1 -1.8 3 h-8.4 a2 2 0 0 1 -1.8 -3 l4 -11 v-4 h-1 z"/><path d="M8 14 h8" stroke-dasharray="1 2"/></svg>` },
  { re: /soda|baking|powder|salt|sugar|starch/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="7" width="14" height="14" rx="1"/><path d="M7 7 v-2 h10 v2"/><path d="M9 12 h6 M9 15 h6"/></svg>` },
  { re: /bottle|jar|container/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 2 h4 v3 l2 3 v13 a1 1 0 0 1 -1 1 h-6 a1 1 0 0 1 -1 -1 v-13 l2 -3 z"/></svg>` },
  { re: /cup|glass|mug|beaker/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6 h12 l-1 14 a2 2 0 0 1 -2 2 h-6 a2 2 0 0 1 -2 -2 z"/><path d="M18 8 h2 a2 2 0 0 1 0 4 h-2"/></svg>` },
  { re: /balloon/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="9" rx="6" ry="7"/><path d="M12 16 l-1 2 l1 1 l-1 2"/></svg>` },
  { re: /paper|towel|napkin/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="3" width="14" height="18"/><path d="M8 7 h8 M8 11 h8 M8 15 h5"/></svg>` },
  { re: /string|thread|yarn|rope/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6 C 8 10, 16 2, 21 6 M3 12 C 8 16, 16 8, 21 12 M3 18 C 8 22, 16 14, 21 18"/></svg>` },
  { re: /magnet/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4 v8 a7 7 0 0 0 14 0 v-8 h-4 v8 a3 3 0 0 1 -6 0 v-8 z"/><path d="M5 6 h4 M15 6 h4"/></svg>` },
  { re: /battery|wire|circuit|bulb|LED/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="9" width="14" height="6" rx="1"/><rect x="18" y="11" width="2" height="2"/><path d="M7 12 h2 M11 10 v4 M11 12 h3"/></svg>` },
  { re: /seed|plant|bean|leaf/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22 v-10 M12 12 C 5 12, 5 4, 12 4 C 19 4, 19 12, 12 12 z"/></svg>` },
  { re: /food.?color|dye|ink/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 C 8 10, 6 14, 6 17 a6 6 0 0 0 12 0 c0 -3 -2 -7 -6 -14 z"/></svg>` },
  { re: /spoon|scoop/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="7" cy="7" rx="4" ry="5"/><path d="M9 10 l10 10"/></svg>` },
  { re: /soap|detergent|dish/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><circle cx="15" cy="6" r="2"/><circle cx="12" cy="14" r="4"/><circle cx="18" cy="15" r="2"/></svg>` },
  { re: /oil/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 C 8 10, 7 14, 7 17 a5 5 0 0 0 10 0 c0 -3 -1 -7 -5 -14 z"/><circle cx="11" cy="14" r="1" fill="currentColor"/></svg>` },
  { re: /egg/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="13" rx="6" ry="8"/></svg>` },
  { re: /ice|cold/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 v18 M3 12 h18 M6 6 l12 12 M18 6 l-12 12"/></svg>` },
  { re: /ruler|tape|measure/i, svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="9" width="18" height="6"/><path d="M6 9 v3 M9 9 v4 M12 9 v3 M15 9 v4 M18 9 v3"/></svg>` },
];
function materialIcon(name) {
  for (const m of MATERIAL_ICONS) if (m.re.test(name)) return m.svg;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>`;
}

/* ---------- Apparatus banner diagram ---------- */
function apparatusBanner(exp) {
  const tag = (exp.concept_tags || [])[0] || "chemistry";
  const scenes = {
    chemistry: `
      <g transform="translate(60 30)">
        <path d="M10 30 h20 v5 h-3 v20 l10 30 a4 4 0 0 1 -3.5 6 h-27 a4 4 0 0 1 -3.5 -6 l10 -30 v-20 h-3 z" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <path d="M10 65 h20 l6 15 a4 4 0 0 1 -3.5 6 h-25 a4 4 0 0 1 -3.5 -6 z" fill="var(--oxblood)" opacity="0.7"/>
        <circle cx="15" cy="78" r="2" fill="#F4EDDF" opacity="0.9"/>
        <circle cx="22" cy="80" r="1.5" fill="#F4EDDF" opacity="0.7"/>
        <circle cx="28" cy="76" r="2.5" fill="#F4EDDF" opacity="0.8"/>
      </g>
      <g transform="translate(170 40)">
        <rect x="0" y="20" width="50" height="50" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/>
        <path d="M0 20 h50 l-4 -8 h-42 z" fill="none" stroke="currentColor" stroke-width="1.4"/>
        <path d="M10 35 h30 M10 45 h30 M10 55 h20" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/>
      </g>
      <g transform="translate(260 45)">
        <circle cx="20" cy="30" r="20" fill="none" stroke="currentColor" stroke-width="1.4"/>
        <path d="M20 10 v40 M0 30 h40" stroke="currentColor" stroke-width="0.8" opacity="0.5"/>
        <path d="M20 30 l10 -10" stroke="var(--oxblood)" stroke-width="1.8"/>
      </g>
      <g transform="translate(340 50)" stroke="currentColor" fill="none" stroke-width="1.3">
        <ellipse cx="25" cy="25" rx="22" ry="8"/>
        <ellipse cx="25" cy="25" rx="22" ry="8" transform="rotate(60 25 25)"/>
        <ellipse cx="25" cy="25" rx="22" ry="8" transform="rotate(120 25 25)"/>
        <circle cx="25" cy="25" r="2.5" fill="currentColor"/>
      </g>`,
    physics: `
      <g transform="translate(60 40)" fill="none" stroke="currentColor" stroke-width="1.4">
        <ellipse cx="40" cy="30" rx="38" ry="10"/>
        <ellipse cx="40" cy="30" rx="38" ry="10" transform="rotate(60 40 30)"/>
        <ellipse cx="40" cy="30" rx="38" ry="10" transform="rotate(120 40 30)"/>
        <circle cx="40" cy="30" r="4" fill="currentColor"/>
      </g>
      <g transform="translate(180 30)" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M30 10 v40"/>
        <path d="M30 10 l-20 40" stroke-dasharray="2 3"/>
        <circle cx="10" cy="50" r="6" fill="var(--oxblood)" opacity="0.7"/>
      </g>
      <g transform="translate(260 45)" fill="none" stroke="currentColor" stroke-width="1.4">
        <rect x="0" y="20" width="60" height="8"/>
        <path d="M10 20 v-12 M30 20 v-20 M50 20 v-14"/>
        <path d="M0 24 C 20 10, 40 40, 60 24" stroke="var(--oxblood)" stroke-width="1.6"/>
      </g>
      <g transform="translate(340 55)" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M5 20 Q 15 5 25 20 T 45 20" />
        <path d="M5 35 Q 15 20 25 35 T 45 35" />
      </g>`,
    biology: `
      <g transform="translate(70 30)" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M30 70 v-40"/>
        <path d="M30 50 C 15 50, 15 35, 30 30 C 45 35, 45 50, 30 50 z"/>
        <path d="M30 60 C 20 60, 20 52, 30 52"/>
        <path d="M30 40 L 20 35 M30 45 L 40 40"/>
      </g>
      <g transform="translate(170 40)" fill="none" stroke="currentColor" stroke-width="1.4">
        <ellipse cx="30" cy="30" rx="25" ry="18"/>
        <circle cx="30" cy="30" r="6" fill="currentColor" opacity="0.2"/>
        <circle cx="20" cy="25" r="2"/>
        <circle cx="40" cy="35" r="2"/>
      </g>
      <g transform="translate(260 40)" fill="none" stroke="currentColor" stroke-width="1.3">
        <path d="M5 0 C 35 20, 5 40, 35 60"/>
        <path d="M35 0 C 5 20, 35 40, 5 60"/>
        <path d="M10 10 h20 M10 25 h20 M10 40 h20 M10 55 h20" stroke-dasharray="1 2"/>
      </g>
      <g transform="translate(340 45)" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M25 55 v-25"/>
        <path d="M25 40 C 10 40, 10 25, 25 22 C 40 25, 40 40, 25 40 z" fill="var(--oxblood)" fill-opacity="0.2"/>
      </g>`,
    earth_science: `
      <g transform="translate(60 35)" fill="none" stroke="currentColor" stroke-width="1.4">
        <circle cx="40" cy="40" r="35"/>
        <path d="M5 40 h70 M40 5 C 20 20, 20 60, 40 75 M40 5 C 60 20, 60 60, 40 75"/>
        <path d="M15 25 C 30 30, 50 20, 65 28" stroke-dasharray="2 2"/>
      </g>
      <g transform="translate(180 50)" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M0 50 L 20 15 L 35 35 L 55 10 L 70 50 z"/>
        <path d="M15 20 l5 -3 l3 3 M48 15 l5 -3 l3 3" stroke="#F4EDDF" stroke-width="2"/>
      </g>
      <g transform="translate(270 45)" fill="none" stroke="currentColor" stroke-width="1.3">
        <path d="M5 30 Q 15 10 30 25 Q 45 5 55 25 Q 65 15 75 30" />
        <path d="M10 45 v10 M25 50 v10 M40 45 v12 M55 50 v8 M70 45 v10" stroke-dasharray="1 3"/>
      </g>
      <g transform="translate(370 55)" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M5 40 L 30 5 L 55 40 z"/>
        <path d="M20 25 L 30 15 L 40 25"/>
      </g>`,
    engineering: `
      <g transform="translate(60 30)" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="40" cy="40" r="25"/>
        <circle cx="40" cy="40" r="6"/>
        <path d="M40 15 v8 M40 57 v8 M15 40 h8 M57 40 h8 M22 22 l6 6 M52 52 l6 6 M22 58 l6 -6 M52 28 l6 -6"/>
      </g>
      <g transform="translate(170 45)" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M0 50 L 30 10 L 60 50 z"/>
        <path d="M0 50 L 60 50 M15 30 h30 M22 20 h16"/>
      </g>
      <g transform="translate(270 40)" fill="none" stroke="currentColor" stroke-width="1.4">
        <rect x="10" y="10" width="50" height="8" />
        <rect x="10" y="25" width="50" height="8" />
        <rect x="10" y="40" width="50" height="8" />
        <path d="M35 18 v7 M35 33 v7"/>
      </g>
      <g transform="translate(360 45)" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M10 40 L 50 40 L 50 20 L 35 10 L 20 20 L 20 40 z"/>
        <rect x="30" y="25" width="10" height="15"/>
      </g>`,
  };
  const scene = scenes[tag] || scenes.chemistry;
  return `<div class="apparatus-banner" aria-hidden="true">
    <svg viewBox="0 0 440 120" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="bannerDots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="currentColor" opacity="0.3"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="440" height="120" fill="url(#bannerDots)" opacity="0.5"/>
      <path d="M20 110 h400" stroke="currentColor" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.6"/>
      ${scene}
    </svg>
  </div>`;
}

function renderExperiment(exp) {
  $("#outputPage").classList.remove("hidden");
  const holder = $("#experimentCard");

  const matsHtml = exp.materials.map(m => {
    const subs = Array.isArray(m.substitutes) && m.substitutes.length
      ? `<span class="subs">No ${escapeHtml(m.name)}? Try: ${m.substitutes.map(s =>
          `<span class="sub-chip">${escapeHtml(s)}</span>`).join(" ")}</span>`
      : "";
    return `<li class="mat-item">
      <span class="mat-icon">${materialIcon(m.name)}</span>
      <div class="mat-body">
        <strong>${escapeHtml(m.name)}</strong>
        <span class="mat-qty">${escapeHtml(m.quantity || "")}</span>
        ${subs}
      </div>
    </li>`;
  }).join("");

  const procHtml = exp.procedure.map((step, i) =>
    `<li data-step="${i}" class="proc-step">
      <span class="proc-num">${i + 1}</span>
      <button class="speak-btn" title="Read this step" data-read="${i}">🔊</button>
      <span class="proc-text">${escapeHtml(step)}</span>
    </li>`
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

      ${apparatusBanner(exp)}

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
