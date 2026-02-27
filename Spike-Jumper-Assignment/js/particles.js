// ─── NEURO-RUN: Particle System ───

const Particles = {
    pool: [],
    maxParticles: 300,

    emit(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            if (this.pool.length >= this.maxParticles) {
                // Reuse oldest
                const p = this.pool.shift();
                this._initParticle(p, x, y, config);
                this.pool.push(p);
            } else {
                const p = {};
                this._initParticle(p, x, y, config);
                this.pool.push(p);
            }
        }
    },

    _initParticle(p, x, y, cfg) {
        const angle = cfg.angle !== undefined ? cfg.angle + (Math.random() - 0.5) * (cfg.spread || Math.PI) : Math.random() * Math.PI * 2;
        const speed = rand(cfg.speedMin || 0.1, cfg.speedMax || 0.4);
        p.x = x + (Math.random() - 0.5) * (cfg.offsetX || 0);
        p.y = y + (Math.random() - 0.5) * (cfg.offsetY || 0);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = cfg.life || 300;
        p.maxLife = p.life;
        p.size = cfg.size || 3;
        p.color = cfg.colors ? cfg.colors[randInt(0, cfg.colors.length - 1)] : (cfg.color || '#00ffff');
        p.gravity = cfg.gravity || 0;
        p.friction = cfg.friction || 1;
        p.alive = true;
    },

    update(dt) {
        for (let i = this.pool.length - 1; i >= 0; i--) {
            const p = this.pool[i];
            if (!p.alive) { this.pool.splice(i, 1); continue; }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.life -= dt;
            if (p.life <= 0) {
                p.alive = false;
                this.pool.splice(i, 1);
            }
        }
    },

    draw(ctx) {
        for (const p of this.pool) {
            if (!p.alive) continue;
            const alpha = clamp(p.life / p.maxLife, 0, 1);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    },

    clear() {
        this.pool.length = 0;
    },

    // Preset emitters
    landSparks(x, y) {
        this.emit(x, y, 8, {
            angle: -Math.PI / 2,
            spread: Math.PI * 0.8,
            speedMin: 0.15,
            speedMax: 0.45,
            life: 200,
            size: 3,
            colors: ['#00ffff', '#ffffff', '#88ffff'],
            gravity: 0.001,
            offsetX: 20
        });
    },

    deathExplosion(x, y) {
        this.emit(x, y, 50, {
            speedMin: 0.2,
            speedMax: 0.8,
            life: 800,
            size: 4,
            colors: ['#ff4444', '#ff8800', '#ffff00', '#ffffff', '#00ffff'],
            gravity: 0.0008,
            offsetX: 30,
            offsetY: 30
        });
    },

    ghostFlicker(x, y) {
        this.emit(x, y, 12, {
            speedMin: 0.05,
            speedMax: 0.2,
            life: 400,
            size: 2,
            colors: ['#ff66cc', '#ff44aa', '#ffffff'],
            gravity: -0.0003
        });
    }
};

// ─── Environmental Particles (separate from game particles) ───
const EnvParticles = {
    particles: [],
    maxCount: 60,

    update(dt, tier, speedMult) {
        // Spawn new
        if (this.particles.length < this.maxCount && Math.random() < 0.05) {
            this._spawn(tier, speedMult);
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt * speedMult;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0 || p.x < -20) {
                this.particles.splice(i, 1);
            }
        }
    },

    _spawn(tier, speedMult) {
        const p = { x: CANVAS_W + 20, y: rand(50, CANVAS_H - 100), life: 0, maxLife: 0, size: 0, color: '', vx: 0, vy: 0, type: '' };

        if (tier <= 2) {
            // City: embers, smog
            p.type = Math.random() < 0.5 ? 'ember' : 'smog';
            if (p.type === 'ember') {
                p.y = rand(300, 580);
                p.vx = -rand(0.03, 0.08);
                p.vy = -rand(0.01, 0.03);
                p.size = rand(1, 3);
                p.color = '#ff6600';
                p.life = p.maxLife = rand(2000, 4000);
            } else {
                p.y = rand(100, 400);
                p.vx = -rand(0.02, 0.05);
                p.vy = rand(-0.005, 0.005);
                p.size = rand(15, 30);
                p.color = 'rgba(150,150,170,0.15)';
                p.life = p.maxLife = rand(3000, 6000);
            }
        } else if (tier === 3) {
            // Dust
            p.y = rand(200, 550);
            p.vx = -rand(0.04, 0.1);
            p.vy = rand(-0.01, 0.01);
            p.size = rand(2, 5);
            p.color = '#aa9977';
            p.life = p.maxLife = rand(2000, 4000);
            p.type = 'dust';
        } else {
            // Forest: leaves, fireflies
            p.type = Math.random() < 0.6 ? 'leaf' : 'firefly';
            if (p.type === 'leaf') {
                p.y = rand(50, 400);
                p.vx = -rand(0.03, 0.08);
                p.vy = rand(0.01, 0.04);
                p.size = rand(3, 6);
                p.color = ['#44aa33', '#88cc44', '#cc8833', '#aa6622'][randInt(0, 3)];
                p.life = p.maxLife = rand(3000, 6000);
            } else {
                p.y = rand(200, 500);
                p.vx = -rand(0.01, 0.03);
                p.vy = Math.sin(Math.random() * 6) * 0.01;
                p.size = rand(2, 4);
                p.color = '#aaffaa';
                p.life = p.maxLife = rand(2000, 5000);
            }
        }
    },

    draw(ctx) {
        for (const p of this.particles) {
            const alpha = clamp(p.life / p.maxLife, 0, 1) * 0.8;
            ctx.globalAlpha = alpha;
            if (p.type === 'smog') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'firefly') {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
    },

    clear() {
        this.particles.length = 0;
    }
};
