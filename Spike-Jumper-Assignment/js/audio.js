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
    musicStep: 0,

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

    // ─── Music Helpers ───
    _playNote(freq, type, vol, startTime, duration, filterFreq, detune) {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        if (detune) osc.detune.value = detune;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain.gain.setValueAtTime(vol * 0.8, startTime + duration * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);

        if (filterFreq) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;
            filter.Q.value = 2;
            osc.connect(filter);
            filter.connect(gain);
        } else {
            osc.connect(gain);
        }
        gain.connect(this.musicGain);
        osc.start(startTime);
        osc.stop(startTime + duration);
    },

    _playDrum(type, t) {
        if (type === 'kick') {
            const osc = this.ctx.createOscillator();
            osc.frequency.setValueAtTime(160, t);
            osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(t);
            osc.stop(t + 0.2);
            // Click transient
            const click = this.ctx.createOscillator();
            click.frequency.value = 1000;
            const cg = this.ctx.createGain();
            cg.gain.setValueAtTime(0.08, t);
            cg.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
            click.connect(cg);
            cg.connect(this.musicGain);
            click.start(t);
            click.stop(t + 0.015);
        } else if (type === 'snare') {
            const bufLen = this.ctx.sampleRate * 0.1;
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const hp = this.ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 2000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            src.connect(hp);
            hp.connect(gain);
            gain.connect(this.musicGain);
            src.start(t);
            // Tonal body
            const osc = this.ctx.createOscillator();
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
            const g2 = this.ctx.createGain();
            g2.gain.setValueAtTime(0.15, t);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(g2);
            g2.connect(this.musicGain);
            osc.start(t);
            osc.stop(t + 0.08);
        } else if (type === 'hat') {
            const bufLen = this.ctx.sampleRate * 0.04;
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const hp = this.ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 8000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            src.connect(hp);
            hp.connect(gain);
            gain.connect(this.musicGain);
            src.start(t);
        } else if (type === 'openhat') {
            const bufLen = this.ctx.sampleRate * 0.15;
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const hp = this.ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 6000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            src.connect(hp);
            hp.connect(gain);
            gain.connect(this.musicGain);
            src.start(t);
        }
    },

    // ─── Background Music: Layered Synthwave ───
    startMusic(bpm) {
        this.ensureContext();
        this.stopMusic();
        this.currentBPM = bpm;
        this.musicStep = 0;

        const beatInterval = 60 / bpm;
        const sixteenthInterval = beatInterval / 4;
        let nextTime = this.ctx.currentTime + 0.1;

        // Bass patterns (16 sixteenth-notes per bar) — Am progression
        const bassPatterns = [
            [55,0,55,0, 55,0,55,55, 55,0,55,0, 55,0,65.4,0],
            [43.65,0,43.65,0, 43.65,0,43.65,43.65, 43.65,0,43.65,0, 43.65,0,55,0],
            [41.2,0,41.2,0, 41.2,0,41.2,41.2, 41.2,0,41.2,0, 49,0,55,0],
            [49,0,49,0, 49,0,49,49, 49,0,49,0, 55,0,41.2,0],
        ];

        // Pad chords [freq1, freq2, freq3]
        const chordPatterns = [
            [220, 261.6, 329.6],   // Am
            [174.6, 220, 261.6],   // F
            [164.8, 246.9, 329.6], // Em
            [196, 246.9, 392],     // G
        ];

        // Arp sequences
        const arpPatterns = [
            [220,261.6,329.6,440, 329.6,261.6,220,329.6, 220,261.6,329.6,440, 523.2,440,329.6,261.6],
            [174.6,220,261.6,349.2, 261.6,220,174.6,261.6, 174.6,220,261.6,349.2, 440,349.2,261.6,220],
            [164.8,246.9,329.6,493.9, 329.6,246.9,164.8,329.6, 164.8,246.9,329.6,493.9, 659.2,493.9,329.6,246.9],
            [196,246.9,392,493.9, 392,246.9,196,392, 196,246.9,392,493.9, 587.3,493.9,392,246.9],
        ];

        // Drum patterns (16 steps): K=kick, S=snare, H=hat, O=openhat
        const drumPatterns = [
            'K.H.S.HKK.H.S.HO',
            'K.HKS.H.K.HKS.HO',
            'K.H.S.HKK.HKS.H.',
            'K.HKS.HKK.H.S.HO',
        ];

        // Lead melody (sparse, plays on even bars from section 2+)
        const leadMelodies = [
            [0,0,0,0, 440,0,523.2,0, 440,0,329.6,0, 0,0,0,0],
            [0,0,0,0, 349.2,0,440,0, 349.2,0,261.6,0, 0,0,0,0],
            [0,0,0,0, 329.6,0,493.9,0, 329.6,0,246.9,0, 0,0,0,0],
            [0,0,0,0, 392,0,493.9,0, 587.3,0,493.9,0, 392,0,0,0],
        ];

        const schedule = () => {
            while (nextTime < this.ctx.currentTime + 0.3) {
                const step = this.musicStep % 16;
                const bar = Math.floor(this.musicStep / 16);
                const chordIdx = bar % 4;
                const section = Math.floor(bar / 4);

                const t = nextTime;
                const dur = sixteenthInterval * 0.9;

                // Bass (always)
                const bassNote = bassPatterns[chordIdx][step];
                if (bassNote > 0) {
                    this._playNote(bassNote, 'sawtooth', 0.1, t, dur, 350, 0);
                    this._playNote(bassNote, 'sine', 0.1, t, dur * 1.2, 0, 0);
                }

                // Drums (always)
                const drumChar = drumPatterns[chordIdx][step];
                if (drumChar === 'K') this._playDrum('kick', t);
                else if (drumChar === 'S') this._playDrum('snare', t);
                else if (drumChar === 'H') this._playDrum('hat', t);
                else if (drumChar === 'O') this._playDrum('openhat', t);

                // Pad chords (from section 1+, once per bar)
                if (section >= 1 && step === 0) {
                    const chord = chordPatterns[chordIdx];
                    const padDur = beatInterval * 4 * 0.95;
                    for (const freq of chord) {
                        this._playNote(freq, 'sine', 0.035, t, padDur, 800, 5);
                        this._playNote(freq, 'triangle', 0.018, t, padDur, 600, -5);
                    }
                }

                // Arp (from section 1+, every other step)
                if (section >= 1 && step % 2 === 0) {
                    const arpNote = arpPatterns[chordIdx][step];
                    if (arpNote > 0) {
                        this._playNote(arpNote, 'square', 0.04, t, dur * 0.6, 2000, 0);
                    }
                }

                // Lead melody (from section 2+, even bars only)
                if (section >= 2 && bar % 2 === 0) {
                    const leadNote = leadMelodies[chordIdx][step];
                    if (leadNote > 0) {
                        this._playNote(leadNote, 'sine', 0.07, t, dur * 1.5, 0, 0);
                        this._playNote(leadNote * 1.005, 'triangle', 0.03, t, dur * 1.5, 0, 7);
                    }
                }

                // Beat callback
                if (step % 4 === 0 && this.beatCallback) {
                    const delay = Math.max(0, (t - this.ctx.currentTime) * 1000);
                    setTimeout(() => this.beatCallback && this.beatCallback(), delay);
                }

                this.musicStep++;
                nextTime += sixteenthInterval;
            }
        };

        this.sequencerInterval = setInterval(schedule, 80);
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
