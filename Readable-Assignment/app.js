// ============================================================
// Readable — app.js
// ============================================================

const state = {
    bg: { r: 255, g: 255, b: 255 },
    text: { r: 0, g: 0, b: 0 },
    fontSize: 16,
    visionMode: 'normal',
    guess: { active: false, correct: 0, total: 0, answer: null, streak: 0 }
};

// --- DOM ---
const dom = {
    display: document.getElementById('text-display'),
    contrastRatio: document.getElementById('contrast-ratio'),
    bgLuminance: document.getElementById('bg-luminance'),
    textLuminance: document.getElementById('text-luminance'),
    bgSwatch: document.getElementById('bg-swatch'),
    textSwatch: document.getElementById('text-swatch'),
    bgHex: document.getElementById('bg-hex'),
    textHex: document.getElementById('text-hex'),
    badgeNormal: document.getElementById('badge-normal-status'),
    badgeLarge: document.getElementById('badge-large-status'),
    lockNotice: document.getElementById('vision-lock-notice'),
    presetButtons: document.getElementById('preset-buttons'),
    roastBtn: document.getElementById('roast-btn'),
    roastText: document.getElementById('roast-text'),
    swapBtn: document.getElementById('swap-btn'),
    guessStart: document.getElementById('guess-start'),
    guessButtons: document.getElementById('guess-buttons'),
    guessPass: document.getElementById('guess-pass'),
    guessFail: document.getElementById('guess-fail'),
    guessResult: document.getElementById('guess-result'),
    scoreCorrect: document.getElementById('score-correct'),
    scoreTotal: document.getElementById('score-total'),
    guessStreak: document.getElementById('guess-streak'),
    streakNum: document.getElementById('streak-num'),
    autoRoastOverlay: document.getElementById('auto-roast-overlay'),
    autoRoastMsg: document.getElementById('auto-roast-msg'),
    guessEnd: document.getElementById('guess-end')
};

const channels = [
    { slider: 'bg-r-slider', num: 'bg-r-num', target: 'bg', channel: 'r' },
    { slider: 'bg-g-slider', num: 'bg-g-num', target: 'bg', channel: 'g' },
    { slider: 'bg-b-slider', num: 'bg-b-num', target: 'bg', channel: 'b' },
    { slider: 'text-r-slider', num: 'text-r-num', target: 'text', channel: 'r' },
    { slider: 'text-g-slider', num: 'text-g-num', target: 'text', channel: 'g' },
    { slider: 'text-b-slider', num: 'text-b-num', target: 'text', channel: 'b' }
];

const sizeSlider = document.getElementById('size-slider');
const sizeNum = document.getElementById('size-num');

// ============================================================
// WCAG Luminance & Contrast
// ============================================================

function srgbToLinear(c) {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
    return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// ============================================================
// Vision Simulation
// ============================================================

const visionMatrices = {
    protanopia: [
        [0.56667, 0.43333, 0.00000],
        [0.55833, 0.44167, 0.00000],
        [0.00000, 0.24167, 0.75833]
    ],
    deuteranopia: [
        [0.62500, 0.37500, 0.00000],
        [0.70000, 0.30000, 0.00000],
        [0.00000, 0.30000, 0.70000]
    ],
    tritanopia: [
        [0.95000, 0.05000, 0.00000],
        [0.00000, 0.43333, 0.56667],
        [0.00000, 0.47500, 0.52500]
    ],
    monochromacy: [
        [0.2126, 0.7152, 0.0722],
        [0.2126, 0.7152, 0.0722],
        [0.2126, 0.7152, 0.0722]
    ]
};

function simulateVision(r, g, b, mode) {
    if (mode === 'normal') return { r, g, b };
    const m = visionMatrices[mode];
    return {
        r: Math.round(Math.min(255, Math.max(0, m[0][0] * r + m[0][1] * g + m[0][2] * b))),
        g: Math.round(Math.min(255, Math.max(0, m[1][0] * r + m[1][1] * g + m[1][2] * b))),
        b: Math.round(Math.min(255, Math.max(0, m[2][0] * r + m[2][1] * g + m[2][2] * b)))
    };
}

// ============================================================
// Helpers
// ============================================================

function toHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

function showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('show'));
    });
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 1500);
}

// ============================================================
// Presets
// ============================================================

const presets = [
    { name: 'Classic B/W', bg: [255, 255, 255], text: [0, 0, 0] },
    { name: 'Dark Mode', bg: [30, 30, 30], text: [230, 230, 230] },
    { name: 'GitHub', bg: [255, 255, 255], text: [31, 35, 40] },
    { name: 'Solarized', bg: [253, 246, 227], text: [101, 123, 131] },
    { name: 'Monokai', bg: [39, 40, 34], text: [248, 248, 242] },
    { name: 'Nord', bg: [46, 52, 64], text: [216, 222, 233] },
    { name: 'Faint Gray', bg: [255, 255, 255], text: [150, 150, 150] },
    { name: 'Pale Mint', bg: [200, 235, 210], text: [140, 190, 155] },
    { name: 'Yellow/White', bg: [255, 255, 255], text: [255, 255, 0] },
    { name: 'Gray/White', bg: [245, 245, 245], text: [200, 200, 200] },
    { name: 'Red/Green', bg: [0, 128, 0], text: [200, 50, 50] }
];

function buildPresetButtons() {
    presets.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.textContent = p.name;
        btn.addEventListener('click', () => applyPreset(p));
        dom.presetButtons.appendChild(btn);
    });
}

function applyPreset(p) {
    state.bg.r = p.bg[0]; state.bg.g = p.bg[1]; state.bg.b = p.bg[2];
    state.text.r = p.text[0]; state.text.g = p.text[1]; state.text.b = p.text[2];
    syncControlsFromState();
    update();
}

// ============================================================
// Roast My Colors
// ============================================================

const roasts = [
    "Congratulations, you've invented invisible ink.",
    "This color combo is a war crime against eyeballs everywhere.",
    "I've seen better contrast on a foggy day in a snowstorm.",
    "Are you designing for ghosts? Because no living person can read this.",
    "My grandmother's cataracts called — they want their color scheme back.",
    "This is less 'design choice' and more 'cry for help.'",
    "Somewhere, a WCAG auditor just felt a disturbance in the Force.",
    "If squinting was a sport, your users would be Olympic athletes.",
    "Bold strategy: making your text the same color as your background.",
    "This color pair just failed a vibe check AND an accessibility check.",
    "I've seen more contrast between two slices of plain white bread.",
    "Your users don't need glasses — they need a search party to find this text.",
    "Even a chameleon would say this blends in too much.",
    "This combo makes me want to Ctrl+Z my entire career in design.",
    "You didn't just fail WCAG — you made WCAG cry.",
    "I showed this to my optometrist and she retired on the spot.",
    "Were you going for 'minimalism' or 'witness protection for your text'?",
    "Your contrast ratio is so low it just got rejected from limbo.",
    "This makes gray-on-gray look like a fireworks show.",
    "If your goal was to make people lean 3 inches closer to their screen, congratulations.",
    "I ran this through 47 accessibility tools. They all just said 'why.'",
    "Your text is playing hide and seek. It's winning.",
    "Even a Magic 8-Ball has better contrast than this."
];

let lastRoastIndex = -1;
let autoRoastTimer = null;
let currentAutoRoast = '';

function getRandomRoast() {
    let idx;
    do {
        idx = Math.floor(Math.random() * roasts.length);
    } while (idx === lastRoastIndex && roasts.length > 1);
    lastRoastIndex = idx;
    return roasts[idx];
}

// ============================================================
// Sync & Update
// ============================================================

function syncControlsFromState() {
    channels.forEach(ch => {
        const val = state[ch.target][ch.channel];
        document.getElementById(ch.slider).value = val;
        document.getElementById(ch.num).value = val;
    });
    sizeSlider.value = state.fontSize;
    sizeNum.value = state.fontSize;
}

function update() {
    const { bg, text, fontSize, visionMode } = state;

    const simBg = simulateVision(bg.r, bg.g, bg.b, visionMode);
    const simText = simulateVision(text.r, text.g, text.b, visionMode);

    dom.display.style.backgroundColor = `rgb(${simBg.r}, ${simBg.g}, ${simBg.b})`;
    dom.display.style.color = `rgb(${simText.r}, ${simText.g}, ${simText.b})`;
    dom.display.style.fontSize = fontSize + 'px';

    const bgL = relativeLuminance(bg.r, bg.g, bg.b);
    const textL = relativeLuminance(text.r, text.g, text.b);
    const ratio = contrastRatio(bgL, textL);

    if (!state.guess.active) {
        dom.contrastRatio.textContent = ratio.toFixed(2) + ':1';
    }
    dom.bgLuminance.textContent = bgL.toFixed(4);
    dom.textLuminance.textContent = textL.toFixed(4);

    dom.bgSwatch.style.background = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
    dom.textSwatch.style.background = `rgb(${text.r}, ${text.g}, ${text.b})`;

    // Hex displays
    dom.bgHex.textContent = toHex(bg.r, bg.g, bg.b);
    dom.textHex.textContent = toHex(text.r, text.g, text.b);

    updateBadge(dom.badgeNormal, ratio >= 4.5);
    updateBadge(dom.badgeLarge, ratio >= 3);

    const failing = ratio < 4.5;
    dom.roastBtn.disabled = !failing;
    if (!failing) {
        dom.roastText.textContent = '';
    }

    // Auto-roast overlay: show when contrast is bad, hide during game
    if (failing && !state.guess.active) {
        dom.autoRoastOverlay.classList.remove('hidden');
        // Rotate roasts every 4 seconds
        if (!autoRoastTimer) {
            currentAutoRoast = getRandomRoast();
            dom.autoRoastMsg.textContent = currentAutoRoast;
            autoRoastTimer = setInterval(() => {
                currentAutoRoast = getRandomRoast();
                dom.autoRoastMsg.style.animation = 'none';
                dom.autoRoastMsg.offsetHeight; // trigger reflow
                dom.autoRoastMsg.style.animation = '';
                dom.autoRoastMsg.textContent = currentAutoRoast;
            }, 4000);
        }
    } else {
        dom.autoRoastOverlay.classList.add('hidden');
        if (autoRoastTimer) {
            clearInterval(autoRoastTimer);
            autoRoastTimer = null;
        }
    }

    // Dynamic glow on the preview based on BG color
    const glowColor = `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.15)`;
    dom.display.style.boxShadow = `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`;
}

function updateBadge(el, passes) {
    el.textContent = passes ? 'PASS' : 'FAIL';
    el.className = 'badge-status ' + (passes ? 'pass' : 'fail');
}

// ============================================================
// Particle Background
// ============================================================

function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const count = 60;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#00e5ff', '#ff00e5', '#39ff14', '#ff3366', '#00aaff'];

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.5 + 0.1
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const alpha = (1 - dist / 150) * 0.12;
                    ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
            grad.addColorStop(0, p.color.replace(')', ', 0.15)').replace('rgb', 'rgba').replace('#', ''));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            // Use simplified glow
            ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha * 0.15})`;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================
// Confetti System
// ============================================================

const confettiState = { particles: [], active: false };

function initConfetti() {
    const canvas = document.getElementById('confetti');
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#00e5ff', '#ff00e5', '#39ff14', '#ff3366', '#ffe600', '#00aaff'];

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = confettiState.particles.length - 1; i >= 0; i--) {
            const p = confettiState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12; // gravity
            p.rotation += p.rotationSpeed;
            p.alpha -= 0.008;

            if (p.alpha <= 0) {
                confettiState.particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }

        if (confettiState.particles.length > 0) {
            requestAnimationFrame(draw);
        } else {
            confettiState.active = false;
        }
    }

    confettiState.fire = function () {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        for (let i = 0; i < 80; i++) {
            confettiState.particles.push({
                x: cx + (Math.random() - 0.5) * 200,
                y: cy - 100,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 1) * 10 - 2,
                w: Math.random() * 8 + 4,
                h: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                alpha: 1
            });
        }
        if (!confettiState.active) {
            confettiState.active = true;
            draw();
        }
    };
}

// ============================================================
// Swap Colors
// ============================================================

function swapColors() {
    const tmp = { ...state.bg };
    state.bg.r = state.text.r; state.bg.g = state.text.g; state.bg.b = state.text.b;
    state.text.r = tmp.r; state.text.g = tmp.g; state.text.b = tmp.b;
    syncControlsFromState();
    update();
}

// ============================================================
// Copy Hex to Clipboard
// ============================================================

function copyHex(target) {
    const el = target === 'bg' ? dom.bgHex : dom.textHex;
    const hex = el.textContent;
    navigator.clipboard.writeText(hex).then(() => {
        el.classList.add('copied');
        showToast(`Copied ${hex}`);
        setTimeout(() => el.classList.remove('copied'), 1200);
    });
}

// ============================================================
// Guess the Ratio
// ============================================================

function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function randomColor(lMin, lMax) {
    const h = Math.floor(Math.random() * 360);
    const s = 40 + Math.floor(Math.random() * 60);
    const l = lMin + Math.floor(Math.random() * (lMax - lMin));
    return hslToRgb(h, s, l);
}

function generateGuessColors() {
    // ~50% chance of generating a passing combo (ratio >= 4.5)
    const wantPass = Math.random() < 0.5;

    if (wantPass) {
        // Pick one light and one dark color to ensure high contrast
        const light = randomColor(70, 95);
        const dark = randomColor(5, 30);
        // Randomly assign which is bg vs text
        if (Math.random() < 0.5) {
            return { bg: light, text: dark };
        } else {
            return { bg: dark, text: light };
        }
    } else {
        // Pick two colors with similar lightness for low contrast
        const baseLightness = 30 + Math.floor(Math.random() * 40);
        const bg = randomColor(baseLightness, baseLightness + 15);
        const text = randomColor(baseLightness, baseLightness + 15);
        return { bg, text };
    }
}

function startGuessRound() {
    const colors = generateGuessColors();
    state.bg.r = colors.bg.r; state.bg.g = colors.bg.g; state.bg.b = colors.bg.b;
    state.text.r = colors.text.r; state.text.g = colors.text.g; state.text.b = colors.text.b;

    const bgL = relativeLuminance(state.bg.r, state.bg.g, state.bg.b);
    const textL = relativeLuminance(state.text.r, state.text.g, state.text.b);
    const ratio = contrastRatio(bgL, textL);
    state.guess.answer = { ratio, passes: ratio >= 4.5 };
    state.guess.active = true;

    dom.contrastRatio.textContent = '??.??:1';
    syncControlsFromState();
    update();

    dom.guessButtons.classList.remove('hidden');
    dom.guessResult.classList.add('hidden');
}

function submitGuess(guessedPass) {
    const { ratio, passes } = state.guess.answer;
    const isCorrect = guessedPass === passes;

    state.guess.total++;
    if (isCorrect) {
        state.guess.correct++;
        state.guess.streak++;
        if (confettiState.fire && state.guess.streak >= 2) {
            confettiState.fire();
        }
    } else {
        state.guess.streak = 0;
    }
    state.guess.active = false;

    // Update streak display
    if (state.guess.streak >= 2) {
        dom.guessStreak.classList.remove('hidden');
        dom.streakNum.textContent = state.guess.streak;
    } else {
        dom.guessStreak.classList.add('hidden');
    }

    dom.contrastRatio.textContent = ratio.toFixed(2) + ':1';

    dom.guessResult.classList.remove('hidden', 'correct', 'incorrect');
    dom.guessResult.classList.add(isCorrect ? 'correct' : 'incorrect');

    const label = passes ? 'PASS' : 'FAIL';
    dom.guessResult.textContent = (isCorrect ? 'Correct! ' : 'Wrong! ') + `${ratio.toFixed(2)}:1 — ${label}`;

    dom.guessButtons.classList.add('hidden');
    dom.guessEnd.classList.remove('hidden');
    dom.scoreCorrect.textContent = state.guess.correct;
    dom.scoreTotal.textContent = state.guess.total;
}

// ============================================================
// End Game
// ============================================================

function endGame() {
    if (state.guess.total === 0 && !state.guess.active) return;

    const { correct, total, streak } = state.guess;
    state.guess.active = false;

    // Show final result
    dom.guessResult.classList.remove('hidden', 'correct', 'incorrect');
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    let verdict;
    if (pct === 100 && total >= 3) verdict = 'Perfect! You have the eyes of a WCAG auditor.';
    else if (pct >= 80) verdict = 'Solid! You know your contrast.';
    else if (pct >= 50) verdict = 'Not bad, but your eyeballs need more training.';
    else verdict = 'Yikes. Time to let the roasts do the talking.';
    dom.guessResult.classList.add(pct >= 50 ? 'correct' : 'incorrect');
    dom.guessResult.textContent = `Game Over! ${correct}/${total} (${pct}%) — ${verdict}`;

    // Reset game state
    state.guess.correct = 0;
    state.guess.total = 0;
    state.guess.streak = 0;
    state.guess.answer = null;

    // Reset UI
    dom.guessButtons.classList.add('hidden');
    dom.guessEnd.classList.add('hidden');
    dom.guessStreak.classList.add('hidden');
    dom.scoreCorrect.textContent = '0';
    dom.scoreTotal.textContent = '0';
    dom.contrastRatio.textContent = contrastRatio(
        relativeLuminance(state.bg.r, state.bg.g, state.bg.b),
        relativeLuminance(state.text.r, state.text.g, state.text.b)
    ).toFixed(2) + ':1';

    // This triggers auto-roast overlay to come back if contrast is bad
    update();
}

// ============================================================
// Events
// ============================================================

function init() {
    channels.forEach(ch => {
        const slider = document.getElementById(ch.slider);
        const num = document.getElementById(ch.num);

        slider.addEventListener('input', () => {
            const v = parseInt(slider.value, 10);
            state[ch.target][ch.channel] = v;
            num.value = v;
            update();
        });

        num.addEventListener('input', () => {
            let v = parseInt(num.value, 10);
            if (isNaN(v)) return;
            v = Math.max(0, Math.min(255, v));
            state[ch.target][ch.channel] = v;
            slider.value = v;
            update();
        });

        num.addEventListener('blur', () => {
            num.value = state[ch.target][ch.channel];
        });
    });

    sizeSlider.addEventListener('input', () => {
        const v = parseInt(sizeSlider.value, 10);
        state.fontSize = v;
        sizeNum.value = v;
        update();
    });

    sizeNum.addEventListener('input', () => {
        let v = parseInt(sizeNum.value, 10);
        if (isNaN(v)) return;
        v = Math.max(8, Math.min(72, v));
        state.fontSize = v;
        sizeSlider.value = v;
        update();
    });

    sizeNum.addEventListener('blur', () => {
        sizeNum.value = state.fontSize;
    });

    // Vision simulation
    document.querySelectorAll('input[name="vision"]').forEach(radio => {
        radio.addEventListener('change', () => {
            state.visionMode = radio.value;
            const locked = radio.value !== 'normal';
            document.getElementById('bg-controls').classList.toggle('locked', locked);
            document.getElementById('text-controls').classList.toggle('locked', locked);
            dom.lockNotice.classList.toggle('hidden', !locked);
            update();
        });
    });

    // Presets
    buildPresetButtons();

    // Roast My Colors
    dom.roastBtn.addEventListener('click', () => {
        dom.roastText.textContent = getRandomRoast();
    });

    // Swap
    dom.swapBtn.addEventListener('click', swapColors);

    // Hex copy
    dom.bgHex.addEventListener('click', () => copyHex('bg'));
    dom.textHex.addEventListener('click', () => copyHex('text'));

    // Guess the Ratio
    dom.guessStart.addEventListener('click', startGuessRound);
    dom.guessPass.addEventListener('click', () => submitGuess(true));
    dom.guessFail.addEventListener('click', () => submitGuess(false));
    dom.guessEnd.addEventListener('click', endGame);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't trigger if typing in an input
        if (e.target.tagName === 'INPUT') return;
        const key = e.key.toLowerCase();
        if (key === 'n') {
            startGuessRound();
        } else if (key === 'p' && state.guess.active) {
            submitGuess(true);
        } else if (key === 'f' && state.guess.active) {
            submitGuess(false);
        } else if (key === 'e' && (state.guess.total > 0 || state.guess.active)) {
            endGame();
        }
    });

    // Init systems
    initParticles();
    initConfetti();

    update();
}

// ============================================================
init();
