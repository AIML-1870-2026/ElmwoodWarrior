// ===== Performance Config =====
const FAST_RES = 200;      // render width during drag/zoom/animation
const FULL_RES = 500;      // render width for idle high-quality pass
const REFINE_DELAY = 300;  // ms to wait before rendering full quality

// ===== State =====
const state = {
    tab: 'mandelbrot',
    c: { r: -0.745, i: 0.186 },
    palette: 'rainbow',
    maxIter: 150,
    views: {
        mandelbrot: { cx: -0.5, cy: 0, scale: 1.5 },
        julia:      { cx: 0,    cy: 0, scale: 1.5 }
    },
    anim: {
        mode: null,
        playing: false,
        speed: 1,
        time: 0
    },
    dragging: false,
    dragStart: null,
    viewAtDragStart: null,
    theme: 'dark',
    quality: 'fast'  // 'fast' or 'full'
};

// ===== DOM =====
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
const cValueDisplay = document.getElementById('cValueDisplay');
const zoomDisplay = document.getElementById('zoomDisplay');
const coordDisplay = document.getElementById('coordDisplay');
const renderingIndicator = document.getElementById('renderingIndicator');
const iterSlider = document.getElementById('iterSlider');
const iterValue = document.getElementById('iterValue');
const speedSlider = document.getElementById('speedSlider');

const presets = [
    { name: 'Rabbit',      r: -0.123, i: 0.745 },
    { name: 'Dendrite',    r: 0,      i: 1 },
    { name: 'San Marco',   r: -0.75,  i: 0 },
    { name: 'Siegel Disk', r: -0.391, i: -0.587 },
    { name: 'Seahorse',    r: -0.75,  i: 0.1 },
    { name: 'Lightning',   r: -0.4,   i: 0.6 },
    { name: 'Galaxy',      r: -0.8,   i: 0.156 },
    { name: 'Starfish',    r: -0.5,   i: 0.563 }
];

// ===== Pre-baked Color LUTs (256 entries each) =====
const LUT_SIZE = 256;
const colorLUTs = {};

function buildLUT(name, paletteFunc) {
    const lut = new Uint8ClampedArray(LUT_SIZE * 3);
    for (let i = 0; i < LUT_SIZE; i++) {
        const t = i / (LUT_SIZE - 1);
        const c = paletteFunc(t);
        lut[i * 3]     = c[0];
        lut[i * 3 + 1] = c[1];
        lut[i * 3 + 2] = c[2];
    }
    return lut;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
    return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}
function gradientColor(stops, t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i].pos && t <= stops[i + 1].pos) {
            const local = (t - stops[i].pos) / (stops[i + 1].pos - stops[i].pos);
            return lerpColor(stops[i].color, stops[i + 1].color, local);
        }
    }
    return stops[stops.length - 1].color;
}
function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
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
    return [r * 255, g * 255, b * 255];
}

const paletteFuncs = {
    rainbow: (t) => hslToRgb(t * 360, 100, 50),
    fire: (t) => gradientColor([
        { pos: 0, color: [0,0,0] }, { pos: 0.33, color: [139,0,0] },
        { pos: 0.66, color: [255,69,0] }, { pos: 1, color: [255,215,0] }
    ], t),
    ocean: (t) => gradientColor([
        { pos: 0, color: [0,0,51] }, { pos: 0.5, color: [0,206,209] },
        { pos: 1, color: [255,255,255] }
    ], t),
    synthwave: (t) => gradientColor([
        { pos: 0, color: [26,0,51] }, { pos: 0.33, color: [255,20,147] },
        { pos: 0.66, color: [148,0,211] }, { pos: 1, color: [0,255,255] }
    ], t)
};

const boundedColors = {
    rainbow: [0,0,0], fire: [0,0,0], ocean: [0,0,51], synthwave: [0,0,0]
};

// Build all LUTs at startup
for (const name in paletteFuncs) {
    colorLUTs[name] = buildLUT(name, paletteFuncs[name]);
}

// ===== Fractal Computation (optimized with LUT) =====
function computeFractal(imageData, width, height, view, isJulia, cVal, maxIter, paletteName) {
    const data = imageData.data;
    const lut = colorLUTs[paletteName];
    const bc = boundedColors[paletteName];
    const aspect = width / height;
    const scaleX = view.scale * aspect;
    const scaleY = view.scale;
    const startX = view.cx - scaleX;
    const startY = view.cy - scaleY;
    const stepX = (2 * scaleX) / width;
    const stepY = (2 * scaleY) / height;
    const cr_c = cVal.r, ci_c = cVal.i;
    const lutMax = LUT_SIZE - 1;

    for (let py = 0; py < height; py++) {
        const y0 = startY + stepY * py;
        for (let px = 0; px < width; px++) {
            const x0 = startX + stepX * px;

            let zr, zi, cr, ci;
            if (isJulia) {
                zr = x0; zi = y0;
                cr = cr_c; ci = ci_c;
            } else {
                zr = 0; zi = 0;
                cr = x0; ci = y0;
            }

            let iter = 0;
            let zr2 = zr * zr, zi2 = zi * zi;
            while (zr2 + zi2 <= 4 && iter < maxIter) {
                zi = 2 * zr * zi + ci;
                zr = zr2 - zi2 + cr;
                zr2 = zr * zr;
                zi2 = zi * zi;
                iter++;
            }

            const idx = (py * width + px) * 4;
            if (iter === maxIter) {
                data[idx] = bc[0]; data[idx+1] = bc[1]; data[idx+2] = bc[2];
            } else {
                // Smooth coloring with LUT lookup
                const logZn = Math.log(zr2 + zi2) * 0.5;
                const nu = Math.log(logZn * 1.4426950408889634) * 1.4426950408889634; // 1/ln2
                const smooth = (iter + 1 - nu) / maxIter;
                const t = Math.abs(smooth * 4 % 1);
                const li = (t * lutMax) | 0;
                const li3 = li * 3;
                data[idx] = lut[li3]; data[idx+1] = lut[li3+1]; data[idx+2] = lut[li3+2];
            }
            data[idx+3] = 255;
        }
    }
}

// ===== Rendering with quality tiers =====
let renderQueued = false;
let refineTimer = null;

function render(quality) {
    const isAnimating = state.anim.playing;
    const isFast = quality === 'fast';

    // Choose resolution
    const baseW = isFast || isAnimating ? FAST_RES : FULL_RES;
    const w = baseW;
    const h = Math.round(w * 0.75);

    canvas.width = w;
    canvas.height = h;

    const view = state.views[state.tab];
    const isJulia = state.tab === 'julia';
    const iterCount = isFast ? Math.min(state.maxIter, 100) : state.maxIter;

    const imageData = ctx.createImageData(w, h);
    computeFractal(imageData, w, h, view, isJulia, state.c, iterCount, state.palette);
    ctx.putImageData(imageData, 0, 0);

    updateUI();
}

function requestRender(fast) {
    clearTimeout(refineTimer);

    if (fast) {
        // Immediate fast render
        if (!renderQueued) {
            renderQueued = true;
            requestAnimationFrame(() => {
                renderQueued = false;
                render('fast');
            });
        }
        // Schedule high-quality refine
        refineTimer = setTimeout(() => render('full'), REFINE_DELAY);
    } else {
        if (!renderQueued) {
            renderQueued = true;
            requestAnimationFrame(() => {
                renderQueued = false;
                render('full');
            });
        }
    }
}

// ===== UI Updates =====
function formatComplex(r, i) {
    const sign = i >= 0 ? '+' : '\u2212';
    return `${r.toFixed(3)} ${sign} ${Math.abs(i).toFixed(3)}i`;
}

function updateUI() {
    cValueDisplay.textContent = `c = ${formatComplex(state.c.r, state.c.i)}`;
    const view = state.views[state.tab];
    const zoomLevel = (1.5 / view.scale).toFixed(1);
    zoomDisplay.textContent = `Zoom: ${zoomLevel}x`;
}

// ===== Pixel to Complex =====
function pixelToComplex(px, py) {
    const rect = canvas.getBoundingClientRect();
    const x = (px - rect.left) / rect.width;
    const y = (py - rect.top) / rect.height;
    const view = state.views[state.tab];
    const aspect = 4 / 3; // fixed aspect
    const scaleX = view.scale * aspect;
    const scaleY = view.scale;
    return {
        r: view.cx - scaleX + 2 * scaleX * x,
        i: view.cy - scaleY + 2 * scaleY * y
    };
}

// ===== Event Handlers =====

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tab = btn.dataset.tab;
        requestRender(false);
    });
});

// Palettes
document.querySelectorAll('[data-palette]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-palette]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.palette = btn.dataset.palette;
        requestRender(false);
    });
});

// Presets
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.c.r = parseFloat(btn.dataset.cr);
        state.c.i = parseFloat(btn.dataset.ci);
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="julia"]').classList.add('active');
        state.tab = 'julia';
        state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
        requestRender(false);
    });
});

// Zoom buttons
document.getElementById('zoomIn').addEventListener('click', () => {
    state.views[state.tab].scale *= 0.5;
    requestRender(true);
});
document.getElementById('zoomOut').addEventListener('click', () => {
    state.views[state.tab].scale *= 2;
    requestRender(true);
});
document.getElementById('resetView').addEventListener('click', () => {
    if (state.tab === 'mandelbrot') {
        state.views.mandelbrot = { cx: -0.5, cy: 0, scale: 1.5 };
    } else {
        state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
    }
    requestRender(false);
});

// Iterations
iterSlider.addEventListener('input', () => {
    state.maxIter = parseInt(iterSlider.value);
    iterValue.textContent = state.maxIter;
    requestRender(true);
});

// Speed
speedSlider.addEventListener('input', () => {
    state.anim.speed = parseFloat(speedSlider.value);
});

// Scroll zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const view = state.views[state.tab];
    const complex = pixelToComplex(e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 1.2 : 1 / 1.2;
    view.cx = complex.r + (view.cx - complex.r) * factor;
    view.cy = complex.i + (view.cy - complex.i) * factor;
    view.scale *= factor;
    requestRender(true);
}, { passive: false });

// Drag to pan / click to select c
let clickStart = null;
let hasDragged = false;

canvas.addEventListener('mousedown', (e) => {
    clickStart = { x: e.clientX, y: e.clientY };
    hasDragged = false;
    state.dragging = true;
    state.dragStart = { x: e.clientX, y: e.clientY };
    state.viewAtDragStart = { ...state.views[state.tab] };
});

canvas.addEventListener('mousemove', (e) => {
    const complex = pixelToComplex(e.clientX, e.clientY);
    coordDisplay.textContent = `z = ${formatComplex(complex.r, complex.i)}`;

    if (state.dragging) {
        const dx = e.clientX - state.dragStart.x;
        const dy = e.clientY - state.dragStart.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;

        const rect = canvas.getBoundingClientRect();
        const view = state.views[state.tab];
        const aspect = 4 / 3;
        const scaleX = state.viewAtDragStart.scale * aspect;
        const scaleY = state.viewAtDragStart.scale;

        view.cx = state.viewAtDragStart.cx - (dx / rect.width) * 2 * scaleX;
        view.cy = state.viewAtDragStart.cy - (dy / rect.height) * 2 * scaleY;
        requestRender(true);
    }
});

canvas.addEventListener('mouseup', (e) => {
    state.dragging = false;
    if (!hasDragged && state.tab === 'mandelbrot') {
        const complex = pixelToComplex(e.clientX, e.clientY);
        state.c.r = complex.r;
        state.c.i = complex.i;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="julia"]').classList.add('active');
        state.tab = 'julia';
        state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
        requestRender(false);
    } else if (hasDragged) {
        // Refine after drag ends
        requestRender(false);
    }
});

canvas.addEventListener('mouseleave', () => { state.dragging = false; });

// Touch
let lastTouchDist = null;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        clickStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        hasDragged = false;
        state.dragging = true;
        state.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        state.viewAtDragStart = { ...state.views[state.tab] };
    } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && state.dragging) {
        const dx = e.touches[0].clientX - state.dragStart.x;
        const dy = e.touches[0].clientY - state.dragStart.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
        const rect = canvas.getBoundingClientRect();
        const view = state.views[state.tab];
        const aspect = 4 / 3;
        const scaleX = state.viewAtDragStart.scale * aspect;
        const scaleY = state.viewAtDragStart.scale;
        view.cx = state.viewAtDragStart.cx - (dx / rect.width) * 2 * scaleX;
        view.cy = state.viewAtDragStart.cy - (dy / rect.height) * 2 * scaleY;
        requestRender(true);
    } else if (e.touches.length === 2 && lastTouchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const factor = lastTouchDist / dist;
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const complex = pixelToComplex(cx, cy);
        const view = state.views[state.tab];
        view.cx = complex.r + (view.cx - complex.r) * factor;
        view.cy = complex.i + (view.cy - complex.i) * factor;
        view.scale *= factor;
        lastTouchDist = dist;
        requestRender(true);
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
        state.dragging = false;
        lastTouchDist = null;
        if (!hasDragged && state.tab === 'mandelbrot' && clickStart) {
            const complex = pixelToComplex(clickStart.x, clickStart.y);
            state.c.r = complex.r;
            state.c.i = complex.i;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tab="julia"]').classList.add('active');
            state.tab = 'julia';
            state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
            requestRender(false);
        } else {
            requestRender(false); // refine
        }
    }
});

// Keyboard
document.addEventListener('keydown', (e) => {
    const view = state.views[state.tab];
    const pan = view.scale * 0.15;
    switch (e.key) {
        case '=': case '+': view.scale *= 0.5; requestRender(true); break;
        case '-': view.scale *= 2; requestRender(true); break;
        case 'ArrowLeft':  e.preventDefault(); view.cx -= pan; requestRender(true); break;
        case 'ArrowRight': e.preventDefault(); view.cx += pan; requestRender(true); break;
        case 'ArrowUp':    e.preventDefault(); view.cy -= pan; requestRender(true); break;
        case 'ArrowDown':  e.preventDefault(); view.cy += pan; requestRender(true); break;
        case 'r': case 'R':
            if (state.tab === 'mandelbrot') state.views.mandelbrot = { cx: -0.5, cy: 0, scale: 1.5 };
            else state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
            requestRender(false); break;
        case '1': selectPalette('rainbow'); break;
        case '2': selectPalette('fire'); break;
        case '3': selectPalette('ocean'); break;
        case '4': selectPalette('synthwave'); break;
    }
});

function selectPalette(name) {
    document.querySelectorAll('[data-palette]').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-palette="${name}"]`).classList.add('active');
    state.palette = name;
    requestRender(false);
}

// ===== Theme =====
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    themeToggle.textContent = state.theme === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
    try { localStorage.setItem('fractal-theme', state.theme); } catch (e) {}
});
try {
    const saved = localStorage.getItem('fractal-theme');
    if (saved) {
        state.theme = saved;
        document.documentElement.setAttribute('data-theme', saved);
        themeToggle.textContent = saved === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
    }
} catch (e) {}

// ===== Animations =====
let animFrame = null;
let animLastTime = null;

document.querySelectorAll('[data-anim]').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.anim;
        if (state.anim.mode === mode) {
            document.querySelectorAll('[data-anim]').forEach(b => b.classList.remove('active'));
            state.anim.mode = null;
            stopAnimation();
        } else {
            document.querySelectorAll('[data-anim]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.anim.mode = mode;
            state.anim.time = 0;
        }
    });
});

document.getElementById('animPlay').addEventListener('click', () => {
    if (!state.anim.mode) {
        state.anim.mode = 'orbit';
        document.querySelector('[data-anim="orbit"]').classList.add('active');
    }
    startAnimation();
});
document.getElementById('animPause').addEventListener('click', () => { state.anim.playing = false; });
document.getElementById('animStop').addEventListener('click', () => {
    stopAnimation();
    requestRender(false);
});

function startAnimation() {
    state.anim.playing = true;
    animLastTime = performance.now();
    if (state.tab !== 'julia') {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="julia"]').classList.add('active');
        state.tab = 'julia';
    }
    if (!animFrame) animLoop();
}

function stopAnimation() {
    state.anim.playing = false;
    state.anim.time = 0;
    animLastTime = null;
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
}

function animLoop() {
    if (!state.anim.playing) { animFrame = null; return; }

    const now = performance.now();
    const dt = (now - (animLastTime || now)) / 1000;
    animLastTime = now;
    state.anim.time += dt * state.anim.speed;

    switch (state.anim.mode) {
        case 'orbit': animOrbit(); break;
        case 'path':  animPath(); break;
        case 'morph': animMorph(); break;
    }

    render('fast');
    animFrame = requestAnimationFrame(animLoop);
}

function animOrbit() {
    const t = state.anim.time;
    state.c.r = -0.5 + 0.5 * Math.cos(t * Math.PI * 2);
    state.c.i = 0.5 * Math.sin(t * Math.PI * 2);
}

function animPath() {
    const angle = state.anim.time * 0.3 * Math.PI * 2;
    const r = 0.5 * (1 - Math.cos(angle));
    state.c.r = r * Math.cos(angle) / 2 - 0.25;
    state.c.i = r * Math.sin(angle) / 2;
}

function animMorph() {
    const duration = 3;
    const total = presets.length;
    const seg = state.anim.time % duration;
    const idx = Math.floor(state.anim.time / duration) % total;
    const next = (idx + 1) % total;
    const t = seg / duration;
    const e = t * t * (3 - 2 * t);
    state.c.r = presets[idx].r * (1 - e) + presets[next].r * e;
    state.c.i = presets[idx].i * (1 - e) + presets[next].i * e;
}

// ===== Canvas sizing =====
function setCanvasDisplay() {
    const container = document.getElementById('canvasContainer');
    const w = container.clientWidth;
    canvas.style.height = Math.round(w * 0.75) + 'px';
}

window.addEventListener('resize', () => {
    setCanvasDisplay();
    requestRender(false);
});

// ===== Init =====
setCanvasDisplay();
requestRender(false);
