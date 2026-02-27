// ─── NEURO-RUN: Audio Engine (Web Audio API) ───

const AudioEngine = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    muted: false,
    musicVolume: 0.4,
    sfxVolume: 0.8,
    musicNodes: [],
    sequencerInterval: null,
    currentBPM: 128,
    beatCallback: null,

    init() {
        this.muted = Storage.getMuted();
    },

    ensureContext() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.masterGain);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        this.sfxGain.connect(this.masterGain);
        this.masterGain.gain.value = this.muted ? 0 : 1;
    },

    setMuted(v) {
        this.muted = v;
        Storage.setMuted(v);
        if (this.masterGain) {
            this.masterGain.gain.value = v ? 0 : 1;
        }
    },

    toggleMute() {
        this.setMuted(!this.muted);
    },

    // ─── Sound Effects ───
    playJump() {
        this.ensureContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.08);
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
    },

    playLand() {
        this.ensureContext();
        const t = this.ctx.currentTime;
        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.08);

        // Sub thud
        const osc = this.ctx.createOscillator();
        osc.frequency.value = 60;
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.3, t);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(g2);
        g2.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    playPerfect() {
        this.ensureContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
    },

    playMultiplierUp() {
        this.ensureContext();
        const t = this.ctx.currentTime;
        [800, 1000, 1200].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.15, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.15);
        });
    },

    playBossWarning() {
        this.ensureContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.linearRampToValueAtTime(200, t + 1.5);
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 8;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.15;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 1.5);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        lfo.start(t);
        osc.start(t);
        osc.stop(t + 1.5);
        lfo.stop(t + 1.5);
    },

    playDeath() {
        this.ensureContext();
        const t = this.ctx.currentTime;
        // Noise explosion
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        noise.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.8);

        // Sub bass drop
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.linearRampToValueAtTime(20, t + 0.6);
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.5, t);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        osc.connect(g2);
        g2.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.6);

        // Descending whine
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(3000, t + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(100, t + 1.2);
        const g3 = this.ctx.createGain();
        g3.gain.setValueAtTime(0.15, t + 0.1);
        g3.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
        osc2.connect(g3);
        g3.connect(this.sfxGain);
        osc2.start(t + 0.1);
        osc2.stop(t + 1.2);
    },

    playMenuSelect() {
        this.ensureContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 600;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.06);
    },

    // ─── Background Music ───
    startMusic(bpm) {
        this.ensureContext();
        this.stopMusic();
        this.currentBPM = bpm;
        const beatInterval = 60 / bpm;

        // Simple generative bass line
        const notes = [55, 55, 73.4, 55, 65.4, 55, 82.4, 73.4]; // A, A, D, A, C, A, E, D
        let step = 0;
        let nextBeatTime = this.ctx.currentTime + 0.1;

        const schedule = () => {
            while (nextBeatTime < this.ctx.currentTime + 0.2) {
                const t = nextBeatTime;
                // Bass
                const osc = this.ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = notes[step % notes.length];
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 400;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + beatInterval * 0.8);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);
                osc.start(t);
                osc.stop(t + beatInterval);

                // Kick on every beat
                const kick = this.ctx.createOscillator();
                kick.frequency.setValueAtTime(150, t);
                kick.frequency.exponentialRampToValueAtTime(30, t + 0.08);
                const kGain = this.ctx.createGain();
                kGain.gain.setValueAtTime(0.3, t);
                kGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                kick.connect(kGain);
                kGain.connect(this.musicGain);
                kick.start(t);
                kick.stop(t + 0.1);

                // Hi-hat on off-beats
                if (step % 2 === 1) {
                    const hh = this.ctx.createBufferSource();
                    const hhBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
                    const hhData = hhBuf.getChannelData(0);
                    for (let i = 0; i < hhData.length; i++) hhData[i] = (Math.random() * 2 - 1) * 0.3;
                    hh.buffer = hhBuf;
                    const hhFilter = this.ctx.createBiquadFilter();
                    hhFilter.type = 'highpass';
                    hhFilter.frequency.value = 7000;
                    const hhGain = this.ctx.createGain();
                    hhGain.gain.setValueAtTime(0.15, t);
                    hhGain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
                    hh.connect(hhFilter);
                    hhFilter.connect(hhGain);
                    hhGain.connect(this.musicGain);
                    hh.start(t);
                }

                if (this.beatCallback) {
                    // Schedule beat callback slightly ahead
                    const delay = Math.max(0, (t - this.ctx.currentTime) * 1000);
                    setTimeout(() => this.beatCallback && this.beatCallback(), delay);
                }

                step++;
                nextBeatTime += beatInterval;
            }
        };

        this.sequencerInterval = setInterval(schedule, 100);
        schedule();
    },

    stopMusic() {
        if (this.sequencerInterval) {
            clearInterval(this.sequencerInterval);
            this.sequencerInterval = null;
        }
    },

    setBPM(bpm) {
        if (bpm !== this.currentBPM) {
            this.startMusic(bpm);
        }
    }
};
