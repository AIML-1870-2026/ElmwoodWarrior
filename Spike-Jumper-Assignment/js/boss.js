// ─── NEURO-RUN: Boss Encounter System ───

const BossManager = {
    active: false,
    bossType: 0,
    timer: 0,
    duration: 15000,
    warningTimer: 0,
    warningDuration: 2000,
    showingWarning: false,
    bossName: '',
    projectiles: [],
    bossX: 0,
    bossY: 0,
    bossW: 0,
    bossH: 0,
    phase: 0,
    attackTimer: 0,

    bossData: [
        { name: 'POLICE CRUISER', color: '#2244aa', w: 200, h: 60 },
        { name: 'CONSTRUCTION MECH', color: '#886622', w: 120, h: 140 },
        { name: 'SWARM DRONE CLUSTER', color: '#555577', w: 250, h: 80 },
        { name: 'CORPORATE GUNSHIP', color: '#333355', w: 220, h: 70 },
        { name: 'CORRUPTED FOREST SPIRIT', color: '#225522', w: 160, h: 160 }
    ],

    shouldTrigger(gameTime) {
        const minute = Math.floor(gameTime / 60000);
        const intoMinute = gameTime % 60000;
        // Trigger boss at 45s into each minute (before the minute mark)
        return intoMinute >= 45000 && intoMinute < 45100 && !this.active && !this.showingWarning;
    },

    startWarning(minute) {
        this.showingWarning = true;
        this.warningTimer = this.warningDuration;
        this.bossType = Math.min(minute, 4); // 0-indexed
        const data = this.bossData[this.bossType];
        this.bossName = data.name;
        AudioEngine.playBossWarning();

        // Clear all obstacles immediately so the player doesn't die to leftover objects
        ObstaclePool.clear();
    },

    startBoss() {
        this.active = true;
        this.showingWarning = false;
        this.timer = this.duration;
        this.projectiles = [];
        this.phase = 0;
        this.attackTimer = 0;

        const data = this.bossData[this.bossType];
        this.bossW = data.w;
        this.bossH = data.h;
        this.bossX = CANVAS_W - this.bossW - 50;
        this.bossY = GROUND_Y - this.bossH - 20;

        // Clear regular obstacles
        ObstaclePool.clear();
    },

    update(dt, gameTime) {
        if (this.showingWarning) {
            this.warningTimer -= dt;
            if (this.warningTimer <= 0) {
                this.startBoss();
            }
            return;
        }

        if (!this.active) return;

        this.timer -= dt;
        this.attackTimer -= dt;

        if (this.timer <= 0) {
            this.active = false;
            this.projectiles = [];
            return;
        }

        // Boss attack patterns
        if (this.attackTimer <= 0) {
            this._doAttack();
            this.attackTimer = this.bossType < 3 ? rand(800, 1500) : rand(600, 1200);
        }

        // Move projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.gravity) p.vy += p.gravity * dt;
            if (p.x < -50 || p.y > GROUND_Y + 50) {
                this.projectiles.splice(i, 1);
            }
        }

        // Slight boss movement
        this.bossY = GROUND_Y - this.bossH - 20 + Math.sin(gameTime * 0.002) * 15;
    },

    _doAttack() {
        switch (this.bossType) {
            case 0: // Police Cruiser - horizontal beams
                this.projectiles.push({
                    x: this.bossX,
                    y: this.bossY + this.bossH / 2 + rand(-20, 20),
                    w: 80, h: 8,
                    vx: -0.5, vy: 0,
                    color: '#ff4444'
                });
                break;

            case 1: // Construction Mech - falling debris
                for (let i = 0; i < 3; i++) {
                    this.projectiles.push({
                        x: rand(200, CANVAS_W - 100),
                        y: -20,
                        w: 25, h: 25,
                        vx: -0.05, vy: 0.1,
                        gravity: 0.0005,
                        color: '#886622'
                    });
                }
                break;

            case 2: // Swarm Drones - grid of small projectiles
                for (let i = 0; i < 4; i++) {
                    this.projectiles.push({
                        x: this.bossX,
                        y: GROUND_Y - 40 - i * 35,
                        w: 15, h: 15,
                        vx: -0.4, vy: 0,
                        color: '#7777aa'
                    });
                }
                // Leave a gap
                break;

            case 3: // Corporate Gunship - mixed
                // Ground projectile
                this.projectiles.push({
                    x: this.bossX,
                    y: GROUND_Y - 30,
                    w: 40, h: 30,
                    vx: -0.4, vy: 0,
                    color: '#555588'
                });
                // Aerial projectile
                this.projectiles.push({
                    x: this.bossX,
                    y: GROUND_Y - 100 - rand(0, 40),
                    w: 50, h: 15,
                    vx: -0.35, vy: 0,
                    color: '#ff6644'
                });
                break;

            case 4: // Forest Spirit - vines from ground
                for (let i = 0; i < 2; i++) {
                    this.projectiles.push({
                        x: rand(250, CANVAS_W - 200),
                        y: GROUND_Y,
                        w: 15, h: 0,
                        vx: 0, vy: -0.3,
                        color: '#33aa33',
                        isVine: true,
                        maxH: rand(60, 120)
                    });
                }
                break;
        }
    },

    checkCollision(playerHitbox) {
        for (const p of this.projectiles) {
            const ph = p.isVine ? { x: p.x, y: GROUND_Y - (p.maxH || 80), w: p.w, h: p.maxH || 80 } : p;
            if (playerHitbox.x < ph.x + ph.w &&
                playerHitbox.x + playerHitbox.w > ph.x &&
                playerHitbox.y < ph.y + ph.h &&
                playerHitbox.y + playerHitbox.h > ph.y) {
                return true;
            }
        }
        return false;
    },

    draw(ctx) {
        if (this.showingWarning) {
            this._drawWarning(ctx);
            return;
        }

        if (!this.active) return;

        const data = this.bossData[this.bossType];

        // Draw boss
        ctx.save();
        ctx.translate(this.bossX, this.bossY);

        // Boss body shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(3, 3, this.bossW, this.bossH);
        // Boss body
        ctx.fillStyle = data.color;
        ctx.fillRect(0, 0, this.bossW, this.bossH);
        // Edge highlights
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(0, 0, this.bossW, 2);
        ctx.fillRect(0, 0, 2, this.bossH);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(this.bossW - 2, 0, 2, this.bossH);
        ctx.fillRect(0, this.bossH - 2, this.bossW, 2);

        // Boss details based on type
        const time = Date.now();
        ctx.fillStyle = '#ff3333';
        ctx.globalAlpha = 0.5 + Math.sin(time * 0.005) * 0.3;
        if (this.bossType === 0) {
            // Police lights (alternating)
            const lightPhase = Math.sin(time * 0.012) > 0;
            ctx.fillStyle = lightPhase ? '#ff2222' : '#441111';
            ctx.fillRect(10, 5, 20, 8);
            ctx.fillStyle = lightPhase ? '#111144' : '#2222ff';
            ctx.fillRect(this.bossW - 30, 5, 20, 8);
            // Light bar
            ctx.fillStyle = '#666';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(8, 3, this.bossW - 16, 2);
        } else if (this.bossType === 1) {
            // Mech details
            ctx.fillStyle = '#aa8833';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(10, 20, 30, 40);
            ctx.fillRect(this.bossW - 40, 20, 30, 40);
            ctx.fillStyle = '#ffaa00';
            ctx.globalAlpha = 0.4 + Math.sin(time * 0.004) * 0.3;
            ctx.fillRect(this.bossW / 2 - 8, 10, 16, 10);
        } else if (this.bossType === 4) {
            // Eyes (glowing)
            ctx.fillStyle = '#88ff44';
            ctx.shadowColor = '#88ff44';
            ctx.shadowBlur = 10;
            ctx.fillRect(40, 30, 20, 15);
            ctx.fillRect(100, 30, 20, 15);
            ctx.shadowBlur = 0;
            // Mouth
            ctx.fillStyle = '#225522';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(55, 80, 50, 8);
        }
        ctx.globalAlpha = 1;

        // Health bar
        const healthPct = this.timer / this.duration;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, -15, this.bossW, 8);
        ctx.fillStyle = healthPct > 0.3 ? '#44ff44' : '#ff4444';
        ctx.fillRect(0, -15, this.bossW * healthPct, 8);

        ctx.restore();

        // Draw projectiles
        for (const p of this.projectiles) {
            if (p.isVine) {
                const vineH = Math.min(Math.abs(p.y - GROUND_Y), p.maxH);
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, GROUND_Y - vineH, p.w, vineH);
                // Thorns
                ctx.fillStyle = '#228822';
                for (let i = 0; i < vineH; i += 15) {
                    ctx.fillRect(p.x - 4, GROUND_Y - i - 10, 5, 5);
                    ctx.fillRect(p.x + p.w - 1, GROUND_Y - i - 5, 5, 5);
                }
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.w, p.h);
                // Glow
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h / 2);
            }
        }

        // Boss timer
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.bossName, this.bossX + this.bossW / 2, this.bossY - 25);
        ctx.fillText(Math.ceil(this.timer / 1000) + 's', this.bossX + this.bossW / 2, this.bossY - 40);
    },

    _drawWarning(ctx) {
        const flash = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        // Full screen flash
        ctx.fillStyle = `rgba(255,0,0,${flash * 0.15})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Boss name card
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px "Orbitron", sans-serif';
        ctx.fillText('WARNING', CANVAS_W / 2, CANVAS_H / 2 - 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px "Orbitron", sans-serif';
        ctx.fillText(this.bossName, CANVAS_W / 2, CANVAS_H / 2 + 10);
        ctx.fillStyle = '#ff6666';
        ctx.font = '16px "Orbitron", sans-serif';
        ctx.fillText('INCOMING', CANVAS_W / 2, CANVAS_H / 2 + 40);
        ctx.restore();
    },

    getBossTimeRemaining(gameTime) {
        const intoMinute = gameTime % 60000;
        const timeUntilBoss = 45000 - intoMinute;
        return Math.max(0, timeUntilBoss);
    }
};
