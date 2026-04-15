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
  { re: /water|h2o/i, svg: `<svg viewBox="0 0 40 40"><defs><linearGradient id="mg-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8d0ea"/><stop offset="1" stop-color="#4a7ba8"/></linearGradient></defs><path d="M20 4 C 11 16, 11 26, 20 36 C 29 26, 29 16, 20 4 z" fill="url(#mg-water)" stroke="#2e4a7a" stroke-width="1.2"/><path d="M15 22 C 14 18, 16 14, 18 12" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.7" stroke-linecap="round"/></svg>` },
  { re: /vinegar/i, svg: `<svg viewBox="0 0 40 40"><rect x="15" y="3" width="10" height="3" fill="#5a4030" rx="0.5"/><path d="M13 6 h14 l-1 6 l2 4 v18 a2 2 0 0 1 -2 2 h-12 a2 2 0 0 1 -2 -2 v-18 l2 -4 z" fill="#f5e6a0" stroke="#6b4a1a" stroke-width="1.3"/><rect x="15" y="20" width="10" height="10" fill="#ffffff" stroke="#6b4a1a" stroke-width="0.8"/><text x="20" y="26" text-anchor="middle" font-family="serif" font-size="4" fill="#6b4a1a" font-weight="bold">VINEGAR</text></svg>` },
  { re: /lemon|juice|citric/i, svg: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="14" ry="10" fill="#f5de4a" stroke="#a8841a" stroke-width="1.2"/><path d="M7 20 l-2 0 M33 20 l2 0" stroke="#a8841a" stroke-width="1.2"/><path d="M20 11 C 16 16, 16 24, 20 29 M20 11 C 24 16, 24 24, 20 29 M8 20 C 14 18, 26 18, 32 20" fill="none" stroke="#d8b72a" stroke-width="0.8" opacity="0.6"/></svg>` },
  { re: /baking soda|bicarbonate/i, svg: `<svg viewBox="0 0 40 40"><rect x="9" y="7" width="22" height="28" fill="#ffb84a" stroke="#8a4a10" stroke-width="1.3" rx="1"/><rect x="11" y="13" width="18" height="10" fill="#ffffff" opacity="0.85"/><text x="20" y="18" text-anchor="middle" font-family="serif" font-size="3.5" fill="#8a4a10" font-weight="bold">BAKING</text><text x="20" y="22" text-anchor="middle" font-family="serif" font-size="3.5" fill="#8a4a10" font-weight="bold">SODA</text><path d="M11 26 h18 M11 29 h18" stroke="#8a4a10" stroke-width="0.4" opacity="0.5"/></svg>` },
  { re: /baking powder/i, svg: `<svg viewBox="0 0 40 40"><rect x="10" y="8" width="20" height="26" fill="#d93a3a" stroke="#5a1010" stroke-width="1.3" rx="1"/><rect x="12" y="14" width="16" height="8" fill="#f5e6a0"/><text x="20" y="19" text-anchor="middle" font-family="serif" font-size="3" fill="#5a1010" font-weight="bold">POWDER</text></svg>` },
  { re: /salt/i, svg: `<svg viewBox="0 0 40 40"><path d="M14 8 h12 v24 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2 z" fill="#4a90c2" stroke="#1e3a5f" stroke-width="1.3"/><rect x="14" y="14" width="12" height="8" fill="#ffffff"/><text x="20" y="19" text-anchor="middle" font-family="serif" font-size="4" fill="#1e3a5f" font-weight="bold">SALT</text><circle cx="17" cy="10" r="0.6" fill="#1e3a5f"/><circle cx="20" cy="10" r="0.6" fill="#1e3a5f"/><circle cx="23" cy="10" r="0.6" fill="#1e3a5f"/></svg>` },
  { re: /sugar/i, svg: `<svg viewBox="0 0 40 40"><path d="M10 12 h20 v22 h-20 z" fill="#f5f0e0" stroke="#8a6a30" stroke-width="1.3"/><path d="M10 12 l4 -5 h12 l4 5" fill="#faf5e8" stroke="#8a6a30" stroke-width="1.3"/><text x="20" y="24" text-anchor="middle" font-family="serif" font-size="4" fill="#8a6a30" font-weight="bold">SUGAR</text></svg>` },
  { re: /cornstarch|starch|flour/i, svg: `<svg viewBox="0 0 40 40"><path d="M10 10 h20 l-1 24 a2 2 0 0 1 -2 2 h-14 a2 2 0 0 1 -2 -2 z" fill="#f5eeda" stroke="#6b4a1a" stroke-width="1.3"/><rect x="13" y="16" width="14" height="8" fill="#ffffff"/><text x="20" y="21" text-anchor="middle" font-family="serif" font-size="3" fill="#6b4a1a" font-weight="bold">STARCH</text></svg>` },
  { re: /bottle/i, svg: `<svg viewBox="0 0 40 40"><rect x="17" y="3" width="6" height="4" fill="#2a5a3a" stroke="#1a3a24" stroke-width="1"/><path d="M17 7 h6 v4 l3 5 v18 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2 v-18 l3 -5 z" fill="#4a8f5a" stroke="#1a3a24" stroke-width="1.3" opacity="0.85"/><rect x="14" y="22" width="12" height="7" fill="#f5e6a0" stroke="#6b4a1a" stroke-width="0.5"/></svg>` },
  { re: /jar/i, svg: `<svg viewBox="0 0 40 40"><rect x="12" y="4" width="16" height="5" fill="#8a6a30" stroke="#3a2a10" stroke-width="1"/><rect x="10" y="9" width="20" height="26" rx="1" fill="#d8e8e4" stroke="#4a5a5e" stroke-width="1.3" opacity="0.8"/><path d="M13 14 h14 M13 32 h14" stroke="#4a5a5e" stroke-width="0.6" opacity="0.6"/></svg>` },
  { re: /cup|mug/i, svg: `<svg viewBox="0 0 40 40"><path d="M10 12 h18 l-2 22 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 z" fill="#ffffff" stroke="#3a2a10" stroke-width="1.4"/><path d="M28 16 h3 a4 4 0 0 1 0 8 h-3" fill="none" stroke="#3a2a10" stroke-width="1.4"/><ellipse cx="19" cy="12" rx="9" ry="2" fill="#e8d8a8" stroke="#3a2a10" stroke-width="1"/></svg>` },
  { re: /glass|beaker/i, svg: `<svg viewBox="0 0 40 40"><path d="M12 8 h16 v2 l-2 2 v20 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2 v-20 l-2 -2 z" fill="#d8e8ef" stroke="#2e4a7a" stroke-width="1.3" opacity="0.8"/><path d="M15 22 h10 M15 28 h10" stroke="#2e4a7a" stroke-width="0.6"/><path d="M10 8 h20" stroke="#2e4a7a" stroke-width="1.3"/></svg>` },
  { re: /balloon/i, svg: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="14" rx="10" ry="12" fill="#e85a5a" stroke="#7a1a1a" stroke-width="1.3"/><ellipse cx="17" cy="10" rx="2" ry="3" fill="#ffffff" opacity="0.5"/><path d="M20 26 l-1 2 l1 1 l-2 2 l1 1 l-1 2 l1 2" fill="none" stroke="#3a2a10" stroke-width="1"/></svg>` },
  { re: /paper towel|napkin/i, svg: `<svg viewBox="0 0 40 40"><rect x="8" y="10" width="24" height="20" fill="#ffffff" stroke="#8a6a30" stroke-width="1.3"/><path d="M12 15 h16 M12 19 h16 M12 23 h16 M12 27 h10" stroke="#c4b898" stroke-width="0.7"/><path d="M10 10 q14 -8 28 0" fill="none" stroke="#8a6a30" stroke-width="1" opacity="0.5"/></svg>` },
  { re: /paper/i, svg: `<svg viewBox="0 0 40 40"><path d="M10 6 h15 l5 5 v23 a1 1 0 0 1 -1 1 h-19 a1 1 0 0 1 -1 -1 z" fill="#ffffff" stroke="#3a2a10" stroke-width="1.3"/><path d="M25 6 v5 h5" fill="none" stroke="#3a2a10" stroke-width="1.3"/><path d="M13 16 h14 M13 20 h14 M13 24 h10 M13 28 h14" stroke="#8a6a30" stroke-width="0.8"/></svg>` },
  { re: /string|thread|yarn|rope/i, svg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="12" fill="#f5e6a0" stroke="#6b4a1a" stroke-width="1.3"/><path d="M10 16 C 18 14, 24 18, 30 16 M9 20 C 18 18, 24 22, 31 20 M10 24 C 18 22, 24 26, 30 24" stroke="#8a6a30" stroke-width="0.8" fill="none"/><path d="M30 20 q8 -4 6 4" fill="none" stroke="#6b4a1a" stroke-width="1"/></svg>` },
  { re: /magnet/i, svg: `<svg viewBox="0 0 40 40"><path d="M8 8 v14 a12 12 0 0 0 24 0 v-14 h-7 v14 a5 5 0 0 1 -10 0 v-14 z" fill="#d93a3a" stroke="#5a1010" stroke-width="1.3"/><rect x="8" y="8" width="7" height="4" fill="#4a4a4a"/><rect x="25" y="8" width="7" height="4" fill="#4a4a4a"/><text x="11" y="15" font-family="serif" font-size="3" fill="#ffffff" font-weight="bold">N</text><text x="28" y="15" font-family="serif" font-size="3" fill="#ffffff" font-weight="bold">S</text></svg>` },
  { re: /battery/i, svg: `<svg viewBox="0 0 40 40"><rect x="8" y="14" width="24" height="12" fill="#c4a430" stroke="#5a4010" stroke-width="1.3"/><rect x="32" y="17" width="3" height="6" fill="#5a4010"/><text x="20" y="23" text-anchor="middle" font-family="serif" font-size="5" fill="#ffffff" font-weight="bold">1.5V</text><path d="M5 14 v12" stroke="#5a4010" stroke-width="1.3"/></svg>` },
  { re: /wire|circuit/i, svg: `<svg viewBox="0 0 40 40"><path d="M5 20 h6 v-6 h18 v12 h-18 v-6" fill="none" stroke="#a83a3a" stroke-width="2"/><circle cx="5" cy="20" r="2" fill="#c4a430"/><circle cx="35" cy="20" r="2" fill="#c4a430"/></svg>` },
  { re: /bulb|led|light/i, svg: `<svg viewBox="0 0 40 40"><path d="M20 6 C 12 6, 10 14, 14 20 C 16 23, 16 25, 16 27 h8 c0 -2, 0 -4, 2 -7 C 30 14, 28 6, 20 6 z" fill="#fff6a8" stroke="#8a6a10" stroke-width="1.3"/><path d="M16 28 h8 v2 h-8 z M17 31 h6 v2 h-6 z" fill="#8a8a8a" stroke="#3a3a3a" stroke-width="1"/><path d="M16 18 l4 -6 l4 6" fill="none" stroke="#8a6a10" stroke-width="0.8"/></svg>` },
  { re: /seed/i, svg: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="6" ry="10" fill="#8a6a30" stroke="#3a2a10" stroke-width="1.2" transform="rotate(20 20 20)"/><path d="M20 12 C 18 16, 18 24, 20 28" fill="none" stroke="#3a2a10" stroke-width="0.8"/></svg>` },
  { re: /plant|leaf|bean/i, svg: `<svg viewBox="0 0 40 40"><path d="M20 36 v-16" stroke="#5a4a1a" stroke-width="1.8" fill="none"/><path d="M20 24 C 8 22, 6 12, 16 10 C 22 14, 24 22, 20 24 z" fill="#5a9a3a" stroke="#2a5a1a" stroke-width="1.2"/><path d="M20 18 C 32 16, 34 6, 24 4 C 18 8, 16 16, 20 18 z" fill="#6aaa4a" stroke="#2a5a1a" stroke-width="1.2"/><path d="M16 36 h8" stroke="#5a4a1a" stroke-width="1.4"/></svg>` },
  { re: /food.?color|dye/i, svg: `<svg viewBox="0 0 40 40"><path d="M17 4 h6 v4 l4 6 v20 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 v-20 l4 -6 z" fill="#d93a3a" stroke="#5a1010" stroke-width="1.3"/><rect x="13" y="18" width="14" height="8" fill="#ffffff"/><text x="20" y="24" text-anchor="middle" font-family="serif" font-size="3" fill="#5a1010" font-weight="bold">DYE</text></svg>` },
  { re: /ink/i, svg: `<svg viewBox="0 0 40 40"><rect x="10" y="10" width="20" height="24" rx="1" fill="#1a1a3a" stroke="#000" stroke-width="1.3"/><rect x="13" y="6" width="14" height="5" fill="#3a3a5a" stroke="#000" stroke-width="1"/><rect x="13" y="18" width="14" height="10" fill="#f5f0e0"/><text x="20" y="25" text-anchor="middle" font-family="serif" font-size="4" fill="#000" font-weight="bold">INK</text></svg>` },
  { re: /spoon/i, svg: `<svg viewBox="0 0 40 40"><ellipse cx="12" cy="12" rx="7" ry="9" fill="#c4c4c8" stroke="#4a4a4a" stroke-width="1.3"/><ellipse cx="12" cy="12" rx="4" ry="6" fill="#8a8a92" opacity="0.4"/><path d="M16 17 l14 14" stroke="#4a4a4a" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { re: /scoop|measuring/i, svg: `<svg viewBox="0 0 40 40"><rect x="6" y="10" width="14" height="14" rx="1" fill="#d8a850" stroke="#5a3a10" stroke-width="1.3"/><path d="M20 17 l14 14" stroke="#5a3a10" stroke-width="2.5" stroke-linecap="round"/><path d="M8 14 h10 M8 18 h10" stroke="#5a3a10" stroke-width="0.6"/></svg>` },
  { re: /soap|detergent|dish/i, svg: `<svg viewBox="0 0 40 40"><path d="M14 6 h12 v3 l3 4 v20 a2 2 0 0 1 -2 2 h-14 a2 2 0 0 1 -2 -2 v-20 l3 -4 z" fill="#4a9adf" stroke="#1e3a6f" stroke-width="1.3"/><rect x="14" y="18" width="12" height="8" fill="#ffffff"/><text x="20" y="24" text-anchor="middle" font-family="serif" font-size="4" fill="#1e3a6f" font-weight="bold">SOAP</text><circle cx="10" cy="6" r="1.5" fill="#ffffff" opacity="0.6"/><circle cx="30" cy="5" r="1" fill="#ffffff" opacity="0.6"/></svg>` },
  { re: /oil/i, svg: `<svg viewBox="0 0 40 40"><path d="M16 4 h8 v5 l3 4 v20 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 v-20 l3 -4 z" fill="#f5d050" stroke="#6b4a1a" stroke-width="1.3"/><rect x="14" y="18" width="12" height="8" fill="#ffffff" opacity="0.9"/><text x="20" y="24" text-anchor="middle" font-family="serif" font-size="4" fill="#6b4a1a" font-weight="bold">OIL</text></svg>` },
  { re: /egg/i, svg: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="22" rx="10" ry="13" fill="#f5eeda" stroke="#8a6a30" stroke-width="1.3"/><ellipse cx="16" cy="15" rx="3" ry="4" fill="#ffffff" opacity="0.6"/></svg>` },
  { re: /ice|cold/i, svg: `<svg viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="24" rx="2" fill="#c4e8f0" stroke="#2e4a7a" stroke-width="1.3" opacity="0.85"/><path d="M20 6 v28 M6 20 h28 M11 11 l18 18 M29 11 l-18 18" stroke="#4a7a9f" stroke-width="1" opacity="0.6"/><circle cx="15" cy="13" r="1.5" fill="#ffffff" opacity="0.7"/></svg>` },
  { re: /ruler|tape measure|measure/i, svg: `<svg viewBox="0 0 40 40"><rect x="4" y="15" width="32" height="10" fill="#f5d050" stroke="#5a3a10" stroke-width="1.3"/><path d="M7 15 v4 M10 15 v6 M13 15 v4 M16 15 v6 M19 15 v4 M22 15 v6 M25 15 v4 M28 15 v6 M31 15 v4 M34 15 v6" stroke="#5a3a10" stroke-width="0.8"/></svg>` },
  { re: /tape/i, svg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#e8d090" stroke="#6b4a1a" stroke-width="1.3"/><circle cx="20" cy="20" r="6" fill="#faf0d0" stroke="#6b4a1a" stroke-width="1"/><circle cx="20" cy="20" r="2" fill="#6b4a1a"/></svg>` },
  { re: /scissors/i, svg: `<svg viewBox="0 0 40 40"><circle cx="10" cy="10" r="5" fill="none" stroke="#3a3a3a" stroke-width="1.5"/><circle cx="10" cy="30" r="5" fill="none" stroke="#3a3a3a" stroke-width="1.5"/><path d="M14 14 L 32 28 M14 26 L 32 12" stroke="#8a8a92" stroke-width="2" stroke-linecap="round"/></svg>` },
  { re: /straw/i, svg: `<svg viewBox="0 0 40 40"><path d="M16 4 L 24 36" stroke="#d93a3a" stroke-width="5" stroke-linecap="round"/><path d="M16 4 L 24 36" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 3"/></svg>` },
  { re: /coin|penny|nickel/i, svg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#c48a30" stroke="#5a3a10" stroke-width="1.3"/><circle cx="20" cy="20" r="11" fill="none" stroke="#5a3a10" stroke-width="0.6"/><text x="20" y="25" text-anchor="middle" font-family="serif" font-size="10" fill="#5a3a10" font-weight="bold">¢</text></svg>` },
  { re: /coffee filter|filter/i, svg: `<svg viewBox="0 0 40 40"><path d="M8 10 h24 l-4 22 a2 2 0 0 1 -2 2 h-12 a2 2 0 0 1 -2 -2 z" fill="#ffffff" stroke="#8a6a30" stroke-width="1.3"/><path d="M8 10 h24" stroke="#8a6a30" stroke-width="0.6" stroke-dasharray="1 1"/></svg>` },
  { re: /candle|wax/i, svg: `<svg viewBox="0 0 40 40"><path d="M18 6 C 20 2, 22 2, 20 6 C 22 10, 16 10, 18 6 z" fill="#ffb84a" stroke="#d95a00" stroke-width="1"/><rect x="15" y="10" width="10" height="24" fill="#f5e6a0" stroke="#8a6a30" stroke-width="1.3"/><path d="M20 10 v3" stroke="#3a2a10" stroke-width="1"/></svg>` },
  { re: /match/i, svg: `<svg viewBox="0 0 40 40"><rect x="18" y="12" width="3" height="24" fill="#d8b070" stroke="#5a3a10" stroke-width="0.8"/><ellipse cx="19.5" cy="10" rx="3" ry="4" fill="#d93a3a" stroke="#5a1010" stroke-width="0.8"/></svg>` },
  { re: /flashlight|torch/i, svg: `<svg viewBox="0 0 40 40"><rect x="10" y="16" width="18" height="8" fill="#4a4a4a" stroke="#000" stroke-width="1.2"/><path d="M28 14 l8 -4 v20 l-8 -4 z" fill="#fff6a8" stroke="#8a6a10" stroke-width="1.2"/><path d="M36 14 l4 -2 M36 20 l5 0 M36 26 l4 2" stroke="#fff6a8" stroke-width="1.2"/></svg>` },
  { re: /rubber band|elastic/i, svg: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="14" ry="6" fill="none" stroke="#b05a30" stroke-width="3"/></svg>` },
  { re: /clay|playdough/i, svg: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="26" rx="14" ry="8" fill="#e88a50" stroke="#7a3a10" stroke-width="1.3"/><ellipse cx="20" cy="22" rx="10" ry="4" fill="#f0a070" stroke="#7a3a10" stroke-width="1"/></svg>` },
  { re: /cardboard|box/i, svg: `<svg viewBox="0 0 40 40"><path d="M6 14 L 20 8 L 34 14 V 32 L 20 38 L 6 32 z" fill="#d8a850" stroke="#5a3a10" stroke-width="1.3"/><path d="M20 8 V 38 M6 14 L 34 14" stroke="#5a3a10" stroke-width="0.8"/></svg>` },
  { re: /marker|pen|pencil/i, svg: `<svg viewBox="0 0 40 40"><path d="M6 30 l20 -20 l4 4 l-20 20 z" fill="#d8b050" stroke="#5a3a10" stroke-width="1.2"/><path d="M26 10 l4 4" stroke="#5a3a10" stroke-width="1"/><path d="M4 32 l4 -2 l2 4 z" fill="#3a2a10"/></svg>` },
  { re: /thermometer/i, svg: `<svg viewBox="0 0 40 40"><path d="M18 6 a2 2 0 0 1 4 0 v22 a4 4 0 1 1 -4 0 z" fill="#ffffff" stroke="#3a2a10" stroke-width="1.3"/><circle cx="20" cy="32" r="4" fill="#d93a3a" stroke="#5a1010" stroke-width="1"/><path d="M20 28 V 20" stroke="#d93a3a" stroke-width="2"/><path d="M22 10 h2 M22 14 h2 M22 18 h2 M22 22 h2" stroke="#3a2a10" stroke-width="0.6"/></svg>` },
  { re: /clock|timer|watch|stopwatch/i, svg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="14" fill="#ffffff" stroke="#3a2a10" stroke-width="1.3"/><path d="M18 6 h4 v3 h-4 z" fill="#3a2a10"/><path d="M20 22 V 12 M20 22 L 26 26" stroke="#3a2a10" stroke-width="1.5"/><circle cx="20" cy="22" r="1.5" fill="#3a2a10"/></svg>` },
  { re: /plate|dish/i, svg: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="24" rx="16" ry="5" fill="#ffffff" stroke="#3a2a10" stroke-width="1.3"/><ellipse cx="20" cy="22" rx="12" ry="3" fill="none" stroke="#8a6a30" stroke-width="0.8"/></svg>` },
  { re: /tray/i, svg: `<svg viewBox="0 0 40 40"><path d="M4 14 h32 l-2 18 a2 2 0 0 1 -2 2 h-24 a2 2 0 0 1 -2 -2 z" fill="#c48a30" stroke="#5a3a10" stroke-width="1.3"/></svg>` },
  { re: /bowl/i, svg: `<svg viewBox="0 0 40 40"><path d="M4 16 C 4 28, 36 28, 36 16 z" fill="#c4c4d8" stroke="#3a3a4a" stroke-width="1.4"/><ellipse cx="20" cy="16" rx="16" ry="3" fill="none" stroke="#3a3a4a" stroke-width="1"/></svg>` },
  { re: /bottle|jar|container/i, svg: `<svg viewBox="0 0 40 40"><rect x="17" y="3" width="6" height="4" fill="#5a4030"/><path d="M17 7 h6 v4 l3 5 v18 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2 v-18 l3 -5 z" fill="#d8e8ef" stroke="#2e4a7a" stroke-width="1.3"/></svg>` },
];
function materialIcon(name) {
  for (const m of MATERIAL_ICONS) if (m.re.test(name)) return m.svg;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>`;
}

/* ---------- Materials reference strip ---------- */
function materialsStrip(exp) {
  if (!Array.isArray(exp.materials) || !exp.materials.length) return "";
  const items = exp.materials.slice(0, 8).map(m => `
    <figure class="mat-ref">
      <div class="mat-ref-frame">${materialIcon(m.name)}</div>
      <figcaption>
        <strong>${escapeHtml(m.name)}</strong>
        <span>${escapeHtml(m.quantity || "")}</span>
      </figcaption>
    </figure>
  `).join("");
  return `<div class="materials-strip">
    <div class="strip-title">You will need</div>
    <div class="strip-row">${items}</div>
  </div>`;
}

/* ---------- Apparatus banner diagram ---------- */
function apparatusBanner(exp) {
  const tag = (exp.concept_tags || [])[0] || "chemistry";

  // Each scene: three labeled stations with arrows between them — setup → action → observe.
  const scenes = {
    chemistry: {
      title: "Apparatus Setup",
      stations: [
        {
          label: "Measure",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
            <rect x="14" y="10" width="26" height="42" rx="1"/>
            <path d="M14 16 h26 M14 22 h26 M14 28 h26 M14 34 h26 M14 40 h26 M14 46 h26"/>
            <rect x="18" y="40" width="18" height="12" fill="var(--oxblood)" fill-opacity="0.35" stroke="none"/>
          </g>`
        },
        {
          label: "Combine",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
            <path d="M16 14 h22 v4 h-2 v14 l8 20 a3 3 0 0 1 -2.6 4.5 h-22.8 a3 3 0 0 1 -2.6 -4.5 l8 -20 v-14 h-2 z"/>
            <path d="M14 42 h26 l5 14 a3 3 0 0 1 -2.6 4.5 h-22 a3 3 0 0 1 -2.6 -4.5 z" fill="var(--oxblood)" fill-opacity="0.6" stroke="none"/>
            <circle cx="22" cy="54" r="1.6" fill="#F4EDDF" stroke="none"/>
            <circle cx="29" cy="56" r="1.2" fill="#F4EDDF" stroke="none"/>
            <circle cx="34" cy="53" r="1.8" fill="#F4EDDF" stroke="none"/>
            <path d="M20 6 q2 -4 4 0 M28 4 q2 -4 4 0" stroke-width="1.2"/>
          </g>`
        },
        {
          label: "Observe",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 32 C 14 18, 40 18, 48 32 C 40 46, 14 46, 6 32 z"/>
            <circle cx="27" cy="32" r="8" fill="currentColor" fill-opacity="0.15"/>
            <circle cx="27" cy="32" r="4" fill="currentColor"/>
            <path d="M35 16 l4 -4 M14 48 l-4 4" stroke-width="1"/>
          </g>`
        }
      ]
    },
    physics: {
      title: "Forces at Play",
      stations: [
        {
          label: "Setup",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 14 h38"/>
            <path d="M22 14 v20"/>
            <circle cx="22" cy="40" r="7" fill="var(--oxblood)" fill-opacity="0.5" stroke="currentColor"/>
            <path d="M10 14 l-4 -4 M14 14 l-4 -4 M18 14 l-4 -4 M22 14 l-4 -4 M26 14 l-4 -4 M30 14 l-4 -4 M34 14 l-4 -4 M38 14 l-4 -4 M42 14 l-4 -4"/>
          </g>`
        },
        {
          label: "Release",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M10 10 C 20 20, 20 40, 10 50"/>
            <path d="M10 10 h8 M10 10 v8" stroke-width="2" stroke="var(--oxblood)"/>
            <circle cx="38" cy="30" r="6" fill="var(--oxblood)" fill-opacity="0.5" stroke="currentColor"/>
            <path d="M26 24 h8 M26 30 h10 M26 36 h8" stroke-dasharray="2 2" opacity="0.6"/>
          </g>`
        },
        {
          label: "Measure",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.4">
            <circle cx="27" cy="30" r="20"/>
            <path d="M27 10 v4 M47 30 h-4 M27 50 v-4 M7 30 h4 M41 16 l-3 3 M41 44 l-3 -3 M13 44 l3 -3 M13 16 l3 3"/>
            <path d="M27 30 l10 -10" stroke="var(--oxblood)" stroke-width="2"/>
            <circle cx="27" cy="30" r="2" fill="currentColor"/>
          </g>`
        }
      ]
    },
    biology: {
      title: "Life Processes",
      stations: [
        {
          label: "Sample",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M27 56 v-30"/>
            <path d="M27 40 C 12 40, 12 22, 27 20 C 42 22, 42 40, 27 40 z" fill="var(--oxblood)" fill-opacity="0.25"/>
            <path d="M27 34 C 18 34, 18 26, 27 25" stroke-dasharray="1 2"/>
            <path d="M14 56 h26"/>
          </g>`
        },
        {
          label: "Observe",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.4">
            <ellipse cx="27" cy="30" rx="22" ry="16"/>
            <circle cx="27" cy="30" r="8" fill="currentColor" fill-opacity="0.15"/>
            <circle cx="19" cy="26" r="2" fill="currentColor"/>
            <circle cx="34" cy="34" r="2" fill="currentColor"/>
            <circle cx="22" cy="36" r="1.5" fill="currentColor"/>
            <circle cx="33" cy="22" r="1.5" fill="currentColor"/>
          </g>`
        },
        {
          label: "Grow",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M27 56 v-34"/>
            <path d="M27 38 C 16 38, 14 26, 24 22 C 30 26, 30 36, 27 38 z" fill="var(--oxblood)" fill-opacity="0.2"/>
            <path d="M27 30 C 38 30, 40 18, 30 14 C 24 18, 24 28, 27 30 z" fill="var(--oxblood)" fill-opacity="0.3"/>
            <path d="M12 56 h30"/>
          </g>`
        }
      ]
    },
    earth_science: {
      title: "Earth & Sky",
      stations: [
        {
          label: "Earth",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.4">
            <circle cx="27" cy="30" r="20"/>
            <path d="M7 30 h40 M27 10 C 17 18, 17 42, 27 50 M27 10 C 37 18, 37 42, 27 50"/>
            <path d="M10 22 C 20 24, 34 18, 44 22" stroke-dasharray="2 2"/>
            <path d="M11 38 C 22 40, 32 36, 43 38" stroke-dasharray="2 2"/>
          </g>`
        },
        {
          label: "Weather",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
            <circle cx="16" cy="18" r="6" fill="#f5d06b" fill-opacity="0.6"/>
            <path d="M10 40 C 14 32, 24 32, 28 40 C 36 38, 42 44, 38 50 h-28 C 6 46, 8 40, 10 40 z" fill="#ffffff" fill-opacity="0.6"/>
            <path d="M18 52 v5 M24 54 v5 M30 52 v5 M36 54 v5" stroke="var(--ink-blue)"/>
          </g>`
        },
        {
          label: "Terrain",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
            <path d="M4 48 L 18 24 L 30 38 L 42 18 L 50 48 z" fill="var(--oxblood)" fill-opacity="0.2"/>
            <path d="M14 30 l4 -3 l3 3 M38 26 l4 -3 l3 3" stroke-width="1.6"/>
            <path d="M4 54 h46"/>
          </g>`
        }
      ]
    },
    engineering: {
      title: "Build & Test",
      stations: [
        {
          label: "Design",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
            <path d="M8 14 h38 v34 h-38 z"/>
            <path d="M14 22 h26 M14 28 h20 M14 34 h26 M14 40 h16" stroke-dasharray="2 2"/>
            <path d="M38 40 l6 -4 l2 4 l-6 4 z" fill="var(--oxblood)" fill-opacity="0.4"/>
          </g>`
        },
        {
          label: "Build",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 48 L 27 14 L 46 48 z"/>
            <path d="M16 34 h22 M20 28 h14 M24 22 h6"/>
            <rect x="24" y="40" width="6" height="8" fill="var(--oxblood)" fill-opacity="0.4" stroke="none"/>
          </g>`
        },
        {
          label: "Test",
          svg: `<g fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="27" cy="30" r="18"/>
            <circle cx="27" cy="30" r="5"/>
            <path d="M27 12 v5 M27 43 v5 M9 30 h5 M40 30 h5 M15 18 l4 4 M39 42 l-4 -4 M15 42 l4 -4 M39 18 l-4 4"/>
            <path d="M27 30 l8 -6" stroke="var(--oxblood)" stroke-width="2"/>
          </g>`
        }
      ]
    },
  };
  const scene = scenes[tag] || scenes.chemistry;

  const stationXs = [60, 220, 380];
  const stationsHtml = scene.stations.map((s, i) => {
    const x = stationXs[i];
    return `
      <g transform="translate(${x - 27} 30)">
        <rect x="-4" y="-4" width="62" height="62" rx="3" fill="rgba(255,255,255,0.4)" stroke="var(--rule)" stroke-width="1"/>
        ${s.svg}
      </g>
      <text x="${x}" y="110" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="13" font-weight="600" fill="currentColor">${escapeHtml(s.label)}</text>
      <text x="${x}" y="124" text-anchor="middle" font-family="Special Elite, monospace" font-size="9" fill="var(--sepia)">Step ${i + 1}</text>
    `;
  }).join("");

  const arrows = [
    { x1: 130, x2: 160 },
    { x1: 290, x2: 320 },
  ].map(a => `
    <g stroke="var(--oxblood)" fill="none" stroke-width="1.5" stroke-linecap="round">
      <path d="M${a.x1} 56 h${a.x2 - a.x1 - 8}" stroke-dasharray="3 3"/>
      <path d="M${a.x2 - 8} 51 l8 5 l-8 5" />
    </g>
  `).join("");

  return `<div class="apparatus-banner" aria-hidden="true">
    <div class="apparatus-title">${escapeHtml(scene.title)}</div>
    <svg viewBox="0 0 440 140" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="bannerGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 L 0 0 0 20" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.18"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="440" height="140" fill="url(#bannerGrid)"/>
      <path d="M10 95 h420" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
      <path d="M10 95 l-4 8 h428 l-4 -8" fill="currentColor" opacity="0.08" stroke="none"/>
      ${stationsHtml}
      ${arrows}
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

      ${materialsStrip(exp)}
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
