// ===== State =====
const state = {
    tab: 'mandelbrot',
    c: { r: -0.745, i: 0.186 },
    palette: 'rainbow',
    maxIter: 256,
    views: {
        mandelbrot: { cx: -0.5, cy: 0, scale: 1.5 },
        julia:      { cx: 0,    cy: 0, scale: 1.5 }
    },
    anim: {
        mode: null,
        playing: false,
        speed: 1,
        time: 0,
        morphFrom: null,
        morphTo: null,
        morphPresetIndex: 0
    },
    dragging: false,
    dragStart: null,
    viewAtDragStart: null,
    theme: 'dark'
};

// ===== DOM Elements =====
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
const cValueDisplay = document.getElementById('cValueDisplay');
const zoomDisplay = document.getElementById('zoomDisplay');
const coordDisplay = document.getElementById('coordDisplay');
const canvasOverlay = document.getElementById('canvasOverlay');
const renderingIndicator = document.getElementById('renderingIndicator');
const iterSlider = document.getElementById('iterSlider');
const iterValue = document.getElementById('iterValue');
const speedSlider = document.getElementById('speedSlider');

// Presets data
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

// ===== Color Palettes =====
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
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
}

const palettes = {
    rainbow: (t) => {
        return hslToRgb(t * 360, 100, 50);
    },
    fire: (t) => {
        const stops = [
            { pos: 0,    color: [0, 0, 0] },
            { pos: 0.33, color: [139, 0, 0] },
            { pos: 0.66, color: [255, 69, 0] },
            { pos: 1.0,  color: [255, 215, 0] }
        ];
        return gradientColor(stops, t);
    },
    ocean: (t) => {
        const stops = [
            { pos: 0,   color: [0, 0, 51] },
            { pos: 0.5, color: [0, 206, 209] },
            { pos: 1.0, color: [255, 255, 255] }
        ];
        return gradientColor(stops, t);
    },
    synthwave: (t) => {
        const stops = [
            { pos: 0,    color: [26, 0, 51] },
            { pos: 0.33, color: [255, 20, 147] },
            { pos: 0.66, color: [148, 0, 211] },
            { pos: 1.0,  color: [0, 255, 255] }
        ];
        return gradientColor(stops, t);
    }
};

const boundedColors = {
    rainbow: [0, 0, 0],
    fire: [0, 0, 0],
    ocean: [0, 0, 51],
    synthwave: [0, 0, 0]
};

// ===== Fractal Computation =====
function computeFractal(imageData, width, height, view, isJulia, cVal, maxIter, paletteName) {
    const data = imageData.data;
    const paletteFunc = palettes[paletteName];
    const boundedColor = boundedColors[paletteName];
    const aspect = width / height;
    const scaleX = view.scale * aspect;
    const scaleY = view.scale;

    for (let py = 0; py < height; py++) {
        const y0 = view.cy - scaleY + (2 * scaleY * py) / height;
        for (let px = 0; px < width; px++) {
            const x0 = view.cx - scaleX + (2 * scaleX * px) / width;

            let zr, zi, cr, ci;
            if (isJulia) {
                zr = x0; zi = y0;
                cr = cVal.r; ci = cVal.i;
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
                data[idx]     = boundedColor[0];
                data[idx + 1] = boundedColor[1];
                data[idx + 2] = boundedColor[2];
            } else {
                // Smooth coloring
                const logZn = Math.log(zr2 + zi2) / 2;
                const nu = Math.log(logZn / Math.LN2) / Math.LN2;
                const smooth = (iter + 1 - nu) / maxIter;
                const t = Math.max(0, Math.min(1, smooth * 4 % 1));
                const color = paletteFunc(t);
                data[idx]     = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
            }
            data[idx + 3] = 255;
        }
    }
}

// ===== Rendering =====
let renderQueued = false;

function render() {
    const width = canvas.width;
    const height = canvas.height;
    const view = state.views[state.tab];
    const isJulia = state.tab === 'julia';

    renderingIndicator.classList.add('visible');

    const imageData = ctx.createImageData(width, height);
    computeFractal(imageData, width, height, view, isJulia, state.c, state.maxIter, state.palette);
    ctx.putImageData(imageData, 0, 0);

    renderingIndicator.classList.remove('visible');
    updateUI();
}

function requestRender() {
    if (!renderQueued) {
        renderQueued = true;
        requestAnimationFrame(() => {
            renderQueued = false;
            render();
        });
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
    const defaultScale = 1.5;
    const zoomLevel = (defaultScale / view.scale).toFixed(1);
    zoomDisplay.textContent = `Zoom: ${zoomLevel}x`;
}

// ===== Pixel to Complex Coordinate =====
function pixelToComplex(px, py) {
    const rect = canvas.getBoundingClientRect();
    const x = (px - rect.left) / rect.width * canvas.width;
    const y = (py - rect.top) / rect.height * canvas.height;
    const view = state.views[state.tab];
    const aspect = canvas.width / canvas.height;
    const scaleX = view.scale * aspect;
    const scaleY = view.scale;
    const cr = view.cx - scaleX + (2 * scaleX * x) / canvas.width;
    const ci = view.cy - scaleY + (2 * scaleY * y) / canvas.height;
    return { r: cr, i: ci };
}

// ===== Event Handlers =====

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tab = btn.dataset.tab;
        requestRender();
    });
});

// Palette switching
document.querySelectorAll('[data-palette]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-palette]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.palette = btn.dataset.palette;
        requestRender();
    });
});

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.c.r = parseFloat(btn.dataset.cr);
        state.c.i = parseFloat(btn.dataset.ci);
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="julia"]').classList.add('active');
        state.tab = 'julia';
        state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
        requestRender();
    });
});

// Zoom buttons
document.getElementById('zoomIn').addEventListener('click', () => {
    const view = state.views[state.tab];
    view.scale *= 0.5;
    requestRender();
});

document.getElementById('zoomOut').addEventListener('click', () => {
    const view = state.views[state.tab];
    view.scale *= 2;
    requestRender();
});

document.getElementById('resetView').addEventListener('click', () => {
    if (state.tab === 'mandelbrot') {
        state.views.mandelbrot = { cx: -0.5, cy: 0, scale: 1.5 };
    } else {
        state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
    }
    requestRender();
});

// Iteration slider
iterSlider.addEventListener('input', () => {
    state.maxIter = parseInt(iterSlider.value);
    iterValue.textContent = state.maxIter;
    requestRender();
});

// Speed slider
speedSlider.addEventListener('input', () => {
    state.anim.speed = parseFloat(speedSlider.value);
});

// Mouse: scroll to zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const view = state.views[state.tab];
    const complex = pixelToComplex(e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;

    view.cx = complex.r + (view.cx - complex.r) * factor;
    view.cy = complex.i + (view.cy - complex.i) * factor;
    view.scale *= factor;
    requestRender();
}, { passive: false });

// Mouse: click + drag to pan, click on Mandelbrot to select c
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
        const aspect = canvas.width / canvas.height;
        const scaleX = state.viewAtDragStart.scale * aspect;
        const scaleY = state.viewAtDragStart.scale;

        view.cx = state.viewAtDragStart.cx - (dx / rect.width) * 2 * scaleX;
        view.cy = state.viewAtDragStart.cy - (dy / rect.height) * 2 * scaleY;
        requestRender();
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
        requestRender();
    }
});

canvas.addEventListener('mouseleave', () => {
    state.dragging = false;
});

// Touch support
let lastTouchDist = null;
let lastTouchCenter = null;

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
        lastTouchCenter = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
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
        const aspect = canvas.width / canvas.height;
        const scaleX = state.viewAtDragStart.scale * aspect;
        const scaleY = state.viewAtDragStart.scale;

        view.cx = state.viewAtDragStart.cx - (dx / rect.width) * 2 * scaleX;
        view.cy = state.viewAtDragStart.cy - (dy / rect.height) * 2 * scaleY;
        requestRender();
    } else if (e.touches.length === 2 && lastTouchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const factor = lastTouchDist / dist;

        const center = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        const complex = pixelToComplex(center.x, center.y);
        const view = state.views[state.tab];

        view.cx = complex.r + (view.cx - complex.r) * factor;
        view.cy = complex.i + (view.cy - complex.i) * factor;
        view.scale *= factor;

        lastTouchDist = dist;
        lastTouchCenter = center;
        requestRender();
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
        state.dragging = false;
        lastTouchDist = null;
        lastTouchCenter = null;
        if (!hasDragged && state.tab === 'mandelbrot' && clickStart) {
            const complex = pixelToComplex(clickStart.x, clickStart.y);
            state.c.r = complex.r;
            state.c.i = complex.i;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tab="julia"]').classList.add('active');
            state.tab = 'julia';
            state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
            requestRender();
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const view = state.views[state.tab];
    const panAmount = view.scale * 0.15;

    switch (e.key) {
        case '=': case '+':
            view.scale *= 0.5;
            requestRender();
            break;
        case '-':
            view.scale *= 2;
            requestRender();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            view.cx -= panAmount;
            requestRender();
            break;
        case 'ArrowRight':
            e.preventDefault();
            view.cx += panAmount;
            requestRender();
            break;
        case 'ArrowUp':
            e.preventDefault();
            view.cy -= panAmount;
            requestRender();
            break;
        case 'ArrowDown':
            e.preventDefault();
            view.cy += panAmount;
            requestRender();
            break;
        case 'r': case 'R':
            if (state.tab === 'mandelbrot') {
                state.views.mandelbrot = { cx: -0.5, cy: 0, scale: 1.5 };
            } else {
                state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
            }
            requestRender();
            break;
        case '1':
            selectPalette('rainbow');
            break;
        case '2':
            selectPalette('fire');
            break;
        case '3':
            selectPalette('ocean');
            break;
        case '4':
            selectPalette('synthwave');
            break;
    }
});

function selectPalette(name) {
    document.querySelectorAll('[data-palette]').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-palette="${name}"]`).classList.add('active');
    state.palette = name;
    requestRender();
}

// ===== Theme Toggle =====
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    themeToggle.textContent = state.theme === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
    try { localStorage.setItem('fractal-theme', state.theme); } catch (e) {}
});

// Load saved theme
try {
    const saved = localStorage.getItem('fractal-theme');
    if (saved) {
        state.theme = saved;
        document.documentElement.setAttribute('data-theme', saved);
        themeToggle.textContent = saved === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
    }
} catch (e) {}

// ===== Animation System =====
let animFrame = null;
let animLastTime = null;

// Animation mode buttons
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
            if (mode === 'morph') {
                state.anim.morphPresetIndex = 0;
                state.anim.morphFrom = { ...presets[0] };
                state.anim.morphTo = { ...presets[1] };
            }
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

document.getElementById('animPause').addEventListener('click', () => {
    state.anim.playing = false;
});

document.getElementById('animStop').addEventListener('click', () => {
    stopAnimation();
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
    if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
    }
}

function animLoop() {
    if (!state.anim.playing) {
        animFrame = null;
        return;
    }

    const now = performance.now();
    const dt = (now - (animLastTime || now)) / 1000;
    animLastTime = now;
    state.anim.time += dt * state.anim.speed;

    switch (state.anim.mode) {
        case 'orbit':
            animOrbit();
            break;
        case 'path':
            animPath();
            break;
        case 'morph':
            animMorph();
            break;
    }

    render();
    animFrame = requestAnimationFrame(animLoop);
}

function animOrbit() {
    const t = state.anim.time;
    const centerR = -0.5, centerI = 0;
    const radius = 0.5;
    state.c.r = centerR + radius * Math.cos(t * Math.PI * 2);
    state.c.i = centerI + radius * Math.sin(t * Math.PI * 2);
}

function animPath() {
    const t = state.anim.time * 0.3;
    const angle = t * Math.PI * 2;
    const r = 0.5 * (1 - Math.cos(angle));
    state.c.r = r * Math.cos(angle) / 2 - 0.25;
    state.c.i = r * Math.sin(angle) / 2;
}

function animMorph() {
    const duration = 3;
    const totalPresets = presets.length;
    const totalTime = state.anim.time;
    const segmentTime = totalTime % duration;
    const segmentIndex = Math.floor(totalTime / duration) % totalPresets;
    const nextIndex = (segmentIndex + 1) % totalPresets;

    const t = segmentTime / duration;
    const easedT = t * t * (3 - 2 * t);

    state.c.r = presets[segmentIndex].r * (1 - easedT) + presets[nextIndex].r * easedT;
    state.c.i = presets[segmentIndex].i * (1 - easedT) + presets[nextIndex].i * easedT;
}

// ===== Responsive Canvas =====
function resizeCanvas() {
    const container = document.getElementById('canvasContainer');
    const width = container.clientWidth;
    const height = Math.round(width * 0.75);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const renderWidth = Math.min(Math.round(width * dpr), 1200);
    const renderHeight = Math.round(renderWidth * 0.75);
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    canvas.style.height = height + 'px';
    requestRender();
}

window.addEventListener('resize', resizeCanvas);

// ===== Init =====
resizeCanvas();
