// ─── NEURO-RUN: UI Manager ───

const UI = {
    screen: 'title', // title, playing, paused, dead, ghosts
    deathSequenceTimer: 0,
    deathFlashAlpha: 0,
    deathDesaturation: 0,
    deathTextShown: false,
    deathScoreShown: false,
    deathRestartShown: false,
    deathNameInput: false,
    deathNameBuffer: '',
    deathNameDone: false,
    deathNameCursorBlink: 0,
    pauseSelection: 0,
    pauseOptions: ['RESUME', 'RESTART', 'MUTE AUDIO', 'QUIT TO TITLE'],
    ghostMenuSelection: 0,
    ghostMenuAction: 'list', // list, rename
    renameBuffer: '',
    titleSelection: 0,
    titleOptions: ['START', 'GHOSTS'],
    finalScore: 0,
    finalAccuracy: 0,
    isNewHighScore: false,

    init() {
        this.screen = 'title';
        this.titleSelection = 0;
        // Clean up any lingering name input handler
        if (this._nameInputHandler) {
            window.removeEventListener('keydown', this._nameInputHandler, true);
            this._nameInputHandler = null;
        }
    },

    // ─── Title Screen ───
    drawTitle(ctx) {
        // Background
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Grid lines for cyber effect
        ctx.strokeStyle = 'rgba(0,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let y = 0; y < CANVAS_H; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
        }
        for (let x = 0; x < CANVAS_W; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
        }

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 64px "Orbitron", sans-serif';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.fillText('NEURO-RUN', CANVAS_W / 2, 200);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ff00ff';
        ctx.font = '20px "Orbitron", sans-serif';
        ctx.fillText('CYBER SPRINT', CANVAS_W / 2, 240);

        // High score
        const hs = Storage.getHighScore();
        if (hs > 0) {
            ctx.fillStyle = '#888';
            ctx.font = '16px "Orbitron", sans-serif';
            ctx.fillText('HIGH SCORE: ' + hs.toLocaleString(), CANVAS_W / 2, 290);
        }

        // Menu options
        for (let i = 0; i < this.titleOptions.length; i++) {
            const selected = i === this.titleSelection;
            ctx.fillStyle = selected ? '#00ffff' : '#666688';
            ctx.font = (selected ? 'bold ' : '') + '24px "Orbitron", sans-serif';
            if (selected) {
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
            }
            ctx.fillText(this.titleOptions[i], CANVAS_W / 2, 380 + i * 50);
            ctx.shadowBlur = 0;
        }

        // Controls hint
        ctx.fillStyle = '#444466';
        ctx.font = '14px "Orbitron", sans-serif';
        ctx.fillText('SPACE / UP / W = JUMP    DOWN / S = DUCK    ESC = PAUSE', CANVAS_W / 2, 550);
        ctx.fillText('ARROW KEYS = NAVIGATE    ENTER = SELECT', CANVAS_W / 2, 575);

        // Handle input
        if (Input.justPressed['ArrowDown']) {
            this.titleSelection = (this.titleSelection + 1) % this.titleOptions.length;
            AudioEngine.playMenuSelect();
        }
        if (Input.justPressed['ArrowUp']) {
            this.titleSelection = (this.titleSelection - 1 + this.titleOptions.length) % this.titleOptions.length;
            AudioEngine.playMenuSelect();
        }
        if (Input.isEnter() || Input.isJumpJust()) {
            AudioEngine.ensureContext();
            if (this.titleSelection === 0) {
                return 'start';
            } else if (this.titleSelection === 1) {
                this.screen = 'ghosts';
                this.ghostMenuSelection = 0;
                return 'ghosts';
            }
        }
        return null;
    },

    // ─── HUD ───
    drawHUD(ctx, score, gameTime, tier, multiplier, combo) {
        const theme = ThemeManager.getTheme();
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

        // Score
        ctx.textAlign = 'left';
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 24px "Orbitron", sans-serif';
        ctx.fillText(Math.floor(score).toLocaleString(), 20, 35);

        // Zone name
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Orbitron", sans-serif';
        ctx.fillText(theme.name + ' T' + tier, CANVAS_W / 2, 28);

        // Time
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px "Orbitron", sans-serif';
        ctx.fillText(timeStr, CANVAS_W - 20, 35);

        // Multiplier
        if (multiplier > 1) {
            ctx.textAlign = 'left';
            ctx.fillStyle = multiplier >= 3 ? '#ffd700' : (multiplier >= 2 ? '#ff66cc' : '#00ffff');
            ctx.font = 'bold 18px "Orbitron", sans-serif';
            ctx.fillText('x' + multiplier.toFixed(1), 20, 62);
        }

        // Combo
        if (combo >= 3) {
            ctx.fillStyle = '#ff66cc';
            ctx.font = '14px "Orbitron", sans-serif';
            ctx.fillText('COMBO ' + combo, 100, 62);
        }

        // Boss timer (if not in boss fight)
        if (!BossManager.active && !BossManager.showingWarning) {
            const bossIn = BossManager.getBossTimeRemaining(gameTime);
            if (bossIn > 0 && bossIn < 30000) {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ff4444';
                ctx.font = '14px "Orbitron", sans-serif';
                ctx.fillText('BOSS IN ' + Math.ceil(bossIn / 1000) + 's', CANVAS_W / 2, 52);
            }
        }
    },

    // ─── Pause Screen ───
    drawPause(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 36px "Orbitron", sans-serif';
        ctx.fillText('PAUSED', CANVAS_W / 2, 200);

        const options = [...this.pauseOptions];
        options[2] = AudioEngine.muted ? 'UNMUTE AUDIO' : 'MUTE AUDIO';

        for (let i = 0; i < options.length; i++) {
            const selected = i === this.pauseSelection;
            ctx.fillStyle = selected ? '#00ffff' : '#666688';
            ctx.font = (selected ? 'bold ' : '') + '20px "Orbitron", sans-serif';
            ctx.fillText(options[i], CANVAS_W / 2, 300 + i * 45);
        }

        // Handle input
        if (Input.justPressed['ArrowDown']) {
            this.pauseSelection = (this.pauseSelection + 1) % options.length;
            AudioEngine.playMenuSelect();
        }
        if (Input.justPressed['ArrowUp']) {
            this.pauseSelection = (this.pauseSelection - 1 + options.length) % options.length;
            AudioEngine.playMenuSelect();
        }
        if (Input.isEnter()) {
            switch (this.pauseSelection) {
                case 0: return 'resume';
                case 1: return 'restart';
                case 2:
                    AudioEngine.toggleMute();
                    return null;
                case 3: return 'quit';
            }
        }
        if (Input.isPause()) return 'resume';
        return null;
    },

    // ─── Death Sequence ───
    startDeath(score, accuracy) {
        this.screen = 'dead';
        this.deathSequenceTimer = 0;
        this.deathFlashAlpha = 0;
        this.deathDesaturation = 0;
        this.deathTextShown = false;
        this.deathScoreShown = false;
        this.deathRestartShown = false;
        this.deathNameInput = false;
        this.deathNameBuffer = '';
        this.deathNameDone = false;
        this.deathNameCursorBlink = 0;
        this.finalScore = Math.floor(score);
        this.finalAccuracy = accuracy;
        this.isNewHighScore = score > Storage.getHighScore();
        if (this.isNewHighScore) {
            Storage.setHighScore(Math.floor(score));
        }

        // Set up keyboard listener for name input
        this._nameInputHandler = (e) => {
            if (!this.deathNameInput || this.deathNameDone) return;
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Enter') {
                this.deathNameDone = true;
                // Apply the name to the most recent ghost
                const name = this.deathNameBuffer.trim() || null;
                if (name) {
                    GhostSystem.renameGhost(0, name);
                }
                // Remove the handler
                window.removeEventListener('keydown', this._nameInputHandler, true);
                this._nameInputHandler = null;
                return;
            }
            if (e.key === 'Escape') {
                // Skip naming
                this.deathNameDone = true;
                window.removeEventListener('keydown', this._nameInputHandler, true);
                this._nameInputHandler = null;
                return;
            }
            if (e.key === 'Backspace') {
                this.deathNameBuffer = this.deathNameBuffer.slice(0, -1);
                return;
            }
            // Only allow printable characters, max 16 chars
            if (e.key.length === 1 && this.deathNameBuffer.length < 16) {
                this.deathNameBuffer += e.key.toUpperCase();
            }
        };
        window.addEventListener('keydown', this._nameInputHandler, true);
    },

    updateDeath(dt) {
        this.deathSequenceTimer += dt;
        const t = this.deathSequenceTimer;

        // White flash (100ms-500ms)
        if (t >= 100 && t < 500) {
            this.deathFlashAlpha = Math.max(0, 0.9 * (1 - (t - 100) / 400));
        }

        // Desaturation (600ms+)
        if (t >= 600) {
            this.deathDesaturation = Math.min(1, (t - 600) / 1000);
        }

        // Text appears at 1200ms
        if (t >= 1200) this.deathTextShown = true;
        if (t >= 1800) this.deathScoreShown = true;
        // Name input appears at 2800ms
        if (t >= 2800 && !this.deathNameDone) {
            this.deathNameInput = true;
            this.deathNameCursorBlink += dt;
        }
        // Restart shown after name is done (or after timeout)
        if (this.deathNameDone || t >= 3000 && !this.deathNameInput) {
            this.deathRestartShown = true;
        }
    },

    drawDeath(ctx) {
        // White flash
        if (this.deathFlashAlpha > 0) {
            ctx.fillStyle = `rgba(255,255,255,${this.deathFlashAlpha})`;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }

        // Desaturation overlay
        if (this.deathDesaturation > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.deathDesaturation * 0.4})`;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }

        // Red chromatic aberration (simplified as red tint edges)
        if (this.deathSequenceTimer >= 200 && this.deathSequenceTimer < 1200) {
            const t = (this.deathSequenceTimer - 200) / 1000;
            ctx.fillStyle = `rgba(255,0,0,${0.15 * (1 - t)})`;
            ctx.fillRect(0, 0, 30, CANVAS_H);
            ctx.fillRect(CANVAS_W - 30, 0, 30, CANVAS_H);
            ctx.fillRect(0, 0, CANVAS_W, 20);
            ctx.fillRect(0, CANVAS_H - 20, CANVAS_W, 20);
        }

        // "SYSTEM FAILURE" text
        if (this.deathTextShown) {
            const textAge = this.deathSequenceTimer - 1200;
            const glitch = textAge < 300 ? Math.sin(textAge * 0.1) * 5 : 0;
            const scale = textAge < 200 ? 1 + (200 - textAge) / 200 * 0.5 : 1;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.translate(CANVAS_W / 2 + glitch, CANVAS_H / 2 - 80);
            ctx.scale(scale, scale);
            ctx.fillStyle = '#ff3333';
            ctx.font = 'bold 42px "Orbitron", sans-serif';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.fillText('SYSTEM FAILURE', 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Score card
        if (this.deathScoreShown) {
            const cardAge = this.deathSequenceTimer - 1800;
            const cardAlpha = Math.min(1, cardAge / 300);

            ctx.save();
            ctx.globalAlpha = cardAlpha;
            ctx.textAlign = 'center';

            // Score
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px "Orbitron", sans-serif';
            ctx.fillText('SCORE', CANVAS_W / 2, CANVAS_H / 2 - 10);
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 44px "Orbitron", sans-serif';
            ctx.fillText(this.finalScore.toLocaleString(), CANVAS_W / 2, CANVAS_H / 2 + 40);

            // Accuracy
            ctx.fillStyle = '#aaaacc';
            ctx.font = '18px "Orbitron", sans-serif';
            ctx.fillText('BEAT ACCURACY: ' + this.finalAccuracy.toFixed(1) + '%', CANVAS_W / 2, CANVAS_H / 2 + 75);

            // New high score
            if (this.isNewHighScore) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 22px "Orbitron", sans-serif';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.fillText('NEW HIGH SCORE!', CANVAS_W / 2, CANVAS_H / 2 + 110);
                ctx.shadowBlur = 0;
            }

            ctx.restore();
        }

        // Ghost name input
        if (this.deathNameInput && !this.deathNameDone) {
            const inputAge = this.deathSequenceTimer - 2800;
            const inputAlpha = Math.min(1, inputAge / 300);

            ctx.save();
            ctx.globalAlpha = inputAlpha;
            ctx.textAlign = 'center';

            // Label
            ctx.fillStyle = '#ff66cc';
            ctx.font = '16px "Orbitron", sans-serif';
            ctx.fillText('NAME YOUR GHOST', CANVAS_W / 2, CANVAS_H / 2 + 120);

            // Input box background
            const boxW = 280;
            const boxH = 36;
            const boxX = CANVAS_W / 2 - boxW / 2;
            const boxY = CANVAS_H / 2 + 132;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = '#ff66cc';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            // Typed text
            const displayText = this.deathNameBuffer || '';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(displayText, CANVAS_W / 2, boxY + 24);

            // Blinking cursor
            const cursorBlink = Math.sin(this.deathNameCursorBlink * 0.005) > 0;
            if (cursorBlink) {
                const textWidth = ctx.measureText(displayText).width;
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(CANVAS_W / 2 + textWidth / 2 + 3, boxY + 8, 2, 20);
            }

            // Hint
            ctx.fillStyle = '#666688';
            ctx.font = '12px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('TYPE A NAME + ENTER    |    ESC TO SKIP', CANVAS_W / 2, boxY + boxH + 18);

            ctx.restore();
        }

        // Restart prompt
        if (this.deathRestartShown && this.deathNameDone) {
            const blink = Math.sin(Date.now() * 0.004) > 0;
            if (blink) {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#888899';
                ctx.font = '18px "Orbitron", sans-serif';
                ctx.fillText('PRESS ENTER OR SPACE TO RESTART', CANVAS_W / 2, CANVAS_H / 2 + 190);
                ctx.fillText('ESC FOR TITLE', CANVAS_W / 2, CANVAS_H / 2 + 220);
            }
        }
    },

    handleDeathInput() {
        // Don't allow restart while name input is active
        if (!this.deathRestartShown || !this.deathNameDone) return null;
        if (Input.isEnter() || Input.isJumpJust()) return 'restart';
        if (Input.justPressed['Escape']) return 'quit';
        return null;
    },

    // ─── Ghost Management Screen ───
    drawGhosts(ctx) {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff66cc';
        ctx.font = 'bold 32px "Orbitron", sans-serif';
        ctx.fillText('GHOST DATA', CANVAS_W / 2, 60);

        const ghosts = GhostSystem.getGhostList();

        if (ghosts.length === 0) {
            ctx.fillStyle = '#666688';
            ctx.font = '18px "Orbitron", sans-serif';
            ctx.fillText('NO GHOST DATA RECORDED', CANVAS_W / 2, 300);
        } else {
            for (let i = 0; i < ghosts.length; i++) {
                const g = ghosts[i];
                const selected = i === this.ghostMenuSelection;
                const y = 120 + i * 70;

                // Background
                ctx.fillStyle = selected ? 'rgba(255,102,204,0.15)' : 'rgba(255,255,255,0.03)';
                ctx.fillRect(200, y, CANVAS_W - 400, 60);
                if (selected) {
                    ctx.strokeStyle = '#ff66cc';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(200, y, CANVAS_W - 400, 60);
                }

                ctx.textAlign = 'left';
                ctx.fillStyle = selected ? '#ff66cc' : '#888899';
                ctx.font = 'bold 18px "Orbitron", sans-serif';
                ctx.fillText(g.name, 220, y + 25);

                ctx.fillStyle = '#aaaacc';
                ctx.font = '14px "Orbitron", sans-serif';
                ctx.fillText('Score: ' + (g.score || 0).toLocaleString(), 220, y + 48);

                ctx.textAlign = 'right';
                ctx.fillText(g.date || '', CANVAS_W - 220, y + 25);
                ctx.fillText('Accuracy: ' + (g.beat_accuracy || 0).toFixed(1) + '%', CANVAS_W - 220, y + 48);
            }
        }

        // Controls
        ctx.textAlign = 'center';
        ctx.fillStyle = '#444466';
        ctx.font = '14px "Orbitron", sans-serif';
        ctx.fillText('UP/DOWN = SELECT    DEL = DELETE    ESC = BACK', CANVAS_W / 2, CANVAS_H - 40);

        // Handle input
        if (Input.justPressed['ArrowDown'] && ghosts.length > 0) {
            this.ghostMenuSelection = (this.ghostMenuSelection + 1) % ghosts.length;
            AudioEngine.playMenuSelect();
        }
        if (Input.justPressed['ArrowUp'] && ghosts.length > 0) {
            this.ghostMenuSelection = (this.ghostMenuSelection - 1 + ghosts.length) % ghosts.length;
            AudioEngine.playMenuSelect();
        }
        if (Input.justPressed['Delete'] && ghosts.length > 0) {
            GhostSystem.deleteGhost(this.ghostMenuSelection);
            if (this.ghostMenuSelection >= ghosts.length - 1) {
                this.ghostMenuSelection = Math.max(0, ghosts.length - 2);
            }
        }
        if (Input.justPressed['Escape']) {
            this.screen = 'title';
            return 'title';
        }
        return null;
    }
};
