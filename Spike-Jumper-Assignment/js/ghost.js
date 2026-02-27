// ─── NEURO-RUN: Ghost System ───

const GhostSystem = {
    recording: false,
    frames: [],
    recordInterval: 16,
    recordTimer: 0,
    playbackGhosts: [],
    maxGhosts: 5,

    startRecording() {
        this.recording = true;
        this.frames = [];
        this.recordTimer = 0;
    },

    stopRecording() {
        this.recording = false;
    },

    recordFrame(dt, gameTime) {
        if (!this.recording) return;
        this.recordTimer += dt;
        if (this.recordTimer >= this.recordInterval) {
            this.recordTimer = 0;
            this.frames.push({
                t: gameTime,
                x: Player.x,
                y: Player.y,
                state: Player.state,
                scaleY: Player.scaleY
            });
        }
    },

    saveGhost(score, tierReached, beatAccuracy) {
        const ghosts = Storage.getGhosts();
        const hexId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase();

        // Delta-compress frames
        const compressed = this._compressFrames(this.frames);

        const ghost = {
            name: 'GHOST-' + hexId,
            score: Math.floor(score),
            date: new Date().toISOString().split('T')[0],
            theme_reached: tierReached,
            beat_accuracy: beatAccuracy,
            frames: compressed
        };

        ghosts.unshift(ghost);
        if (ghosts.length > this.maxGhosts) ghosts.pop();
        Storage.setGhosts(ghosts);
    },

    _compressFrames(frames) {
        if (frames.length === 0) return [];
        // Store first frame fully, then deltas
        const result = [frames[0]];
        for (let i = 1; i < frames.length; i++) {
            result.push({
                t: frames[i].t,
                y: frames[i].y,
                state: frames[i].state !== frames[i - 1].state ? frames[i].state : undefined,
                scaleY: frames[i].scaleY !== frames[i - 1].scaleY ? frames[i].scaleY : undefined
            });
        }
        return result;
    },

    _decompressFrames(compressed) {
        if (compressed.length === 0) return [];
        const result = [compressed[0]];
        for (let i = 1; i < compressed.length; i++) {
            const prev = result[i - 1];
            result.push({
                t: compressed[i].t,
                x: compressed[i].x !== undefined ? compressed[i].x : prev.x,
                y: compressed[i].y,
                state: compressed[i].state !== undefined ? compressed[i].state : prev.state,
                scaleY: compressed[i].scaleY !== undefined ? compressed[i].scaleY : prev.scaleY
            });
        }
        return result;
    },

    loadGhostsForPlayback() {
        const ghosts = Storage.getGhosts();
        if (ghosts.length === 0) {
            this.playbackGhosts = [];
            return;
        }
        // Only load the top-scoring ghost
        const best = ghosts.reduce((a, b) => a.score >= b.score ? a : b);
        this.playbackGhosts = [{
            name: best.name,
            score: best.score,
            frames: this._decompressFrames(best.frames),
            frameIndex: 0,
            alive: true,
            x: PLAYER_X,
            y: GROUND_Y,
            state: 'run',
            scaleY: 1
        }];
    },

    updatePlayback(gameTime) {
        for (const ghost of this.playbackGhosts) {
            if (!ghost.alive) continue;
            const frames = ghost.frames;
            if (frames.length === 0) { ghost.alive = false; continue; }

            // Find current frame
            while (ghost.frameIndex < frames.length - 1 && frames[ghost.frameIndex + 1].t <= gameTime) {
                ghost.frameIndex++;
            }

            const f = frames[ghost.frameIndex];
            if (ghost.frameIndex >= frames.length - 1) {
                // Ghost died here
                ghost.alive = false;
                Particles.ghostFlicker(ghost.x, ghost.y);
                continue;
            }

            // Interpolate to next frame
            const next = frames[Math.min(ghost.frameIndex + 1, frames.length - 1)];
            const t = (next.t - f.t) > 0 ? (gameTime - f.t) / (next.t - f.t) : 0;
            ghost.y = lerp(f.y, next.y, clamp(t, 0, 1));
            ghost.state = f.state;
            ghost.scaleY = f.scaleY || 1;
        }
    },

    drawPlayback(ctx) {
        for (const ghost of this.playbackGhosts) {
            if (!ghost.alive) continue;
            Player.drawGhost(ctx, ghost.x, ghost.y, ghost.state, ghost.scaleY);

            // Name tag + score
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#ff66cc';
            ctx.font = '10px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ghost.name + ' (' + ghost.score + ')', ghost.x, ghost.y - 80);
            ctx.restore();
        }
    },

    getGhostList() {
        return Storage.getGhosts();
    },

    deleteGhost(index) {
        const ghosts = Storage.getGhosts();
        ghosts.splice(index, 1);
        Storage.setGhosts(ghosts);
    },

    renameGhost(index, name) {
        const ghosts = Storage.getGhosts();
        if (ghosts[index]) {
            ghosts[index].name = name.substring(0, 16);
            Storage.setGhosts(ghosts);
        }
    },

    exportGhost(index) {
        const ghosts = Storage.getGhosts();
        if (ghosts[index]) {
            return JSON.stringify(ghosts[index]);
        }
        return '';
    },

    importGhost(jsonStr) {
        try {
            const ghost = JSON.parse(jsonStr);
            if (ghost.name && ghost.frames) {
                const ghosts = Storage.getGhosts();
                ghosts.unshift(ghost);
                if (ghosts.length > this.maxGhosts) ghosts.pop();
                Storage.setGhosts(ghosts);
                return true;
            }
        } catch { }
        return false;
    }
};
