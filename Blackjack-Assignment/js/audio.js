// Audio Manager - Web Audio API Synthesized Sounds
class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.5;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported');
    }
  }

  play(name) {
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    switch (name) {
      case 'card-deal': this.playCardDeal(); break;
      case 'card-flip': this.playCardFlip(); break;
      case 'chip-place': this.playChipPlace(); break;
      case 'win': this.playWin(); break;
      case 'blackjack': this.playBlackjack(); break;
      case 'bust': this.playBust(); break;
      case 'push': this.playPush(); break;
      case 'streak-up': this.playStreakUp(); break;
      case 'achievement': this.playAchievement(); break;
      case 'gamble-win': this.playGambleWin(); break;
      case 'gamble-lose': this.playGambleLose(); break;
      case 'collect': this.playCollect(); break;
    }
  }

  playTone(freq, duration, type = 'sine', vol = 0.3) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol * this.volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, vol = 0.1) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    gain.gain.value = vol * this.volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(filter).connect(gain).connect(this.ctx.destination);
    source.start();
  }

  playCardDeal() {
    this.playNoise(0.08, 0.2);
    this.playTone(800, 0.05, 'sine', 0.05);
  }

  playCardFlip() {
    this.playNoise(0.06, 0.15);
    this.playTone(1200, 0.04, 'sine', 0.08);
  }

  playChipPlace() {
    this.playTone(2000, 0.05, 'sine', 0.1);
    this.playTone(3000, 0.03, 'sine', 0.08);
    this.playNoise(0.04, 0.1);
  }

  playWin() {
    const t = this.ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.2 * this.volume;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + i * 0.1);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + 0.5 + i * 0.1);
    });
  }

  playBlackjack() {
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.25 * this.volume;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8 + i * 0.15);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + 0.8 + i * 0.15);
    });
  }

  playBust() {
    this.playTone(220, 0.3, 'sawtooth', 0.15);
    this.playTone(180, 0.4, 'sine', 0.1);
  }

  playPush() {
    this.playTone(440, 0.15, 'sine', 0.1);
    setTimeout(() => this.playTone(440, 0.15, 'sine', 0.08), 150);
  }

  playStreakUp() {
    // Ascending power-up whoosh
    const t = this.ctx.currentTime;
    [440, 660, 880, 1100, 1320].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.15 * this.volume;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + i * 0.06);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.06);
      osc.stop(t + 0.4 + i * 0.06);
    });
  }

  playAchievement() {
    // Triumphant fanfare - 5 note ascending with harmonics
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.2 * this.volume;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0 + i * 0.1);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + 1.0 + i * 0.1);
    });
    // Add a shimmer
    const noise = this.ctx.createOscillator();
    const nGain = this.ctx.createGain();
    noise.type = 'sine';
    noise.frequency.value = 2637; // High E
    nGain.gain.value = 0.08 * this.volume;
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    noise.connect(nGain).connect(this.ctx.destination);
    noise.start(t + 0.4);
    noise.stop(t + 1.2);
  }

  playGambleWin() {
    // Cash register ka-ching
    const t = this.ctx.currentTime;
    this.playTone(1200, 0.08, 'square', 0.15);
    setTimeout(() => {
      this.playTone(1800, 0.15, 'sine', 0.2);
      this.playTone(2400, 0.2, 'sine', 0.15);
    }, 80);
    this.playNoise(0.05, 0.15);
  }

  playGambleLose() {
    // Descending wah-wah
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.8);
    gain.gain.value = 0.15 * this.volume;
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.8);

    // Second sad tone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(300, t + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 1.0);
    gain2.gain.value = 0.1 * this.volume;
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc2.connect(gain2).connect(this.ctx.destination);
    osc2.start(t + 0.3);
    osc2.stop(t + 1.0);
  }

  playCollect() {
    // Satisfying coin collect sound
    const t = this.ctx.currentTime;
    [800, 1000, 1200, 1600].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.12 * this.volume;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + i * 0.05);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.04);
      osc.stop(t + 0.3 + i * 0.05);
    });
    this.playNoise(0.06, 0.1);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }
}

const audioManager = new AudioManager();
