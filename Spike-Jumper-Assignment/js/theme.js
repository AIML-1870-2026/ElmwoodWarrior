// ─── NEURO-RUN: Theme & Parallax System ───

const ThemeData = [
    { // Tier 1: Mega City
        skyTop: '#0a0015', skyBot: '#1a0030',
        groundColor: '#1a1a2e', groundLine: '#333355',
        buildingColors: ['#0d0d1a', '#111133', '#0a0a22'],
        accentColor: '#ff00ff',
        neonColors: ['#00ffff', '#ff00ff', '#ffff00', '#ff4466'],
        buildingDensity: 1.0,
        name: 'MEGA CITY'
    },
    { // Tier 2: Mid District
        skyTop: '#080020', skyBot: '#151535',
        groundColor: '#1e1e30', groundLine: '#2a2a44',
        buildingColors: ['#0e0e20', '#121230', '#0c0c1e'],
        accentColor: '#6644ff',
        neonColors: ['#4488ff', '#6644ff', '#ff6644'],
        buildingDensity: 0.7,
        name: 'MID DISTRICT'
    },
    { // Tier 3: Outskirts
        skyTop: '#041520', skyBot: '#0a2a2a',
        groundColor: '#2a2015', groundLine: '#3a3025',
        buildingColors: ['#151510', '#1a1a12', '#121210'],
        accentColor: '#44aa66',
        neonColors: ['#44aa66', '#886633'],
        buildingDensity: 0.35,
        name: 'OUTSKIRTS'
    },
    { // Tier 4: Wasteland
        skyTop: '#0a1a0a', skyBot: '#152a10',
        groundColor: '#2a2210', groundLine: '#3a3520',
        buildingColors: ['#121510', '#101208', '#151510'],
        accentColor: '#66aa33',
        neonColors: ['#66aa33', '#338844'],
        buildingDensity: 0.15,
        name: 'WASTELAND'
    },
    { // Tier 5: Forest
        skyTop: '#051005', skyBot: '#0a200a',
        groundColor: '#1a2a10', groundLine: '#2a3a1a',
        buildingColors: ['#0a150a', '#0c180c', '#081208'],
        accentColor: '#33cc33',
        neonColors: ['#33cc33', '#88ff88'],
        buildingDensity: 0.0,
        name: 'DEEP FOREST'
    }
];

const ThemeManager = {
    currentTier: 1,
    transitionProgress: 1, // 1 = fully at current tier
    transitionSpeed: 0.001, // per ms
    current: null,

    init() {
        this.currentTier = 1;
        this.transitionProgress = 1;
        this.current = { ...ThemeData[0] };
    },

    setTier(tier) {
        if (tier !== this.currentTier && tier >= 1 && tier <= 5) {
            this.currentTier = tier;
            this.transitionProgress = 0;
        }
    },

    update(dt) {
        if (this.transitionProgress < 1) {
            this.transitionProgress = Math.min(1, this.transitionProgress + this.transitionSpeed * dt);
        }
    },

    getTheme() {
        const idx = this.currentTier - 1;
        if (this.transitionProgress >= 1 || idx === 0) {
            return ThemeData[idx];
        }
        const prev = ThemeData[Math.max(0, idx - 1)];
        const curr = ThemeData[idx];
        const t = this.transitionProgress;
        return {
            skyTop: lerpColor(prev.skyTop, curr.skyTop, t),
            skyBot: lerpColor(prev.skyBot, curr.skyBot, t),
            groundColor: lerpColor(prev.groundColor, curr.groundColor, t),
            groundLine: lerpColor(prev.groundLine, curr.groundLine, t),
            buildingColors: curr.buildingColors,
            accentColor: lerpColor(prev.accentColor, curr.accentColor, t),
            neonColors: curr.neonColors,
            buildingDensity: lerp(prev.buildingDensity, curr.buildingDensity, t),
            name: curr.name
        };
    }
};

// ─── Parallax Background ───
const Parallax = {
    layers: [],
    // Pre-computed star positions (never changes)
    stars: [],
    // Slow-pulsing window timer (shared across all buildings)
    windowTimer: 0,

    init() {
        this.layers = [];
        this.windowTimer = 0;

        // Generate dense star field (hi-res)
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: (i * 31.7 + 17) % CANVAS_W,
                y: (i * 23.3 + 11) % (GROUND_Y * 0.6),
                size: i < 20 ? 2 : (i < 50 ? 1.5 : 1),
                brightness: 0.12 + (i % 7) * 0.08,
                twinklePhase: i * 0.8,
                color: i % 10 === 0 ? '#aaccff' : (i % 13 === 0 ? '#ffccaa' : '#ffffff')
            });
        }

        // Layer 0: Far skyline (slowest)
        // Layer 1: Mid buildings
        // Layer 2: Near buildings
        // Layer 3: Foreground silhouettes (fastest)
        for (let i = 0; i < 4; i++) {
            const layer = {
                speed: [0.1, 0.2, 0.4, 0.7][i],
                elements: []
            };
            this._populateLayer(layer, i, ThemeData[0]);
            this.layers.push(layer);
        }
    },

    _populateLayer(layer, layerIdx, theme) {
        layer.elements = [];
        const count = [6, 9, 11, 7][layerIdx];
        for (let i = 0; i < count; i++) {
            const x = (CANVAS_W / count) * i + ((i * 37 + layerIdx * 13) % 60) - 30;
            layer.elements.push(this._makeElement(layerIdx, x, theme));
        }
    },

    _makeElement(layerIdx, x, theme) {
        const density = theme ? theme.buildingDensity : 1;
        const neonColors = theme ? theme.neonColors : ['#00ffff', '#ff00ff'];
        let el;

        if (layerIdx === 0) {
            el = {
                x, w: 60 + ((x * 7 + 31) % 90),
                h: (100 + ((x * 13 + 47) % 200)) * density + 30,
                color: theme ? theme.buildingColors[0] : '#0d0d1a',
                hasWindows: density > 0.3,
                windows: [],
                // Antenna/spire on some far buildings
                hasSpire: density > 0.5 && ((x * 3 + 11) % 5 < 2)
            };
        } else if (layerIdx === 1) {
            el = {
                x, w: 40 + ((x * 11 + 23) % 60),
                h: (80 + ((x * 17 + 53) % 170)) * density + 20,
                color: theme ? theme.buildingColors[1] : '#111133',
                hasWindows: density > 0.2,
                windows: []
            };
        } else if (layerIdx === 2) {
            el = {
                x, w: 50 + ((x * 9 + 19) % 70),
                h: (60 + ((x * 19 + 41) % 140)) * density + 20,
                color: theme ? theme.buildingColors[2] : '#0a0a22',
                hasWindows: density > 0.5,
                windows: []
            };
        } else {
            el = {
                x, w: 30 + ((x * 7 + 29) % 50),
                h: (40 + ((x * 11 + 37) % 80)) * density + 10,
                color: theme ? theme.buildingColors[0] : '#0d0d1a',
                hasWindows: false,
                windows: []
            };
        }

        // Pre-generate stable window data
        if (el.hasWindows && el.h > 40) {
            const rows = Math.floor(el.h / 20);
            const cols = Math.floor(el.w / 15);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Deterministic "random" based on position
                    const seed = (Math.abs(Math.round(x)) * 31 + r * 17 + c * 7 + layerIdx * 53) % 100;
                    if (seed < 30) {
                        const colorIdx = (r + c) % neonColors.length;
                        el.windows.push({
                            rx: 5 + c * 15,
                            ry: 5 + r * 20,
                            color: neonColors[colorIdx],
                            alpha: 0.25 + (seed % 40) * 0.01,
                            // Each window pulses on its own slow cycle
                            pulsePhase: (r * 2.1 + c * 3.7 + x * 0.1) % (Math.PI * 2)
                        });
                    }
                }
            }
        }

        return el;
    },

    update(dt, speedMult) {
        const theme = ThemeManager.getTheme();
        this.windowTimer += dt * 0.001; // slow pulse timer

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const scrollSpeed = layer.speed * speedMult * 0.15 * dt;
            for (const el of layer.elements) {
                el.x -= scrollSpeed;
                if (el.x + el.w < -50) {
                    el.x = CANVAS_W + 10 + ((el.x * 7 + 31) % 100);
                    const newEl = this._makeElement(i, el.x, theme);
                    el.w = newEl.w;
                    el.h = newEl.h;
                    el.color = newEl.color;
                    el.hasWindows = newEl.hasWindows;
                    el.windows = newEl.windows;
                    el.hasSpire = newEl.hasSpire;
                }
            }
        }
    },

    draw(ctx) {
        const theme = ThemeManager.getTheme();

        // ── Sky gradient ──
        const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        skyGrad.addColorStop(0, theme.skyTop);
        skyGrad.addColorStop(0.7, theme.skyBot);
        // Add a subtle horizon glow
        skyGrad.addColorStop(1, theme.accentColor ? this._dimColor(theme.accentColor, 0.15) : theme.skyBot);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

        // ── Moon ──
        ctx.save();
        // Soft moon glow
        const moonGlow = ctx.createRadialGradient(1050, 80, 10, 1050, 80, 60);
        moonGlow.addColorStop(0, 'rgba(200,210,255,0.25)');
        moonGlow.addColorStop(1, 'rgba(200,210,255,0)');
        ctx.fillStyle = moonGlow;
        ctx.fillRect(990, 20, 120, 120);
        // Moon disc
        ctx.fillStyle = 'rgba(220,225,240,0.6)';
        ctx.beginPath();
        ctx.arc(1050, 80, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ── Stars with gentle twinkle (hi-res) ──
        for (const star of this.stars) {
            const pulse = Math.sin(this.windowTimer * 0.6 + star.twinklePhase) * 0.1;
            ctx.globalAlpha = star.brightness + pulse;
            ctx.fillStyle = star.color;
            if (star.size >= 2) {
                // Brighter stars get a soft glow
                ctx.globalAlpha = (star.brightness + pulse) * 0.2;
                ctx.fillRect(star.x - 1, star.y - 1, star.size + 2, star.size + 2);
                ctx.globalAlpha = star.brightness + pulse;
            }
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        ctx.globalAlpha = 1;

        // ── Parallax building layers ──
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            // Deeper layers are more faded/dim for depth
            const layerAlpha = [0.4, 0.55, 0.75, 1.0][i];

            for (const el of layer.elements) {
                const baseY = GROUND_Y - el.h;

                // Building body with edge shading
                ctx.globalAlpha = layerAlpha;
                ctx.fillStyle = el.color;
                ctx.fillRect(el.x, baseY, el.w, el.h);
                // Left edge highlight
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(el.x, baseY, 2, el.h);
                // Right edge shadow
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(el.x + el.w - 2, baseY, 2, el.h);
                // Roof line
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.fillRect(el.x, baseY, el.w, 2);

                // Spire on far buildings
                if (el.hasSpire) {
                    const spireW = 4;
                    const spireH = 20 + (el.w % 15);
                    ctx.fillRect(el.x + el.w / 2 - spireW / 2, baseY - spireH, spireW, spireH);
                    // Blinking light on top (slow, stable blink)
                    const blinkPhase = Math.sin(this.windowTimer * 1.2 + el.x * 0.05);
                    if (blinkPhase > 0.3) {
                        ctx.fillStyle = '#ff2222';
                        ctx.globalAlpha = layerAlpha * (0.5 + blinkPhase * 0.3);
                        ctx.fillRect(el.x + el.w / 2 - 2, baseY - spireH - 2, 4, 4);
                    }
                }

                // Pre-computed windows with slow pulse
                ctx.globalAlpha = layerAlpha;
                for (const win of el.windows) {
                    const pulse = Math.sin(this.windowTimer * 0.5 + win.pulsePhase) * 0.06;
                    ctx.fillStyle = win.color;
                    ctx.globalAlpha = layerAlpha * (win.alpha + pulse);
                    ctx.fillRect(el.x + win.rx, baseY + win.ry, 8, 12);
                }
                ctx.globalAlpha = 1;
            }
        }

        // ── Ground ──
        // Ground gradient instead of flat color
        const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
        groundGrad.addColorStop(0, theme.groundColor);
        groundGrad.addColorStop(1, this._dimColor(theme.groundColor, 0.6));
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

        // Ground top edge with subtle glow
        ctx.strokeStyle = theme.groundLine;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(CANVAS_W, GROUND_Y);
        ctx.stroke();

        // Subtle accent glow along ground line
        ctx.save();
        const groundGlow = ctx.createLinearGradient(0, GROUND_Y - 3, 0, GROUND_Y + 8);
        groundGlow.addColorStop(0, 'rgba(0,0,0,0)');
        groundGlow.addColorStop(0.5, theme.accentColor || theme.groundLine);
        groundGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = groundGlow;
        ctx.fillRect(0, GROUND_Y - 3, CANVAS_W, 11);
        ctx.restore();

        // Ground detail lines (enhanced)
        ctx.strokeStyle = theme.groundLine;
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 8; i++) {
            const y = GROUND_Y + 10 + i * 14;
            const alpha = 0.2 * (1 - i / 8);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_W, y);
            ctx.stroke();
        }
        // Vertical ground lines for depth grid
        ctx.globalAlpha = 0.06;
        for (let x = 0; x < CANVAS_W; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y + 3);
            ctx.lineTo(x, CANVAS_H);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    },

    // Darken a hex color by a factor (0 = black, 1 = original)
    _dimColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return hexColor(r * factor, g * factor, b * factor);
    }
};
