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
