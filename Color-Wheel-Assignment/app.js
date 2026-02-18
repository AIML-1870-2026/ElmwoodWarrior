/* ==============================
   Chromatica — App Logic
   ============================== */

// ====== STATE ======
const state = {
  mode: 'rgb',        // 'rgb' | 'cmyk'
  view: '3d',         // '2d' | '3d'
  hue: 0,             // 0-360
  saturation: 100,    // 0-100
  lightness: 50,      // 0-100
  alpha: 100,         // 0-100
  kBlack: 0,          // 0-100 (CMYK K)
  colorA: '#ff0000',
  colorB: '#0000ff',
  settingWell: null,   // null | 'a' | 'b'
  mixRatio: 50,
  particleStyle: 'circles',
  history: JSON.parse(localStorage.getItem('chromatica-history') || '[]'),
  palette: [],
  paletteType: 'complementary',
  lockedSwatches: new Set(),
  paletteHistory: JSON.parse(localStorage.getItem('chromatica-palette-history') || '[]'),
  accessibleMode: false,
  accessibleBg: '#ffffff',
  wcagLevel: 'aa',
  contrastEnforcement: 'background',
  showContrastBadges: false,
  cvdMode: 'normal',
  checkerFg: '#000000',
  checkerBg: '#ffffff',
  widgetBgMode: 'white', // 'white' | 'black' | 'custom'
};

// ====== COLOR MATH UTILITIES ======
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToCmyk(r, g, b) {
  if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 100];
  const c1 = 1 - r / 255, m1 = 1 - g / 255, y1 = 1 - b / 255;
  const k = Math.min(c1, m1, y1);
  return [
    Math.round((c1 - k) / (1 - k) * 100),
    Math.round((m1 - k) / (1 - k) * 100),
    Math.round((y1 - k) / (1 - k) * 100),
    Math.round(k * 100)
  ];
}

function cmykToRgb(c, m, y, k) {
  c /= 100; m /= 100; y /= 100; k /= 100;
  return [
    Math.round(255 * (1 - c) * (1 - k)),
    Math.round(255 * (1 - m) * (1 - k)),
    Math.round(255 * (1 - y) * (1 - k))
  ];
}

function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getRelativeLuminance(...rgb1);
  const l2 = getRelativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function textColorForBg(r, g, b) {
  return getRelativeLuminance(r, g, b) > 0.179 ? '#000000' : '#ffffff';
}

function getCurrentRgb() {
  if (state.mode === 'cmyk') {
    const [r, g, b] = hslToRgb(state.hue, state.saturation, state.lightness);
    const [c, m, y] = rgbToCmyk(r, g, b);
    return cmykToRgb(c, m, y, state.kBlack);
  }
  return hslToRgb(state.hue, state.saturation, state.lightness);
}

function getCurrentHex() {
  const [r, g, b] = getCurrentRgb();
  if (state.alpha < 100) {
    const a = Math.round(state.alpha * 2.55).toString(16).padStart(2, '0');
    return rgbToHex(r, g, b) + a;
  }
  return rgbToHex(r, g, b);
}

function parseColorInput(str) {
  str = str.trim();
  // #hex
  const hexMatch = str.match(/^#?([0-9a-fA-F]{3,8})$/);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length >= 6) {
      const rgb = hexToRgb(h.substring(0, 6));
      return rgbToHsl(...rgb);
    }
  }
  // rgb(r, g, b)
  const rgbMatch = str.match(/rgb\w?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return rgbToHsl(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]);
  }
  // hsl(h, s%, l%)
  const hslMatch = str.match(/hsl\w?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)/i);
  if (hslMatch) {
    return [+hslMatch[1], +hslMatch[2], +hslMatch[3]];
  }
  return null;
}

function mixColors(hexA, hexB, ratio) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const t = ratio / 100;
  if (state.mode === 'cmyk') {
    // Subtractive mix
    const cmykA = rgbToCmyk(...a);
    const cmykB = rgbToCmyk(...b);
    const mixed = cmykA.map((v, i) => Math.round(v + (cmykB[i] - v) * t));
    return rgbToHex(...cmykToRgb(...mixed));
  }
  // Additive (RGB) linear interpolation
  const mixed = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return rgbToHex(...mixed);
}

// ====== DOM REFS ======
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  cursorOrb: $('#cursor-orb'),
  cursorTrail: $('#cursor-trail'),
  toast: $('#toast'),
  tabs: $$('.tab'),
  tabContents: $$('.tab-content'),
  modeToggle: $('#mode-toggle-btn'),
  view2dBtn: $('#view-2d-btn'),
  view3dBtn: $('#view-3d-btn'),
  wheel2d: $('#wheel-2d-container'),
  wheel3d: $('#wheel-3d-container'),
  wheelCanvas: $('#color-wheel'),
  wheelSelector: $('#wheel-selector'),
  kSliderRow: $('#k-slider-row'),
  kSlider: $('#k-slider'),
  kValue: $('#k-value'),
  alphaSlider: $('#alpha-slider'),
  alphaValue: $('#alpha-value'),
  rSlider: $('#r-slider'),
  gSlider: $('#g-slider'),
  bSlider: $('#b-slider'),
  rValue: $('#r-value'),
  gValue: $('#g-value'),
  bValue: $('#b-value'),
  eyedropperBtn: $('#eyedropper-btn'),
  randomColorBtn: $('#random-color-btn'),
  lightnessSlider: $('#lightness-slider'),
  lightnessValue: $('#lightness-value'),
  quickHarmonies: $('#quick-harmonies'),
  hexBadge: $('#hex-badge'),
  hexValue: $('#hex-value'),
  copyHexBtn: $('#copy-hex-btn'),
  hslValue: $('#hsl-value'),
  cmykValue: $('#cmyk-value'),
  hexInput: $('#hex-input'),
  hexGoBtn: $('#hex-go-btn'),
  widgetFg: $('#widget-fg'),
  widgetBg: $('#widget-bg'),
  widgetBgToggle: $('#widget-bg-toggle'),
  widgetRatio: $('#widget-ratio'),
  pillNormalAA: $('#pill-normal-aa'),
  pillNormalAAA: $('#pill-normal-aaa'),
  pillLargeAA: $('#pill-large-aa'),
  paletteType: $('#palette-type'),
  customNRow: $('#custom-n-row'),
  customN: $('#custom-n'),
  generatePaletteBtn: $('#generate-palette-btn'),
  accessibleModeToggle: $('#accessible-mode-toggle'),
  accessibleOptions: $('#accessible-options'),
  accessibleBg: $('#accessible-bg'),
  accessibleBgHex: $('#accessible-bg-hex'),
  showContrastToggle: $('#show-contrast-toggle'),
  paletteSwatches: $('#palette-swatches'),
  paletteSummary: $('#palette-summary'),
  contrastMatrixSection: $('#contrast-matrix-section'),
  toggleMatrixBtn: $('#toggle-matrix-btn'),
  contrastMatrix: $('#contrast-matrix'),
  exportJsonBtn: $('#export-json-btn'),
  exportCssBtn: $('#export-css-btn'),
  exportPngBtn: $('#export-png-btn'),
  checkerFg: $('#checker-fg'),
  checkerBg: $('#checker-bg'),
  checkerFgHex: $('#checker-fg-hex'),
  checkerBgHex: $('#checker-bg-hex'),
  checkerSwapBtn: $('#checker-swap-btn'),
  checkerRatio: $('#checker-ratio'),
  previewZone: $('#preview-zone'),
  findPassingBtn: $('#find-passing-btn'),
  cvdLabel: $('#cvd-label'),
  cvdModeName: $('#cvd-mode-name'),
  cvdCompareToggle: $('#cvd-compare-toggle'),
  cvdCompare: $('#cvd-compare'),
  cvdNormalCanvas: $('#cvd-normal-canvas'),
  cvdSimCanvas: $('#cvd-sim-canvas'),
  historySwatches: $('#history-swatches'),
  clearHistoryBtn: $('#clear-history-btn'),
  randomPaletteBtn: $('#random-palette-btn'),
  paletteHistoryList: $('#palette-history-list'),
  clearPaletteHistoryBtn: $('#clear-palette-history-btn'),
};

// ====== CUSTOM CURSOR ======
let cursorX = 0, cursorY = 0, trailX = 0, trailY = 0;

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  els.cursorOrb.style.left = cursorX + 'px';
  els.cursorOrb.style.top = cursorY + 'px';
});

function animateCursor() {
  trailX += (cursorX - trailX) * 0.15;
  trailY += (cursorY - trailY) * 0.15;
  els.cursorTrail.style.left = trailX + 'px';
  els.cursorTrail.style.top = trailY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

function updateCursorColor() {
  const [r, g, b] = getCurrentRgb();
  const hex = rgbToHex(r, g, b);
  const lum = getRelativeLuminance(r, g, b);
  const isDark = lum < 0.15;
  els.cursorOrb.style.background = hex;
  // Dark colors get a white border + white glow; light colors get a dark border
  if (isDark) {
    els.cursorOrb.style.borderColor = 'rgba(255, 255, 255, 0.9)';
    els.cursorOrb.style.boxShadow = `0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.25)`;
    els.cursorTrail.style.background = 'rgba(255, 255, 255, 0.15)';
  } else {
    els.cursorOrb.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    els.cursorOrb.style.boxShadow = `0 0 12px ${hex}80, 0 0 24px ${hex}40, 0 0 0 1px rgba(0,0,0,0.3)`;
    els.cursorTrail.style.background = hex + '40';
  }
}

// ====== TOAST ======
let toastTimeout;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  els.toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    els.toast.classList.remove('show');
    setTimeout(() => els.toast.classList.add('hidden'), 300);
  }, 2000);
}

// ====== CLIPBOARD ======
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${text} copied`);
  } catch {
    showToast('Copy failed');
  }
}

// ====== TABS ======
els.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    els.tabs.forEach(t => t.classList.remove('active'));
    els.tabContents.forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    $(`#tab-${tab.dataset.tab}`).classList.add('active');
    if (tab.dataset.tab === 'palettes') {
      renderQuickHarmonies();
    }
  });
});

// ====== COLOR WHEEL (2D) ======
const wheelCtx = els.wheelCanvas.getContext('2d');
const WHEEL_SIZE = 400;
const WHEEL_RADIUS = WHEEL_SIZE / 2;

function drawWheel() {
  const ctx = wheelCtx;
  const size = WHEEL_SIZE;
  const cx = size / 2, cy = size / 2;
  const outerR = cx - 4;

  ctx.clearRect(0, 0, size, size);
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > outerR) continue;

      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      const sat = (dist / outerR) * 100;
      const lightness = state.lightness;

      let r, g, b;
      if (state.mode === 'cmyk') {
        // CMY wheel
        const [rr, gg, bb] = hslToRgb(angle, sat, lightness);
        const [c, m, yy] = rgbToCmyk(rr, gg, bb);
        [r, g, b] = cmykToRgb(c, m, yy, state.kBlack);
      } else {
        [r, g, b] = hslToRgb(angle, sat, lightness);
      }

      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Circular mask
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

function updateWheelSelector() {
  const angle = (state.hue - 90) * (Math.PI / 180);
  const dist = (state.saturation / 100) * (WHEEL_RADIUS - 4);
  const x = WHEEL_RADIUS + Math.cos(angle) * dist;
  const y = WHEEL_RADIUS + Math.sin(angle) * dist;
  // Use percentage positioning so it scales with container
  els.wheelSelector.style.left = (x / WHEEL_SIZE * 100) + '%';
  els.wheelSelector.style.top = (y / WHEEL_SIZE * 100) + '%';
}

// Wheel interaction
let wheelDragging = false;

function wheelPickColor(clientX, clientY) {
  const rect = els.wheelCanvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const scaleX = WHEEL_SIZE / rect.width;
  const scaleY = WHEEL_SIZE / rect.height;
  const px = x * scaleX;
  const py = y * scaleY;
  const dx = px - WHEEL_RADIUS;
  const dy = py - WHEEL_RADIUS;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = WHEEL_RADIUS - 4;

  if (dist > maxR + 10) return;

  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;

  state.hue = Math.round(angle) % 360;
  state.saturation = Math.min(100, Math.round((dist / maxR) * 100));
  // Keep current lightness from slider instead of resetting to 50

  updateAll();
  addToHistory();
}

els.wheelCanvas.addEventListener('mousedown', (e) => {
  wheelDragging = true;
  wheelPickColor(e.clientX, e.clientY);
});
document.addEventListener('mousemove', (e) => {
  if (wheelDragging) wheelPickColor(e.clientX, e.clientY);
});
document.addEventListener('mouseup', () => { wheelDragging = false; });

// ====== 3D TORUS (Three.js) ======
let threeScene, threeCamera, threeRenderer, threeControls, torusMesh;
let threeInitialized = false;
let torusIndicator = null; // sphere mesh that sits on the torus surface
let THREE_REF = null; // store THREE module reference

async function initThree() {
  if (threeInitialized) return;
  threeInitialized = true;

  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

  const container = $('#torus-canvas-container');
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x0a0a12);

  const rect = container.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height, 400);

  threeCamera = new THREE.PerspectiveCamera(45, rect.width / rect.height || 1, 0.1, 100);
  threeCamera.position.set(0, 3.0, 7.0);

  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setSize(rect.width || size, rect.height || size);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(threeRenderer.domElement);

  threeControls = new OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping = true;
  threeControls.dampingFactor = 0.06;
  threeControls.rotateSpeed = 0.8;
  threeControls.minDistance = 2.5;
  threeControls.maxDistance = 12;
  threeControls.enablePan = false;

  // Torus geometry
  const geometry = new THREE.TorusGeometry(2.0, 0.75, 128, 256);

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    vec3 hsl2rgb(float h, float s, float l) {
      float c = (1.0 - abs(2.0 * l - 1.0)) * s;
      float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
      float m = l - c / 2.0;
      vec3 rgb;
      if      (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
      else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
      else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
      else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
      else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
      else                   rgb = vec3(c, 0.0, x);
      return rgb + m;
    }

    void main() {
      float hue = vUv.x;
      float phi = vUv.y * 2.0 * 3.14159265;

      // Full lightness range: true black (0.0) to true white (1.0)
      float lightness = 0.5 + 0.5 * sin(phi);
      // Saturation peaks at middle lightness, fades to 0 at white/black edges
      float satFalloff = 1.0 - pow(abs(2.0 * lightness - 1.0), 2.0);
      float saturation = satFalloff;

      vec3 color = hsl2rgb(hue, saturation, lightness);

      // Subtle rim lighting with color tint
      float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
      vec3 rimColor = hsl2rgb(hue + 0.1, 0.8, 0.6);
      color += rim * rimColor * 0.12;

      // Slight iridescent sheen
      float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), 2.0);
      color += fresnel * 0.06 * vec3(0.4, 0.6, 1.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
  });

  torusMesh = new THREE.Mesh(geometry, material);
  threeScene.add(torusMesh);

  THREE_REF = THREE;

  // Torus indicator sphere (child of torus so it rotates with it)
  const indicatorGeo = new THREE.SphereGeometry(0.07, 16, 16);
  const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  torusIndicator = new THREE.Mesh(indicatorGeo, indicatorMat);
  torusIndicator.visible = false;

  // Outer ring for visibility
  const ringGeo = new THREE.RingGeometry(0.09, 0.12, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const indicatorRing = new THREE.Mesh(ringGeo, ringMat);
  torusIndicator.add(indicatorRing);

  torusMesh.add(torusIndicator);

  // Raycasting
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  threeRenderer.domElement.addEventListener('click', (e) => {
    const rect = threeRenderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, threeCamera);
    const intersects = raycaster.intersectObject(torusMesh);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const uv = hit.uv;
      const hue = uv.x;
      const phi = uv.y * 2 * Math.PI;
      const lightness = 0.5 + 0.5 * Math.sin(phi);
      const satFalloff = 1.0 - Math.pow(Math.abs(2.0 * lightness - 1.0), 2.0);
      const saturation = satFalloff;

      state.hue = Math.round(hue * 360) % 360;
      state.saturation = Math.round(saturation * 100);
      state.lightness = Math.round(lightness * 100);

      updateAll();
      addToHistory();
      updateTorusIndicator();
    }
  });

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    if (state.view === '3d') {
      torusMesh.rotation.y += 0.0015;
      torusMesh.rotation.x += 0.0003;
      threeControls.update();
      threeRenderer.render(threeScene, threeCamera);
    }
  }
  animate();
}

// ====== MODE TOGGLE ======
els.modeToggle.addEventListener('click', () => {
  state.mode = state.mode === 'rgb' ? 'cmyk' : 'rgb';
  els.modeToggle.classList.toggle('cmyk', state.mode === 'cmyk');
  els.kSliderRow.classList.toggle('hidden', state.mode !== 'cmyk');

  // Update mode labels
  $$('.mode-label').forEach(l => {
    l.classList.toggle('active', l.dataset.mode === state.mode);
  });

  drawWheel();
  updateAll();
});

// ====== VIEW TOGGLE (2D / 3D) ======
els.view2dBtn.addEventListener('click', () => {
  state.view = '2d';
  els.view2dBtn.classList.add('active');
  els.view3dBtn.classList.remove('active');
  els.wheel2d.classList.remove('hidden');
  els.wheel3d.classList.add('hidden');
  els.wheelSelector.classList.remove('hidden');
});

els.view3dBtn.addEventListener('click', async () => {
  state.view = '3d';
  els.view3dBtn.classList.add('active');
  els.view2dBtn.classList.remove('active');
  els.wheel3d.classList.remove('hidden');
  els.wheel2d.classList.add('hidden');
  els.wheelSelector.classList.add('hidden');
  await initThree();
});

// ====== K SLIDER ======
els.kSlider.addEventListener('input', () => {
  state.kBlack = +els.kSlider.value;
  els.kValue.textContent = state.kBlack + '%';
  drawWheel();
  updateAll();
});

// ====== ALPHA SLIDER ======
els.alphaSlider.addEventListener('input', () => {
  state.alpha = +els.alphaSlider.value;
  els.alphaValue.textContent = state.alpha + '%';
  updateColorDisplay();
});

// ====== LIGHTNESS SLIDER ======
els.lightnessSlider.addEventListener('input', () => {
  state.lightness = +els.lightnessSlider.value;
  els.lightnessValue.textContent = state.lightness + '%';
  drawWheel();
  updateAll();
  addToHistory();
});

// ====== RGB SLIDERS ======
function onRgbSliderInput() {
  const r = +els.rSlider.value;
  const g = +els.gSlider.value;
  const b = +els.bSlider.value;
  els.rValue.textContent = r;
  els.gValue.textContent = g;
  els.bValue.textContent = b;
  const [h, s, l] = rgbToHsl(r, g, b);
  state.hue = h;
  state.saturation = s;
  state.lightness = l;
  els.lightnessSlider.value = l;
  els.lightnessValue.textContent = l + '%';
  drawWheel();
  updateAll();
  addToHistory();
}

els.rSlider.addEventListener('input', onRgbSliderInput);
els.gSlider.addEventListener('input', onRgbSliderInput);
els.bSlider.addEventListener('input', onRgbSliderInput);

// ====== RANDOM COLOR ======
els.randomColorBtn.addEventListener('click', () => {
  state.hue = Math.floor(Math.random() * 360);
  state.saturation = 40 + Math.floor(Math.random() * 60);
  state.lightness = 30 + Math.floor(Math.random() * 40);
  els.lightnessSlider.value = state.lightness;
  els.lightnessValue.textContent = state.lightness + '%';
  drawWheel();
  updateAll();
  addToHistory();
  showToast('Random color!');
});

// ====== EYEDROPPER ======
els.eyedropperBtn.addEventListener('click', async () => {
  if (!window.EyeDropper) {
    showToast('Eyedropper not supported in this browser');
    return;
  }
  try {
    const dropper = new EyeDropper();
    const result = await dropper.open();
    const hex = result.sRGBHex;
    const [h, s, l] = rgbToHsl(...hexToRgb(hex));
    state.hue = h; state.saturation = s; state.lightness = l;
    updateAll();
    addToHistory();
    showToast(`Picked ${hex}`);
  } catch { /* cancelled */ }
});

// ====== COLOR DISPLAY UPDATE ======
function updateColorDisplay() {
  const [r, g, b] = getCurrentRgb();
  const hex = getCurrentHex();
  const [h, s, l] = [state.hue, state.saturation, state.lightness];
  const [c, m, y, k] = rgbToCmyk(r, g, b);
  const textColor = textColorForBg(r, g, b);

  // Hex badge
  els.hexBadge.style.background = hex.substring(0, 7);
  els.hexBadge.style.color = textColor;
  els.hexValue.textContent = hex.toUpperCase();
  els.hexInput.value = hex.toUpperCase();

  // Color values
  els.hslValue.textContent = `${h}°, ${s}%, ${l}%`;
  els.cmykValue.textContent = `${c}, ${m}, ${y}, ${k}`;

  // Sync RGB sliders
  els.rSlider.value = r;
  els.gSlider.value = g;
  els.bSlider.value = b;
  els.rValue.textContent = r;
  els.gValue.textContent = g;
  els.bValue.textContent = b;

  // Update cursor color
  updateCursorColor();

  // Background ambient shift
  document.body.style.background = `radial-gradient(ellipse at center, hsl(${h}, 15%, 6%) 0%, #0a0a12 70%)`;

  // Update accent
  document.documentElement.style.setProperty('--accent', `hsl(${h}, 70%, 60%)`);
  document.documentElement.style.setProperty('--accent-glow', `hsla(${h}, 70%, 60%, 0.4)`);
}

// ====== CONTRAST WIDGET ======
function updateContrastWidget() {
  const [r, g, b] = getCurrentRgb();
  els.widgetFg.style.background = rgbToHex(r, g, b);

  let bgRgb;
  if (state.widgetBgMode === 'white') bgRgb = [255, 255, 255];
  else if (state.widgetBgMode === 'black') bgRgb = [0, 0, 0];
  else bgRgb = [128, 128, 128];
  els.widgetBg.style.background = rgbToHex(...bgRgb);

  const ratio = getContrastRatio([r, g, b], bgRgb);
  const ratioStr = ratio.toFixed(2) + ':1';
  els.widgetRatio.textContent = ratioStr;

  function setPill(el, pass) {
    el.className = 'pill ' + (pass ? 'pass' : 'fail');
    const label = el.textContent.replace(/ [✓✗]$/, '');
    el.textContent = label + (pass ? ' ✓' : ' ✗');
  }
  setPill(els.pillNormalAA, ratio >= 4.5);
  setPill(els.pillNormalAAA, ratio >= 7);
  setPill(els.pillLargeAA, ratio >= 3);
}

els.widgetBgToggle.addEventListener('click', () => {
  if (state.widgetBgMode === 'white') state.widgetBgMode = 'black';
  else if (state.widgetBgMode === 'black') state.widgetBgMode = 'white';
  updateContrastWidget();
});

// ====== MIXER (kept for palette tab compatibility) ======
function updateMixerWells() {}
function updateMixResult() {}

// ====== HEX INPUT ======
function applyHexInput() {
  const parsed = parseColorInput(els.hexInput.value);
  if (parsed) {
    [state.hue, state.saturation, state.lightness] = parsed;
    updateAll();
    addToHistory();
  } else {
    showToast('Invalid color format');
  }
}
els.hexGoBtn.addEventListener('click', applyHexInput);
els.hexInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyHexInput();
});

// ====== COPY BUTTONS ======
els.copyHexBtn.addEventListener('click', () => {
  copyToClipboard(getCurrentHex().toUpperCase());
  els.copyHexBtn.querySelector('.icon-copy').classList.add('hidden');
  els.copyHexBtn.querySelector('.icon-check').classList.remove('hidden');
  setTimeout(() => {
    els.copyHexBtn.querySelector('.icon-copy').classList.remove('hidden');
    els.copyHexBtn.querySelector('.icon-check').classList.add('hidden');
  }, 1500);
});

$$('.copy-small').forEach(btn => {
  btn.addEventListener('click', () => {
    const format = btn.dataset.format;
    const [r, g, b] = getCurrentRgb();
    let text;
    switch (format) {
      case 'hsl': text = `hsl(${state.hue}, ${state.saturation}%, ${state.lightness}%)`; break;
      case 'cmyk': { const [c,m,y,k] = rgbToCmyk(r,g,b); text = `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`; break; }
      default: text = `rgb(${r}, ${g}, ${b})`;
    }
    copyToClipboard(text);
  });
});

// ====== HISTORY ======
function addToHistory() {
  const hex = getCurrentHex().substring(0, 7).toUpperCase();
  // Don't duplicate consecutive
  if (state.history[0] === hex) return;
  state.history.unshift(hex);
  if (state.history.length > 20) state.history.pop();
  localStorage.setItem('chromatica-history', JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  els.historySwatches.innerHTML = '';
  state.history.forEach(hex => {
    const el = document.createElement('div');
    el.className = 'history-swatch';
    el.style.background = hex;
    el.dataset.hex = hex;
    el.addEventListener('click', () => {
      const [h, s, l] = rgbToHsl(...hexToRgb(hex));
      state.hue = h; state.saturation = s; state.lightness = l;
      updateAll();
    });
    els.historySwatches.appendChild(el);
  });
}

els.clearHistoryBtn.addEventListener('click', () => {
  state.history = [];
  localStorage.removeItem('chromatica-history');
  renderHistory();
  showToast('History cleared');
});

// ====== PALETTE GENERATION ======
function generateHarmonyHues(baseHue, type, count) {
  const hues = [baseHue];
  switch (type) {
    case 'complementary':
      hues.push((baseHue + 180) % 360);
      break;
    case 'analogous':
      hues.push((baseHue + 30) % 360, (baseHue + 60) % 360,
                (baseHue - 30 + 360) % 360, (baseHue - 60 + 360) % 360);
      break;
    case 'triadic':
      hues.push((baseHue + 120) % 360, (baseHue + 240) % 360);
      break;
    case 'split-complementary':
      hues.push((baseHue + 150) % 360, (baseHue + 210) % 360);
      break;
    case 'tetradic':
      hues.push((baseHue + 90) % 360, (baseHue + 180) % 360, (baseHue + 270) % 360);
      break;
    case 'monochromatic':
      // Same hue, different lightness
      return [
        { h: baseHue, s: state.saturation, l: 20 },
        { h: baseHue, s: state.saturation, l: 35 },
        { h: baseHue, s: state.saturation, l: 50 },
        { h: baseHue, s: state.saturation, l: 65 },
        { h: baseHue, s: state.saturation, l: 80 },
      ];
    case 'double-split':
      hues.push(
        (baseHue + 30) % 360, (baseHue + 150) % 360,
        (baseHue + 180) % 360, (baseHue + 210) % 360, (baseHue + 330) % 360
      );
      break;
    case 'custom':
      for (let i = 1; i < count; i++) {
        hues.push((baseHue + (360 / count) * i) % 360);
      }
      break;
  }
  return hues.map(h => ({ h: Math.round(h), s: state.saturation, l: state.lightness }));
}

function findAccessibleLightness(hue, sat, bgRgb, targetRatio) {
  let lo = 0, hi = 100, bestL = 50, bestDiff = Infinity;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const rgb = hslToRgb(hue, sat, mid);
    const ratio = getContrastRatio(rgb, bgRgb);
    const diff = Math.abs(ratio - targetRatio);
    if (diff < bestDiff) { bestDiff = diff; bestL = mid; }
    if (ratio < targetRatio) {
      // Need more contrast -> try darker or lighter
      if (getRelativeLuminance(...bgRgb) > 0.5) hi = mid;
      else lo = mid;
    } else {
      if (getRelativeLuminance(...bgRgb) > 0.5) lo = mid;
      else hi = mid;
    }
  }
  return Math.round(bestL);
}

function generatePalette() {
  const type = els.paletteType.value;
  const customN = +els.customN.value || 5;
  let colors = generateHarmonyHues(state.hue, type, customN);

  const bgRgb = hexToRgb(state.accessibleBg);
  const targetRatio = state.wcagLevel === 'aaa' ? 7 : state.wcagLevel === 'large-aa' ? 3 : 4.5;

  state.palette = colors.map((c, i) => {
    if (state.lockedSwatches.has(i) && state.palette[i]) {
      return state.palette[i];
    }

    let hex;
    let adjusted = false;
    if (state.accessibleMode) {
      const originalL = c.l;
      const accessibleL = findAccessibleLightness(c.h, c.s, bgRgb, targetRatio);
      const [r, g, b] = hslToRgb(c.h, c.s, accessibleL);
      const ratio = getContrastRatio([r, g, b], bgRgb);
      adjusted = Math.abs(accessibleL - originalL) > 3;
      hex = rgbToHex(r, g, b);

      // All-pairs enforcement
      if (state.contrastEnforcement === 'all-pairs') {
        // Will be handled after initial generation
      }
    } else {
      const [r, g, b] = hslToRgb(c.h, c.s, c.l);
      hex = rgbToHex(r, g, b);
    }

    return { hex, h: c.h, s: c.s, l: c.l, adjusted };
  });

  // All-pairs enforcement pass
  if (state.accessibleMode && state.contrastEnforcement === 'all-pairs') {
    for (let i = 0; i < state.palette.length; i++) {
      for (let j = i + 1; j < state.palette.length; j++) {
        const rgbI = hexToRgb(state.palette[i].hex);
        const rgbJ = hexToRgb(state.palette[j].hex);
        const ratio = getContrastRatio(rgbI, rgbJ);
        if (ratio < targetRatio) {
          // Nudge j's lightness
          const [h, s, l] = rgbToHsl(...rgbJ);
          const newL = l > 50 ? Math.min(100, l + 15) : Math.max(0, l - 15);
          const [r, g, b] = hslToRgb(h, s, newL);
          state.palette[j].hex = rgbToHex(r, g, b);
          state.palette[j].adjusted = true;
        }
      }
    }
  }

  renderPalette();
  savePaletteToHistory();
}

function renderPalette() {
  els.paletteSwatches.innerHTML = '';
  const bgRgb = hexToRgb(state.accessibleBg);

  state.palette.forEach((color, i) => {
    const hex = typeof color === 'string' ? color : color.hex;
    const adjusted = typeof color === 'object' ? color.adjusted : false;

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.animationDelay = `${i * 0.08}s`;

    const colorDiv = document.createElement('div');
    colorDiv.className = 'swatch-color';
    colorDiv.style.background = hex;

    // Lock button
    const lockBtn = document.createElement('button');
    lockBtn.className = 'swatch-lock' + (state.lockedSwatches.has(i) ? ' locked' : '');
    lockBtn.textContent = state.lockedSwatches.has(i) ? '🔒' : '🔓';
    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.lockedSwatches.has(i)) state.lockedSwatches.delete(i);
      else state.lockedSwatches.add(i);
      renderPalette();
    });
    colorDiv.appendChild(lockBtn);

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'swatch-copy';
    copyBtn.textContent = '⎘';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(hex.toUpperCase());
    });
    colorDiv.appendChild(copyBtn);

    // Contrast badge
    if (state.showContrastBadges) {
      const ratio = getContrastRatio(hexToRgb(hex), bgRgb);
      const badge = document.createElement('span');
      badge.className = 'swatch-contrast-badge ' + (ratio >= 4.5 ? 'pass' : 'fail');
      badge.textContent = ratio.toFixed(1) + ':1';
      colorDiv.appendChild(badge);
    }

    // Adjusted indicator
    if (adjusted) {
      const adj = document.createElement('span');
      adj.className = 'swatch-adjusted';
      adj.textContent = '✦';
      adj.title = 'Adjusted for accessibility';
      colorDiv.appendChild(adj);
    }

    swatch.appendChild(colorDiv);

    const hexLabel = document.createElement('span');
    hexLabel.className = 'swatch-hex';
    hexLabel.textContent = hex.toUpperCase();
    swatch.appendChild(hexLabel);

    // Click swatch to select that color
    colorDiv.addEventListener('click', () => {
      const [h, s, l] = rgbToHsl(...hexToRgb(hex));
      state.hue = h; state.saturation = s; state.lightness = l;
      updateAll();
    });

    els.paletteSwatches.appendChild(swatch);
  });

  // Summary for accessible mode
  if (state.accessibleMode && state.palette.length > 0) {
    const bgRgb2 = hexToRgb(state.accessibleBg);
    let passAA = 0, passAAA = 0;
    state.palette.forEach(c => {
      const hex = typeof c === 'string' ? c : c.hex;
      const ratio = getContrastRatio(hexToRgb(hex), bgRgb2);
      if (ratio >= 4.5) passAA++;
      if (ratio >= 7) passAAA++;
    });
    els.paletteSummary.textContent = `All ${state.palette.length} colors: ${passAA} pass AA, ${passAAA} pass AAA on ${state.accessibleBg.toUpperCase()}`;
    els.paletteSummary.classList.remove('hidden');
  } else {
    els.paletteSummary.classList.add('hidden');
  }

  // Show matrix section if palette exists
  els.contrastMatrixSection.classList.toggle('hidden', state.palette.length === 0);
}

// Palette controls
els.paletteType.addEventListener('change', () => {
  els.customNRow.classList.toggle('hidden', els.paletteType.value !== 'custom');
});

els.generatePaletteBtn.addEventListener('click', generatePalette);

els.accessibleModeToggle.addEventListener('change', () => {
  state.accessibleMode = els.accessibleModeToggle.checked;
  els.accessibleOptions.classList.toggle('hidden', !state.accessibleMode);
});

els.accessibleBg.addEventListener('input', () => {
  state.accessibleBg = els.accessibleBg.value;
  els.accessibleBgHex.textContent = state.accessibleBg.toUpperCase();
});

$$('input[name="wcag-level"]').forEach(r => {
  r.addEventListener('change', () => { state.wcagLevel = r.value; });
});

$('#contrast-enforcement').addEventListener('change', (e) => {
  state.contrastEnforcement = e.target.value;
});

els.showContrastToggle.addEventListener('change', () => {
  state.showContrastBadges = els.showContrastToggle.checked;
  renderPalette();
});

// Contrast matrix
els.toggleMatrixBtn.addEventListener('click', () => {
  els.contrastMatrix.classList.toggle('hidden');
  if (!els.contrastMatrix.classList.contains('hidden')) {
    renderContrastMatrix();
  }
});

function renderContrastMatrix() {
  const colors = state.palette.map(c => typeof c === 'string' ? c : c.hex);
  if (colors.length === 0) return;

  let html = '<table><tr><th></th>';
  colors.forEach((c, i) => {
    html += `<th style="color:${c}">■ ${i + 1}</th>`;
  });
  html += '</tr>';

  colors.forEach((c1, i) => {
    html += `<tr><th style="color:${c1}">■ ${i + 1}</th>`;
    colors.forEach((c2, j) => {
      if (i === j) {
        html += '<td class="cell-self">—</td>';
      } else {
        const ratio = getContrastRatio(hexToRgb(c1), hexToRgb(c2));
        const pass = ratio >= 4.5;
        html += `<td class="${pass ? 'cell-pass' : 'cell-fail'}">${ratio.toFixed(1)}</td>`;
      }
    });
    html += '</tr>';
  });
  html += '</table>';
  els.contrastMatrix.innerHTML = html;
}

// ====== EXPORT ======
els.exportJsonBtn.addEventListener('click', () => {
  const colors = state.palette.map(c => {
    const hex = typeof c === 'string' ? c : c.hex;
    const bgRgb = hexToRgb(state.accessibleBg);
    const ratio = getContrastRatio(hexToRgb(hex), bgRgb);
    return {
      hex,
      contrast_vs_background: +ratio.toFixed(2),
      wcag_normal_text_aa: ratio >= 4.5,
      wcag_normal_text_aaa: ratio >= 7,
      wcag_large_text_aa: ratio >= 3,
    };
  });
  const data = {
    palette: els.paletteType.value,
    wcag_level: state.wcagLevel.toUpperCase(),
    background: state.accessibleBg,
    colors,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'chromatica-palette.json');
});

els.exportCssBtn.addEventListener('click', () => {
  const names = ['primary', 'secondary', 'accent', 'highlight', 'muted', 'contrast', 'subtle', 'bold', 'warm', 'cool', 'neutral', 'pop'];
  let css = `/* Chromatica Palette — WCAG ${state.wcagLevel.toUpperCase()} on ${state.accessibleBg} */\n:root {\n`;
  state.palette.forEach((c, i) => {
    const hex = typeof c === 'string' ? c : c.hex;
    const bgRgb = hexToRgb(state.accessibleBg);
    const ratio = getContrastRatio(hexToRgb(hex), bgRgb);
    const name = names[i] || `color-${i + 1}`;
    css += `  --color-${name}: ${hex};   /* contrast: ${ratio.toFixed(2)}:1 ${ratio >= 4.5 ? '✓ AA' : '✗'} */\n`;
  });
  css += '}\n';
  const blob = new Blob([css], { type: 'text/css' });
  downloadBlob(blob, 'chromatica-palette.css');
});

els.exportPngBtn.addEventListener('click', () => {
  const colors = state.palette.map(c => typeof c === 'string' ? c : c.hex);
  const w = colors.length * 100;
  const h = 100;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * 100, 0, 100, h);
    ctx.fillStyle = textColorForBg(...hexToRgb(c));
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c.toUpperCase(), i * 100 + 50, 58);
  });
  canvas.toBlob(blob => downloadBlob(blob, 'chromatica-palette.png'));
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ====== ACCESSIBILITY TAB — CONTRAST CHECKER ======
function updateChecker() {
  const fgRgb = hexToRgb(state.checkerFg);
  const bgRgb = hexToRgb(state.checkerBg);
  const ratio = getContrastRatio(fgRgb, bgRgb);

  els.checkerRatio.textContent = ratio.toFixed(2) + ':1';
  els.checkerRatio.style.color = ratio >= 4.5 ? '#4dff91' : ratio >= 3 ? '#ffc800' : '#ff6666';

  function setBadge(el, pass) {
    el.className = 'badge ' + (pass ? 'pass' : 'fail');
    el.textContent = pass ? '✓ Pass' : '✗ Fail';
  }
  setBadge($('#ck-normal-aa'), ratio >= 4.5);
  setBadge($('#ck-normal-aaa'), ratio >= 7);
  setBadge($('#ck-large-aa'), ratio >= 3);
  setBadge($('#ck-large-aaa'), ratio >= 4.5);
  setBadge($('#ck-ui'), ratio >= 3);

  // Preview zone
  els.previewZone.style.background = state.checkerBg;
  els.previewZone.style.color = state.checkerFg;
}

els.checkerFg.addEventListener('input', () => {
  state.checkerFg = els.checkerFg.value;
  els.checkerFgHex.value = state.checkerFg.toUpperCase();
  updateChecker();
});
els.checkerBg.addEventListener('input', () => {
  state.checkerBg = els.checkerBg.value;
  els.checkerBgHex.value = state.checkerBg.toUpperCase();
  updateChecker();
});
els.checkerFgHex.addEventListener('change', () => {
  const parsed = parseColorInput(els.checkerFgHex.value);
  if (parsed) {
    const rgb = hslToRgb(...parsed);
    state.checkerFg = rgbToHex(...rgb);
    els.checkerFg.value = state.checkerFg;
    updateChecker();
  }
});
els.checkerBgHex.addEventListener('change', () => {
  const parsed = parseColorInput(els.checkerBgHex.value);
  if (parsed) {
    const rgb = hslToRgb(...parsed);
    state.checkerBg = rgbToHex(...rgb);
    els.checkerBg.value = state.checkerBg;
    updateChecker();
  }
});
els.checkerSwapBtn.addEventListener('click', () => {
  [state.checkerFg, state.checkerBg] = [state.checkerBg, state.checkerFg];
  els.checkerFg.value = state.checkerFg;
  els.checkerBg.value = state.checkerBg;
  els.checkerFgHex.value = state.checkerFg.toUpperCase();
  els.checkerBgHex.value = state.checkerBg.toUpperCase();
  updateChecker();
});

// Find passing color
els.findPassingBtn.addEventListener('click', () => {
  const bgRgb = hexToRgb(state.checkerBg);
  const [h, s] = rgbToHsl(...hexToRgb(state.checkerFg));
  const newL = findAccessibleLightness(h, s, bgRgb, 4.5);
  const [r, g, b] = hslToRgb(h, s, newL);
  state.checkerFg = rgbToHex(r, g, b);
  els.checkerFg.value = state.checkerFg;
  els.checkerFgHex.value = state.checkerFg.toUpperCase();
  updateChecker();
  showToast(`Adjusted to ${state.checkerFg.toUpperCase()}`);
});

// ====== CVD SIMULATOR ======
function applyCvdBodyFilter() {
  document.body.classList.remove('cvd-protanopia', 'cvd-deuteranopia', 'cvd-tritanopia', 'cvd-achromatopsia');
  // Only apply the CSS body filter when compare mode is OFF
  if (state.cvdMode !== 'normal' && !els.cvdCompareToggle.checked) {
    document.body.classList.add('cvd-' + state.cvdMode);
  }
}

$$('.cvd-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.cvd-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.cvdMode = btn.dataset.cvd;

    applyCvdBodyFilter();

    if (state.cvdMode !== 'normal') {
      els.cvdLabel.classList.remove('hidden');
      els.cvdModeName.textContent = btn.textContent.trim().split('\n')[0].trim();
    } else {
      els.cvdLabel.classList.add('hidden');
    }

    // Update compare canvases if visible
    if (els.cvdCompareToggle.checked) {
      drawCvdCompare();
    }
  });
});

els.cvdCompareToggle.addEventListener('change', () => {
  els.cvdCompare.classList.toggle('hidden', !els.cvdCompareToggle.checked);
  // Remove/restore body filter based on compare mode
  applyCvdBodyFilter();
  if (els.cvdCompareToggle.checked) drawCvdCompare();
});

// CVD simulation matrices
const cvdMatrices = {
  protanopia: [
    [0.567, 0.433, 0.000],
    [0.558, 0.442, 0.000],
    [0.000, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0.000],
    [0.700, 0.300, 0.000],
    [0.000, 0.300, 0.700],
  ],
  tritanopia: [
    [0.950, 0.050, 0.000],
    [0.000, 0.433, 0.567],
    [0.000, 0.475, 0.525],
  ],
  achromatopsia: [
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
  ],
};

function simulateCvd(r, g, b, matrix) {
  // Gamma decode
  const linearize = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rl = linearize(r), gl = linearize(g), bl = linearize(b);

  // Apply matrix
  const sr = matrix[0][0] * rl + matrix[0][1] * gl + matrix[0][2] * bl;
  const sg = matrix[1][0] * rl + matrix[1][1] * gl + matrix[1][2] * bl;
  const sb = matrix[2][0] * rl + matrix[2][1] * gl + matrix[2][2] * bl;

  // Gamma encode
  const delinearize = (c) => {
    c = Math.max(0, Math.min(1, c));
    return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  return [
    Math.round(delinearize(sr) * 255),
    Math.round(delinearize(sg) * 255),
    Math.round(delinearize(sb) * 255),
  ];
}

function drawCvdCompare() {
  const size = 180;
  const cx = size / 2;
  const outerR = cx - 2;

  [els.cvdNormalCanvas, els.cvdSimCanvas].forEach((canvas, isSimulated) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cx;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > outerR) continue;

        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        const sat = (dist / outerR) * 100;
        let [r, g, b] = hslToRgb(angle, sat, 50);

        if (isSimulated && state.cvdMode !== 'normal' && cvdMatrices[state.cvdMode]) {
          [r, g, b] = simulateCvd(r, g, b, cvdMatrices[state.cvdMode]);
        }

        const idx = (y * size + x) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(cx, cx, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  });
}

// ====== QUICK HARMONIES ======
function renderQuickHarmonies() {
  const container = els.quickHarmonies;
  if (!container) return;
  container.innerHTML = '';

  const harmonies = [
    { name: 'Complement', offsets: [180] },
    { name: 'Analogous', offsets: [-30, 30] },
    { name: 'Triadic', offsets: [120, 240] },
    { name: 'Split', offsets: [150, 210] },
    { name: 'Tetradic', offsets: [90, 180, 270] },
  ];

  harmonies.forEach(h => {
    const row = document.createElement('div');
    row.className = 'harmony-row';

    const name = document.createElement('span');
    name.className = 'harmony-name';
    name.textContent = h.name;
    row.appendChild(name);

    const dots = document.createElement('div');
    dots.className = 'harmony-dots';

    // Base color dot
    const baseDot = document.createElement('div');
    baseDot.className = 'harmony-dot';
    const baseRgb = hslToRgb(state.hue, state.saturation, state.lightness);
    baseDot.style.background = rgbToHex(...baseRgb);
    baseDot.style.boxShadow = `0 0 6px ${rgbToHex(...baseRgb)}80`;
    baseDot.title = rgbToHex(...baseRgb).toUpperCase();
    dots.appendChild(baseDot);

    h.offsets.forEach(offset => {
      const hue = (state.hue + offset + 360) % 360;
      const rgb = hslToRgb(hue, state.saturation, state.lightness);
      const hex = rgbToHex(...rgb);
      const dot = document.createElement('div');
      dot.className = 'harmony-dot';
      dot.style.background = hex;
      dot.style.boxShadow = `0 0 6px ${hex}80`;
      dot.title = hex.toUpperCase();
      dot.addEventListener('click', () => {
        state.hue = hue;
        updateAll();
        addToHistory();
      });
      dots.appendChild(dot);
    });

    row.appendChild(dots);

    // Click entire row to apply as palette
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('harmony-dot')) return;
      const allHues = [state.hue, ...h.offsets.map(o => (state.hue + o + 360) % 360)];
      state.palette = allHues.map(hue => {
        const rgb = hslToRgb(hue, state.saturation, state.lightness);
        return { hex: rgbToHex(...rgb), h: hue, s: state.saturation, l: state.lightness, adjusted: false };
      });
      renderPalette();
      showToast(`${h.name} palette applied`);
    });

    container.appendChild(row);
  });
}

// ====== KEYBOARD SHORTCUTS ======
document.addEventListener('keydown', (e) => {
  // Don't intercept when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

  let changed = false;
  const step = e.shiftKey ? 10 : 1;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      state.hue = (state.hue - step + 360) % 360;
      changed = true;
      break;
    case 'ArrowRight':
      e.preventDefault();
      state.hue = (state.hue + step) % 360;
      changed = true;
      break;
    case 'ArrowUp':
      e.preventDefault();
      state.saturation = Math.min(100, state.saturation + step);
      changed = true;
      break;
    case 'ArrowDown':
      e.preventDefault();
      state.saturation = Math.max(0, state.saturation - step);
      changed = true;
      break;
    case 'r':
      els.randomColorBtn.click();
      break;
    case 'c':
      copyToClipboard(getCurrentHex().toUpperCase());
      break;
  }

  if (changed) {
    updateAll();
    addToHistory();
  }
});

// ====== TORUS INDICATOR ======
function updateTorusIndicator() {
  if (!torusIndicator || !torusMesh) return;

  const R = 2.0; // major radius (must match TorusGeometry)
  const r = 0.75; // tube radius

  const hueNorm = state.hue / 360;
  const lNorm = state.lightness / 100;

  // From the shader: lightness = 0.5 + 0.5 * sin(phi)
  // So sin(phi) = 2 * lNorm - 1
  const sinPhi = Math.max(-1, Math.min(1, 2 * lNorm - 1));
  const phi = Math.asin(sinPhi);

  // theta around the major circle (UV x maps to hue)
  const theta = hueNorm * 2 * Math.PI;

  // Position on torus surface (Three.js TorusGeometry parametric form)
  const x = (R + r * Math.cos(phi)) * Math.cos(theta);
  const y = (R + r * Math.cos(phi)) * Math.sin(theta);
  const z = r * Math.sin(phi);

  // Normal direction (outward from tube center)
  const cx = R * Math.cos(theta);
  const cy = R * Math.sin(theta);
  const nx = x - cx;
  const ny = y - cy;
  const nz = z;
  const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

  // Offset slightly above surface
  const offset = 0.12;
  torusIndicator.position.set(
    x + (nx / nLen) * offset,
    y + (ny / nLen) * offset,
    z + (nz / nLen) * offset
  );

  // Orient the ring to face outward
  if (THREE_REF) {
    const lookTarget = new THREE_REF.Vector3(
      x + nx / nLen,
      y + ny / nLen,
      z + nz / nLen
    );
    torusIndicator.lookAt(lookTarget);
  }

  // Color the indicator to match the current color
  const [cr, cg, cb] = getCurrentRgb();
  const hex = rgbToHex(cr, cg, cb);
  torusIndicator.material.color.set(hex);

  // Make ring contrast with indicator color
  const textCol = textColorForBg(cr, cg, cb);
  torusIndicator.children[0].material.color.set(textCol);

  torusIndicator.visible = true;
}

// ====== RANDOM PALETTE GENERATOR ======
els.randomPaletteBtn.addEventListener('click', () => {
  const types = ['complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic', 'monochromatic', 'double-split'];
  const randomType = types[Math.floor(Math.random() * types.length)];

  // Random base color
  state.hue = Math.floor(Math.random() * 360);
  state.saturation = 50 + Math.floor(Math.random() * 50);
  state.lightness = 30 + Math.floor(Math.random() * 40);

  els.paletteType.value = randomType;
  els.lightnessSlider.value = state.lightness;
  els.lightnessValue.textContent = state.lightness + '%';

  drawWheel();
  updateAll();
  generatePalette();
  showToast(`Random ${randomType} palette!`);
});

// ====== PALETTE HISTORY ======
function savePaletteToHistory() {
  if (state.palette.length === 0) return;

  const entry = {
    type: els.paletteType.value,
    colors: state.palette.map(c => typeof c === 'string' ? c : c.hex),
    timestamp: Date.now(),
  };

  // Don't duplicate the same palette
  const lastEntry = state.paletteHistory[0];
  if (lastEntry && JSON.stringify(lastEntry.colors) === JSON.stringify(entry.colors)) return;

  state.paletteHistory.unshift(entry);
  if (state.paletteHistory.length > 20) state.paletteHistory.pop();
  localStorage.setItem('chromatica-palette-history', JSON.stringify(state.paletteHistory));
  renderPaletteHistory();
}

function renderPaletteHistory() {
  if (!els.paletteHistoryList) return;
  els.paletteHistoryList.innerHTML = '';

  if (state.paletteHistory.length === 0) {
    els.paletteHistoryList.innerHTML = '<p style="font-size:12px;color:var(--text-dim);font-style:italic;">No palettes generated yet.</p>';
    return;
  }

  state.paletteHistory.forEach((entry, idx) => {
    const row = document.createElement('div');
    row.className = 'palette-history-entry';

    const colorsDiv = document.createElement('div');
    colorsDiv.className = 'palette-history-colors';

    entry.colors.forEach(hex => {
      const dot = document.createElement('div');
      dot.className = 'palette-history-dot';
      dot.style.background = hex;
      dot.title = hex.toUpperCase();
      colorsDiv.appendChild(dot);
    });

    const typeLabel = document.createElement('span');
    typeLabel.className = 'palette-history-type';
    typeLabel.textContent = entry.type;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'palette-history-delete';
    deleteBtn.textContent = '\u00d7';
    deleteBtn.title = 'Remove';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.paletteHistory.splice(idx, 1);
      localStorage.setItem('chromatica-palette-history', JSON.stringify(state.paletteHistory));
      renderPaletteHistory();
      showToast('Palette removed');
    });

    row.appendChild(colorsDiv);
    row.appendChild(typeLabel);
    row.appendChild(deleteBtn);

    // Click to restore
    row.addEventListener('click', () => {
      state.palette = entry.colors.map(hex => {
        const [h, s, l] = rgbToHsl(...hexToRgb(hex));
        return { hex, h, s, l, adjusted: false };
      });
      els.paletteType.value = entry.type;
      renderPalette();
      showToast(`Restored ${entry.type} palette`);
    });

    els.paletteHistoryList.appendChild(row);
  });
}

els.clearPaletteHistoryBtn.addEventListener('click', () => {
  state.paletteHistory = [];
  localStorage.removeItem('chromatica-palette-history');
  renderPaletteHistory();
  showToast('Palette history cleared');
});

// ====== MASTER UPDATE ======
function updateAll() {
  updateColorDisplay();
  updateWheelSelector();
  updateContrastWidget();
  renderQuickHarmonies();

  // Sync lightness slider
  els.lightnessSlider.value = state.lightness;
  els.lightnessValue.textContent = state.lightness + '%';

  // Also set checker fg to current color
  state.checkerFg = getCurrentHex().substring(0, 7);
  els.checkerFg.value = state.checkerFg;
  els.checkerFgHex.value = state.checkerFg.toUpperCase();
  updateChecker();

  // Update torus indicator position
  updateTorusIndicator();
}

// ====== INIT ======
async function init() {
  drawWheel();
  updateAll();
  renderHistory();
  renderQuickHarmonies();
  updateChecker();
  renderPaletteHistory();

  // Set initial mode label
  $$('.mode-label').forEach(l => {
    l.classList.toggle('active', l.dataset.mode === state.mode);
  });

  // Start in 3D mode
  await initThree();
}

init();
