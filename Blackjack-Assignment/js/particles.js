// Canvas-Based Particle System
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(options = {}) {
    const {
      x = this.canvas.width / 2,
      y = this.canvas.height / 2,
      count = 80,
      colors = ['#f0d080', '#c9a84c', '#e63946', '#2d9e4f', '#4a90d9'],
      type = 'confetti'
    } = options;

    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle({ x, y, colors, type }));
    }
    if (!this.running) this.loop();
  }

  loop() {
    this.running = true;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = this.particles.filter(p => p.alive);
    this.particles.forEach(p => { p.update(); p.draw(this.ctx); });
    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.running = false;
    }
  }
}

class Particle {
  constructor({ x, y, colors, type }) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 12;
    this.vy = (Math.random() * -14) - 2;
    this.gravity = 0.4;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.size = Math.random() * 10 + 4;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 12;
    this.life = 1.0;
    this.decay = Math.random() * 0.015 + 0.008;
    this.type = type;
    this.alive = true;
  }

  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.life -= this.decay;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);

    if (this.type === 'confetti') {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else if (this.type === 'sparkle') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      // Draw a star
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const r = this.size / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'chip') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
    }

    ctx.restore();
  }
}

let particleSystem;

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  particleSystem = new ParticleSystem(canvas);
}

function triggerWinEffect() {
  if (!particleSystem) return;
  particleSystem.burst({
    count: 60,
    colors: ['#f0d080', '#c9a84c', '#2d9e4f', '#4caf50'],
    type: 'confetti'
  });
}

function triggerBlackjackEffect() {
  if (!particleSystem) return;
  // Full gold sparkle cascade
  particleSystem.burst({
    count: 120,
    colors: ['#f0d080', '#c9a84c', '#ffd700', '#fff8dc'],
    type: 'sparkle'
  });
  // Second delayed burst
  setTimeout(() => {
    particleSystem.burst({
      count: 60,
      colors: ['#f0d080', '#ffd700'],
      type: 'confetti'
    });
  }, 300);

  // Screen flash
  document.getElementById('app').classList.add('win-flash');
  setTimeout(() => document.getElementById('app').classList.remove('win-flash'), 500);
}

function triggerPushEffect() {
  if (!particleSystem) return;
  particleSystem.burst({
    count: 20,
    colors: ['#aaa', '#ccc', '#888'],
    type: 'sparkle'
  });
}

function animateBust(handIndex) {
  document.getElementById('app').classList.add('bust-flash');
  setTimeout(() => document.getElementById('app').classList.remove('bust-flash'), 400);

  const handEls = document.querySelectorAll('.hand-container');
  // +1 to skip dealer hand
  const el = handEls[handIndex + 1];
  if (el) {
    el.classList.add('bust-animation');
    setTimeout(() => el.classList.remove('bust-animation'), 400);
  }
}
