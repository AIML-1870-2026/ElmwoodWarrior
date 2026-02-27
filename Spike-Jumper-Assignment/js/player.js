// ─── NEURO-RUN: Player Controller ───

const Player = {
    x: PLAYER_X,
    y: GROUND_Y,
    w: 36,
    h: 70,
    vy: 0,
    grounded: true,
    state: 'run', // run, jump_rise, jump_fall, land, duck, death
    scaleY: 1,
    runFrame: 0,
    runTimer: 0,
    jumpHoldTime: 0,
    maxJumpHold: 300,
    jumpStrength: -0.95,
    jumpHoldBoost: -0.0015,
    landTimer: 0,
    duckHeight: 40,
    normalHeight: 70,
    deathParts: [],
    auraActive: false,

    init() {
        this.x = PLAYER_X;
        this.y = GROUND_Y;
        this.vy = 0;
        this.grounded = true;
        this.state = 'run';
        this.scaleY = 1;
        this.runFrame = 0;
        this.runTimer = 0;
        this.jumpHoldTime = 0;
        this.landTimer = 0;
        this.h = this.normalHeight;
        this.deathParts = [];
        this.auraActive = false;
    },

    update(dt) {
        if (this.state === 'death') return;

        // Landing recovery
        if (this.landTimer > 0) {
            this.landTimer -= dt;
            this.scaleY = lerp(0.75, 1, 1 - this.landTimer / 100);
            if (this.landTimer <= 0) {
                this.scaleY = 1;
                this.state = 'run';
            }
        }

        // Ducking
        if (Input.isDuck() && this.grounded) {
            this.state = 'duck';
            this.h = this.duckHeight;
        } else if (this.state === 'duck' && !Input.isDuck()) {
            this.state = 'run';
            this.h = this.normalHeight;
        }

        // Jump initiation
        if (Input.isJumpJust() && this.grounded && this.state !== 'death') {
            this.vy = this.jumpStrength;
            this.grounded = false;
            this.state = 'jump_rise';
            this.jumpHoldTime = 0;
            this.h = this.normalHeight;
            AudioEngine.playJump();
        }

        // Variable jump height
        if (Input.isJump() && !this.grounded && this.state === 'jump_rise' && this.jumpHoldTime < this.maxJumpHold) {
            this.jumpHoldTime += dt;
            this.vy += this.jumpHoldBoost * dt;
        }

        // Gravity
        if (!this.grounded) {
            this.vy += GRAVITY * dt;
            this.y += this.vy * dt;

            if (this.vy > 0) this.state = 'jump_fall';

            // Land
            if (this.y >= GROUND_Y) {
                this.y = GROUND_Y;
                this.vy = 0;
                this.grounded = true;
                this.state = 'land';
                this.landTimer = 100;
                this.scaleY = 0.75;
                AudioEngine.playLand();
                Particles.landSparks(this.x, GROUND_Y);
                ScreenShake.trigger(3, 150);
            }
        }

        // Run animation
        if (this.state === 'run' || this.state === 'duck') {
            this.runTimer += dt;
            if (this.runTimer > 83) { // ~12 FPS
                this.runTimer = 0;
                this.runFrame = (this.runFrame + 1) % 8;
            }
        }
    },

    getHitbox() {
        const hbW = this.w * 0.6;
        const hbH = this.h * 0.6;
        return {
            x: this.x - hbW / 2,
            y: this.y - this.h + (this.h - hbH) / 2,
            w: hbW,
            h: hbH
        };
    },

    die() {
        this.state = 'death';
        // Create ragdoll parts
        const parts = [
            { name: 'head', x: this.x, y: this.y - this.h + 8, w: 14, h: 14 },
            { name: 'torso', x: this.x, y: this.y - this.h + 28, w: 20, h: 24 },
            { name: 'armL', x: this.x - 14, y: this.y - this.h + 25, w: 8, h: 22 },
            { name: 'armR', x: this.x + 14, y: this.y - this.h + 25, w: 8, h: 22 },
            { name: 'legL', x: this.x - 8, y: this.y - 26, w: 8, h: 26 },
            { name: 'legR', x: this.x + 8, y: this.y - 26, w: 8, h: 26 }
        ];
        this.deathParts = parts.map(p => ({
            ...p,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -Math.random() * 0.8 - 0.2,
            rot: 0,
            vr: (Math.random() - 0.5) * 0.02
        }));
    },

    updateDeath(dt) {
        for (const p of this.deathParts) {
            p.vy += GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vr * dt;
            if (p.y > GROUND_Y + 50) p.vy *= -0.3;
        }
    },

    draw(ctx) {
        if (this.state === 'death') {
            this._drawDeathParts(ctx);
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(1, this.scaleY);

        const h = this.h;
        const isDuck = this.state === 'duck';
        const isJump = this.state === 'jump_rise' || this.state === 'jump_fall';
        const frame = this.runFrame;
        const time = Date.now();

        // Aura effect
        if (this.auraActive) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 25;
            // Aura ring
            ctx.strokeStyle = '#00ffff';
            ctx.globalAlpha = 0.15 + Math.sin(time * 0.008) * 0.1;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, -h / 2, 24, h * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // ─── Enhanced 32-bit body rendering ───
        const bodyDark = '#1e1e2e';
        const bodyMid = '#2a2a3a';
        const bodyLight = '#3a3a4e';
        const accentColor = '#00ffff';
        const accentDim = '#007a8a';
        const jointColor = '#444466';
        const jointHighlight = '#555580';

        // ─── Feet / Boots ───
        const legSwing = isDuck ? 0 : Math.sin(frame * Math.PI / 4) * 14;

        // Left leg
        ctx.save();
        ctx.translate(-8, -2);
        ctx.rotate(legSwing * 0.022);
        // Upper leg
        ctx.fillStyle = bodyMid;
        ctx.fillRect(-5, -24, 10, 12);
        // Knee joint
        ctx.fillStyle = jointHighlight;
        ctx.fillRect(-4, -13, 8, 3);
        ctx.fillStyle = accentDim;
        ctx.fillRect(-3, -12, 6, 1);
        // Lower leg
        ctx.fillStyle = bodyDark;
        ctx.fillRect(-4, -10, 9, 10);
        // Boot
        ctx.fillStyle = bodyLight;
        ctx.fillRect(-5, -2, 11, 4);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-4, -1, 9, 1);
        ctx.globalAlpha = 1;
        ctx.restore();

        // Right leg
        ctx.save();
        ctx.translate(8, -2);
        ctx.rotate(-legSwing * 0.022);
        ctx.fillStyle = bodyMid;
        ctx.fillRect(-5, -24, 10, 12);
        ctx.fillStyle = jointHighlight;
        ctx.fillRect(-4, -13, 8, 3);
        ctx.fillStyle = accentDim;
        ctx.fillRect(-3, -12, 6, 1);
        ctx.fillStyle = bodyDark;
        ctx.fillRect(-5, -10, 9, 10);
        ctx.fillStyle = bodyLight;
        ctx.fillRect(-6, -2, 11, 4);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-5, -1, 9, 1);
        ctx.globalAlpha = 1;
        ctx.restore();

        // ─── Torso ───
        const torsoY = isDuck ? -28 : -(h - 18);
        const torsoH = isDuck ? 20 : 30;

        // Back plate (shadow)
        ctx.fillStyle = bodyDark;
        ctx.fillRect(-12, torsoY + 1, 24, torsoH);
        // Main torso
        ctx.fillStyle = bodyMid;
        ctx.fillRect(-11, torsoY, 22, torsoH);
        // Shoulder ridge
        ctx.fillStyle = bodyLight;
        ctx.fillRect(-12, torsoY, 24, 3);
        // Chest panel (inset)
        ctx.fillStyle = '#12122a';
        ctx.fillRect(-7, torsoY + 5, 14, isDuck ? 11 : 18);
        // Chest panel border
        ctx.strokeStyle = accentDim;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-7, torsoY + 5, 14, isDuck ? 11 : 18);
        // Reactor core glow
        const coreGlow = 0.5 + Math.sin(time * 0.006) * 0.35;
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = coreGlow;
        ctx.fillRect(-4, torsoY + 8, 8, 4);
        ctx.globalAlpha = coreGlow * 0.6;
        ctx.fillRect(-3, torsoY + 14, 6, 2);
        if (!isDuck) {
            ctx.globalAlpha = coreGlow * 0.4;
            ctx.fillRect(-2, torsoY + 18, 4, 2);
        }
        ctx.globalAlpha = 1;
        // Hip section
        ctx.fillStyle = jointColor;
        ctx.fillRect(-9, torsoY + torsoH - 3, 18, 3);

        // ─── Arms ───
        const armSwing = isDuck ? 0 : Math.sin(frame * Math.PI / 4) * 12;
        const armY = torsoY + 5;

        // Left arm
        ctx.save();
        ctx.translate(-15, armY + 3);
        ctx.rotate(isJump ? -0.6 : armSwing * 0.028);
        // Shoulder pad
        ctx.fillStyle = bodyLight;
        ctx.fillRect(-4, -2, 8, 5);
        // Upper arm
        ctx.fillStyle = bodyMid;
        ctx.fillRect(-3, 3, 7, 10);
        // Elbow
        ctx.fillStyle = jointHighlight;
        ctx.fillRect(-2, 12, 5, 3);
        // Forearm
        ctx.fillStyle = bodyDark;
        ctx.fillRect(-3, 15, 7, 8);
        // Wrist accent
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(-2, 21, 5, 1);
        ctx.globalAlpha = 1;
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(15, armY + 3);
        ctx.rotate(isJump ? 0.6 : -armSwing * 0.028);
        ctx.fillStyle = bodyLight;
        ctx.fillRect(-4, -2, 8, 5);
        ctx.fillStyle = bodyMid;
        ctx.fillRect(-4, 3, 7, 10);
        ctx.fillStyle = jointHighlight;
        ctx.fillRect(-3, 12, 5, 3);
        ctx.fillStyle = bodyDark;
        ctx.fillRect(-4, 15, 7, 8);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(-3, 21, 5, 1);
        ctx.globalAlpha = 1;
        ctx.restore();

        // ─── Head ───
        const headY = torsoY - (isDuck ? 10 : 16);
        // Neck
        ctx.fillStyle = jointColor;
        ctx.fillRect(-3, torsoY - 2, 6, 4);

        // Head base
        ctx.fillStyle = bodyDark;
        ctx.fillRect(-9, headY, 18, 16);
        // Head mid layer
        ctx.fillStyle = bodyMid;
        ctx.fillRect(-8, headY + 1, 16, 14);
        // Helmet ridge
        ctx.fillStyle = bodyLight;
        ctx.fillRect(-9, headY, 18, 2);
        ctx.fillRect(-9, headY, 2, 16);
        ctx.fillRect(7, headY, 2, 16);

        // Visor (large, glowing)
        const visorGrad = ctx.createLinearGradient(-6, headY + 5, -6, headY + 11);
        visorGrad.addColorStop(0, '#00ddff');
        visorGrad.addColorStop(1, '#0066aa');
        ctx.fillStyle = visorGrad;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-6, headY + 5, 12, 6);
        // Visor highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(-4, headY + 6, 4, 2);
        // Visor scanline effect
        ctx.globalAlpha = 0.15;
        ctx.fillRect(-6, headY + 7, 12, 1);
        ctx.fillRect(-6, headY + 9, 12, 1);
        ctx.globalAlpha = 1;

        // Ear pieces
        ctx.fillStyle = accentDim;
        ctx.fillRect(-10, headY + 5, 2, 6);
        ctx.fillRect(8, headY + 5, 2, 6);

        // Antenna (only when not ducking)
        if (!isDuck) {
            ctx.fillStyle = jointColor;
            ctx.fillRect(4, headY - 5, 2, 6);
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.5 + Math.sin(time * 0.01) * 0.5;
            ctx.fillRect(3, headY - 6, 4, 2);
            ctx.globalAlpha = 1;
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    },

    _drawDeathParts(ctx) {
        const bodyDark = '#1e1e2e';
        const bodyMid = '#2a2a3a';
        const accentColor = '#00ffff';
        for (const p of this.deathParts) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            // Multi-layer death parts
            ctx.fillStyle = bodyDark;
            ctx.fillRect(-p.w / 2 - 1, -p.h / 2 - 1, p.w + 2, p.h + 2);
            ctx.fillStyle = bodyMid;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            if (p.name === 'head') {
                const visorGrad = ctx.createLinearGradient(-5, -3, -5, 3);
                visorGrad.addColorStop(0, '#00ddff');
                visorGrad.addColorStop(1, '#003366');
                ctx.fillStyle = visorGrad;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(-5, -3, 10, 5);
                ctx.globalAlpha = 1;
            } else if (p.name === 'torso') {
                ctx.fillStyle = accentColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(-3, -4, 6, 3);
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }
    },

    drawGhost(ctx, gx, gy, gState, gScaleY) {
        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(1, gScaleY || 1);
        ctx.globalAlpha = 0.18;

        const h = 70;
        const ghostColor = '#ff66cc';
        const ghostDark = '#cc3399';

        // Enhanced ghost silhouette
        ctx.fillStyle = ghostDark;
        ctx.fillRect(-11, -h + 19, 22, 30);
        ctx.fillRect(-8, -h + 5, 16, 16);
        ctx.fillRect(-5, -5, 10, 24);

        ctx.fillStyle = ghostColor;
        ctx.fillRect(-10, -h + 20, 20, 28);
        ctx.fillRect(-7, -h + 6, 14, 14);
        ctx.fillRect(-4, -4, 8, 22);
        ctx.fillRect(-13, -h + 24, 7, 18);
        ctx.fillRect(6, -h + 24, 7, 18);

        // Ghost visor
        ctx.fillStyle = '#ffaadd';
        ctx.globalAlpha = 0.25;
        ctx.fillRect(-4, -h + 10, 8, 4);

        ctx.globalAlpha = 1;
        ctx.restore();
    }
};
