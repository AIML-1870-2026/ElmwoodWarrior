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

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }
}

const audioManager = new AudioManager();
