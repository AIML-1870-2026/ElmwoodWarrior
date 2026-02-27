// ─── NEURO-RUN: Main Game Engine ───

const Game = {
    canvas: null,
    ctx: null,
    state: 'title', // title, playing, paused, dead, ghosts
    gameTime: 0,
    score: 0,
    rhythmBonus: 0,
    tier: 1,
    lastTimestamp: 0,
    totalJumps: 0,
    rhythmHits: 0,
    running: false,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = RENDER_W;
        this.canvas.height = RENDER_H;

        Input.init();
        AudioEngine.init();
        UI.init();

        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());

        this.running = true;
        this.lastTimestamp = performance.now();
        requestAnimationFrame(t => this._loop(t));
    },

    _resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const aspect = RENDER_W / RENDER_H;
        let w = container.clientWidth;
        let h = container.clientHeight;

        if (w / h > aspect) {
            w = h * aspect;
        } else {
            h = w / aspect;
        }

        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
    },

    startGame() {
        this.state = 'playing';
        this.gameTime = 0;
        this.score = 0;
        this.rhythmBonus = 0;
        this.tier = 1;
        this.totalJumps = 0;
        this.rhythmHits = 0;

        Player.init();
        ObstaclePool.init();
        ThemeManager.init();
        Parallax.init();
        RhythmEngine.init();
        Particles.clear();
        EnvParticles.clear();
        BossManager.active = false;
        BossManager.showingWarning = false;

        GhostSystem.startRecording();
        GhostSystem.loadGhostsForPlayback();

        AudioEngine.ensureContext();
        AudioEngine.startMusic(128);

        UI.screen = 'playing';
    },

    _loop(timestamp) {
        if (!this.running) return;

        const rawDt = timestamp - this.lastTimestamp;
        const dt = Math.min(rawDt, 50); // Cap delta to prevent spiral
        this.lastTimestamp = timestamp;

        this._update(dt);
        this._render();

        Input.clearFrame();
        requestAnimationFrame(t => this._loop(t));
    },

    _update(dt) {
        ScreenShake.update(dt);

        switch (this.state) {
            case 'title':
                // Input handled in render
                break;

            case 'playing':
                this._updateGameplay(dt);
                break;

            case 'paused':
                // Input handled in render
                break;

            case 'dead':
                UI.updateDeath(dt);
                Player.updateDeath(dt);
                Particles.update(dt);
                break;

            case 'ghosts':
                // Input handled in render
                break;
        }
    },

    _updateGameplay(dt) {
        this.gameTime += dt;

        // Tier update
        const newTier = Math.min(5, Math.floor(this.gameTime / 60000) + 1);
        if (newTier !== this.tier) {
            this.tier = newTier;
            ThemeManager.setTier(newTier);
        }

        // Update systems
        ThemeManager.update(dt);
        Parallax.update(dt, ObstaclePool.getSpeed(this.tier));
        Player.update(dt);
        RhythmEngine.update(dt, this.gameTime);
        EnvParticles.update(dt, this.tier, ObstaclePool.getSpeed(this.tier));
        Particles.update(dt);

        // Ghost recording
        GhostSystem.recordFrame(dt, this.gameTime);
        GhostSystem.updatePlayback(this.gameTime);

        // Jump rhythm rating
        if (Input.isJumpJust() && Player.grounded) {
            this.totalJumps++;
            const { rating, bonus } = RhythmEngine.rateJump(this.gameTime);
            if (bonus > 0) {
                this.rhythmBonus += bonus * RhythmEngine.multiplier;
                this.rhythmHits++;
            }
        }

        // Boss check
        if (BossManager.shouldTrigger(this.gameTime)) {
            const minute = Math.floor(this.gameTime / 60000) + 1;
            BossManager.startWarning(minute - 1);
        }

        // Update boss or obstacles
        if (BossManager.active || BossManager.showingWarning) {
            BossManager.update(dt, this.gameTime);
        } else {
            ObstaclePool.update(dt, this.tier, this.gameTime);
        }

        // Player aura
        Player.auraActive = RhythmEngine.multiplier >= 3;

        // Score
        this.score = (this.gameTime / 10) + this.rhythmBonus;

        // Collision detection
        if (Player.state !== 'death') {
            const hb = Player.getHitbox();
            let hit = false;

            if (BossManager.active) {
                hit = BossManager.checkCollision(hb);
            } else {
                hit = ObstaclePool.checkCollision(hb) !== null;
            }

            if (hit) {
                this._triggerDeath();
            }
        }

        // Pause
        if (Input.isPause()) {
            this.state = 'paused';
            UI.screen = 'paused';
            UI.pauseSelection = 0;
            AudioEngine.stopMusic();
        }
    },

    _triggerDeath() {
        this.state = 'dead';
        Player.die();
        AudioEngine.playDeath();
        AudioEngine.stopMusic();
        ScreenShake.trigger(12, 800);
        Particles.deathExplosion(Player.x, Player.y - Player.h / 2);

        GhostSystem.stopRecording();
        const accuracy = this.totalJumps > 0 ? (this.rhythmHits / this.totalJumps * 100) : 0;
        GhostSystem.saveGhost(this.score, this.tier, accuracy);

        UI.startDeath(this.score, accuracy);
    },

    _render() {
        const ctx = this.ctx;
        ctx.save();

        // Scale to high-res canvas
        ctx.scale(RENDER_SCALE, RENDER_SCALE);

        // Apply screen shake
        ctx.translate(ScreenShake.offsetX, ScreenShake.offsetY);

        switch (this.state) {
            case 'title':
                const titleAction = UI.drawTitle(ctx);
                if (titleAction === 'start') {
                    this.startGame();
                } else if (titleAction === 'ghosts') {
                    this.state = 'ghosts';
                }
                break;

            case 'playing':
                this._renderGameplay(ctx);
                break;

            case 'paused':
                this._renderGameplay(ctx);
                const pauseAction = UI.drawPause(ctx);
                if (pauseAction === 'resume') {
                    this.state = 'playing';
                    UI.screen = 'playing';
                    AudioEngine.startMusic(RhythmEngine.bpm);
                } else if (pauseAction === 'restart') {
                    this.startGame();
                } else if (pauseAction === 'quit') {
                    this.state = 'title';
                    UI.screen = 'title';
                    UI.init();
                }
                break;

            case 'dead':
                this._renderGameplay(ctx);
                UI.drawDeath(ctx);
                const deathAction = UI.handleDeathInput();
                if (deathAction === 'restart') {
                    this.startGame();
                } else if (deathAction === 'quit') {
                    this.state = 'title';
                    UI.screen = 'title';
                    UI.init();
                }
                break;

            case 'ghosts':
                const ghostAction = UI.drawGhosts(ctx);
                if (ghostAction === 'title') {
                    this.state = 'title';
                    UI.screen = 'title';
                }
                break;
        }

        ctx.restore();
    },

    _renderGameplay(ctx) {
        // Background & parallax
        Parallax.draw(ctx);

        // Environmental particles
        EnvParticles.draw(ctx);

        // Ghost playback
        GhostSystem.drawPlayback(ctx);

        // Obstacles
        if (BossManager.active || BossManager.showingWarning) {
            BossManager.draw(ctx);
        }
        ObstaclePool.draw(ctx);

        // Player
        Player.draw(ctx);

        // Game particles (sparks, explosions)
        Particles.draw(ctx);

        // Rhythm feedback
        RhythmEngine.drawRating(ctx);
        // HUD
        UI.drawHUD(ctx, this.score, this.gameTime, this.tier, RhythmEngine.multiplier, RhythmEngine.combo);
    }
};

// ─── Boot ───
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
