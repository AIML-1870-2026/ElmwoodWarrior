// ─── NEURO-RUN: Utilities & Input ───

const CANVAS_W = 1280;
const CANVAS_H = 720;
const RENDER_SCALE = 1.5;
const RENDER_W = Math.round(CANVAS_W * RENDER_SCALE);
const RENDER_H = Math.round(CANVAS_H * RENDER_SCALE);
const GROUND_Y = 600;
const GRAVITY = 0.0028;
const PLAYER_X = 180;

// ─── Input Manager ───
const Input = {
    keys: {},
    justPressed: {},
    touchJump: false,
    touchDuck: false,
    _touchStartY: 0,

    init() {
        window.addEventListener('keydown', e => {
            if (!this.keys[e.code]) this.justPressed[e.code] = true;
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            this._touchStartY = e.touches[0].clientY;
            this.touchJump = true;
        }, { passive: false });
        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            const dy = e.touches[0].clientY - this._touchStartY;
            if (dy > 40) {
                this.touchJump = false;
                this.touchDuck = true;
            }
        }, { passive: false });
        canvas.addEventListener('touchend', e => {
            e.preventDefault();
            this.touchDuck = false;
        }, { passive: false });
    },

    isJump() {
        return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchJump;
    },

    isJumpJust() {
        return this.justPressed['Space'] || this.justPressed['ArrowUp'] || this.justPressed['KeyW'] || this.touchJump;
    },

    isDuck() {
        return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchDuck;
    },

    isPause() {
        return this.justPressed['Escape'] || this.justPressed['KeyP'];
    },

    isEnter() {
        return this.justPressed['Enter'];
    },

    clearFrame() {
        this.justPressed = {};
        this.touchJump = false;
    }
};

// ─── Storage Manager ───
const Storage = {
    getHighScore() {
        return parseInt(localStorage.getItem('neurorun_highscore') || '0');
    },
    setHighScore(score) {
        localStorage.setItem('neurorun_highscore', score.toString());
    },
    getGhosts() {
        try {
            return JSON.parse(localStorage.getItem('neurorun_ghosts') || '[]');
        } catch { return []; }
    },
    setGhosts(ghosts) {
        localStorage.setItem('neurorun_ghosts', JSON.stringify(ghosts));
    },
    getMuted() {
        return localStorage.getItem('neurorun_muted') === 'true';
    },
    setMuted(v) {
        localStorage.setItem('neurorun_muted', v.toString());
    }
};

// ─── Utility Functions ───
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function hexColor(r, g, b) {
    return '#' + [r, g, b].map(c => clamp(Math.round(c), 0, 255).toString(16).padStart(2, '0')).join('');
}
function lerpColor(c1, c2, t) {
    const p = (c, i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
    return hexColor(
        lerp(p(c1, 0), p(c2, 0), t),
        lerp(p(c1, 1), p(c2, 1), t),
        lerp(p(c1, 2), p(c2, 2), t)
    );
}

// Screen shake state
const ScreenShake = {
    magnitude: 0,
    duration: 0,
    elapsed: 0,
    offsetX: 0,
    offsetY: 0,

    trigger(mag, dur) {
        this.magnitude = mag;
        this.duration = dur;
        this.elapsed = 0;
    },

    update(dt) {
        if (this.elapsed < this.duration) {
            this.elapsed += dt;
            const t = 1 - this.elapsed / this.duration;
            const m = this.magnitude * t;
            this.offsetX = (Math.random() - 0.5) * 2 * m;
            this.offsetY = (Math.random() - 0.5) * 2 * m;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }
};
