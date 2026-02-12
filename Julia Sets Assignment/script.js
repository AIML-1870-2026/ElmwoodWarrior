// ===== Performance Config =====
const FAST_RES = 200;
const FULL_RES = 500;
const REFINE_DELAY = 300;
const PREVIEW_RES = 100;

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
    anim: { mode: null, playing: false, speed: 1, time: 0 },
    dragging: false,
    dragStart: null,
    viewAtDragStart: null,
    theme: 'dark',
    // New feature states
    sound: { enabled: false, scale: 'pentatonic', volume: 0.3 },
    kaleido: { enabled: false, segments: 6 },
    orbit: { enabled: false, trails: [] }
};

// ===== DOM =====
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const orbitOverlay = document.getElementById('orbitOverlay');
const orbitCtx = orbitOverlay.getContext('2d');
const cValueDisplay = document.getElementById('cValueDisplay');
const zoomDisplay = document.getElementById('zoomDisplay');
const coordDisplay = document.getElementById('coordDisplay');
const renderingIndicator = document.getElementById('renderingIndicator');
const iterSlider = document.getElementById('iterSlider');
const iterValue = document.getElementById('iterValue');
const speedSlider = document.getElementById('speedSlider');
const previewCDisplay = document.getElementById('previewC');
const previewHint = document.getElementById('previewHint');
const waveformCanvas = document.getElementById('waveformCanvas');
const waveformCtx = waveformCanvas.getContext('2d');

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

// ===== Color LUTs =====
const LUT_SIZE = 256;
const colorLUTs = {};

function buildLUT(paletteFunc) {
    const lut = new Uint8ClampedArray(LUT_SIZE * 3);
    for (let i = 0; i < LUT_SIZE; i++) {
        const t = i / (LUT_SIZE - 1);
        const c = paletteFunc(t);
        lut[i * 3] = c[0]; lut[i * 3 + 1] = c[1]; lut[i * 3 + 2] = c[2];
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
        r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
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
    ], t),
    aurora: (t) => gradientColor([
        { pos: 0, color: [0,17,34] }, { pos: 0.25, color: [0,255,136] },
        { pos: 0.5, color: [0,170,255] }, { pos: 0.75, color: [170,85,255] },
        { pos: 1, color: [0,17,34] }
    ], t),
    infrared: (t) => gradientColor([
        { pos: 0, color: [0,0,0] }, { pos: 0.25, color: [34,0,34] },
        { pos: 0.6, color: [255,0,85] }, { pos: 1, color: [255,204,0] }
    ], t)
};
const boundedColors = {
    rainbow: [0,0,0], fire: [0,0,0], ocean: [0,0,51], synthwave: [0,0,0],
    aurora: [0,17,34], infrared: [0,0,0]
};
for (const name in paletteFuncs) colorLUTs[name] = buildLUT(paletteFuncs[name]);

// ===== Fractal Computation =====
function computeFractal(imageData, width, height, view, isJulia, cVal, maxIter, paletteName, kaleidoscope) {
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
    const kEnabled = kaleidoscope && kaleidoscope.enabled;
    const kSegments = kEnabled ? kaleidoscope.segments : 0;
    const kAngle = kEnabled ? (2 * Math.PI / kSegments) : 0;
    const vcx = view.cx, vcy = view.cy;

    for (let py = 0; py < height; py++) {
        const rawY = startY + stepY * py;
        for (let px = 0; px < width; px++) {
            let x0 = startX + stepX * px;
            let y0 = rawY;

            // Kaleidoscope coordinate transform
            if (kEnabled) {
                const dx = x0 - vcx;
                const dy = y0 - vcy;
                const r = Math.sqrt(dx * dx + dy * dy);
                let theta = Math.atan2(dy, dx);
                theta = ((theta % kAngle) + kAngle) % kAngle;
                if (theta > kAngle / 2) theta = kAngle - theta;
                x0 = vcx + r * Math.cos(theta);
                y0 = vcy + r * Math.sin(theta);
            }

            let zr, zi, cr, ci;
            if (isJulia) { zr = x0; zi = y0; cr = cr_c; ci = ci_c; }
            else { zr = 0; zi = 0; cr = x0; ci = y0; }

            let iter = 0, zr2 = zr * zr, zi2 = zi * zi;
            while (zr2 + zi2 <= 4 && iter < maxIter) {
                zi = 2 * zr * zi + ci; zr = zr2 - zi2 + cr;
                zr2 = zr * zr; zi2 = zi * zi; iter++;
            }
            const idx = (py * width + px) * 4;
            if (iter === maxIter) {
                data[idx] = bc[0]; data[idx+1] = bc[1]; data[idx+2] = bc[2];
            } else {
                const logZn = Math.log(zr2 + zi2) * 0.5;
                const nu = Math.log(logZn * 1.4426950408889634) * 1.4426950408889634;
                const t = Math.abs(((iter + 1 - nu) / maxIter) * 4 % 1);
                const li3 = ((t * lutMax) | 0) * 3;
                data[idx] = lut[li3]; data[idx+1] = lut[li3+1]; data[idx+2] = lut[li3+2];
            }
            data[idx+3] = 255;
        }
    }
}

// ===== Rendering =====
let renderQueued = false;
let refineTimer = null;

function render(quality) {
    const isFast = quality === 'fast';
    const w = isFast || state.anim.playing ? FAST_RES : FULL_RES;
    const h = Math.round(w * 0.75);
    canvas.width = w; canvas.height = h;
    const view = state.views[state.tab];
    const iterCount = isFast ? Math.min(state.maxIter, 100) : state.maxIter;
    const imageData = ctx.createImageData(w, h);
    computeFractal(imageData, w, h, view, state.tab === 'julia', state.c, iterCount, state.palette, state.kaleido);
    ctx.putImageData(imageData, 0, 0);
    updateUI();
}

function requestRender(fast) {
    clearTimeout(refineTimer);
    if (fast) {
        if (!renderQueued) {
            renderQueued = true;
            requestAnimationFrame(() => { renderQueued = false; render('fast'); });
        }
        refineTimer = setTimeout(() => render('full'), REFINE_DELAY);
    } else {
        if (!renderQueued) {
            renderQueued = true;
            requestAnimationFrame(() => { renderQueued = false; render('full'); });
        }
    }
}

// ===== Julia Preview =====
let previewThrottle = 0;

function renderPreview(cr, ci) {
    const w = PREVIEW_RES;
    const h = Math.round(w * 0.75);
    previewCanvas.width = w;
    previewCanvas.height = h;
    const view = { cx: 0, cy: 0, scale: 1.5 };
    const cVal = { r: cr, i: ci };
    const imageData = previewCtx.createImageData(w, h);
    computeFractal(imageData, w, h, view, true, cVal, 80, state.palette, null);
    previewCtx.putImageData(imageData, 0, 0);
    previewCDisplay.textContent = `c = ${formatComplex(cr, ci)}`;
    previewHint.textContent = '';
}

// ===== Preset Thumbnails =====
function renderPresetThumbnails() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        const thumbCanvas = btn.querySelector('.preset-thumb');
        if (!thumbCanvas) return;
        const tCtx = thumbCanvas.getContext('2d');
        const w = thumbCanvas.width, h = thumbCanvas.height;
        const view = { cx: 0, cy: 0, scale: 1.5 };
        const cVal = { r: parseFloat(btn.dataset.cr), i: parseFloat(btn.dataset.ci) };
        const imageData = tCtx.createImageData(w, h);
        computeFractal(imageData, w, h, view, true, cVal, 60, state.palette, null);
        tCtx.putImageData(imageData, 0, 0);
    });
}

// ===== UI =====
function formatComplex(r, i) {
    const sign = i >= 0 ? '+' : '\u2212';
    return `${r.toFixed(3)} ${sign} ${Math.abs(i).toFixed(3)}i`;
}
function updateUI() {
    cValueDisplay.textContent = `c = ${formatComplex(state.c.r, state.c.i)}`;
    const view = state.views[state.tab];
    zoomDisplay.textContent = `Zoom: ${(1.5 / view.scale).toFixed(1)}x`;
    syncCSliders();
}

function pixelToComplex(px, py) {
    const rect = canvas.getBoundingClientRect();
    const x = (px - rect.left) / rect.width;
    const y = (py - rect.top) / rect.height;
    const view = state.views[state.tab];
    const aspect = 4 / 3;
    const scaleX = view.scale * aspect, scaleY = view.scale;
    return { r: view.cx - scaleX + 2 * scaleX * x, i: view.cy - scaleY + 2 * scaleY * y };
}

// ===== Sound Lab (Web Audio API) =====
let audioCtx = null;
let oscillator = null;
let gainNode = null;
let analyserNode = null;
let reverbNode = null;
let soundInitialized = false;
let waveformAnimFrame = null;

const musicalScales = {
    pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00],
    chromatic:  [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25],
    ethereal:   [220.00, 261.63, 311.13, 349.23, 415.30, 466.16, 523.25, 622.25, 698.46, 830.61]
};

function initAudio() {
    if (soundInitialized) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Create reverb impulse response
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * 2.5;
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const channelData = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.2);
        }
    }
    reverbNode = audioCtx.createConvolver();
    reverbNode.buffer = impulse;

    // Analyser for waveform visualization
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;

    // Gain
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;

    // Create dual oscillators for richness
    oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;

    const osc2 = audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 440;
    osc2.detune.value = 5; // slight detune for chorus effect

    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.value = 0.3;

    // Routing: oscillators -> gain -> reverb + dry -> analyser -> output
    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 0.6;
    const wetGain = audioCtx.createGain();
    wetGain.gain.value = 0.4;

    oscillator.connect(gainNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);

    gainNode.connect(dryGain);
    gainNode.connect(reverbNode);
    reverbNode.connect(wetGain);

    dryGain.connect(analyserNode);
    wetGain.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    oscillator.start();
    osc2.start();

    // Store for frequency updates
    state.sound._osc2 = osc2;

    soundInitialized = true;
}

function playFractalNote(iterCount, maxIter, complexX, complexY) {
    if (!state.sound.enabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const scale = musicalScales[state.sound.scale];
    if (iterCount >= maxIter) {
        // Inside the set - fade to silence
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        return;
    }

    const normalized = iterCount / maxIter;
    const noteIndex = Math.floor(normalized * (scale.length - 1));
    const freq = scale[Math.min(noteIndex, scale.length - 1)];

    // Smooth frequency glide (portamento)
    const now = audioCtx.currentTime;
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(freq, 20), now + 0.06);
    if (state.sound._osc2) {
        state.sound._osc2.frequency.exponentialRampToValueAtTime(Math.max(freq, 20), now + 0.06);
    }

    // Volume based on distance to boundary (louder near boundary = more interesting)
    const boundary = 1 - Math.abs(normalized - 0.5) * 2; // peaks at 0.5
    const vol = state.sound.volume * (0.3 + 0.7 * boundary);
    gainNode.gain.linearRampToValueAtTime(Math.min(vol, 0.5), now + 0.05);
}

function drawWaveform() {
    if (!state.sound.enabled || !analyserNode) {
        waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        return;
    }

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteTimeDomainData(dataArray);

    const w = waveformCanvas.width;
    const h = waveformCanvas.height;
    waveformCtx.clearRect(0, 0, w, h);

    // Draw waveform with gradient
    const gradient = waveformCtx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#6c5ce7');
    gradient.addColorStop(0.5, '#a855f7');
    gradient.addColorStop(1, '#f093fb');

    waveformCtx.lineWidth = 2;
    waveformCtx.strokeStyle = gradient;
    waveformCtx.beginPath();

    const sliceWidth = w / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) waveformCtx.moveTo(x, y);
        else waveformCtx.lineTo(x, y);
        x += sliceWidth;
    }
    waveformCtx.lineTo(w, h / 2);
    waveformCtx.stroke();

    // Glow effect
    waveformCtx.lineWidth = 4;
    waveformCtx.strokeStyle = 'rgba(108, 92, 231, 0.2)';
    waveformCtx.beginPath();
    x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) waveformCtx.moveTo(x, y);
        else waveformCtx.lineTo(x, y);
        x += sliceWidth;
    }
    waveformCtx.lineTo(w, h / 2);
    waveformCtx.stroke();

    waveformAnimFrame = requestAnimationFrame(drawWaveform);
}

// Sound toggle
document.getElementById('soundToggle').addEventListener('click', function() {
    state.sound.enabled = !state.sound.enabled;
    this.classList.toggle('active', state.sound.enabled);
    document.getElementById('soundPanel').classList.toggle('active-glow', state.sound.enabled);

    if (state.sound.enabled) {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        drawWaveform();
    } else {
        if (gainNode) gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        if (waveformAnimFrame) cancelAnimationFrame(waveformAnimFrame);
        waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    }
});

document.getElementById('volumeSlider').addEventListener('input', function() {
    state.sound.volume = parseInt(this.value) / 100;
});

document.querySelectorAll('.scale-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.sound.scale = btn.dataset.scale;
    });
});

// ===== Orbit Trail Visualizer =====
function computeOrbit(x0, y0) {
    const isJulia = state.tab === 'julia';
    let zr, zi, cr, ci;
    if (isJulia) {
        zr = x0; zi = y0; cr = state.c.r; ci = state.c.i;
    } else {
        zr = 0; zi = 0; cr = x0; ci = y0;
    }

    const points = [{ r: zr, i: zi }];
    for (let iter = 0; iter < state.maxIter; iter++) {
        const newZr = zr * zr - zi * zi + cr;
        const newZi = 2 * zr * zi + ci;
        zr = newZr; zi = newZi;
        points.push({ r: zr, i: zi });
        if (zr * zr + zi * zi > 100) break;
    }
    return points;
}

function complexToPixel(r, i) {
    const rect = canvas.getBoundingClientRect();
    const view = state.views[state.tab];
    const aspect = 4 / 3;
    const scaleX = view.scale * aspect;
    const scaleY = view.scale;
    const px = ((r - (view.cx - scaleX)) / (2 * scaleX)) * rect.width;
    const py = ((i - (view.cy - scaleY)) / (2 * scaleY)) * rect.height;
    return { x: px, y: py };
}

function drawOrbitTrails() {
    const rect = canvas.getBoundingClientRect();
    orbitOverlay.width = rect.width * window.devicePixelRatio;
    orbitOverlay.height = rect.height * window.devicePixelRatio;
    orbitOverlay.style.width = rect.width + 'px';
    orbitOverlay.style.height = rect.height + 'px';
    orbitCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    orbitCtx.clearRect(0, 0, rect.width, rect.height);

    state.orbit.trails.forEach((trail, trailIdx) => {
        const points = trail.points;
        if (points.length < 2) return;

        const hue = (trailIdx * 60) % 360;

        // Draw connecting lines
        orbitCtx.lineWidth = 1.5;
        orbitCtx.globalAlpha = 0.6;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = complexToPixel(points[i].r, points[i].i);
            const p2 = complexToPixel(points[i + 1].r, points[i + 1].i);
            const progress = i / points.length;
            orbitCtx.strokeStyle = `hsla(${hue + progress * 120}, 100%, 65%, ${0.8 - progress * 0.5})`;
            orbitCtx.beginPath();
            orbitCtx.moveTo(p1.x, p1.y);
            orbitCtx.lineTo(p2.x, p2.y);
            orbitCtx.stroke();
        }

        // Draw dots at each iteration
        orbitCtx.globalAlpha = 1;
        for (let i = 0; i < points.length; i++) {
            const p = complexToPixel(points[i].r, points[i].i);
            if (p.x < -50 || p.x > rect.width + 50 || p.y < -50 || p.y > rect.height + 50) continue;
            const progress = i / points.length;
            const radius = 3 - progress * 1.5;

            // Glow
            orbitCtx.fillStyle = `hsla(${hue + progress * 120}, 100%, 70%, 0.3)`;
            orbitCtx.beginPath();
            orbitCtx.arc(p.x, p.y, radius + 3, 0, Math.PI * 2);
            orbitCtx.fill();

            // Dot
            orbitCtx.fillStyle = `hsla(${hue + progress * 120}, 100%, 75%, 1)`;
            orbitCtx.beginPath();
            orbitCtx.arc(p.x, p.y, Math.max(radius, 1), 0, Math.PI * 2);
            orbitCtx.fill();
        }

        // Mark starting point
        const start = complexToPixel(points[0].r, points[0].i);
        orbitCtx.fillStyle = '#fff';
        orbitCtx.beginPath();
        orbitCtx.arc(start.x, start.y, 4, 0, Math.PI * 2);
        orbitCtx.fill();
        orbitCtx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
        orbitCtx.lineWidth = 2;
        orbitCtx.beginPath();
        orbitCtx.arc(start.x, start.y, 4, 0, Math.PI * 2);
        orbitCtx.stroke();
    });
    orbitCtx.globalAlpha = 1;
}

document.getElementById('orbitToggle').addEventListener('click', function() {
    state.orbit.enabled = !state.orbit.enabled;
    this.classList.toggle('active', state.orbit.enabled);
    if (state.orbit.enabled) {
        canvas.style.cursor = 'crosshair';
    } else {
        canvas.style.cursor = 'crosshair';
    }
});

document.getElementById('orbitClear').addEventListener('click', () => {
    state.orbit.trails = [];
    const rect = canvas.getBoundingClientRect();
    orbitOverlay.width = rect.width;
    orbitOverlay.height = rect.height;
    orbitCtx.clearRect(0, 0, orbitOverlay.width, orbitOverlay.height);
});

// ===== Kaleidoscope =====
document.getElementById('kaleidoToggle').addEventListener('click', function() {
    state.kaleido.enabled = !state.kaleido.enabled;
    this.classList.toggle('active', state.kaleido.enabled);
    document.getElementById('kaleidoPanel').classList.toggle('active-glow', state.kaleido.enabled);
    requestRender(false);
});

document.getElementById('kaleidoSlider').addEventListener('input', function() {
    state.kaleido.segments = parseInt(this.value);
    document.getElementById('kaleidoValue').textContent = this.value;
    if (state.kaleido.enabled) requestRender(true);
});

// ===== HD Export =====
function exportFractal(resolution) {
    const w = resolution;
    const h = Math.round(w * 0.75);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const exportCtx = exportCanvas.getContext('2d');
    const view = state.views[state.tab];
    const imageData = exportCtx.createImageData(w, h);

    renderingIndicator.textContent = `Exporting ${w}x${h}...`;
    renderingIndicator.classList.add('visible');

    // Use setTimeout to allow UI update
    setTimeout(() => {
        computeFractal(imageData, w, h, view, state.tab === 'julia', state.c, state.maxIter, state.palette, state.kaleido);
        exportCtx.putImageData(imageData, 0, 0);

        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `julia-set-${state.tab}-${w}x${h}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            renderingIndicator.classList.remove('visible');
        }, 'image/png');
    }, 50);
}

document.getElementById('exportHD').addEventListener('click', () => exportFractal(2048));
document.getElementById('export4K').addEventListener('click', () => exportFractal(4096));

// ===== C Parameter Sliders =====
const cRealSlider = document.getElementById('cRealSlider');
const cImagSlider = document.getElementById('cImagSlider');
const cRealValue = document.getElementById('cRealValue');
const cImagValue = document.getElementById('cImagValue');

function syncCSliders() {
    cRealSlider.value = state.c.r;
    cImagSlider.value = state.c.i;
    cRealValue.textContent = state.c.r.toFixed(3);
    cImagValue.textContent = state.c.i.toFixed(3);
}

cRealSlider.addEventListener('input', () => {
    state.c.r = parseFloat(cRealSlider.value);
    cRealValue.textContent = state.c.r.toFixed(3);
    if (state.tab !== 'julia') {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="julia"]').classList.add('active');
        state.tab = 'julia';
    }
    requestRender(true);
});
cImagSlider.addEventListener('input', () => {
    state.c.i = parseFloat(cImagSlider.value);
    cImagValue.textContent = state.c.i.toFixed(3);
    if (state.tab !== 'julia') {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="julia"]').classList.add('active');
        state.tab = 'julia';
    }
    requestRender(true);
});

// ===== Info Panel Toggle =====
document.getElementById('infoToggle').addEventListener('click', () => {
    const body = document.getElementById('infoBody');
    const chevron = document.getElementById('infoChevron');
    body.classList.toggle('collapsed');
    chevron.classList.toggle('collapsed');
});

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
document.querySelectorAll('.palette-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.palette = btn.dataset.palette;
        requestRender(false);
        // Re-render preset thumbnails with new palette
        setTimeout(renderPresetThumbnails, 100);
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

// Zoom
document.getElementById('zoomIn').addEventListener('click', () => { state.views[state.tab].scale *= 0.5; requestRender(true); });
document.getElementById('zoomOut').addEventListener('click', () => { state.views[state.tab].scale *= 2; requestRender(true); });
document.getElementById('resetView').addEventListener('click', () => {
    if (state.tab === 'mandelbrot') state.views.mandelbrot = { cx: -0.5, cy: 0, scale: 1.5 };
    else state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
    requestRender(false);
});

// Sliders
iterSlider.addEventListener('input', () => {
    state.maxIter = parseInt(iterSlider.value);
    iterValue.textContent = state.maxIter;
    requestRender(true);
});
speedSlider.addEventListener('input', () => { state.anim.speed = parseFloat(speedSlider.value); });

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

// Drag / click
let clickStart = null, hasDragged = false;

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

    // Live Julia preview on Mandelbrot hover
    if (state.tab === 'mandelbrot' && !state.dragging) {
        const now = performance.now();
        if (now - previewThrottle > 60) {
            previewThrottle = now;
            renderPreview(complex.r, complex.i);
        }
    }

    // Sound: play note based on position
    if (state.sound.enabled && !state.dragging) {
        const view = state.views[state.tab];
        const isJulia = state.tab === 'julia';
        let zr, zi, cr, ci;
        if (isJulia) { zr = complex.r; zi = complex.i; cr = state.c.r; ci = state.c.i; }
        else { zr = 0; zi = 0; cr = complex.r; ci = complex.i; }

        let iter = 0;
        let zr2 = zr * zr, zi2 = zi * zi;
        while (zr2 + zi2 <= 4 && iter < state.maxIter) {
            zi = 2 * zr * zi + ci; zr = zr2 - zi2 + cr;
            zr2 = zr * zr; zi2 = zi * zi; iter++;
        }
        playFractalNote(iter, state.maxIter, complex.r, complex.i);
    }

    if (state.dragging) {
        const dx = e.clientX - state.dragStart.x;
        const dy = e.clientY - state.dragStart.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
        const rect = canvas.getBoundingClientRect();
        const view = state.views[state.tab];
        const scaleX = state.viewAtDragStart.scale * (4/3);
        const scaleY = state.viewAtDragStart.scale;
        view.cx = state.viewAtDragStart.cx - (dx / rect.width) * 2 * scaleX;
        view.cy = state.viewAtDragStart.cy - (dy / rect.height) * 2 * scaleY;
        requestRender(true);
    }
});

canvas.addEventListener('mouseup', (e) => {
    state.dragging = false;

    // Orbit trace mode
    if (!hasDragged && state.orbit.enabled) {
        const complex = pixelToComplex(e.clientX, e.clientY);
        const orbitPoints = computeOrbit(complex.r, complex.i);
        state.orbit.trails.push({ points: orbitPoints, origin: complex });
        drawOrbitTrails();
        return;
    }

    if (!hasDragged && state.tab === 'mandelbrot') {
        const complex = pixelToComplex(e.clientX, e.clientY);
        state.c.r = complex.r; state.c.i = complex.i;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="julia"]').classList.add('active');
        state.tab = 'julia';
        state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
        requestRender(false);
    } else if (hasDragged) {
        requestRender(false);
        // Redraw orbit trails after pan
        if (state.orbit.trails.length > 0) drawOrbitTrails();
    }
});
canvas.addEventListener('mouseleave', () => {
    state.dragging = false;
    // Fade sound on leave
    if (state.sound.enabled && gainNode) {
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
    }
});

// Touch
let lastTouchDist = null;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        clickStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        hasDragged = false; state.dragging = true;
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
        const scaleX = state.viewAtDragStart.scale * (4/3), scaleY = state.viewAtDragStart.scale;
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
        state.dragging = false; lastTouchDist = null;
        if (!hasDragged && state.tab === 'mandelbrot' && clickStart) {
            const complex = pixelToComplex(clickStart.x, clickStart.y);
            state.c.r = complex.r; state.c.i = complex.i;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tab="julia"]').classList.add('active');
            state.tab = 'julia';
            state.views.julia = { cx: 0, cy: 0, scale: 1.5 };
            requestRender(false);
        } else { requestRender(false); }
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
        case '5': selectPalette('aurora'); break;
        case '6': selectPalette('infrared'); break;
        case 'k': case 'K':
            document.getElementById('kaleidoToggle').click();
            break;
        case 's': case 'S':
            if (!e.ctrlKey && !e.metaKey) document.getElementById('soundToggle').click();
            break;
    }
});
function selectPalette(name) {
    document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
    const el = document.querySelector(`.palette-btn[data-palette="${name}"]`);
    if (el) {
        el.classList.add('active');
        state.palette = name;
        requestRender(false);
        setTimeout(renderPresetThumbnails, 100);
    }
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
let animFrame = null, animLastTime = null;

document.querySelectorAll('[data-anim]').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.anim;
        if (state.anim.mode === mode) {
            document.querySelectorAll('[data-anim]').forEach(b => b.classList.remove('active'));
            state.anim.mode = null; stopAnimation();
        } else {
            document.querySelectorAll('[data-anim]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); state.anim.mode = mode; state.anim.time = 0;
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
document.getElementById('animStop').addEventListener('click', () => { stopAnimation(); requestRender(false); });

function startAnimation() {
    state.anim.playing = true; animLastTime = performance.now();
    if (state.tab !== 'julia') {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="julia"]').classList.add('active');
        state.tab = 'julia';
    }
    if (!animFrame) animLoop();
}
function stopAnimation() {
    state.anim.playing = false; state.anim.time = 0; animLastTime = null;
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
}
function animLoop() {
    if (!state.anim.playing) { animFrame = null; return; }
    const now = performance.now();
    const dt = (now - (animLastTime || now)) / 1000;
    animLastTime = now; state.anim.time += dt * state.anim.speed;
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
    const duration = 3, total = presets.length;
    const seg = state.anim.time % duration;
    const idx = Math.floor(state.anim.time / duration) % total;
    const next = (idx + 1) % total;
    const e = (seg / duration); const t = e * e * (3 - 2 * e);
    state.c.r = presets[idx].r * (1 - t) + presets[next].r * t;
    state.c.i = presets[idx].i * (1 - t) + presets[next].i * t;
}

// ===== Button ripple effect =====
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty('--ripple-x', x + '%');
        btn.style.setProperty('--ripple-y', y + '%');
    });
});

// ===== Canvas sizing =====
function setCanvasDisplay() {
    const container = document.getElementById('canvasContainer');
    const w = container.clientWidth;
    canvas.style.height = Math.round(w * 0.75) + 'px';
    orbitOverlay.style.height = Math.round(w * 0.75) + 'px';
}
window.addEventListener('resize', () => {
    setCanvasDisplay();
    requestRender(false);
    if (state.orbit.trails.length > 0) setTimeout(drawOrbitTrails, 100);
});

// ===== Init =====
setCanvasDisplay();
renderPreview(state.c.r, state.c.i);
requestRender(false);

// Render preset thumbnails after a short delay
setTimeout(renderPresetThumbnails, 200);
