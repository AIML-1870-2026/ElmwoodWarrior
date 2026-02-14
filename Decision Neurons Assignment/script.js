/* ═══════════════════════════════════════════════════════════════
   SCENARIOS DATA
   ═══════════════════════════════════════════════════════════════ */
const SCENARIOS = [
  {
    id: 'sleep', emoji: '😴', title: 'Sleep or Suffer',
    yesLabel: 'Crash Out 💤', noLabel: 'Stay Conscious ⚡',
    biasName: 'Sleep Paralysis Preview', biasDefault: 0.3,
    thresholdText: 'You have entered sleep paralysis preview mode...',
    wakeText: 'Welcome back to consciousness',
    inputs: [
      { name: 'Body Exhaustion', range: [0,10], unit: 'scale', weight: 0.40, region: 'brainstem', color: '#7c3aed', particleBehavior: 'heavy', desc: 'Physical fatigue. 0 = fresh, 10 = can\'t move', default: 3 },
      { name: 'Brain Mush', range: [0,10], unit: 'scale', weight: 0.30, region: 'prefrontal', color: '#9ca3af', particleBehavior: 'chaotic', desc: 'Mental fog. 0 = sharp, 10 = thoughts are soup', default: 2 },
      { name: 'Caffeine Crash', range: [0,8], unit: 'hours', weight: 0.25, region: 'reticular', color: '#d97706', particleBehavior: 'fading', desc: 'Hours since caffeine. 0 = just had coffee, 8 = wore off', default: 1 },
      { name: 'Schedule Emptiness', range: [0,24], unit: 'hours', weight: 0.20, region: 'temporal', color: '#60a5fa', particleBehavior: 'drifting', desc: 'Hours until obligation. 0 = now, 24 = nothing today', default: 4 },
      { name: 'Boredom Level', range: [0,10], unit: 'scale', weight: 0.35, region: 'parietal', color: '#4ade80', particleBehavior: 'sluggish', desc: 'Engagement. 0 = hyperfocused, 10 = nothing interesting', default: 3 },
    ]
  },
  {
    id: 'college', emoji: '🎓', title: 'Choose a College',
    yesLabel: 'Apply ✅', noLabel: 'Skip ❌',
    biasName: 'Gut Feeling', biasDefault: 0.1,
    thresholdText: 'Application submitted! No turning back...',
    wakeText: 'Still browsing options',
    inputs: [
      { name: 'Academic Fit', range: [0,10], unit: 'scale', weight: 0.40, region: 'prefrontal', color: '#a78bfa', particleBehavior: 'chaotic', desc: '0 = wrong major, 10 = perfect program', default: 5 },
      { name: 'Financial Aid', range: [0,10], unit: 'scale', weight: 0.35, region: 'temporal', color: '#4ade80', particleBehavior: 'drifting', desc: '0 = full price, 10 = full ride', default: 3 },
      { name: 'Distance', range: [0,10], unit: 'scale', weight: 0.20, region: 'parietal', color: '#60a5fa', particleBehavior: 'sluggish', desc: '0 = across country, 10 = perfect distance', default: 5 },
      { name: 'Campus Vibe', range: [0,10], unit: 'scale', weight: 0.25, region: 'reticular', color: '#f97316', particleBehavior: 'fading', desc: '0 = bad feeling, 10 = instant love', default: 5 },
      { name: 'Career Prospects', range: [0,10], unit: 'scale', weight: 0.30, region: 'brainstem', color: '#fbbf24', particleBehavior: 'heavy', desc: '0 = no placement, 10 = guaranteed job', default: 5 },
    ]
  },
  {
    id: 'pet', emoji: '🐕', title: 'Adopt a Pet',
    yesLabel: 'Adopt 🐾', noLabel: 'Wait ⏳',
    biasName: 'Puppy Eyes Effect', biasDefault: 0.5,
    thresholdText: 'Congratulations, you\'re a pet parent!',
    wakeText: 'Maybe next time...',
    inputs: [
      { name: 'Time Available', range: [0,10], unit: 'scale', weight: 0.35, region: 'prefrontal', color: '#a78bfa', particleBehavior: 'chaotic', desc: '0 = no free time, 10 = all day', default: 5 },
      { name: 'Living Space', range: [0,10], unit: 'scale', weight: 0.25, region: 'temporal', color: '#60a5fa', particleBehavior: 'drifting', desc: '0 = tiny apartment, 10 = huge yard', default: 5 },
      { name: 'Budget', range: [0,10], unit: 'scale', weight: 0.30, region: 'reticular', color: '#4ade80', particleBehavior: 'fading', desc: '0 = broke, 10 = money no object', default: 5 },
      { name: 'Allergies', range: [0,10], unit: 'scale', weight: 0.20, region: 'brainstem', color: '#f97316', particleBehavior: 'heavy', desc: '0 = severe allergies, 10 = none at all', default: 7 },
      { name: 'Emotional Readiness', range: [0,10], unit: 'scale', weight: 0.40, region: 'parietal', color: '#fbbf24', particleBehavior: 'sluggish', desc: '0 = not ready, 10 = heart is open', default: 6 },
    ]
  },
  {
    id: 'roadtrip', emoji: '🚗', title: 'Road Trip?',
    yesLabel: 'Go 🛣️', noLabel: 'Stay 🏠',
    biasName: 'Wanderlust', biasDefault: 0.2,
    thresholdText: 'Engine started. Adventure awaits!',
    wakeText: 'Couch it is.',
    inputs: [
      { name: 'Gas Money', range: [0,10], unit: 'scale', weight: 0.30, region: 'temporal', color: '#4ade80', particleBehavior: 'drifting', desc: '0 = empty wallet, 10 = tank is full', default: 5 },
      { name: 'Days Off', range: [0,10], unit: 'scale', weight: 0.35, region: 'prefrontal', color: '#a78bfa', particleBehavior: 'chaotic', desc: '0 = none, 10 = whole week', default: 3 },
      { name: 'Car Condition', range: [0,10], unit: 'scale', weight: 0.25, region: 'brainstem', color: '#f97316', particleBehavior: 'heavy', desc: '0 = falling apart, 10 = brand new', default: 6 },
      { name: 'Friends In', range: [0,10], unit: 'scale', weight: 0.40, region: 'parietal', color: '#60a5fa', particleBehavior: 'sluggish', desc: '0 = nobody, 10 = whole squad', default: 4 },
      { name: 'Weather', range: [0,10], unit: 'scale', weight: 0.20, region: 'reticular', color: '#fbbf24', particleBehavior: 'fading', desc: '0 = blizzard, 10 = perfect day', default: 5 },
    ]
  },
  {
    id: 'tech', emoji: '💻', title: 'Tech Upgrade',
    yesLabel: 'Buy 🛒', noLabel: 'Hold ✋',
    biasName: 'Tech FOMO', biasDefault: 0.3,
    thresholdText: 'Order placed. Your wallet weeps.',
    wakeText: 'Saved your money... for now.',
    inputs: [
      { name: 'Current Pain', range: [0,10], unit: 'scale', weight: 0.40, region: 'brainstem', color: '#f97316', particleBehavior: 'heavy', desc: '0 = works fine, 10 = unusable', default: 4 },
      { name: 'Need Features', range: [0,10], unit: 'scale', weight: 0.30, region: 'prefrontal', color: '#a78bfa', particleBehavior: 'chaotic', desc: '0 = nothing new, 10 = must-haves', default: 5 },
      { name: 'Budget', range: [0,10], unit: 'scale', weight: 0.25, region: 'temporal', color: '#4ade80', particleBehavior: 'drifting', desc: '0 = broke, 10 = flush with cash', default: 5 },
      { name: 'Sale Active', range: [0,10], unit: 'scale', weight: 0.35, region: 'reticular', color: '#fbbf24', particleBehavior: 'fading', desc: '0 = full price, 10 = massive deal', default: 3 },
      { name: 'Resale Value', range: [0,10], unit: 'scale', weight: 0.20, region: 'parietal', color: '#60a5fa', particleBehavior: 'sluggish', desc: '0 = worthless, 10 = great trade-in', default: 5 },
    ]
  },
];

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */
const state = {
  scenario: null,
  inputValues: [],
  bias: 0.3,
  activationFn: 'sigmoid',
  compareAll: false,
  probability: 0,
  rawZ: 0,
  crashed: false,
  // two-neuron
  n2Bed: 5, n2Social: 3, n2Tomorrow: 5, n2Bias: -0.5, synapseWeight: 0.8,
  // training
  trainingPoints: [],
  trainWeights: null,
  trainBias: 0,
  trainSteps: 0,
  trainLabel: 1,
  trainXIdx: 2,
  trainYIdx: 0,
  // sensitivity
  sensMode: 'lines',
  // decision boundary
  dbXIdx: 2,
  dbYIdx: 0,
};

/* ═══════════════════════════════════════════════════════════════
   ACTIVATION FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */
function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
function step(z) { return z >= 0 ? 1 : 0; }
function relu(z) { return Math.min(Math.max(0, z), 1); }
function activate(z, fn) {
  if (fn === 'step') return step(z);
  if (fn === 'relu') return relu(z);
  return sigmoid(z);
}

/* ═══════════════════════════════════════════════════════════════
   COMPUTE
   ═══════════════════════════════════════════════════════════════ */
function computeZ() {
  const s = state.scenario;
  let z = state.bias;
  for (let i = 0; i < s.inputs.length; i++) {
    const inp = s.inputs[i];
    const norm = state.inputValues[i] / inp.range[1];
    z += norm * inp.weight;
  }
  return z;
}

function computeProbability() {
  state.rawZ = computeZ();
  state.probability = activate(state.rawZ, state.activationFn);
  return state.probability;
}

/* ═══════════════════════════════════════════════════════════════
   UI BUILDERS
   ═══════════════════════════════════════════════════════════════ */
function buildScenarioSelect() {
  const sel = document.getElementById('scenario-select');
  sel.innerHTML = '';
  SCENARIOS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.emoji} ${s.title}`;
    sel.appendChild(opt);
  });
  // add custom option
  const cOpt = document.createElement('option');
  cOpt.value = '__create__';
  cOpt.textContent = '✨ Create Your Own';
  sel.appendChild(cOpt);
}

function loadScenario(id) {
  const s = SCENARIOS.find(sc => sc.id === id);
  if (!s) return;
  state.scenario = s;
  state.bias = s.biasDefault;
  state.inputValues = s.inputs.map(inp => inp.default);
  state.crashed = false;

  document.getElementById('page-title').textContent = s.title;
  document.getElementById('bias-label').textContent = s.biasName;
  document.getElementById('bias-slider').value = s.biasDefault;
  document.getElementById('bias-value').textContent = (s.biasDefault >= 0 ? '+' : '') + s.biasDefault.toFixed(1);
  document.getElementById('crash-text').textContent = s.thresholdText;

  buildSliders();
  buildDBSelects();
  buildTrainSelects();
  initTraining();
  computeProbability();
  updateUI();
}

function buildSliders() {
  const left = document.getElementById('left-sliders');
  const right = document.getElementById('right-sliders');
  left.innerHTML = ''; right.innerHTML = '';
  const s = state.scenario;
  s.inputs.forEach((inp, i) => {
    const target = left;
    const card = document.createElement('div');
    card.className = 'slider-card';
    card.innerHTML = `
      <div class="slider-label">${inp.name}</div>
      <div class="slider-desc">${inp.desc}</div>
      <div class="slider-val" id="sval-${i}">${state.inputValues[i]}${inp.unit === 'hours' ? ' hrs' : '/' + inp.range[1]}</div>
      <div class="slider-wrap">
        <input type="range" min="${inp.range[0]}" max="${inp.range[1]}" step="${inp.range[1] > 10 ? 1 : 0.1}" value="${state.inputValues[i]}" data-idx="${i}" class="input-slider" aria-label="${inp.name}">
      </div>
      <div class="weight-badge">w = ${inp.weight >= 0 ? '+' : ''}${inp.weight.toFixed(2)}</div>
    `;
    target.appendChild(card);
  });
  // attach listeners
  document.querySelectorAll('.input-slider').forEach(sl => {
    sl.addEventListener('input', e => {
      const idx = parseInt(e.target.dataset.idx);
      const val = parseFloat(e.target.value);
      state.inputValues[idx] = val;
      const inp = state.scenario.inputs[idx];
      document.getElementById(`sval-${idx}`).textContent = (inp.unit === 'hours') ? val + ' hrs' : val + '/' + inp.range[1];
      computeProbability();
      updateUI();
    });
  });
}

function buildDBSelects() {
  ['db-x', 'db-y'].forEach(selId => {
    const sel = document.getElementById(selId);
    sel.innerHTML = '';
    state.scenario.inputs.forEach((inp, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = inp.name;
      sel.appendChild(opt);
    });
  });
  document.getElementById('db-x').value = Math.min(2, state.scenario.inputs.length - 1);
  document.getElementById('db-y').value = 0;
  state.dbXIdx = parseInt(document.getElementById('db-x').value);
  state.dbYIdx = parseInt(document.getElementById('db-y').value);
}

function buildTrainSelects() {
  ['train-x', 'train-y'].forEach(selId => {
    const sel = document.getElementById(selId);
    sel.innerHTML = '';
    state.scenario.inputs.forEach((inp, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = inp.name;
      sel.appendChild(opt);
    });
  });
  document.getElementById('train-x').value = Math.min(2, state.scenario.inputs.length - 1);
  document.getElementById('train-y').value = 0;
  state.trainXIdx = parseInt(document.getElementById('train-x').value);
  state.trainYIdx = parseInt(document.getElementById('train-y').value);
}

/* ═══════════════════════════════════════════════════════════════
   UPDATE UI
   ═══════════════════════════════════════════════════════════════ */
function updateUI() {
  const p = state.probability;
  const s = state.scenario;

  // Output
  const pctNum = Math.round(p * 100);
  document.getElementById('output-pct').textContent = pctNum + '%';
  document.getElementById('output-bar-fill').style.width = pctNum + '%';

  let verdictEmoji = '';
  if (pctNum < 20) verdictEmoji = s.noLabel;
  else if (pctNum < 50) verdictEmoji = 'Leaning: ' + s.noLabel;
  else if (pctNum < 75) verdictEmoji = 'Leaning: ' + s.yesLabel;
  else verdictEmoji = s.yesLabel;
  document.getElementById('output-verdict').textContent = verdictEmoji;

  // Math display
  const parts = state.scenario.inputs.map((inp, i) => {
    const norm = (state.inputValues[i] / inp.range[1]).toFixed(2);
    return `${inp.weight.toFixed(2)}×${norm}`;
  });
  const fnName = state.activationFn === 'sigmoid' ? 'σ' : state.activationFn === 'step' ? 'step' : 'ReLU';
  document.getElementById('math-display').textContent =
    `z = ${parts.join(' + ')} + ${state.bias >= 0 ? '+' : ''}${state.bias.toFixed(1)} = ${state.rawZ.toFixed(3)} → ${fnName}(z) = ${p.toFixed(4)}`;

  // Full-page effects
  applyEffects(p);

  // Crash check
  if (p >= 0.95 && !state.crashed) {
    triggerCrash();
  }

  // Update two-neuron
  updateTwoNeuron();
}

/* ═══════════════════════════════════════════════════════════════
   FULL-PAGE VISUAL EFFECTS
   ═══════════════════════════════════════════════════════════════ */
function applyEffects(p) {
  // Only apply blur at very high probability (>85%), and keep it subtle
  // Blur everything EXCEPT the input sliders so users can still adjust values
  const blurAmount = p > 0.85 ? (p - 0.85) * 20 : 0;
  const sat = p > 0.7 ? 1 - (p - 0.7) * 1.5 : 1;
  const filterVal = blurAmount > 0 ? `blur(${blurAmount}px) saturate(${sat})` : '';
  document.getElementById('app').style.filter = '';
  document.querySelector('header').style.filter = filterVal;
  document.querySelector('.network-area').style.filter = filterVal;
  document.querySelector('.results-panel').style.filter = filterVal;
  document.querySelector('.math-strip').style.filter = filterVal;
  document.querySelector('.tabs-section').style.filter = filterVal;

  // Vignette — only at higher probabilities
  const vigSpread = p > 0.5 ? (p - 0.5) * 300 : 0;
  const vigAlpha = p > 0.5 ? (p - 0.5) * 1.2 : 0;
  document.getElementById('vignette-overlay').style.boxShadow =
    vigSpread > 0 ? `inset 0 0 ${vigSpread}px rgba(0,0,0,${vigAlpha})` : 'none';

  // Grain — only at higher probabilities
  document.getElementById('grain-overlay').style.opacity = p > 0.6 ? (p - 0.6) * 0.6 : 0;

  // Darken — only at higher probabilities
  document.getElementById('darken-overlay').style.background = p > 0.6 ? `rgba(5,5,15,${(p - 0.6) * 1.2})` : 'transparent';
}

/* ═══════════════════════════════════════════════════════════════
   CRASH TRANSITION
   ═══════════════════════════════════════════════════════════════ */
function triggerCrash() {
  state.crashed = true;
  document.getElementById('crash-overlay').classList.add('active');
  startDreamParticles();
}

function wakeUp() {
  state.crashed = false;
  document.getElementById('crash-overlay').classList.remove('active');
  showToast(state.scenario.wakeText);
}

/* ═══════════════════════════════════════════════════════════════
   DREAM PARTICLES (crash screen)
   ═══════════════════════════════════════════════════════════════ */
let dreamParticles = [];
function startDreamParticles() {
  const canvas = document.getElementById('dream-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  dreamParticles = [];
  for (let i = 0; i < 60; i++) {
    dreamParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      color: ['#00ffff','#ff00ff','#39ff14','#ffdd00','#bf5af2'][Math.floor(Math.random() * 5)],
      alpha: Math.random() * 0.5 + 0.1,
    });
  }
  function animDream() {
    if (!state.crashed) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() / 6000;
    // sleep wave
    ctx.strokeStyle = `rgba(0,255,255,${0.08 + Math.sin(t) * 0.04})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 4) {
      ctx.lineTo(x, canvas.height / 2 + Math.sin(x / 80 + t * Math.PI * 2) * 30);
    }
    ctx.stroke();
    // particles
    dreamParticles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(animDream);
  }
  animDream();
}

/* ═══════════════════════════════════════════════════════════════
   NEURAL NETWORK CANVAS
   ═══════════════════════════════════════════════════════════════ */
const networkCanvas = document.getElementById('network-canvas');
const nCtx = networkCanvas.getContext('2d');

// Node positions (relative 0-1)
const NODES = {
  prefrontal: { x: 0.5, y: 0.12 },
  prefL: { x: 0.32, y: 0.18 },
  prefR: { x: 0.68, y: 0.18 },
  temporal: { x: 0.15, y: 0.4 },
  parietal: { x: 0.85, y: 0.4 },
  gate: { x: 0.5, y: 0.5 },
  reticularL: { x: 0.22, y: 0.65 },
  reticularR: { x: 0.78, y: 0.65 },
  brainstemL: { x: 0.42, y: 0.85 },
  brainstemR: { x: 0.58, y: 0.85 },
  brainstemC: { x: 0.5, y: 0.92 },
};

const EDGES = [
  ['prefrontal', 'prefL'], ['prefrontal', 'prefR'],
  ['prefL', 'temporal'], ['prefL', 'gate'],
  ['prefR', 'parietal'], ['prefR', 'gate'],
  ['temporal', 'gate'], ['parietal', 'gate'],
  ['temporal', 'reticularL'], ['parietal', 'reticularR'],
  ['gate', 'reticularL'], ['gate', 'reticularR'],
  ['reticularL', 'brainstemL'], ['reticularR', 'brainstemR'],
  ['brainstemL', 'brainstemC'], ['brainstemR', 'brainstemC'],
  ['gate', 'brainstemC'],
];

// Region -> node mapping for input-to-region
const REGION_NODES = {
  brainstem: 'brainstemC',
  prefrontal: 'prefrontal',
  reticular: 'gate',
  temporal: 'temporal',
  parietal: 'parietal',
};

// Particles
let particles = [];
const MAX_PARTICLES = 300;

function spawnParticles() {
  const s = state.scenario;
  if (!s) return;
  const w = networkCanvas._lw || networkCanvas.width;
  const h = networkCanvas._lh || networkCanvas.height;

  s.inputs.forEach((inp, i) => {
    const val = state.inputValues[i];
    const norm = val / inp.range[1];
    const count = Math.floor(norm * 8);
    const targetNode = NODES[REGION_NODES[inp.region]];
    // Spawn from slider side
    const isLeft = i < 3;
    for (let j = 0; j < count; j++) {
      if (particles.length >= MAX_PARTICLES) return;
      const startX = isLeft ? 0 : w;
      const startY = h * (0.15 + (i % 3) * 0.25) + (Math.random() - 0.5) * 30;
      const endX = targetNode.x * w;
      const endY = targetNode.y * h;
      const cpx = (startX + endX) / 2 + (Math.random() - 0.5) * 80;
      const cpy = (startY + endY) / 2 + (Math.random() - 0.5) * 80;
      particles.push({
        t: 0,
        speed: (0.003 + Math.random() * 0.005) * (1 / (1 + state.probability * 2)),
        sx: startX, sy: startY,
        cpx, cpy,
        ex: endX, ey: endY,
        color: inp.color,
        r: 2 + norm * 2,
        alpha: 0.6 + norm * 0.4,
      });
    }
  });
}

function bezier(t, p0, p1, p2) {
  const it = 1 - t;
  return it * it * p0 + 2 * it * t * p1 + t * t * p2;
}

function drawNetwork() {
  const w = networkCanvas._lw || networkCanvas.width;
  const h = networkCanvas._lh || networkCanvas.height;
  nCtx.save();
  nCtx.setTransform(1, 0, 0, 1, 0, 0);
  nCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
  nCtx.restore();

  const p = state.probability;
  const t = Date.now() / 1000;

  // Determine pulse cycle based on probability
  let pulseCycle = 1;
  if (p < 0.2) pulseCycle = 1;
  else if (p < 0.5) pulseCycle = 1.5;
  else if (p < 0.75) pulseCycle = 2.5;
  else if (p < 0.9) pulseCycle = 4;
  else pulseCycle = 6;

  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / pulseCycle);
  const brightness = Math.max(0.1, 1 - p * 0.9);
  const nodeBrightness = brightness * (0.7 + pulse * 0.3);

  // Draw edges
  EDGES.forEach(([a, b]) => {
    const na = NODES[a];
    const nb = NODES[b];
    nCtx.beginPath();
    nCtx.moveTo(na.x * w, na.y * h);
    nCtx.lineTo(nb.x * w, nb.y * h);
    const alpha = brightness * (0.3 + pulse * 0.2);
    nCtx.strokeStyle = `rgba(0,255,255,${alpha * 0.6})`;
    nCtx.lineWidth = 1.5 + pulse;
    nCtx.shadowColor = 'rgba(0,255,255,0.3)';
    nCtx.shadowBlur = 8;
    nCtx.stroke();
    nCtx.shadowBlur = 0;

    // Pulse dot traveling along edge
    const pulseT = (t / pulseCycle) % 1;
    const px = na.x * w + (nb.x * w - na.x * w) * pulseT;
    const py = na.y * h + (nb.y * h - na.y * h) * pulseT;
    nCtx.beginPath();
    nCtx.arc(px, py, 2.5, 0, Math.PI * 2);
    nCtx.fillStyle = `rgba(255,0,255,${alpha * 0.9})`;
    nCtx.shadowColor = 'rgba(255,0,255,0.5)';
    nCtx.shadowBlur = 10;
    nCtx.fill();
    nCtx.shadowBlur = 0;
  });

  // Draw nodes
  Object.entries(NODES).forEach(([name, node]) => {
    const nx = node.x * w;
    const ny = node.y * h;
    const isGate = name === 'gate';
    const r = isGate ? 18 : 8;

    // Glow
    const glow = nCtx.createRadialGradient(nx, ny, 0, nx, ny, r * 3);
    glow.addColorStop(0, `rgba(0,255,255,${nodeBrightness * 0.5})`);
    glow.addColorStop(1, 'rgba(0,255,255,0)');
    nCtx.beginPath();
    nCtx.arc(nx, ny, r * 3, 0, Math.PI * 2);
    nCtx.fillStyle = glow;
    nCtx.fill();

    // Core
    nCtx.beginPath();
    nCtx.arc(nx, ny, r, 0, Math.PI * 2);
    if (isGate) {
      const gateSize = 1 - p * 0.6;
      nCtx.save();
      nCtx.translate(nx, ny);
      nCtx.scale(gateSize, gateSize);
      nCtx.translate(-nx, -ny);
      nCtx.arc(nx, ny, r, 0, Math.PI * 2);
      nCtx.fillStyle = `rgba(255,0,255,${nodeBrightness})`;
      nCtx.shadowColor = 'rgba(255,0,255,0.6)';
      nCtx.shadowBlur = 15;
      nCtx.fill();
      nCtx.strokeStyle = `rgba(255,221,0,${nodeBrightness})`;
      nCtx.lineWidth = 2;
      nCtx.stroke();
      nCtx.shadowBlur = 0;
      nCtx.restore();
      // Label
      nCtx.font = '10px "Space Grotesk"';
      nCtx.fillStyle = `rgba(255,221,0,${nodeBrightness * 0.9})`;
      nCtx.shadowColor = 'rgba(255,221,0,0.4)';
      nCtx.shadowBlur = 8;
      nCtx.textAlign = 'center';
      nCtx.fillText('THE GATE', nx, ny + r + 16);
      nCtx.shadowBlur = 0;
    } else {
      nCtx.fillStyle = `rgba(0,255,255,${nodeBrightness * 0.8})`;
      nCtx.shadowColor = 'rgba(0,255,255,0.5)';
      nCtx.shadowBlur = 10;
      nCtx.fill();
      nCtx.strokeStyle = `rgba(191,90,242,${nodeBrightness * 0.7})`;
      nCtx.lineWidth = 1.5;
      nCtx.stroke();
      nCtx.shadowBlur = 0;
    }
  });

  // Region labels
  const labels = [
    { text: 'Prefrontal', x: 0.5, y: 0.05 },
    { text: 'Temporal', x: 0.08, y: 0.4 },
    { text: 'Parietal', x: 0.92, y: 0.4 },
    { text: 'Reticular', x: 0.5, y: 0.72 },
    { text: 'Brainstem', x: 0.5, y: 0.98 },
  ];
  nCtx.font = '10px "Inter"';
  nCtx.textAlign = 'center';
  labels.forEach(l => {
    nCtx.fillStyle = `rgba(136,136,204,${brightness * 0.6})`;
    nCtx.shadowColor = 'rgba(0,255,255,0.2)';
    nCtx.shadowBlur = 4;
    nCtx.fillText(l.text, l.x * w, l.y * h);
    nCtx.shadowBlur = 0;
  });

  // Draw particles
  particles.forEach(pt => {
    const px = bezier(pt.t, pt.sx, pt.cpx, pt.ex);
    const py = bezier(pt.t, pt.sy, pt.cpy, pt.ey);
    nCtx.beginPath();
    nCtx.arc(px, py, pt.r, 0, Math.PI * 2);
    nCtx.fillStyle = pt.color;
    nCtx.globalAlpha = pt.alpha * (1 - pt.t * 0.5);
    nCtx.fill();
    nCtx.globalAlpha = 1;
  });

  // Update particles
  particles = particles.filter(pt => {
    pt.t += pt.speed;
    return pt.t < 1;
  });

  // Spawn new
  if (Math.random() < 0.3) spawnParticles();
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVATION CURVE CANVAS
   ═══════════════════════════════════════════════════════════════ */
function drawCurve() {
  const canvas = document.getElementById('curve-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas._lw || canvas.width;
  const h = canvas._lh || canvas.height;
  ctx.clearRect(0, 0, w, h);

  const pad = 30;
  const plotW = w - pad * 2;
  const plotH = h - pad * 2;

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad);
  ctx.stroke();

  // Labels
  ctx.font = '9px "JetBrains Mono"';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'center';
  ctx.fillText('-5', pad, h - pad + 14);
  ctx.fillText('0', pad + plotW / 2, h - pad + 14);
  ctx.fillText('5', w - pad, h - pad + 14);
  ctx.textAlign = 'right';
  ctx.fillText('1', pad - 4, pad + 4);
  ctx.fillText('0', pad - 4, h - pad + 4);

  // 50% line
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(pad, pad + plotH / 2);
  ctx.lineTo(w - pad, pad + plotH / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const fns = state.compareAll
    ? [{ fn: 'sigmoid', color: '#ff00ff' }, { fn: 'step', color: '#ffdd00' }, { fn: 'relu', color: '#00ffff' }]
    : [{ fn: state.activationFn, color: state.activationFn === 'sigmoid' ? '#ff00ff' : state.activationFn === 'step' ? '#ffdd00' : '#00ffff' }];

  fns.forEach(({ fn, color }) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let px = 0; px <= plotW; px++) {
      const z = (px / plotW) * 10 - 5;
      const y = activate(z, fn);
      const cy = pad + plotH * (1 - y);
      if (px === 0) ctx.moveTo(pad + px, cy);
      else ctx.lineTo(pad + px, cy);
    }
    ctx.stroke();
  });

  // Current z marker
  const zNorm = (state.rawZ + 5) / 10;
  const markerX = pad + zNorm * plotW;
  const markerY = pad + plotH * (1 - state.probability);
  ctx.beginPath();
  ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#39ff14';
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

/* ═══════════════════════════════════════════════════════════════
   DECISION BOUNDARY HEATMAP
   ═══════════════════════════════════════════════════════════════ */
function drawDecisionBoundary() {
  const canvas = document.getElementById('db-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas._lw || canvas.width;
  const h = canvas._lh || canvas.height;
  ctx.clearRect(0, 0, w, h);

  const s = state.scenario;
  const xi = state.dbXIdx;
  const yi = state.dbYIdx;
  const pad = 40;
  const pw = w - pad * 2;
  const ph = h - pad * 2;
  const res = 50;

  for (let gx = 0; gx < res; gx++) {
    for (let gy = 0; gy < res; gy++) {
      const xVal = s.inputs[xi].range[0] + (gx / res) * (s.inputs[xi].range[1] - s.inputs[xi].range[0]);
      const yVal = s.inputs[yi].range[0] + (gy / res) * (s.inputs[yi].range[1] - s.inputs[yi].range[0]);

      let z = state.bias;
      for (let i = 0; i < s.inputs.length; i++) {
        const norm = (i === xi ? xVal : i === yi ? yVal : state.inputValues[i]) / s.inputs[i].range[1];
        z += norm * s.inputs[i].weight;
      }
      const prob = sigmoid(z);

      // Cyan -> Dark -> Magenta (neon heatmap)
      let r, g, b;
      if (prob < 0.5) {
        const t = prob / 0.5;
        r = Math.round(0 + 20 * t);
        g = Math.round(255 * (1 - t) * 0.6);
        b = Math.round(255 * (1 - t));
      } else {
        const t = (prob - 0.5) / 0.5;
        r = Math.round(20 + 235 * t);
        g = Math.round(0);
        b = Math.round(0 + 255 * t);
      }

      const cellW = pw / res;
      const cellH = ph / res;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(pad + gx * cellW, pad + (res - 1 - gy) * cellH, cellW + 1, cellH + 1);
    }
  }

  // Decision boundary contour (50% line)
  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  let started = false;
  for (let gx = 0; gx < res; gx++) {
    const xVal = s.inputs[xi].range[0] + (gx / res) * (s.inputs[xi].range[1] - s.inputs[xi].range[0]);
    // find y where prob = 0.5 (z = 0)
    let otherSum = state.bias;
    for (let i = 0; i < s.inputs.length; i++) {
      if (i === xi) { otherSum += (xVal / s.inputs[i].range[1]) * s.inputs[i].weight; }
      else if (i === yi) continue;
      else { otherSum += (state.inputValues[i] / s.inputs[i].range[1]) * s.inputs[i].weight; }
    }
    const wy = s.inputs[yi].weight;
    const yMax = s.inputs[yi].range[1];
    if (wy === 0) continue;
    const yVal = (-otherSum / wy) * yMax;
    if (yVal >= s.inputs[yi].range[0] && yVal <= yMax) {
      const px = pad + (gx / res) * pw;
      const py = pad + ph - ((yVal - s.inputs[yi].range[0]) / (yMax - s.inputs[yi].range[0])) * ph;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Current position crosshair
  const curXNorm = (state.inputValues[xi] - s.inputs[xi].range[0]) / (s.inputs[xi].range[1] - s.inputs[xi].range[0]);
  const curYNorm = (state.inputValues[yi] - s.inputs[yi].range[0]) / (s.inputs[yi].range[1] - s.inputs[yi].range[0]);
  const curPx = pad + curXNorm * pw;
  const curPy = pad + (1 - curYNorm) * ph;

  const probColor = state.probability < 0.5 ? '#00ffff' : '#ff00ff';
  ctx.beginPath();
  ctx.arc(curPx, curPy, 7, 0, Math.PI * 2);
  ctx.fillStyle = probColor;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Crosshair lines
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(curPx, pad); ctx.lineTo(curPx, pad + ph); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad, curPy); ctx.lineTo(pad + pw, curPy); ctx.stroke();
  ctx.setLineDash([]);

  // Axes labels
  ctx.font = '11px "Inter"';
  ctx.fillStyle = '#e8e8f0';
  ctx.textAlign = 'center';
  ctx.fillText(s.inputs[xi].name, pad + pw / 2, h - 4);
  ctx.save();
  ctx.translate(12, pad + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(s.inputs[yi].name, 0, 0);
  ctx.restore();

  // Range labels
  ctx.font = '9px "JetBrains Mono"';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'left';
  ctx.fillText(s.inputs[xi].range[0], pad, h - pad + 14);
  ctx.textAlign = 'right';
  ctx.fillText(s.inputs[xi].range[1], w - pad, h - pad + 14);
  ctx.textAlign = 'right';
  ctx.fillText(s.inputs[yi].range[0], pad - 4, h - pad + 4);
  ctx.fillText(s.inputs[yi].range[1], pad - 4, pad + 4);
}

/* ═══════════════════════════════════════════════════════════════
   SENSITIVITY ANALYSIS
   ═══════════════════════════════════════════════════════════════ */
function drawSensitivity() {
  const canvas = document.getElementById('sens-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas._lw || canvas.width;
  const h = canvas._lh || canvas.height;
  ctx.clearRect(0, 0, w, h);

  const s = state.scenario;
  const pad = 50;
  const pw = w - pad * 2;
  const ph = h - pad * 2;

  if (state.sensMode === 'lines') {
    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

    ctx.font = '9px "JetBrains Mono"';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    ctx.fillText('0', pad, h - pad + 14);
    ctx.fillText('0.5', pad + pw / 2, h - pad + 14);
    ctx.fillText('1.0', w - pad, h - pad + 14);
    ctx.textAlign = 'right';
    ctx.fillText('1.0', pad - 4, pad + 4);
    ctx.fillText('0.5', pad - 4, pad + ph / 2 + 4);
    ctx.fillText('0', pad - 4, h - pad + 4);

    s.inputs.forEach((inp, i) => {
      ctx.beginPath();
      ctx.strokeStyle = inp.color;
      ctx.lineWidth = 2;
      for (let px = 0; px <= pw; px++) {
        const normSweep = px / pw;
        let z = state.bias;
        for (let j = 0; j < s.inputs.length; j++) {
          const norm = j === i ? normSweep : state.inputValues[j] / s.inputs[j].range[1];
          z += norm * s.inputs[j].weight;
        }
        const prob = sigmoid(z);
        const cy = pad + ph * (1 - prob);
        if (px === 0) ctx.moveTo(pad + px, cy);
        else ctx.lineTo(pad + px, cy);
      }
      ctx.stroke();

      // Current position marker
      const curNorm = state.inputValues[i] / inp.range[1];
      const curX = pad + curNorm * pw;
      let z = state.bias;
      for (let j = 0; j < s.inputs.length; j++) {
        z += (state.inputValues[j] / s.inputs[j].range[1]) * s.inputs[j].weight;
      }
      const curY = pad + ph * (1 - sigmoid(z));
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = inp.color;
      ctx.globalAlpha = 0.4;
      ctx.moveTo(curX, h - pad);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // Legend
    s.inputs.forEach((inp, i) => {
      const ly = pad + i * 14;
      ctx.fillStyle = inp.color;
      ctx.fillRect(w - pad - 10, ly, 8, 8);
      ctx.font = '9px "Inter"';
      ctx.textAlign = 'right';
      ctx.fillText(inp.name, w - pad - 14, ly + 8);
    });

  } else {
    // Bar chart
    const sorted = s.inputs.map((inp, i) => ({ ...inp, idx: i })).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
    const barH = ph / sorted.length - 8;
    const maxW = Math.max(...sorted.map(s => Math.abs(s.weight)));

    sorted.forEach((inp, i) => {
      const y = pad + i * (barH + 8);
      const barW = (Math.abs(inp.weight) / maxW) * (pw - 120);

      ctx.fillStyle = inp.color;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(pad + 100, y, barW, barH);
      ctx.globalAlpha = 1;
      ctx.fillRect(pad + 100, y, barW, barH);
      ctx.globalAlpha = 0.8;
      ctx.fillRect(pad + 100, y, barW, barH);
      ctx.globalAlpha = 1;

      ctx.font = '11px "Inter"';
      ctx.fillStyle = '#e8e8f0';
      ctx.textAlign = 'right';
      ctx.fillText(inp.name, pad + 94, y + barH / 2 + 4);

      ctx.font = '11px "JetBrains Mono"';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'left';
      ctx.fillText(inp.weight.toFixed(2), pad + 104 + barW, y + barH / 2 + 4);
    });
  }

  // Info
  const sortedByWeight = [...s.inputs].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  document.getElementById('sens-info').textContent =
    `Most Influential: ${sortedByWeight[0].name} (${sortedByWeight[0].weight.toFixed(2)}) | Least: ${sortedByWeight[sortedByWeight.length - 1].name} (${sortedByWeight[sortedByWeight.length - 1].weight.toFixed(2)})`;
}

/* ═══════════════════════════════════════════════════════════════
   TWO-NEURON CHAIN
   ═══════════════════════════════════════════════════════════════ */
function updateTwoNeuron() {
  const a1 = state.probability;
  document.getElementById('n1-output').textContent = a1.toFixed(4);

  const bed = state.n2Bed / 10;
  const social = state.n2Social / 10;
  const tomorrow = state.n2Tomorrow / 10;
  const w12 = state.synapseWeight;
  const z2 = w12 * a1 + 0.3 * bed + 0.25 * social + 0.3 * tomorrow + state.n2Bias;
  const a2 = sigmoid(z2);
  document.getElementById('n2-final').textContent = a2.toFixed(4);

  document.getElementById('n2-math').textContent =
    `z₁ = ${state.rawZ.toFixed(3)} → a₁ = σ(z₁) = ${a1.toFixed(4)} | z₂ = ${w12.toFixed(1)}×${a1.toFixed(3)} + 0.30×${bed.toFixed(2)} + 0.25×${social.toFixed(2)} + 0.30×${tomorrow.toFixed(2)} + (${state.n2Bias.toFixed(1)}) = ${z2.toFixed(3)} → σ(z₂) = ${a2.toFixed(4)}`;

  drawSynapse(a1, w12);
}

function drawSynapse(signal, weight) {
  const canvas = document.getElementById('synapse-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas._lw || canvas.width;
  const h = canvas._lh || canvas.height;
  ctx.clearRect(0, 0, w, h);

  const thickness = Math.abs(weight) * 4 + 1;
  const t = Date.now() / 1000;

  // Connection line
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.strokeStyle = weight > 0 ? `rgba(0,255,255,${0.3 + signal * 0.5})` : `rgba(255,0,255,${0.3 + signal * 0.5})`;
  ctx.shadowColor = weight > 0 ? 'rgba(0,255,255,0.4)' : 'rgba(255,0,255,0.4)';
  ctx.shadowBlur = 10;
  ctx.lineWidth = thickness;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Pulse traveling
  const pulseY = (t * 40) % h;
  ctx.beginPath();
  ctx.arc(w / 2, pulseY, thickness + 2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(57,255,20,${signal * 0.9})`;
  ctx.shadowColor = 'rgba(57,255,20,0.5)';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Arrow
  ctx.beginPath();
  ctx.moveTo(w / 2 - 6, h - 10);
  ctx.lineTo(w / 2, h);
  ctx.lineTo(w / 2 + 6, h - 10);
  ctx.fillStyle = 'rgba(0,255,255,0.7)';
  ctx.fill();
}

/* ═══════════════════════════════════════════════════════════════
   TRAINING MODE
   ═══════════════════════════════════════════════════════════════ */
function initTraining() {
  state.trainingPoints = [];
  state.trainSteps = 0;
  const s = state.scenario;
  state.trainWeights = s.inputs.map(inp => inp.weight);
  state.trainBias = state.bias;
  updateTrainStats();
}

function trainStep(lr = 0.1) {
  if (state.trainingPoints.length === 0) return;
  const s = state.scenario;

  state.trainingPoints.forEach(pt => {
    let z = state.trainBias;
    for (let i = 0; i < s.inputs.length; i++) {
      z += state.trainWeights[i] * pt.features[i];
    }
    const pred = sigmoid(z);
    const error = pt.label - pred;
    const gradient = error * pred * (1 - pred);

    for (let i = 0; i < s.inputs.length; i++) {
      state.trainWeights[i] += lr * gradient * pt.features[i];
    }
    state.trainBias += lr * gradient;
  });

  state.trainSteps++;
  updateTrainStats();
}

function getTrainAccuracy() {
  if (state.trainingPoints.length === 0) return null;
  const s = state.scenario;
  let correct = 0;
  state.trainingPoints.forEach(pt => {
    let z = state.trainBias;
    for (let i = 0; i < s.inputs.length; i++) {
      z += state.trainWeights[i] * pt.features[i];
    }
    const pred = sigmoid(z) >= 0.5 ? 1 : 0;
    if (pred === pt.label) correct++;
  });
  return correct / state.trainingPoints.length;
}

function updateTrainStats() {
  const acc = getTrainAccuracy();
  document.getElementById('train-acc').textContent = acc !== null ? (acc * 100).toFixed(0) + '%' : '—';
  document.getElementById('train-steps').textContent = state.trainSteps;
  document.getElementById('train-points').textContent = state.trainingPoints.length;

  if (acc === 1 && state.trainingPoints.length >= 3) {
    document.getElementById('train-milestone').textContent = 'The neuron has learned your patterns!';
    document.getElementById('train-milestone').style.color = '#fbbf24';
  } else {
    document.getElementById('train-milestone').textContent = '';
  }
}

function drawTrainingCanvas() {
  const canvas = document.getElementById('training-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas._lw || canvas.width;
  const h = canvas._lh || canvas.height;
  ctx.clearRect(0, 0, w, h);

  const s = state.scenario;
  const xi = state.trainXIdx;
  const yi = state.trainYIdx;
  const pad = 40;
  const pw = w - pad * 2;
  const ph = h - pad * 2;
  const res = 40;

  // Heatmap using training weights
  for (let gx = 0; gx < res; gx++) {
    for (let gy = 0; gy < res; gy++) {
      const xNorm = gx / res;
      const yNorm = gy / res;

      let z = state.trainBias;
      for (let i = 0; i < s.inputs.length; i++) {
        const norm = i === xi ? xNorm : i === yi ? yNorm : state.inputValues[i] / s.inputs[i].range[1];
        z += norm * state.trainWeights[i];
      }
      const prob = sigmoid(z);

      let r, g, b;
      if (prob < 0.5) {
        const t = prob / 0.5;
        r = Math.round(0 + 20 * t);
        g = Math.round(255 * (1 - t) * 0.6);
        b = Math.round(255 * (1 - t));
      } else {
        const t = (prob - 0.5) / 0.5;
        r = Math.round(20 + 235 * t);
        g = Math.round(0);
        b = Math.round(0 + 255 * t);
      }

      const cellW = pw / res;
      const cellH = ph / res;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(pad + gx * cellW, pad + (res - 1 - gy) * cellH, cellW + 1, cellH + 1);
    }
  }

  // Training points
  state.trainingPoints.forEach(pt => {
    const px = pad + pt.features[xi] * pw;
    const py = pad + (1 - pt.features[yi]) * ph;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = pt.label === 1 ? '#ff00ff' : '#00ffff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Check if misclassified
    let z = state.trainBias;
    for (let i = 0; i < s.inputs.length; i++) {
      z += state.trainWeights[i] * pt.features[i];
    }
    const pred = sigmoid(z) >= 0.5 ? 1 : 0;
    if (pred !== pt.label) {
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // Axes
  ctx.font = '11px "Inter"';
  ctx.fillStyle = '#e8e8f0';
  ctx.textAlign = 'center';
  ctx.fillText(s.inputs[xi].name, pad + pw / 2, h - 4);
  ctx.save();
  ctx.translate(12, pad + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(s.inputs[yi].name, 0, 0);
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════
   CANVAS RESIZE
   ═══════════════════════════════════════════════════════════════ */
function resizeCanvases() {
  const dpr = window.devicePixelRatio || 1;

  // DPR-aware sizing for layout-driven canvases
  function sizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._lw = rect.width;
    canvas._lh = rect.height;
  }

  sizeCanvas(networkCanvas);

  // Curve canvas — sized by CSS
  const curveCanvas = document.getElementById('curve-canvas');
  sizeCanvas(curveCanvas);

  // Fixed-size canvases (explicit CSS width/height)
  const dbCanvas = document.getElementById('db-canvas');
  dbCanvas.width = Math.min(500, dbCanvas.parentElement.clientWidth);
  dbCanvas.height = 400;
  dbCanvas._lw = dbCanvas.width;
  dbCanvas._lh = dbCanvas.height;

  const sensCanvas = document.getElementById('sens-canvas');
  sensCanvas.width = Math.min(600, sensCanvas.parentElement.clientWidth);
  sensCanvas.height = 300;
  sensCanvas._lw = sensCanvas.width;
  sensCanvas._lh = sensCanvas.height;

  const synCanvas = document.getElementById('synapse-canvas');
  synCanvas.width = 80;
  synCanvas.height = 200;
  synCanvas._lw = 80;
  synCanvas._lh = 200;

  const trainCanvas = document.getElementById('training-canvas');
  trainCanvas.width = Math.min(400, trainCanvas.parentElement.clientWidth);
  trainCanvas.height = 350;
  trainCanvas._lw = trainCanvas.width;
  trainCanvas._lh = trainCanvas.height;
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════════ */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN ANIMATION LOOP
   ═══════════════════════════════════════════════════════════════ */
function mainLoop() {
  if (!state.crashed) {
    drawNetwork();
    drawCurve();
    // Only draw visible panel
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
      const tabId = activeTab.dataset.tab;
      if (tabId === 'boundary') drawDecisionBoundary();
      else if (tabId === 'sensitivity') drawSensitivity();
      else if (tabId === 'training') drawTrainingCanvas();
    }
    updateTwoNeuron();
  }
  requestAnimationFrame(mainLoop);
}

/* ═══════════════════════════════════════════════════════════════
   CREATE SCENARIO MODAL
   ═══════════════════════════════════════════════════════════════ */
function openCreateModal() {
  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('custom-title').value = '';
  document.getElementById('custom-emoji').value = '';
  document.getElementById('custom-yes').value = '';
  document.getElementById('custom-no').value = '';
  document.getElementById('custom-threshold-text').value = '';
  const list = document.getElementById('modal-inputs-list');
  list.innerHTML = '';
  for (let i = 0; i < 3; i++) addModalInput();
}

function addModalInput() {
  const list = document.getElementById('modal-inputs-list');
  if (list.children.length >= 7) return;
  const row = document.createElement('div');
  row.className = 'modal-input-row';
  row.innerHTML = `
    <input type="text" placeholder="Name">
    <input type="number" placeholder="Min" value="0">
    <input type="number" placeholder="Max" value="10">
    <select><option value="+">Positive (+)</option><option value="-">Negative (-)</option></select>
  `;
  list.appendChild(row);
}

function saveCustomScenario() {
  const title = document.getElementById('custom-title').value.trim();
  const emoji = document.getElementById('custom-emoji').value.trim() || '🧠';
  const yes = document.getElementById('custom-yes').value.trim() || 'Yes';
  const no = document.getElementById('custom-no').value.trim() || 'No';
  const threshText = document.getElementById('custom-threshold-text').value.trim() || 'Threshold reached!';

  const rows = document.querySelectorAll('#modal-inputs-list .modal-input-row');
  const inputs = [];
  const colors = ['#a78bfa', '#60a5fa', '#4ade80', '#f97316', '#fbbf24', '#ef4444', '#ec4899'];
  const regions = ['prefrontal', 'temporal', 'parietal', 'reticular', 'brainstem'];
  const behaviors = ['chaotic', 'drifting', 'sluggish', 'fading', 'heavy'];

  rows.forEach((row, i) => {
    const fields = row.querySelectorAll('input, select');
    const name = fields[0].value.trim();
    if (!name) return;
    const min = parseInt(fields[1].value) || 0;
    const max = parseInt(fields[2].value) || 10;
    const sign = fields[3].value;
    const baseWeight = 0.2 + Math.random() * 0.25;
    inputs.push({
      name, range: [min, max], unit: 'scale',
      weight: sign === '-' ? -baseWeight : baseWeight,
      region: regions[i % regions.length],
      color: colors[i % colors.length],
      particleBehavior: behaviors[i % behaviors.length],
      desc: '', default: Math.round((max - min) / 2),
    });
  });

  if (!title || inputs.length < 3) {
    showToast('Need a title and at least 3 inputs');
    return;
  }

  const scenario = {
    id: 'custom_' + Date.now(), emoji, title,
    yesLabel: yes, noLabel: no,
    biasName: 'Gut Feeling', biasDefault: 0,
    thresholdText: threshText, wakeText: 'Back to normal',
    inputs,
  };

  SCENARIOS.push(scenario);
  buildScenarioSelect();
  document.getElementById('scenario-select').value = scenario.id;
  loadScenario(scenario.id);
  document.getElementById('modal-backdrop').classList.remove('open');
  showToast(`Created: ${emoji} ${title}`);
}

/* ═══════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════ */
function setupEvents() {
  // Scenario select
  document.getElementById('scenario-select').addEventListener('change', e => {
    if (e.target.value === '__create__') {
      openCreateModal();
      e.target.value = state.scenario.id;
      return;
    }
    loadScenario(e.target.value);
  });

  // Bias slider
  document.getElementById('bias-slider').addEventListener('input', e => {
    state.bias = parseFloat(e.target.value);
    document.getElementById('bias-value').textContent = (state.bias >= 0 ? '+' : '') + state.bias.toFixed(1);
    computeProbability();
    updateUI();
  });

  // Activation function
  document.querySelectorAll('input[name="actfn"]').forEach(r => {
    r.addEventListener('change', e => {
      state.activationFn = e.target.value;
      computeProbability();
      updateUI();
    });
  });

  // Compare all
  document.getElementById('compare-all').addEventListener('change', e => {
    state.compareAll = e.target.checked;
  });

  // Wake button
  document.getElementById('wake-btn').addEventListener('click', wakeUp);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
      // Resize canvases after tab switch since hidden tabs have 0 dimensions
      requestAnimationFrame(() => resizeCanvases());
    });
  });

  // Decision boundary selects
  document.getElementById('db-x').addEventListener('change', e => { state.dbXIdx = parseInt(e.target.value); });
  document.getElementById('db-y').addEventListener('change', e => { state.dbYIdx = parseInt(e.target.value); });

  // Sensitivity toggle
  document.getElementById('sens-lines-btn').addEventListener('click', () => {
    state.sensMode = 'lines';
    document.getElementById('sens-lines-btn').classList.add('active');
    document.getElementById('sens-bars-btn').classList.remove('active');
  });
  document.getElementById('sens-bars-btn').addEventListener('click', () => {
    state.sensMode = 'bars';
    document.getElementById('sens-bars-btn').classList.add('active');
    document.getElementById('sens-lines-btn').classList.remove('active');
  });

  // Two-neuron sliders
  ['n2-bed', 'n2-social', 'n2-tomorrow'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      document.getElementById(id + '-val').textContent = val;
      if (id === 'n2-bed') state.n2Bed = val;
      if (id === 'n2-social') state.n2Social = val;
      if (id === 'n2-tomorrow') state.n2Tomorrow = val;
    });
  });
  document.getElementById('n2-bias').addEventListener('input', e => {
    state.n2Bias = parseFloat(e.target.value);
    document.getElementById('n2-bias-val').textContent = state.n2Bias.toFixed(1);
  });
  document.getElementById('synapse-weight').addEventListener('input', e => {
    state.synapseWeight = parseFloat(e.target.value);
    document.getElementById('synapse-val').textContent = state.synapseWeight.toFixed(1);
  });

  // Training
  document.getElementById('train-x').addEventListener('change', e => { state.trainXIdx = parseInt(e.target.value); });
  document.getElementById('train-y').addEventListener('change', e => { state.trainYIdx = parseInt(e.target.value); });

  document.getElementById('label-sleep').addEventListener('click', () => {
    state.trainLabel = 1;
    document.getElementById('label-sleep').classList.add('active-sleep');
    document.getElementById('label-awake').classList.remove('active-awake');
  });
  document.getElementById('label-awake').addEventListener('click', () => {
    state.trainLabel = 0;
    document.getElementById('label-awake').classList.add('active-awake');
    document.getElementById('label-sleep').classList.remove('active-sleep');
  });

  document.getElementById('training-canvas').addEventListener('click', e => {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const pad = 40;
    const lw = canvas._lw || rect.width;
    const lh = canvas._lh || rect.height;
    const pw = lw - pad * 2;
    const ph = lh - pad * 2;
    const xNorm = (px - pad) / pw;
    const yNorm = 1 - (py - pad) / ph;
    if (xNorm < 0 || xNorm > 1 || yNorm < 0 || yNorm > 1) return;

    const features = state.scenario.inputs.map((inp, i) => {
      if (i === state.trainXIdx) return xNorm;
      if (i === state.trainYIdx) return yNorm;
      return state.inputValues[i] / inp.range[1];
    });
    state.trainingPoints.push({ features, label: state.trainLabel });
    updateTrainStats();
  });

  document.getElementById('train-step').addEventListener('click', () => trainStep(0.5));
  document.getElementById('train-10').addEventListener('click', () => {
    for (let i = 0; i < 10; i++) trainStep(0.5);
  });
  document.getElementById('train-reset').addEventListener('click', initTraining);

  // Create modal
  document.getElementById('create-btn').addEventListener('click', openCreateModal);
  document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('modal-backdrop').classList.remove('open');
  });
  document.getElementById('add-input-btn').addEventListener('click', addModalInput);
  document.getElementById('modal-save').addEventListener('click', saveCustomScenario);

  // Help
  document.getElementById('help-btn').addEventListener('click', () => {
    showToast('Adjust sliders to see how a perceptron makes decisions!');
  });

  // Resize
  window.addEventListener('resize', () => {
    resizeCanvases();
  });
}

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
function init() {
  buildScenarioSelect();
  loadScenario('sleep');
  setupEvents();
  resizeCanvases();
  computeProbability();
  updateUI();
  requestAnimationFrame(mainLoop);
}

window.addEventListener('DOMContentLoaded', init);
