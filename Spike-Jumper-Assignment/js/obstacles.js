// ─── NEURO-RUN: Obstacle Manager & Pattern Library ───

const PatternLibrary = [
    // ─── Tier 1: Easy intro patterns ───
    { id: 'single_low', tier: 1, gaps: [0], types: ['car'], airborne: [false], rhythmAligned: false },
    { id: 'single_barricade', tier: 1, gaps: [0], types: ['barricade'], airborne: [false], rhythmAligned: true },
    { id: 'single_debris', tier: 1, gaps: [0], types: ['debris'], airborne: [false], rhythmAligned: false },
    { id: 'double_low', tier: 1, gaps: [0, 500], types: ['car', 'barricade'], airborne: [false, false], rhythmAligned: false },
    { id: 'wide_double', tier: 1, gaps: [0, 700], types: ['barricade', 'car'], airborne: [false, false], rhythmAligned: true },
    { id: 'debris_car', tier: 1, gaps: [0, 550], types: ['debris', 'car'], airborne: [false, false], rhythmAligned: false },

    // ─── Tier 2: Introduce aerial ───
    { id: 'high_low', tier: 2, gaps: [0, 400], types: ['flying_car', 'car'], airborne: [true, false], rhythmAligned: false },
    { id: 'triple_stagger', tier: 2, gaps: [0, 450, 350], types: ['barricade', 'debris', 'car'], airborne: [false, false, false], rhythmAligned: false },
    { id: 'double_high', tier: 2, gaps: [0, 400], types: ['drone', 'drone'], airborne: [true, true], rhythmAligned: true },
    { id: 'low_high', tier: 2, gaps: [0, 380], types: ['car', 'drone'], airborne: [false, true], rhythmAligned: false },
    { id: 'drone_barricade', tier: 2, gaps: [0, 420], types: ['drone', 'barricade'], airborne: [true, false], rhythmAligned: true },
    { id: 'quick_pair', tier: 2, gaps: [0, 300], types: ['debris', 'debris'], airborne: [false, false], rhythmAligned: false },
    { id: 'fly_by', tier: 2, gaps: [0], types: ['flying_car'], airborne: [true], rhythmAligned: false },
    { id: 'spaced_triple', tier: 2, gaps: [0, 600, 500], types: ['car', 'car', 'barricade'], airborne: [false, false, false], rhythmAligned: true },

    // ─── Tier 3: Complex combos ───
    { id: 'aerial_sweep', tier: 3, gaps: [0, 350], types: ['flying_car', 'drone'], airborne: [true, true], rhythmAligned: false },
    { id: 'sandwich', tier: 3, gaps: [0, 400, 400], types: ['car', 'flying_car', 'barricade'], airborne: [false, true, false], rhythmAligned: true },
    { id: 'zigzag', tier: 3, gaps: [0, 350, 350], types: ['car', 'drone', 'car'], airborne: [false, true, false], rhythmAligned: false },
    { id: 'high_trio', tier: 3, gaps: [0, 300, 300], types: ['drone', 'flying_car', 'drone'], airborne: [true, true, true], rhythmAligned: true },
    { id: 'ground_rush', tier: 3, gaps: [0, 280, 280], types: ['barricade', 'car', 'debris'], airborne: [false, false, false], rhythmAligned: false },
    { id: 'duck_jump', tier: 3, gaps: [0, 500], types: ['flying_car', 'barricade'], airborne: [true, false], rhythmAligned: true },
    { id: 'scattered', tier: 3, gaps: [0, 600, 400, 500], types: ['debris', 'drone', 'car', 'debris'], airborne: [false, true, false, false], rhythmAligned: false },

    // ─── Tier 4: High intensity ───
    { id: 'rhythm_burst', tier: 4, gaps: [0, 468, 468, 468], types: ['barricade', 'debris', 'barricade', 'car'], airborne: [false, false, false, false], rhythmAligned: true },
    { id: 'dense_mix', tier: 4, gaps: [0, 350, 300, 350], types: ['car', 'drone', 'barricade', 'flying_car'], airborne: [false, true, false, true], rhythmAligned: false },
    { id: 'air_raid', tier: 4, gaps: [0, 280, 280, 280], types: ['drone', 'flying_car', 'drone', 'flying_car'], airborne: [true, true, true, true], rhythmAligned: true },
    { id: 'gauntlet', tier: 4, gaps: [0, 320, 320, 320], types: ['car', 'barricade', 'car', 'barricade'], airborne: [false, false, false, false], rhythmAligned: false },
    { id: 'weave', tier: 4, gaps: [0, 350, 350, 350], types: ['barricade', 'drone', 'debris', 'drone'], airborne: [false, true, false, true], rhythmAligned: true },
    { id: 'rapid_fire', tier: 4, gaps: [0, 250, 250, 250, 250], types: ['debris', 'debris', 'barricade', 'debris', 'car'], airborne: [false, false, false, false, false], rhythmAligned: false },
    { id: 'altitude_swap', tier: 4, gaps: [0, 380, 380, 380], types: ['flying_car', 'car', 'drone', 'barricade'], airborne: [true, false, true, false], rhythmAligned: true },

    // ─── Tier 5: Endgame chaos ───
    { id: 'boss_wave', tier: 5, gaps: [0, 300, 300, 300, 300], types: ['car', 'flying_car', 'barricade', 'drone', 'car'], airborne: [false, true, false, true, false], rhythmAligned: true },
    { id: 'storm', tier: 5, gaps: [0, 250, 250, 250, 250], types: ['drone', 'car', 'flying_car', 'barricade', 'drone'], airborne: [true, false, true, false, true], rhythmAligned: false },
    { id: 'final_rush', tier: 5, gaps: [0, 220, 220, 220, 220, 220], types: ['barricade', 'drone', 'car', 'drone', 'debris', 'flying_car'], airborne: [false, true, false, true, false, true], rhythmAligned: true },
    { id: 'sky_fall', tier: 5, gaps: [0, 280, 280, 280], types: ['flying_car', 'flying_car', 'drone', 'drone'], airborne: [true, true, true, true], rhythmAligned: false },
    { id: 'death_march', tier: 5, gaps: [0, 260, 260, 260, 260], types: ['car', 'car', 'barricade', 'car', 'car'], airborne: [false, false, false, false, false], rhythmAligned: true }
];

const ObstaclePool = {
    active: [],
    pending: [],
    recentPatterns: [],
    spawnCooldown: 0,
    baseSpeed: 0.35,

    init() {
        this.active = [];
        this.pending = [];
        this.recentPatterns = [];
        this.spawnCooldown = 1500;
    },

    getSpeed(tier) {
        const mults = [1.0, 1.2, 1.4, 1.6, 1.8];
        return this.baseSpeed * (mults[Math.min(tier - 1, 4)] || 1.8);
    },

    update(dt, tier, gameTime) {
        const speed = this.getSpeed(tier);

        // Process pending spawns
        for (let i = this.pending.length - 1; i >= 0; i--) {
            this.pending[i].delay -= dt;
            if (this.pending[i].delay <= 0) {
                this.active.push(this.pending[i].obstacle);
                this.pending.splice(i, 1);
            }
        }

        // Move active obstacles
        for (let i = this.active.length - 1; i >= 0; i--) {
            const obs = this.active[i];
            obs.x -= speed * dt;
            if (obs.x + obs.w < -50) {
                this.active.splice(i, 1);
            }
        }

        // Spawn new patterns
        this.spawnCooldown -= dt;
        if (this.spawnCooldown <= 0 && this.pending.length === 0) {
            this._spawnPattern(tier);
            const cooldowns = [2200, 1800, 1400, 1100, 900];
            this.spawnCooldown = (cooldowns[Math.min(tier - 1, 4)] || 900) + rand(-200, 200);
        }
    },

    _spawnPattern(tier) {
        // Filter patterns by tier, exclude recent patterns to avoid repetition
        const available = PatternLibrary.filter(p => p.tier <= tier && !this.recentPatterns.includes(p.id));
        if (available.length === 0) return;

        // Weighted: strongly prefer current-tier patterns for variety
        const weights = available.map(p => {
            if (p.tier === tier) return tier * 3;     // Strong preference for current tier
            if (p.tier === tier - 1) return tier * 1.5; // Moderate for one tier below
            return p.tier;                              // Low for much lower tiers
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalWeight;
        let pattern = available[0];
        for (let i = 0; i < available.length; i++) {
            r -= weights[i];
            if (r <= 0) { pattern = available[i]; break; }
        }

        // Track last 3 patterns to prevent repeats
        this.recentPatterns.push(pattern.id);
        if (this.recentPatterns.length > 3) this.recentPatterns.shift();

        for (let i = 0; i < pattern.types.length; i++) {
            const obs = this._createObstacle(pattern.types[i], pattern.airborne[i], tier);
            // Add slight random variation to gap timing for less predictability
            const gapVariation = pattern.gaps[i] > 0 ? rand(-40, 40) : 0;
            if (pattern.gaps[i] === 0 && i === 0) {
                this.active.push(obs);
            } else {
                this.pending.push({ obstacle: obs, delay: pattern.gaps[i] + gapVariation });
            }
        }
    },

    _createObstacle(type, airborne, tier) {
        const zone = tier <= 2 ? 'city' : (tier <= 3 ? 'outskirts' : 'forest');
        let w, h, y, color, label;

        switch (type) {
            case 'car':
                if (zone === 'forest') { type = 'log'; w = 60; h = 25; color = '#5a3a1a'; label = ''; }
                else { w = 70; h = 35; color = '#334466'; label = ''; }
                y = GROUND_Y - h;
                break;
            case 'barricade':
                if (zone === 'forest') { type = 'stump'; w = 35; h = 30; color = '#4a2a0a'; }
                else { w = 45; h = 40; color = '#555566'; }
                y = GROUND_Y - h;
                break;
            case 'debris':
                w = 40; h = 28;
                color = zone === 'forest' ? '#3a2a15' : '#444455';
                y = GROUND_Y - h;
                break;
            case 'flying_car':
                if (zone === 'forest') { type = 'bird'; w = 35; h = 20; color = '#553322'; }
                else { w = 65; h = 30; color = '#2a3a5a'; }
                y = GROUND_Y - 90 - rand(0, 40);
                break;
            case 'drone':
                if (zone === 'forest') { type = 'branch'; w = 50; h = 12; color = '#4a3a15'; }
                else { w = 30; h = 25; color = '#3a3a55'; }
                y = GROUND_Y - 80 - rand(0, 50);
                break;
            default:
                w = 40; h = 35; color = '#444';
                y = GROUND_Y - h;
        }

        return {
            x: CANVAS_W + rand(10, 60),
            y, w, h,
            type, color, airborne,
            zone
        };
    },

    draw(ctx) {
        const theme = ThemeManager.getTheme();
        for (const obs of this.active) {
            this._drawObstacle(ctx, obs, theme);
        }
    },

    _drawObstacle(ctx, obs, theme) {
        ctx.save();
        ctx.translate(obs.x, obs.y);
        const time = Date.now();

        switch (obs.type) {
            case 'car':
                // ─── Enhanced neon sedan ───
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(3, obs.h - 2, obs.w - 4, 4);
                // Body lower
                ctx.fillStyle = obs.color;
                ctx.fillRect(2, 8, obs.w - 4, obs.h - 14);
                // Body upper (cabin)
                const cabinColor = lerpColor(obs.color, '#555588', 0.2);
                ctx.fillStyle = cabinColor;
                ctx.fillRect(12, 2, obs.w - 24, obs.h - 8);
                // Roof highlight
                ctx.fillStyle = lerpColor(obs.color, '#ffffff', 0.1);
                ctx.fillRect(14, 2, obs.w - 28, 2);
                // Windows with gradient
                const winGrad = ctx.createLinearGradient(0, 3, 0, 14);
                winGrad.addColorStop(0, '#aaddff');
                winGrad.addColorStop(1, '#4488cc');
                ctx.fillStyle = winGrad;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(16, 4, 14, 10);
                ctx.fillRect(obs.w - 30, 4, 14, 10);
                // Window divider
                ctx.fillStyle = obs.color;
                ctx.globalAlpha = 1;
                ctx.fillRect(obs.w / 2 - 1, 3, 2, 12);
                // Neon underline glow
                ctx.fillStyle = theme.accentColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(4, obs.h - 1, obs.w - 8, 3);
                ctx.globalAlpha = 0.8;
                ctx.fillRect(6, obs.h - 3, obs.w - 12, 2);
                ctx.globalAlpha = 1;
                // Headlights
                ctx.fillStyle = '#ffee88';
                ctx.globalAlpha = 0.7 + Math.sin(time * 0.003) * 0.2;
                ctx.fillRect(0, 12, 4, 6);
                ctx.globalAlpha = 1;
                // Tail lights
                ctx.fillStyle = '#ff2222';
                ctx.globalAlpha = 0.8;
                ctx.fillRect(obs.w - 4, 12, 4, 6);
                ctx.globalAlpha = 1;
                // Wheels with hub
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(8, obs.h - 7, 14, 7);
                ctx.fillRect(obs.w - 22, obs.h - 7, 14, 7);
                ctx.fillStyle = '#333';
                ctx.fillRect(12, obs.h - 5, 6, 3);
                ctx.fillRect(obs.w - 18, obs.h - 5, 6, 3);
                break;

            case 'barricade':
                // ─── Enhanced barricade ───
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                ctx.fillRect(2, obs.h - 2, obs.w - 2, 4);
                // Main body
                ctx.fillStyle = obs.color;
                ctx.fillRect(0, 0, obs.w, obs.h);
                // Darker inset
                ctx.fillStyle = lerpColor(obs.color, '#000000', 0.2);
                ctx.fillRect(3, 6, obs.w - 6, obs.h - 10);
                // Warning stripes (alternating)
                ctx.fillStyle = '#ffaa00';
                for (let i = 0; i < obs.w; i += 12) {
                    ctx.fillRect(i, 0, 6, 5);
                    ctx.fillRect(i + 6, obs.h - 5, 6, 5);
                }
                // Reflective dots
                ctx.fillStyle = '#ff6600';
                ctx.globalAlpha = 0.6 + Math.sin(time * 0.004) * 0.3;
                ctx.fillRect(obs.w / 2 - 2, obs.h / 2 - 2, 4, 4);
                ctx.globalAlpha = 1;
                // Edge highlights
                ctx.fillStyle = lerpColor(obs.color, '#ffffff', 0.15);
                ctx.fillRect(0, 0, obs.w, 1);
                ctx.fillRect(0, 0, 1, obs.h);
                break;

            case 'debris':
                // ─── Enhanced debris pile ───
                ctx.fillStyle = lerpColor(obs.color, '#000000', 0.15);
                ctx.fillRect(3, 7, obs.w - 6, obs.h - 5);
                ctx.fillStyle = obs.color;
                ctx.fillRect(5, 5, obs.w - 10, obs.h - 5);
                ctx.fillRect(0, 10, obs.w, obs.h - 15);
                // Detail pieces
                ctx.fillStyle = lerpColor(obs.color, '#888888', 0.3);
                ctx.fillRect(8, 2, 10, 8);
                ctx.fillRect(obs.w - 20, 0, 12, 10);
                ctx.fillRect(2, obs.h - 8, 8, 6);
                // Metal shine
                ctx.fillStyle = '#999';
                ctx.globalAlpha = 0.3;
                ctx.fillRect(10, 4, 6, 2);
                ctx.fillRect(obs.w - 16, 2, 4, 3);
                ctx.globalAlpha = 1;
                break;

            case 'flying_car':
                // ─── Enhanced hover car ───
                // Body shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(3, 7, obs.w - 6, obs.h - 8);
                // Main body
                ctx.fillStyle = obs.color;
                ctx.fillRect(5, 5, obs.w - 10, obs.h - 10);
                ctx.fillRect(0, 10, obs.w, obs.h - 20);
                // Body highlight
                ctx.fillStyle = lerpColor(obs.color, '#ffffff', 0.12);
                ctx.fillRect(6, 5, obs.w - 12, 2);
                // Cabin window
                const flyWinGrad = ctx.createLinearGradient(0, 7, 0, 16);
                flyWinGrad.addColorStop(0, '#88ccff');
                flyWinGrad.addColorStop(1, '#3366aa');
                ctx.fillStyle = flyWinGrad;
                ctx.globalAlpha = 0.6;
                ctx.fillRect(15, 7, obs.w - 30, 8);
                ctx.globalAlpha = 1;
                // Hover glow (pulsing)
                const hoverPulse = 0.4 + Math.sin(time * 0.008) * 0.35;
                ctx.fillStyle = '#00aaff';
                ctx.globalAlpha = hoverPulse * 0.3;
                ctx.fillRect(8, obs.h - 2, obs.w - 16, 6);
                ctx.globalAlpha = hoverPulse;
                ctx.fillRect(12, obs.h - 4, obs.w - 24, 4);
                // Engine pods
                ctx.globalAlpha = hoverPulse * 0.8;
                ctx.fillRect(2, obs.h - 6, 8, 4);
                ctx.fillRect(obs.w - 10, obs.h - 6, 8, 4);
                ctx.globalAlpha = 1;
                break;

            case 'drone':
                // ─── Enhanced drone ───
                // Body
                ctx.fillStyle = lerpColor(obs.color, '#000000', 0.15);
                ctx.fillRect(6, 6, obs.w - 12, obs.h - 12);
                ctx.fillStyle = obs.color;
                ctx.fillRect(5, 5, obs.w - 10, obs.h - 10);
                // Top highlight
                ctx.fillStyle = lerpColor(obs.color, '#ffffff', 0.15);
                ctx.fillRect(7, 5, obs.w - 14, 2);
                // Propeller arms
                ctx.fillStyle = '#666';
                ctx.fillRect(-5, 2, 12, 2);
                ctx.fillRect(obs.w - 7, 2, 12, 2);
                // Propeller blur
                ctx.fillStyle = '#aaa';
                ctx.globalAlpha = 0.3;
                const propSpin = Math.sin(time * 0.03);
                ctx.fillRect(-6 + propSpin, 0, 14, 2);
                ctx.fillRect(obs.w - 8 - propSpin, 0, 14, 2);
                ctx.globalAlpha = 1;
                // Camera/sensor
                ctx.fillStyle = '#222';
                ctx.fillRect(obs.w / 2 - 4, obs.h - 8, 8, 6);
                // Light (blinking)
                ctx.fillStyle = '#ff3333';
                ctx.globalAlpha = 0.4 + Math.sin(time * 0.012) * 0.6;
                ctx.fillRect(obs.w / 2 - 2, obs.h / 2 - 2, 4, 4);
                ctx.globalAlpha = 1;
                break;

            case 'log':
                // ─── Enhanced log ───
                ctx.fillStyle = '#3a2510';
                ctx.beginPath();
                ctx.ellipse(obs.w / 2, obs.h / 2 + 1, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = obs.color;
                ctx.beginPath();
                ctx.ellipse(obs.w / 2, obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                // Wood grain lines
                ctx.strokeStyle = '#4a2a10';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.4;
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.ellipse(obs.w / 2 + i * 3, obs.h / 2, obs.w / 4 + Math.abs(i) * 4, obs.h / 4, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                // Bark edge
                ctx.strokeStyle = '#3a2510';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(obs.w / 2, obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'stump':
                // ─── Enhanced stump ───
                ctx.fillStyle = lerpColor(obs.color, '#000000', 0.2);
                ctx.fillRect(1, 2, obs.w - 1, obs.h);
                ctx.fillStyle = obs.color;
                ctx.fillRect(0, 0, obs.w, obs.h);
                // Top face (lighter)
                ctx.fillStyle = lerpColor(obs.color, '#886644', 0.3);
                ctx.fillRect(2, 0, obs.w - 4, 6);
                // Tree rings
                ctx.strokeStyle = '#5a3a15';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.ellipse(obs.w / 2, 4, 6, 3, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(obs.w / 2, 4, 12, 4, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                // Bark texture
                ctx.fillStyle = '#3a1a05';
                ctx.globalAlpha = 0.3;
                ctx.fillRect(0, 8, 2, obs.h - 10);
                ctx.fillRect(obs.w - 2, 10, 2, obs.h - 12);
                ctx.globalAlpha = 1;
                break;

            case 'bird':
                // ─── Enhanced bird ───
                ctx.fillStyle = obs.color;
                // Body (oval)
                ctx.beginPath();
                ctx.ellipse(obs.w / 2, obs.h / 2, obs.w / 3, obs.h / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                // Belly lighter
                ctx.fillStyle = lerpColor(obs.color, '#aa8866', 0.3);
                ctx.beginPath();
                ctx.ellipse(obs.w / 2, obs.h / 2 + 2, obs.w / 4, obs.h / 5, 0, 0, Math.PI * 2);
                ctx.fill();
                // Wings
                ctx.fillStyle = obs.color;
                const wingFlap = Math.sin(time * 0.015) * 8;
                ctx.beginPath();
                ctx.moveTo(obs.w / 2 - 5, obs.h / 2);
                ctx.lineTo(-2, obs.h / 2 - wingFlap - 2);
                ctx.lineTo(2, obs.h / 2 - wingFlap);
                ctx.lineTo(obs.w / 2 - 3, obs.h / 2 + 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(obs.w / 2 + 5, obs.h / 2);
                ctx.lineTo(obs.w + 2, obs.h / 2 - wingFlap - 2);
                ctx.lineTo(obs.w - 2, obs.h / 2 - wingFlap);
                ctx.lineTo(obs.w / 2 + 3, obs.h / 2 + 2);
                ctx.fill();
                // Eye
                ctx.fillStyle = '#111';
                ctx.fillRect(obs.w / 2 + 4, obs.h / 2 - 3, 3, 3);
                // Beak
                ctx.fillStyle = '#cc8833';
                ctx.fillRect(obs.w / 2 + 8, obs.h / 2 - 1, 5, 3);
                break;

            case 'branch':
                // ─── Enhanced branch ───
                ctx.fillStyle = lerpColor(obs.color, '#000000', 0.15);
                ctx.fillRect(0, 3, obs.w, obs.h - 4);
                ctx.fillStyle = obs.color;
                ctx.fillRect(0, 2, obs.w, obs.h - 4);
                // Bark texture
                ctx.fillStyle = lerpColor(obs.color, '#222200', 0.2);
                ctx.fillRect(5, 2, 2, obs.h - 4);
                ctx.fillRect(18, 2, 2, obs.h - 4);
                ctx.fillRect(35, 2, 2, obs.h - 4);
                // Twigs
                ctx.fillStyle = lerpColor(obs.color, '#556633', 0.3);
                ctx.fillRect(10, 0, 3, obs.h + 2);
                ctx.fillRect(30, -1, 3, obs.h + 2);
                // Small leaves
                ctx.fillStyle = '#336622';
                ctx.globalAlpha = 0.6;
                ctx.fillRect(8, -2, 6, 4);
                ctx.fillRect(28, -3, 7, 5);
                ctx.globalAlpha = 1;
                break;

            default:
                ctx.fillStyle = obs.color;
                ctx.fillRect(0, 0, obs.w, obs.h);
        }

        ctx.restore();
    },

    checkCollision(playerHitbox) {
        for (const obs of this.active) {
            if (this._aabb(playerHitbox, obs)) {
                return obs;
            }
        }
        return null;
    },

    _aabb(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    },

    clear() {
        this.active = [];
        this.pending = [];
    }
};
