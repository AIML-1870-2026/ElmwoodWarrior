// ─── NEURO-RUN: Rhythm Engine ───

const RhythmEngine = {
    bpm: 128,
    beatInterval: 60000 / 128,
    startTime: 0,
    beatCount: 0,
    lastBeatTime: 0,
    combo: 0,
    multiplier: 1,
    lastRating: '',
    ratingTimer: 0,
    beatPulse: 0,
    barPosition: 0,

    init() {
        this.bpm = 128;
        this.beatInterval = 60000 / 128;
        this.startTime = performance.now();
        this.beatCount = 0;
        this.lastBeatTime = this.startTime;
        this.combo = 0;
        this.multiplier = 1;
        this.lastRating = '';
        this.ratingTimer = 0;
        this.beatPulse = 0;
        this.barPosition = 0;
    },

    setBPM(bpm) {
        this.bpm = bpm;
        this.beatInterval = 60000 / bpm;
        AudioEngine.setBPM(bpm);
    },

    update(dt, gameTime) {
        // Check if we've crossed a beat boundary
        const elapsed = gameTime;
        const currentBeat = Math.floor(elapsed / this.beatInterval);
        if (currentBeat > this.beatCount) {
            this.beatCount = currentBeat;
            this.lastBeatTime = gameTime;
            this.beatPulse = 1;
        }

        // Decay beat pulse
        if (this.beatPulse > 0) {
            this.beatPulse = Math.max(0, this.beatPulse - dt * 0.004);
        }

        // Rhythm bar position (0 to 1 within a beat)
        const beatProgress = (gameTime % this.beatInterval) / this.beatInterval;
        this.barPosition = beatProgress;

        // Rating display timer
        if (this.ratingTimer > 0) {
            this.ratingTimer -= dt;
        }

        // Update BPM based on tier
        const tier = Math.floor(gameTime / 60000) + 1;
        const targetBPM = tier <= 3 ? 128 : (tier === 4 ? 140 : 155);
        if (targetBPM !== this.bpm) {
            this.setBPM(targetBPM);
        }
    },

    rateJump(gameTime) {
        const beatPhase = gameTime % this.beatInterval;
        const distToBeat = Math.min(beatPhase, this.beatInterval - beatPhase);

        let rating = '';
        let bonus = 0;

        if (distToBeat <= 50) {
            rating = 'PERFECT';
            bonus = 100;
            AudioEngine.playPerfect();
        } else if (distToBeat <= 120) {
            rating = 'GOOD';
            bonus = 40;
        } else if (distToBeat <= 200) {
            rating = 'OK';
            bonus = 10;
        } else {
            rating = '';
            bonus = 0;
        }

        if (rating === 'PERFECT' || rating === 'GOOD') {
            this.combo++;
            const prevMult = this.multiplier;
            if (this.combo >= 10) this.multiplier = 3;
            else if (this.combo >= 6) this.multiplier = 2;
            else if (this.combo >= 3) this.multiplier = 1.5;
            else this.multiplier = 1;

            if (this.multiplier > prevMult) {
                AudioEngine.playMultiplierUp();
            }
        } else if (rating === '') {
            this.combo = 0;
            this.multiplier = 1;
        }

        if (rating) {
            this.lastRating = rating;
            this.ratingTimer = 600;
        }

        return { rating, bonus };
    },

    drawRhythmBar(ctx) {
        const barW = 300;
        const barH = 8;
        const barX = (CANVAS_W - barW) / 2;
        const barY = CANVAS_H - 40;

        // Bar background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH);

        // Perfect zone
        const perfectW = barW * 0.1;
        ctx.fillStyle = 'rgba(255,215,0,0.3)';
        ctx.fillRect(barX + barW / 2 - perfectW / 2, barY, perfectW, barH);

        // Moving marker
        const markerX = barX + this.barPosition * barW;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(markerX - 2, barY - 2, 4, barH + 4);

        // Beat pulse vignette
        if (this.beatPulse > 0) {
            ctx.strokeStyle = `rgba(0,255,255,${this.beatPulse * 0.3})`;
            ctx.lineWidth = 4;
            ctx.strokeRect(4, 4, CANVAS_W - 8, CANVAS_H - 8);
        }
    },

    drawRating(ctx) {
        if (this.ratingTimer <= 0) return;

        const alpha = Math.min(1, this.ratingTimer / 200);
        const yOff = (1 - this.ratingTimer / 600) * -30;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.font = 'bold 28px "Orbitron", sans-serif';

        switch (this.lastRating) {
            case 'PERFECT':
                ctx.fillStyle = '#ffd700';
                break;
            case 'GOOD':
                ctx.fillStyle = '#00ffff';
                break;
            case 'OK':
                ctx.fillStyle = '#ffffff';
                break;
        }

        ctx.fillText(this.lastRating, Player.x, Player.y - Player.h - 20 + yOff);
        ctx.restore();
    }
};
