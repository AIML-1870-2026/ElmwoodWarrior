// ==================== GAME CONSTANTS ====================
const GRID_WIDTH = 16;
const GRID_HEIGHT = 16;

// Calculate tile size to fill the screen (with padding for HUD)
function calculateTileSize() {
    const padding = 200; // Space for HUD elements
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - padding;
    const tileByWidth = Math.floor(maxWidth / GRID_WIDTH);
    const tileByHeight = Math.floor(maxHeight / GRID_HEIGHT);
    return Math.min(tileByWidth, tileByHeight);
}

let TILE_SIZE = calculateTileSize();
let CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;
let CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;
const MAX_ECHOES = 5;
const ECHO_RECORD_TIME = 30000; // 30 seconds
const PARADOX_DURATION = 5000; // 5 seconds
const GROWTH_PER_FOOD = 3;

// Colors (default - neon theme)
let COLORS = {
    background: '#0a0e27',
    grid: 'rgba(0, 255, 255, 0.1)',
    snake: ['#00ffff', '#ff00ff', '#ffff00'],
    snake2: ['#ff6666', '#ff9944', '#ffcc00'], // Player 2 colors
    echo: 'rgba(0, 255, 255, 0.4)',
    food: '#ff6b6b',
    chronoFruit: '#00aaff',
    portal: '#9933ff',
    laser: '#ff0000',
    powerup: {
        timeDilation: '#00ff88',
        echoMagnet: '#ff8800',
        quantumTunnel: '#aa00ff',
        rewind: '#ffff00',
        speed: '#ff0066',
        multiplier: '#00ffff',
        invincibility: '#ffffff',
        foodFrenzy: '#88ff00'
    }
};

// Themes
const THEMES = {
    neon: {
        background: '#0a0e27',
        grid: 'rgba(0, 255, 255, 0.1)',
        echo: 'rgba(0, 255, 255, 0.4)',
        food: '#ff6b6b',
        chronoFruit: '#00aaff',
        portal: '#9933ff',
        laser: '#ff0000'
    },
    retro: {
        background: '#1a0a00',
        grid: 'rgba(255, 107, 53, 0.1)',
        echo: 'rgba(255, 200, 150, 0.4)',
        food: '#ff6b35',
        chronoFruit: '#f7c59f',
        portal: '#ff8c42',
        laser: '#ff4500'
    },
    ocean: {
        background: '#001220',
        grid: 'rgba(0, 180, 216, 0.1)',
        echo: 'rgba(0, 180, 216, 0.4)',
        food: '#48cae4',
        chronoFruit: '#90e0ef',
        portal: '#0096c7',
        laser: '#ff6b6b'
    },
    void: {
        background: '#0d0015',
        grid: 'rgba(107, 45, 91, 0.15)',
        echo: 'rgba(150, 50, 120, 0.4)',
        food: '#9b2335',
        chronoFruit: '#c154c1',
        portal: '#6b2d5b',
        laser: '#ff1493'
    }
};

// Snake Skins
const SKINS = {
    cyber: {
        colors: ['#00ffff', '#ff00ff', '#ffff00'],
        colors2: ['#ff6666', '#ff9944', '#ffcc00']
    },
    fire: {
        colors: ['#ff4500', '#ff6600', '#ffcc00'],
        colors2: ['#00bfff', '#0080ff', '#0040ff']
    },
    ice: {
        colors: ['#87ceeb', '#00bfff', '#ffffff'],
        colors2: ['#ff6b6b', '#ff4444', '#cc0000']
    },
    toxic: {
        colors: ['#39ff14', '#00ff00', '#7fff00'],
        colors2: ['#ff00ff', '#cc00cc', '#990099']
    }
};

// ==================== AUDIO SYSTEM ====================
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
        this.musicPlaying = false;
        this.musicNodes = [];
        this.masterGain = null;
        this.musicVolume = 0.12; // Keep music subtle
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.musicVolume;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.log('Audio not available');
        }
    }

    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;

        // Create ambient space pad with multiple detuned oscillators
        const baseFreqs = [55, 82.5, 110]; // A1, E2, A2 - creates a spacey Am drone

        baseFreqs.forEach((freq, i) => {
            // Main pad oscillator
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.value = freq;

            // Subtle detuning for richness
            osc.detune.value = (i - 1) * 5;

            filter.type = 'lowpass';
            filter.frequency.value = 400;
            filter.Q.value = 1;

            gain.gain.value = 0.3;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            this.musicNodes.push({ osc, gain, filter });

            // Add a subtle triangle wave layer
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();

            osc2.type = 'triangle';
            osc2.frequency.value = freq * 2;
            osc2.detune.value = (i - 1) * 3;
            gain2.gain.value = 0.1;

            osc2.connect(gain2);
            gain2.connect(this.masterGain);

            osc2.start();
            this.musicNodes.push({ osc: osc2, gain: gain2 });
        });

        // Slow arpeggio pattern
        this.startArpeggio();
    }

    startArpeggio() {
        if (!this.ctx || !this.musicPlaying) return;

        const notes = [220, 330, 440, 330, 262, 330, 220, 165]; // Ambient pattern
        let noteIndex = 0;

        const playNote = () => {
            if (!this.musicPlaying) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.value = notes[noteIndex];

            filter.type = 'lowpass';
            filter.frequency.value = 800;

            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 2);

            noteIndex = (noteIndex + 1) % notes.length;

            // Schedule next note
            this.arpTimeout = setTimeout(playNote, 800 + Math.random() * 400);
        };

        // Start after a short delay
        this.arpTimeout = setTimeout(playNote, 500);
    }

    stopMusic() {
        this.musicPlaying = false;

        if (this.arpTimeout) {
            clearTimeout(this.arpTimeout);
        }

        this.musicNodes.forEach(node => {
            try {
                if (node.gain) {
                    node.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
                }
                if (node.osc) {
                    node.osc.stop(this.ctx.currentTime + 0.6);
                }
            } catch (e) {}
        });

        this.musicNodes = [];
    }

    play(type, params = {}) {
        if (!this.enabled || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch(type) {
            case 'eat':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400 + (params.combo || 0) * 50, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'echo':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'paradox':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;

            case 'death':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
                break;

            case 'powerup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.setValueAtTime(400, now + 0.1);
                osc.frequency.setValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'portal':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
        }
    }
}

// ==================== PARTICLE SYSTEM ====================
class Particle {
    constructor(x, y, color, velocity, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = velocity.x;
        this.vy = velocity.y;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.vy += 100 * dt; // gravity
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            this.particles.push(new Particle(
                x, y, color,
                { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                Math.random() * 0.5 + 0.3
            ));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => {
            p.update(dt);
            return !p.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

// ==================== STAR FIELD ====================
class StarField {
    constructor(count = 200) {
        this.count = count;
        this.stars = [];
        this.regenerate();
    }

    regenerate() {
        this.stars = [];
        for (let i = 0; i < this.count; i++) {
            this.stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 20 + 5,
                brightness: Math.random()
            });
        }
    }

    update(dt) {
        this.stars.forEach(star => {
            star.brightness += (Math.random() - 0.5) * dt * 2;
            star.brightness = Math.max(0.2, Math.min(1, star.brightness));
        });
    }

    draw(ctx) {
        this.stars.forEach(star => {
            ctx.globalAlpha = star.brightness * 0.5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

// ==================== SNAKE CLASS ====================
class Snake {
    constructor(x, y, isEcho = false, isAI = false) {
        this.segments = [{ x, y }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.growthPending = 0;
        this.isEcho = isEcho;
        this.isAI = isAI;
        this.echoOpacity = isEcho ? 0.4 : 1;
        this.moveTimer = 0;
        this.moveInterval = 150; // ms between moves
        this.trail = [];
        this.maxTrailLength = 10;

        // Visual interpolation
        this.visualX = x * TILE_SIZE + TILE_SIZE / 2;
        this.visualY = y * TILE_SIZE + TILE_SIZE / 2;
        this.targetX = this.visualX;
        this.targetY = this.visualY;

        // Power-up states
        this.invincible = false;
        this.phaseMode = false;
        this.phaseModeTimer = 0;
        this.speedBoost = 1;

        // AI specific
        this.aiDifficulty = 'learner';
        this.aiTarget = null;
    }

    get head() {
        return this.segments[0];
    }

    setDirection(dx, dy) {
        // Prevent reversing
        if (this.segments.length > 1) {
            if (this.direction.x === -dx && this.direction.y === -dy) return;
        }
        this.nextDirection = { x: dx, y: dy };
    }

    update(dt, gameSpeed = 1) {
        // Update phase mode timer
        if (this.phaseMode) {
            this.phaseModeTimer -= dt * 1000;
            if (this.phaseModeTimer <= 0) {
                this.phaseMode = false;
            }
        }

        this.moveTimer += dt * 1000 * gameSpeed * this.speedBoost;

        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.move();
        }

        // Smooth visual interpolation
        const lerpSpeed = 15;
        this.visualX += (this.targetX - this.visualX) * lerpSpeed * dt;
        this.visualY += (this.targetY - this.visualY) * lerpSpeed * dt;
    }

    move() {
        this.direction = { ...this.nextDirection };

        const newHead = {
            x: this.head.x + this.direction.x,
            y: this.head.y + this.direction.y
        };

        // Add to trail
        this.trail.unshift({
            x: this.visualX,
            y: this.visualY,
            time: Date.now()
        });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        this.segments.unshift(newHead);

        if (this.growthPending > 0) {
            this.growthPending--;
        } else {
            this.segments.pop();
        }

        this.targetX = newHead.x * TILE_SIZE + TILE_SIZE / 2;
        this.targetY = newHead.y * TILE_SIZE + TILE_SIZE / 2;
    }

    grow(amount = GROWTH_PER_FOOD) {
        this.growthPending += amount;
    }

    checkSelfCollision() {
        if (this.phaseMode) return false;
        for (let i = 1; i < this.segments.length; i++) {
            if (this.head.x === this.segments[i].x &&
                this.head.y === this.segments[i].y) {
                return true;
            }
        }
        return false;
    }

    checkWallCollision(gridWidth, gridHeight) {
        return this.head.x < 0 || this.head.x >= gridWidth ||
               this.head.y < 0 || this.head.y >= gridHeight;
    }

    draw(ctx, time) {
        // Get colors based on player
        const snakeColors = this.isPlayer2 ? COLORS.snake2 : COLORS.snake;

        // Draw trail
        if (!this.isEcho) {
            ctx.globalAlpha = 0.3;
            this.trail.forEach((t, i) => {
                const alpha = 1 - (i / this.trail.length);
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = snakeColors[0];
                ctx.beginPath();
                ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }

        // Draw segments
        this.segments.forEach((seg, i) => {
            const x = seg.x * TILE_SIZE;
            const y = seg.y * TILE_SIZE;

            ctx.globalAlpha = this.echoOpacity;

            if (i === 0) {
                // Head with gradient
                if (this.isEcho) {
                    ctx.fillStyle = COLORS.echo;
                } else if (this.isAI) {
                    ctx.fillStyle = '#ff4444';
                } else {
                    const gradient = ctx.createRadialGradient(
                        x + TILE_SIZE/2, y + TILE_SIZE/2, 0,
                        x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE
                    );
                    gradient.addColorStop(0, snakeColors[0]);
                    gradient.addColorStop(0.5, snakeColors[1]);
                    gradient.addColorStop(1, snakeColors[2]);
                    ctx.fillStyle = gradient;
                }

                ctx.beginPath();
                ctx.roundRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 6);
                ctx.fill();

                // Glow effect for head
                if (!this.isEcho) {
                    ctx.shadowColor = snakeColors[0];
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                // Eyes
                ctx.fillStyle = this.isEcho ? '#ffffff44' : '#000';
                const eyeOffset = TILE_SIZE * 0.25;
                const eyeSize = 3;
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE/2 - eyeOffset * (this.direction.y === 0 ? 1 : 0) + this.direction.x * 3,
                        y + TILE_SIZE/2 - eyeOffset * (this.direction.x === 0 ? 1 : 0) + this.direction.y * 3,
                        eyeSize, 0, Math.PI * 2);
                ctx.arc(x + TILE_SIZE/2 + eyeOffset * (this.direction.y === 0 ? 1 : 0) + this.direction.x * 3,
                        y + TILE_SIZE/2 + eyeOffset * (this.direction.x === 0 ? 1 : 0) + this.direction.y * 3,
                        eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Body segments
                const colorIndex = Math.floor(i / 3) % snakeColors.length;
                if (this.isEcho) {
                    ctx.fillStyle = COLORS.echo;
                } else if (this.isAI) {
                    ctx.fillStyle = `rgba(255, 68, 68, ${0.8 - i * 0.02})`;
                } else {
                    ctx.fillStyle = snakeColors[colorIndex];
                }

                const size = TILE_SIZE - 4 - Math.min(i * 0.5, 6);
                const offset = (TILE_SIZE - size) / 2;
                ctx.beginPath();
                ctx.roundRect(x + offset, y + offset, size, size, 4);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1;

        // Phase mode indicator
        if (this.phaseMode) {
            ctx.strokeStyle = '#aa00ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
                this.head.x * TILE_SIZE - 2,
                this.head.y * TILE_SIZE - 2,
                TILE_SIZE + 4,
                TILE_SIZE + 4
            );
            ctx.setLineDash([]);
        }
    }

    // AI Methods
    updateAI(food, obstacles, portals, player, echoes) {
        if (!this.isAI) return;

        switch(this.aiDifficulty) {
            case 'learner':
                this.aiLearner(food);
                break;
            case 'strategist':
                this.aiStrategist(food, player);
                break;
            case 'master':
                this.aiMaster(food, player, obstacles);
                break;
        }
    }

    aiLearner(food) {
        // Simple: move toward nearest food
        if (food.length === 0) return;

        let nearest = food[0];
        let minDist = this.distance(this.head, food[0]);

        for (const f of food) {
            const dist = this.distance(this.head, f);
            if (dist < minDist) {
                minDist = dist;
                nearest = f;
            }
        }

        this.moveToward(nearest);
    }

    aiStrategist(food, player) {
        // Medium: try to block player and get food
        if (food.length === 0) return;

        // 30% chance to block player's path to food
        if (Math.random() < 0.3 && player) {
            let playerTarget = this.findNearestFood(player.head, food);
            if (playerTarget && this.distance(this.head, playerTarget) <
                this.distance(player.head, playerTarget)) {
                this.moveToward(playerTarget);
                return;
            }
        }

        this.aiLearner(food);
    }

    aiMaster(food, player, obstacles) {
        // Hard: A* pathfinding, prediction, strategic play
        if (food.length === 0) return;

        // Find best food considering distance and safety
        let bestFood = null;
        let bestScore = -Infinity;

        for (const f of food) {
            const dist = this.distance(this.head, f);
            const isSafe = !this.isPathDangerous(this.head, f, obstacles);
            const score = (100 - dist) + (isSafe ? 50 : 0);

            if (score > bestScore) {
                bestScore = score;
                bestFood = f;
            }
        }

        if (bestFood) {
            this.moveToward(bestFood);
        }
    }

    findNearestFood(pos, food) {
        let nearest = null;
        let minDist = Infinity;
        for (const f of food) {
            const dist = this.distance(pos, f);
            if (dist < minDist) {
                minDist = dist;
                nearest = f;
            }
        }
        return nearest;
    }

    distance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    isPathDangerous(from, to, obstacles) {
        // Simple check - could be improved with actual pathfinding
        for (const obs of obstacles) {
            if (obs.x === to.x && obs.y === to.y) return true;
        }
        return false;
    }

    moveToward(target) {
        const dx = target.x - this.head.x;
        const dy = target.y - this.head.y;

        // Prioritize the larger distance
        if (Math.abs(dx) > Math.abs(dy)) {
            this.setDirection(dx > 0 ? 1 : -1, 0);
        } else if (dy !== 0) {
            this.setDirection(0, dy > 0 ? 1 : -1);
        } else if (dx !== 0) {
            this.setDirection(dx > 0 ? 1 : -1, 0);
        }
    }
}

// ==================== FOOD CLASS ====================
class Food {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type; // 'normal', 'chrono'
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.colorPhase = Math.random() * Math.PI * 2;
    }

    draw(ctx, time) {
        const x = this.x * TILE_SIZE + TILE_SIZE / 2;
        const y = this.y * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.sin(time * 0.005 + this.pulsePhase) * 0.2 + 1;
        const size = (TILE_SIZE / 2 - 2) * pulse;

        if (this.type === 'chrono') {
            // Chrono fruit - pulsing blue
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, '#88ddff');
            gradient.addColorStop(0.5, COLORS.chronoFruit);
            gradient.addColorStop(1, '#004488');
            ctx.fillStyle = gradient;

            ctx.shadowColor = COLORS.chronoFruit;
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            // Inner glow rings
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowBlur = 0;
        } else {
            // Normal fruit - holographic color shift
            const colorShift = (time * 0.002 + this.colorPhase) % (Math.PI * 2);
            const r = Math.sin(colorShift) * 127 + 128;
            const g = Math.sin(colorShift + 2) * 127 + 128;
            const b = Math.sin(colorShift + 4) * 127 + 128;

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        }
    }
}

// ==================== POWER-UP CLASS ====================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    static getTypes() {
        return [
            'timeDilation', 'echoMagnet', 'quantumTunnel', 'rewind',
            'speed', 'multiplier', 'invincibility', 'foodFrenzy'
        ];
    }

    static getIcon(type) {
        const icons = {
            timeDilation: '⏱',
            echoMagnet: '🧲',
            quantumTunnel: '🌀',
            rewind: '⏪',
            speed: '⚡',
            multiplier: '✖',
            invincibility: '🛡',
            foodFrenzy: '🍎'
        };
        return icons[type] || '?';
    }

    static getDuration(type) {
        const durations = {
            timeDilation: 10000,
            echoMagnet: 8000,
            quantumTunnel: 0, // instant use
            rewind: 0, // instant use
            speed: 8000,
            multiplier: 15000,
            invincibility: 5000,
            foodFrenzy: 10000
        };
        return durations[type] || 5000;
    }

    draw(ctx, time) {
        const x = this.x * TILE_SIZE + TILE_SIZE / 2;
        const y = this.y * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.sin(time * 0.004 + this.pulsePhase) * 0.15 + 1;
        const size = TILE_SIZE / 2 * pulse;

        const color = COLORS.powerup[this.type] || '#ffffff';

        // Outer glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;

        // Background circle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, size + 2, 0, Math.PI * 2);
        ctx.fill();

        // Colored border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();

        // Icon
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(PowerUp.getIcon(this.type), x, y + 1);
    }
}

// ==================== PORTAL CLASS ====================
class Portal {
    constructor(x1, y1, x2, y2) {
        this.entry = { x: x1, y: y1 };
        this.exit = { x: x2, y: y2 };
        this.uses = 5;
        this.cooldown = 0;
        this.phase = Math.random() * Math.PI * 2;
    }

    draw(ctx, time) {
        [this.entry, this.exit].forEach((pos, i) => {
            const x = pos.x * TILE_SIZE + TILE_SIZE / 2;
            const y = pos.y * TILE_SIZE + TILE_SIZE / 2;
            const rotation = time * 0.003 + this.phase;

            // Outer spinning ring
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * (i === 0 ? 1 : -1));

            ctx.strokeStyle = COLORS.portal;
            ctx.lineWidth = 3;
            ctx.shadowColor = COLORS.portal;
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.arc(0, 0, TILE_SIZE / 2, 0, Math.PI * 1.5);
            ctx.stroke();

            // Inner swirl
            ctx.strokeStyle = '#cc66ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, TILE_SIZE / 3, Math.PI * 0.5, Math.PI * 2);
            ctx.stroke();

            ctx.restore();

            // Center dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        });

        // Draw connection line (faint)
        ctx.strokeStyle = 'rgba(153, 51, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.moveTo(this.entry.x * TILE_SIZE + TILE_SIZE/2, this.entry.y * TILE_SIZE + TILE_SIZE/2);
        ctx.lineTo(this.exit.x * TILE_SIZE + TILE_SIZE/2, this.exit.y * TILE_SIZE + TILE_SIZE/2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    teleport(snake) {
        if (this.cooldown > 0 || this.uses <= 0) return false;

        const head = snake.head;
        let destination = null;

        if (head.x === this.entry.x && head.y === this.entry.y) {
            destination = this.exit;
        } else if (head.x === this.exit.x && head.y === this.exit.y) {
            destination = this.entry;
        }

        if (destination) {
            snake.segments[0] = { x: destination.x, y: destination.y };
            snake.targetX = destination.x * TILE_SIZE + TILE_SIZE / 2;
            snake.targetY = destination.y * TILE_SIZE + TILE_SIZE / 2;
            this.cooldown = 500;
            this.uses--;
            return true;
        }

        return false;
    }

    update(dt) {
        if (this.cooldown > 0) {
            this.cooldown -= dt * 1000;
        }
    }

    isDepleted() {
        return this.uses <= 0;
    }
}

// ==================== OBSTACLE CLASSES ====================
class LaserGrid {
    constructor(x, y, direction, length) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 'horizontal' or 'vertical'
        this.length = length;
        this.active = true;
        this.timer = 0;
        this.onTime = 1000;
        this.offTime = 1000;
    }

    update(dt) {
        this.timer += dt * 1000;
        if (this.active && this.timer >= this.onTime) {
            this.active = false;
            this.timer = 0;
        } else if (!this.active && this.timer >= this.offTime) {
            this.active = true;
            this.timer = 0;
        }
    }

    draw(ctx, time) {
        if (!this.active) {
            // Draw faint indicator when off
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = COLORS.laser;
            ctx.lineWidth = 3;
            ctx.shadowColor = COLORS.laser;
            ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        const startX = this.x * TILE_SIZE + TILE_SIZE / 2;
        const startY = this.y * TILE_SIZE + TILE_SIZE / 2;
        ctx.moveTo(startX, startY);

        if (this.direction === 'horizontal') {
            ctx.lineTo(startX + this.length * TILE_SIZE, startY);
        } else {
            ctx.lineTo(startX, startY + this.length * TILE_SIZE);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    checkCollision(snake) {
        if (!this.active) return false;

        const head = snake.head;
        if (this.direction === 'horizontal') {
            if (head.y === this.y && head.x >= this.x && head.x < this.x + this.length) {
                return true;
            }
        } else {
            if (head.x === this.x && head.y >= this.y && head.y < this.y + this.length) {
                return true;
            }
        }
        return false;
    }
}

class MovingBlock {
    constructor(x, y, path) {
        this.x = x;
        this.y = y;
        this.path = path; // Array of {x, y} waypoints
        this.pathIndex = 0;
        this.moveTimer = 0;
        this.moveInterval = 500;
    }

    update(dt) {
        this.moveTimer += dt * 1000;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.pathIndex = (this.pathIndex + 1) % this.path.length;
            this.x = this.path[this.pathIndex].x;
            this.y = this.path[this.pathIndex].y;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#444466';
        ctx.strokeStyle = '#666688';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(
            this.x * TILE_SIZE + 2,
            this.y * TILE_SIZE + 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4,
            4
        );
        ctx.fill();
        ctx.stroke();
    }

    checkCollision(snake) {
        return snake.head.x === this.x && snake.head.y === this.y;
    }
}

// ==================== TIMELINE RECORDING ====================
class TimelineRecorder {
    constructor() {
        this.recording = [];
        this.startTime = 0;
        this.isRecording = false;
    }

    startRecording() {
        this.recording = [];
        this.startTime = Date.now();
        this.isRecording = true;
    }

    recordFrame(snake) {
        if (!this.isRecording) return;

        this.recording.push({
            time: Date.now() - this.startTime,
            segments: JSON.parse(JSON.stringify(snake.segments)),
            direction: { ...snake.direction }
        });
    }

    stopRecording() {
        this.isRecording = false;
        return this.recording;
    }

    getProgress() {
        if (!this.isRecording) return 0;
        return Math.min((Date.now() - this.startTime) / ECHO_RECORD_TIME, 1);
    }
}

// ==================== ECHO PLAYBACK ====================
class EchoPlayback {
    constructor(recording) {
        this.recording = recording;
        this.startTime = Date.now();
        this.currentIndex = 0;
        this.snake = null;
        this.finished = false;

        if (recording.length > 0) {
            const first = recording[0];
            this.snake = new Snake(first.segments[0].x, first.segments[0].y, true);
            this.snake.segments = JSON.parse(JSON.stringify(first.segments));
        }
    }

    update() {
        if (this.finished || !this.snake) return;

        const elapsed = Date.now() - this.startTime;

        while (this.currentIndex < this.recording.length - 1 &&
               this.recording[this.currentIndex + 1].time <= elapsed) {
            this.currentIndex++;
        }

        if (this.currentIndex >= this.recording.length - 1) {
            this.finished = true;
            return;
        }

        const frame = this.recording[this.currentIndex];
        this.snake.segments = JSON.parse(JSON.stringify(frame.segments));
        this.snake.direction = { ...frame.direction };
    }

    draw(ctx, time) {
        if (this.snake && !this.finished) {
            this.snake.draw(ctx, time);
        }
    }

    checkCollision(playerSnake) {
        if (this.finished || !this.snake) return false;

        const head = playerSnake.head;
        for (const seg of this.snake.segments) {
            if (head.x === seg.x && head.y === seg.y) {
                return true;
            }
        }
        return false;
    }

    restart() {
        this.startTime = Date.now();
        this.currentIndex = 0;
        this.finished = false;
    }
}

// ==================== MAIN GAME CLASS ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.audio = new AudioSystem();
        this.particles = new ParticleSystem();
        this.starField = new StarField();

        this.state = 'menu'; // menu, playing, paused, gameOver, editor
        this.gameMode = 'classic';
        this.playerMode = '1'; // '1', '2', or 'ai'
        this.aiDifficulty = 'learner';

        // Theme and skin
        this.currentTheme = 'neon';
        this.currentSkin = 'cyber';

        this.snake = null;
        this.snake2 = null; // Player 2
        this.aiSnake = null;
        this.food = [];
        this.powerups = [];
        this.portals = [];
        this.lasers = [];
        this.blocks = [];
        this.echoes = [];
        this.walls = []; // Custom walls from level editor

        this.recorder = new TimelineRecorder();
        this.recorder2 = null; // Player 2 recorder
        this.savedTimelines = [];
        this.savedTimelines2 = [];

        this.score = 0;
        this.score2 = 0; // Player 2 score
        this.multiplier = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.foodCollected = 0;
        this.echoesCreated = 0;
        this.paradoxesTriggered = 0;
        this.maxCombo = 0;

        this.gameSpeed = 1;
        this.gridWidth = GRID_WIDTH;
        this.gridHeight = GRID_HEIGHT;

        this.paradoxMode = false;
        this.paradoxTimer = 0;

        this.activePowerups = [];
        this.timeDilation = false;
        this.foodFrenzyActive = false;
        this.quantumTunnelAvailable = false;

        this.lastTime = 0;
        this.timeTrialTime = 60000;
        this.timeTrialTimer = 0;

        this.screenShake = 0;
        this.chromaticAberration = 0;

        // Level editor
        this.editorTool = 'wall';
        this.customLevel = null;
        this.savedLevels = this.loadSavedLevels();
        this.portalPair = null; // For placing portal pairs

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupUI();
        this.handleResize();
        this.gameLoop(0);
    }

    handleResize() {
        TILE_SIZE = calculateTileSize();
        CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;
        CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.starField.regenerate();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('resize', () => this.handleResize());
    }

    setupUI() {
        // Mode buttons
        document.querySelectorAll('.mode-button[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-button[data-mode]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.gameMode = btn.dataset.mode;
            });
        });

        // Player mode buttons
        document.querySelectorAll('.difficulty-button[data-players]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-button[data-players]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.playerMode = btn.dataset.players;
                // Show/hide P2 controls
                const p2Controls = document.getElementById('p2Controls');
                if (p2Controls) {
                    p2Controls.classList.toggle('active', this.playerMode === '2');
                }
            });
        });

        // Theme buttons
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTheme = btn.dataset.theme;
                this.applyTheme();
            });
        });

        // Skin buttons
        document.querySelectorAll('.skin-button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.skin-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSkin = btn.dataset.skin;
                this.applySkin();
            });
        });

        document.getElementById('startButton').addEventListener('click', () => {
            this.audio.init();
            this.startGame();
        });

        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('mainMenuButton').addEventListener('click', () => {
            this.showMenu();
        });

        document.getElementById('resumeButton').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('pauseMenuButton').addEventListener('click', () => {
            this.showMenu();
        });

        // Help modal
        document.getElementById('helpButton').addEventListener('click', () => {
            document.getElementById('helpModal').classList.remove('hidden');
        });

        document.getElementById('helpCloseButton').addEventListener('click', () => {
            document.getElementById('helpModal').classList.add('hidden');
        });

        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                document.getElementById('helpModal').classList.add('hidden');
            }
        });

        // Level Editor
        this.setupLevelEditor();
    }

    applyTheme() {
        const theme = THEMES[this.currentTheme];
        if (theme) {
            COLORS.background = theme.background;
            COLORS.grid = theme.grid;
            COLORS.echo = theme.echo;
            COLORS.food = theme.food;
            COLORS.chronoFruit = theme.chronoFruit;
            COLORS.portal = theme.portal;
            COLORS.laser = theme.laser;
        }
    }

    applySkin() {
        const skin = SKINS[this.currentSkin];
        if (skin) {
            COLORS.snake = skin.colors;
            COLORS.snake2 = skin.colors2;
        }
    }

    loadSavedLevels() {
        try {
            const saved = localStorage.getItem('chronoserpent_levels');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveLevelsToStorage() {
        try {
            localStorage.setItem('chronoserpent_levels', JSON.stringify(this.savedLevels));
        } catch (e) {
            console.log('Could not save levels');
        }
    }

    setupLevelEditor() {
        const editorBtn = document.getElementById('editorButton');
        const editorModal = document.getElementById('editorModal');
        const editorCanvas = document.getElementById('editorCanvas');
        const closeBtn = document.getElementById('editorCloseButton');

        if (!editorBtn || !editorModal || !editorCanvas) return;

        // Set up editor canvas
        editorCanvas.width = GRID_WIDTH * 20;
        editorCanvas.height = GRID_HEIGHT * 20;
        this.editorCtx = editorCanvas.getContext('2d');
        this.editorLevel = this.createEmptyLevel();

        editorBtn.addEventListener('click', () => {
            editorModal.classList.remove('hidden');
            this.drawEditorGrid();
            this.updateSavedLevelsList();
        });

        closeBtn.addEventListener('click', () => {
            editorModal.classList.add('hidden');
        });

        editorModal.addEventListener('click', (e) => {
            if (e.target.id === 'editorModal') {
                editorModal.classList.add('hidden');
            }
        });

        // Tool buttons
        document.querySelectorAll('.tool-button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.editorTool = btn.dataset.tool;
            });
        });

        // Canvas click for placing/removing
        editorCanvas.addEventListener('click', (e) => this.handleEditorClick(e));
        editorCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleEditorClick(e, true);
        });

        // Action buttons
        document.getElementById('clearLevel')?.addEventListener('click', () => {
            this.editorLevel = this.createEmptyLevel();
            this.drawEditorGrid();
        });

        document.getElementById('saveLevel')?.addEventListener('click', () => {
            this.saveCurrentLevel();
        });

        document.getElementById('loadLevel')?.addEventListener('click', () => {
            const code = document.getElementById('levelCode')?.value;
            if (code) this.importLevelFromCode(code);
        });

        document.getElementById('playLevel')?.addEventListener('click', () => {
            this.customLevel = { ...this.editorLevel };
            editorModal.classList.add('hidden');
            this.audio.init();
            this.startGame();
        });

        document.getElementById('copyCode')?.addEventListener('click', () => {
            const input = document.getElementById('levelCode');
            if (input) {
                input.select();
                navigator.clipboard.writeText(input.value);
            }
        });

        document.getElementById('importCode')?.addEventListener('click', () => {
            const code = prompt('Paste level code:');
            if (code) {
                this.importLevelFromCode(code);
            }
        });
    }

    createEmptyLevel() {
        return {
            walls: [],
            lasers: [],
            portals: [],
            spawn1: { x: 4, y: Math.floor(GRID_HEIGHT / 2) },
            spawn2: { x: GRID_WIDTH - 5, y: Math.floor(GRID_HEIGHT / 2) }
        };
    }

    handleEditorClick(e, isErase = false) {
        const canvas = document.getElementById('editorCanvas');
        const rect = canvas.getBoundingClientRect();
        const tileSize = 20;
        const x = Math.floor((e.clientX - rect.left) / tileSize);
        const y = Math.floor((e.clientY - rect.top) / tileSize);

        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;

        const tool = isErase ? 'erase' : this.editorTool;

        switch (tool) {
            case 'wall':
                if (!this.editorLevel.walls.find(w => w.x === x && w.y === y)) {
                    this.editorLevel.walls.push({ x, y });
                }
                break;
            case 'laser':
                if (!this.editorLevel.lasers.find(l => l.x === x && l.y === y)) {
                    this.editorLevel.lasers.push({ x, y, direction: 'horizontal', length: 3 });
                }
                break;
            case 'portal':
                if (!this.portalPair) {
                    this.portalPair = { x, y };
                } else {
                    this.editorLevel.portals.push({
                        x1: this.portalPair.x, y1: this.portalPair.y,
                        x2: x, y2: y
                    });
                    this.portalPair = null;
                }
                break;
            case 'spawn':
                if (e.shiftKey) {
                    this.editorLevel.spawn2 = { x, y };
                } else {
                    this.editorLevel.spawn1 = { x, y };
                }
                break;
            case 'erase':
                this.editorLevel.walls = this.editorLevel.walls.filter(w => w.x !== x || w.y !== y);
                this.editorLevel.lasers = this.editorLevel.lasers.filter(l => l.x !== x || l.y !== y);
                this.editorLevel.portals = this.editorLevel.portals.filter(p =>
                    !((p.x1 === x && p.y1 === y) || (p.x2 === x && p.y2 === y))
                );
                break;
        }

        this.drawEditorGrid();
    }

    drawEditorGrid() {
        const ctx = this.editorCtx;
        const tileSize = 20;

        // Background
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, GRID_WIDTH * tileSize, GRID_HEIGHT * tileSize);

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        for (let x = 0; x <= GRID_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * tileSize, 0);
            ctx.lineTo(x * tileSize, GRID_HEIGHT * tileSize);
            ctx.stroke();
        }
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * tileSize);
            ctx.lineTo(GRID_WIDTH * tileSize, y * tileSize);
            ctx.stroke();
        }

        // Draw walls
        ctx.fillStyle = '#666688';
        this.editorLevel.walls.forEach(w => {
            ctx.fillRect(w.x * tileSize + 1, w.y * tileSize + 1, tileSize - 2, tileSize - 2);
        });

        // Draw lasers
        ctx.fillStyle = COLORS.laser;
        this.editorLevel.lasers.forEach(l => {
            ctx.fillRect(l.x * tileSize + 2, l.y * tileSize + 8, tileSize * l.length - 4, 4);
        });

        // Draw portals
        ctx.fillStyle = COLORS.portal;
        this.editorLevel.portals.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x1 * tileSize + tileSize/2, p.y1 * tileSize + tileSize/2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x2 * tileSize + tileSize/2, p.y2 * tileSize + tileSize/2, 6, 0, Math.PI * 2);
            ctx.fill();
            // Connection line
            ctx.strokeStyle = 'rgba(153, 51, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(p.x1 * tileSize + tileSize/2, p.y1 * tileSize + tileSize/2);
            ctx.lineTo(p.x2 * tileSize + tileSize/2, p.y2 * tileSize + tileSize/2);
            ctx.stroke();
        });

        // Pending portal
        if (this.portalPair) {
            ctx.fillStyle = 'rgba(153, 51, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.portalPair.x * tileSize + tileSize/2, this.portalPair.y * tileSize + tileSize/2, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Spawn points
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.editorLevel.spawn1.x * tileSize + tileSize/2, this.editorLevel.spawn1.y * tileSize + tileSize/2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('1', this.editorLevel.spawn1.x * tileSize + tileSize/2, this.editorLevel.spawn1.y * tileSize + tileSize/2 + 3);

        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(this.editorLevel.spawn2.x * tileSize + tileSize/2, this.editorLevel.spawn2.y * tileSize + tileSize/2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillText('2', this.editorLevel.spawn2.x * tileSize + tileSize/2, this.editorLevel.spawn2.y * tileSize + tileSize/2 + 3);
    }

    saveCurrentLevel() {
        const name = prompt('Level name:', `Level ${this.savedLevels.length + 1}`);
        if (!name) return;

        const level = {
            name,
            data: { ...this.editorLevel },
            created: Date.now()
        };

        this.savedLevels.push(level);
        this.saveLevelsToStorage();
        this.updateSavedLevelsList();

        // Generate share code
        const code = btoa(JSON.stringify(this.editorLevel));
        const codeInput = document.getElementById('levelCode');
        if (codeInput) codeInput.value = code;
    }

    importLevelFromCode(code) {
        try {
            const data = JSON.parse(atob(code));
            this.editorLevel = data;
            this.drawEditorGrid();
        } catch (e) {
            alert('Invalid level code');
        }
    }

    updateSavedLevelsList() {
        const list = document.getElementById('savedLevelsList');
        if (!list) return;

        if (this.savedLevels.length === 0) {
            list.innerHTML = '<span class="no-levels">No saved levels yet</span>';
            return;
        }

        list.innerHTML = this.savedLevels.map((level, i) => `
            <button class="saved-level-btn" data-index="${i}">
                ${level.name}
                <span class="delete-level" data-index="${i}">&times;</span>
            </button>
        `).join('');

        // Add click handlers
        list.querySelectorAll('.saved-level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-level')) {
                    const idx = parseInt(e.target.dataset.index);
                    this.savedLevels.splice(idx, 1);
                    this.saveLevelsToStorage();
                    this.updateSavedLevelsList();
                } else {
                    const idx = parseInt(btn.dataset.index);
                    this.editorLevel = { ...this.savedLevels[idx].data };
                    this.drawEditorGrid();
                    const code = btoa(JSON.stringify(this.editorLevel));
                    const codeInput = document.getElementById('levelCode');
                    if (codeInput) codeInput.value = code;
                }
            });
        });
    }

    handleKeyDown(e) {
        if (this.state === 'menu') {
            if (e.code === 'Enter' || e.code === 'Space') {
                this.audio.init();
                this.startGame();
            }
            return;
        }

        if (this.state === 'gameOver') {
            if (e.code === 'Enter' || e.code === 'Space') {
                this.startGame();
            }
            return;
        }

        if (e.code === 'KeyP' || e.code === 'Escape') {
            this.togglePause();
            return;
        }

        if (this.state !== 'playing') return;

        // Player 1 controls (WASD)
        switch(e.code) {
            case 'KeyW':
                this.snake.setDirection(0, -1);
                break;
            case 'KeyS':
                this.snake.setDirection(0, 1);
                break;
            case 'KeyA':
                this.snake.setDirection(-1, 0);
                break;
            case 'KeyD':
                this.snake.setDirection(1, 0);
                break;
            case 'Space':
                this.saveTimeline(1);
                break;
            case 'ShiftLeft':
                this.activateChronoBoost(1);
                break;
            case 'KeyE':
                this.activatePhaseMode(1);
                break;
        }

        // Player 2 controls (Arrow keys) - only in 2-player mode
        if (this.snake2 && this.playerMode === '2') {
            switch(e.code) {
                case 'ArrowUp':
                    this.snake2.setDirection(0, -1);
                    break;
                case 'ArrowDown':
                    this.snake2.setDirection(0, 1);
                    break;
                case 'ArrowLeft':
                    this.snake2.setDirection(-1, 0);
                    break;
                case 'ArrowRight':
                    this.snake2.setDirection(1, 0);
                    break;
                case 'Enter':
                    this.saveTimeline(2);
                    break;
                case 'ShiftRight':
                    this.activateChronoBoost(2);
                    break;
                case 'Slash':
                    this.activatePhaseMode(2);
                    break;
            }
        }
    }

    startGame() {
        this.state = 'playing';
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');

        // Apply current theme and skin
        this.applyTheme();
        this.applySkin();

        // Determine spawn positions
        let spawn1 = { x: Math.floor(GRID_WIDTH / 4), y: Math.floor(GRID_HEIGHT / 2) };
        let spawn2 = { x: Math.floor(GRID_WIDTH * 3/4), y: Math.floor(GRID_HEIGHT / 2) };

        if (this.customLevel) {
            spawn1 = this.customLevel.spawn1;
            spawn2 = this.customLevel.spawn2;
        }

        // Reset game state
        this.snake = new Snake(spawn1.x, spawn1.y);
        this.snake.isPlayer2 = false;
        this.food = [];
        this.powerups = [];
        this.portals = [];
        this.lasers = [];
        this.blocks = [];
        this.walls = [];
        this.echoes = [];
        this.savedTimelines = [];
        this.savedTimelines2 = [];
        this.activePowerups = [];

        this.score = 0;
        this.score2 = 0;
        this.multiplier = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.foodCollected = 0;
        this.echoesCreated = 0;
        this.paradoxesTriggered = 0;
        this.maxCombo = 0;

        this.gameSpeed = 1;
        this.gridWidth = GRID_WIDTH;
        this.gridHeight = GRID_HEIGHT;

        this.paradoxMode = false;
        this.paradoxTimer = 0;
        this.timeDilation = false;
        this.foodFrenzyActive = false;
        this.quantumTunnelAvailable = false;

        this.timeTrialTimer = this.timeTrialTime;

        this.recorder = new TimelineRecorder();
        this.recorder.startRecording();

        // Setup Player 2 in 2-player mode
        this.snake2 = null;
        if (this.playerMode === '2') {
            this.snake2 = new Snake(spawn2.x, spawn2.y);
            this.snake2.isPlayer2 = true;
            this.snake2.setDirection(-1, 0);
            this.recorder2 = new TimelineRecorder();
            this.recorder2.startRecording();
        }

        // Setup AI in AI mode
        this.aiSnake = null;
        if (this.playerMode === 'ai') {
            this.aiSnake = new Snake(spawn2.x, spawn2.y, false, true);
            this.aiSnake.aiDifficulty = this.aiDifficulty;
            this.aiSnake.setDirection(-1, 0);

            switch(this.aiDifficulty) {
                case 'learner':
                    this.aiSnake.moveInterval = 200;
                    break;
                case 'strategist':
                    this.aiSnake.moveInterval = 130;
                    break;
                case 'master':
                    this.aiSnake.moveInterval = 100;
                    break;
            }
        }

        // Load custom level elements
        if (this.customLevel) {
            this.walls = [...this.customLevel.walls];
            this.customLevel.lasers.forEach(l => {
                this.lasers.push(new LaserGrid(l.x, l.y, l.direction || 'horizontal', l.length || 3));
            });
            this.customLevel.portals.forEach(p => {
                this.portals.push(new Portal(p.x1, p.y1, p.x2, p.y2));
            });
        }

        // Spawn initial food
        this.spawnFood();
        this.spawnFood();
        if (this.gameMode === 'temporal') {
            this.spawnChronoFruit();
        }

        this.updateHUD();

        // Start ambient music
        this.audio.startMusic();
    }

    showMenu() {
        this.state = 'menu';
        this.audio.stopMusic();
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pauseOverlay').classList.remove('hidden');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pauseOverlay').classList.add('hidden');
        }
    }

    gameOver() {
        this.state = 'gameOver';
        this.audio.stopMusic();
        this.audio.play('death');

        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('statFood').textContent = this.foodCollected;
        document.getElementById('statEchoes').textContent = this.echoesCreated;
        document.getElementById('statParadoxes').textContent = this.paradoxesTriggered;
        document.getElementById('statMaxCombo').textContent = this.maxCombo;

        // Save high score
        const highScore = localStorage.getItem('revolutionarySnakeHighScore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('revolutionarySnakeHighScore', this.score);
        }
    }

    // Timeline mechanics
    saveTimeline(player = 1) {
        const timelines = player === 1 ? this.savedTimelines : this.savedTimelines2;
        const recorder = player === 1 ? this.recorder : this.recorder2;

        if (!recorder) return;

        if (timelines.length >= MAX_ECHOES) {
            this.showAlert('MAX ECHOES!', '#ff6666');
            return;
        }

        const recording = recorder.stopRecording();
        if (recording.length > 30) {
            const echo = new EchoPlayback(recording);
            this.echoes.push(echo);
            timelines.push(recording);
            this.echoesCreated++;

            this.showAlert(`P${player} TIMELINE SAVED!`, player === 1 ? '#00ffff' : '#ff6666');
            this.audio.play('echo');
        }

        // Start new recording
        if (player === 1) {
            this.recorder = new TimelineRecorder();
            this.recorder.startRecording();
        } else {
            this.recorder2 = new TimelineRecorder();
            this.recorder2.startRecording();
        }

        this.updateTimelineSlots();
    }

    activateChronoBoost(player = 1) {
        const snake = player === 1 ? this.snake : this.snake2;
        const timelines = player === 1 ? this.savedTimelines : this.savedTimelines2;

        if (!snake) return;

        if (timelines.length > 0) {
            snake.speedBoost = 1.5;
            setTimeout(() => {
                if (snake) snake.speedBoost = 1;
            }, 2000);
            this.showAlert('CHRONO BOOST!', '#ffff00');
        }
    }

    activatePhaseMode(player = 1) {
        const snake = player === 1 ? this.snake : this.snake2;
        if (!snake) return;

        if (!snake.phaseMode) {
            snake.phaseMode = true;
            snake.phaseModeTimer = 2000;
            this.showAlert('PHASE MODE!', '#aa00ff');
        }
    }

    triggerParadox() {
        this.paradoxMode = true;
        this.paradoxTimer = PARADOX_DURATION;
        this.paradoxesTriggered++;
        this.multiplier = 5;
        this.chromaticAberration = 1;
        this.screenShake = 20;

        this.showAlert('PARADOX!', '#ff00ff');
        this.audio.play('paradox');
    }

    // Spawning methods
    spawnFood() {
        const pos = this.getEmptyPosition();
        if (pos) {
            this.food.push(new Food(pos.x, pos.y, 'normal'));
        }
    }

    spawnChronoFruit() {
        const pos = this.getEmptyPosition();
        if (pos) {
            this.food.push(new Food(pos.x, pos.y, 'chrono'));
        }
    }

    spawnPowerup() {
        const pos = this.getEmptyPosition();
        if (pos) {
            const types = PowerUp.getTypes();
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerups.push(new PowerUp(pos.x, pos.y, type));
        }
    }

    spawnPortal() {
        const pos1 = this.getEmptyPosition();
        const pos2 = this.getEmptyPosition();
        if (pos1 && pos2) {
            this.portals.push(new Portal(pos1.x, pos1.y, pos2.x, pos2.y));
        }
    }

    spawnLaser() {
        const x = Math.floor(Math.random() * (this.gridWidth - 10)) + 5;
        const y = Math.floor(Math.random() * (this.gridHeight - 10)) + 5;
        const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const length = Math.floor(Math.random() * 5) + 3;
        this.lasers.push(new LaserGrid(x, y, direction, length));
    }

    spawnMovingBlock() {
        const x = Math.floor(Math.random() * (this.gridWidth - 4)) + 2;
        const y = Math.floor(Math.random() * (this.gridHeight - 4)) + 2;
        const path = [
            { x, y },
            { x: x + 3, y },
            { x: x + 3, y: y + 3 },
            { x, y: y + 3 }
        ];
        this.blocks.push(new MovingBlock(x, y, path));
    }

    getEmptyPosition() {
        const occupied = new Set();

        // Add snake positions
        if (this.snake) {
            this.snake.segments.forEach(s => occupied.add(`${s.x},${s.y}`));
        }
        if (this.snake2) {
            this.snake2.segments.forEach(s => occupied.add(`${s.x},${s.y}`));
        }
        if (this.aiSnake) {
            this.aiSnake.segments.forEach(s => occupied.add(`${s.x},${s.y}`));
        }

        // Add wall positions from custom levels
        if (this.walls) {
            this.walls.forEach(w => occupied.add(`${w.x},${w.y}`));
        }

        // Add food positions
        this.food.forEach(f => occupied.add(`${f.x},${f.y}`));

        // Add powerup positions
        this.powerups.forEach(p => occupied.add(`${p.x},${p.y}`));

        // Find empty position
        let attempts = 100;
        while (attempts > 0) {
            const x = Math.floor(Math.random() * this.gridWidth);
            const y = Math.floor(Math.random() * this.gridHeight);
            if (!occupied.has(`${x},${y}`)) {
                return { x, y };
            }
            attempts--;
        }
        return null;
    }

    // Power-up effects
    applyPowerup(type) {
        this.audio.play('powerup');
        const duration = PowerUp.getDuration(type);

        switch(type) {
            case 'timeDilation':
                this.timeDilation = true;
                this.addActivePowerup(type, duration);
                this.showAlert('TIME DILATION!', COLORS.powerup[type]);
                break;

            case 'echoMagnet':
                // Echoes move toward food (simplified: restart them)
                this.echoes.forEach(e => e.restart());
                this.addActivePowerup(type, duration);
                this.showAlert('ECHO MAGNET!', COLORS.powerup[type]);
                break;

            case 'quantumTunnel':
                this.quantumTunnelAvailable = true;
                this.snake.invincible = true;
                setTimeout(() => {
                    this.quantumTunnelAvailable = false;
                    this.snake.invincible = false;
                }, 3000);
                this.showAlert('QUANTUM TUNNEL!', COLORS.powerup[type]);
                break;

            case 'rewind':
                // Rewind snake by removing segments
                if (this.snake.segments.length > 4) {
                    this.snake.segments = this.snake.segments.slice(0, -3);
                }
                this.showAlert('TIMELINE REWIND!', COLORS.powerup[type]);
                break;

            case 'speed':
                this.snake.speedBoost = 1.5;
                this.addActivePowerup(type, duration);
                this.showAlert('SPEED BOOST!', COLORS.powerup[type]);
                break;

            case 'multiplier':
                this.multiplier = Math.min(this.multiplier * 2, 10);
                this.addActivePowerup(type, duration);
                this.showAlert('SCORE x2!', COLORS.powerup[type]);
                break;

            case 'invincibility':
                this.snake.invincible = true;
                this.addActivePowerup(type, duration);
                this.showAlert('INVINCIBLE!', COLORS.powerup[type]);
                break;

            case 'foodFrenzy':
                this.foodFrenzyActive = true;
                for (let i = 0; i < 5; i++) {
                    this.spawnFood();
                }
                this.addActivePowerup(type, duration);
                this.showAlert('FOOD FRENZY!', COLORS.powerup[type]);
                break;
        }
    }

    addActivePowerup(type, duration) {
        this.activePowerups.push({
            type,
            endTime: Date.now() + duration,
            duration
        });
        this.updatePowerupIndicator();
    }

    updateActivePowerups() {
        const now = Date.now();
        this.activePowerups = this.activePowerups.filter(p => {
            if (now >= p.endTime) {
                this.deactivatePowerup(p.type);
                return false;
            }
            return true;
        });
        this.updatePowerupIndicator();
    }

    deactivatePowerup(type) {
        switch(type) {
            case 'timeDilation':
                this.timeDilation = false;
                break;
            case 'speed':
                this.snake.speedBoost = 1;
                break;
            case 'multiplier':
                if (!this.paradoxMode) this.multiplier = 1;
                break;
            case 'invincibility':
                this.snake.invincible = false;
                break;
            case 'foodFrenzy':
                this.foodFrenzyActive = false;
                break;
        }
    }

    updatePowerupIndicator() {
        const container = document.getElementById('powerupIndicator');
        container.innerHTML = '';

        this.activePowerups.forEach(p => {
            const remaining = Math.max(0, p.endTime - Date.now());
            const div = document.createElement('div');
            div.className = 'powerup-icon';
            div.style.borderColor = COLORS.powerup[p.type];
            div.style.color = COLORS.powerup[p.type];
            div.innerHTML = `${PowerUp.getIcon(p.type)}<span class="powerup-timer">${Math.ceil(remaining/1000)}s</span>`;
            container.appendChild(div);
        });
    }

    // Progressive difficulty
    updateDifficulty() {
        // Speed increase every 100 points
        const speedLevel = Math.floor(this.score / 100);
        this.gameSpeed = 1 + speedLevel * 0.05;

        // Spawn new obstacles every 200 points
        if (this.score > 0 && this.score % 200 === 0) {
            if (this.gameMode !== 'classic' || Math.random() < 0.3) {
                this.spawnLaser();
            }
        }
    }

    // UI Updates
    showAlert(text, color) {
        const alert = document.getElementById('centerAlert');
        alert.textContent = text;
        alert.style.color = color;
        alert.style.opacity = 1;

        setTimeout(() => {
            alert.style.opacity = 0;
        }, 1500);
    }

    updateHUD() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('multiplierDisplay').textContent = `x${this.multiplier}`;
        document.getElementById('timelineDisplay').textContent = `${this.savedTimelines.length}/${MAX_ECHOES}`;
    }

    updateTimelineSlots() {
        const slots = document.querySelectorAll('.timeline-fill');
        slots.forEach((slot, i) => {
            if (i < this.savedTimelines.length) {
                slot.style.width = '100%';
            } else if (i === this.savedTimelines.length && this.recorder.isRecording) {
                slot.style.width = `${this.recorder.getProgress() * 100}%`;
            } else {
                slot.style.width = '0%';
            }
        });
    }

    // Main update loop
    update(dt) {
        if (this.state !== 'playing') return;

        const time = Date.now();
        const effectiveSpeed = this.paradoxMode ? this.gameSpeed * 2 :
                              (this.timeDilation ? this.gameSpeed * 0.5 : this.gameSpeed);

        // Update player 1 snake
        this.snake.update(dt, effectiveSpeed);

        // Record timeline for player 1
        if (this.recorder && this.recorder.isRecording) {
            this.recorder.recordFrame(this.snake);
        }

        // Update player 2 snake
        if (this.snake2) {
            this.snake2.update(dt, effectiveSpeed);
            if (this.recorder2 && this.recorder2.isRecording) {
                this.recorder2.recordFrame(this.snake2);
            }
        }

        // Update AI snake
        if (this.aiSnake) {
            this.aiSnake.updateAI(this.food, [...this.lasers, ...this.blocks, ...this.walls], this.portals, this.snake, this.echoes);
            this.aiSnake.update(dt, effectiveSpeed);
        }

        // Update echoes
        this.echoes.forEach(e => e.update());

        // Update portals
        this.portals.forEach(p => p.update(dt));
        this.portals = this.portals.filter(p => !p.isDepleted());

        // Update obstacles
        this.lasers.forEach(l => l.update(dt));
        this.blocks.forEach(b => b.update(dt));

        // Update particles
        this.particles.update(dt);
        this.starField.update(dt);

        // Update paradox mode
        if (this.paradoxMode) {
            this.paradoxTimer -= dt * 1000;
            if (this.paradoxTimer <= 0) {
                this.paradoxMode = false;
                this.multiplier = 1;
                this.chromaticAberration = 0;
            }
        }

        // Update combo timer
        if (this.combo > 0) {
            this.comboTimer -= dt * 1000;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Update active powerups
        this.updateActivePowerups();

        // Update screen effects
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
        }
        if (this.chromaticAberration > 0 && !this.paradoxMode) {
            this.chromaticAberration *= 0.95;
        }

        // Check collisions
        this.checkCollisions();

        // Check player 2 collisions
        if (this.snake2) {
            this.checkPlayer2Collisions();
        }

        // Update timeline UI
        this.updateTimelineSlots();
    }

    checkPlayer2Collisions() {
        if (!this.snake2) return;
        const head = this.snake2.head;

        // Wall collision
        if (head.x < 0 || head.x >= this.gridWidth ||
            head.y < 0 || head.y >= this.gridHeight) {
            if (!this.snake2.invincible) {
                this.snake2Dead();
                return;
            }
        }

        // Self collision
        if (this.snake2.checkSelfCollision() && !this.snake2.invincible) {
            this.snake2Dead();
            return;
        }

        // Custom wall collision
        for (const wall of this.walls) {
            if (head.x === wall.x && head.y === wall.y && !this.snake2.invincible) {
                this.snake2Dead();
                return;
            }
        }

        // Collision with player 1
        for (const seg of this.snake.segments) {
            if (head.x === seg.x && head.y === seg.y && !this.snake2.invincible) {
                this.snake2Dead();
                return;
            }
        }

        // Food collision for player 2
        for (let i = this.food.length - 1; i >= 0; i--) {
            const f = this.food[i];
            if (head.x === f.x && head.y === f.y) {
                this.collectFood(f, i, 2);
            }
        }

        // Portal collision
        for (const portal of this.portals) {
            if (portal.teleport(this.snake2)) {
                this.audio.play('portal');
            }
        }

        // Laser collision
        for (const laser of this.lasers) {
            if (laser.checkCollision(this.snake2) && !this.snake2.invincible) {
                this.snake2Dead();
                return;
            }
        }
    }

    snake2Dead() {
        this.showAlert('P2 DOWN!', '#ff6666');
        this.audio.play('death');
        this.snake2 = null;
        this.recorder2 = null;
    }

    checkCollisions() {
        const head = this.snake.head;

        // Wall collision
        if (head.x < 0 || head.x >= this.gridWidth ||
            head.y < 0 || head.y >= this.gridHeight) {
            if (this.quantumTunnelAvailable) {
                // Wrap around
                if (head.x < 0) this.snake.segments[0].x = this.gridWidth - 1;
                if (head.x >= this.gridWidth) this.snake.segments[0].x = 0;
                if (head.y < 0) this.snake.segments[0].y = this.gridHeight - 1;
                if (head.y >= this.gridHeight) this.snake.segments[0].y = 0;
                this.quantumTunnelAvailable = false;
            } else if (!this.snake.invincible) {
                this.gameOver();
                return;
            }
        }

        // Self collision
        if (this.snake.checkSelfCollision() && !this.snake.invincible) {
            this.gameOver();
            return;
        }

        // Custom wall collision
        for (const wall of this.walls) {
            if (head.x === wall.x && head.y === wall.y && !this.snake.invincible) {
                this.gameOver();
                return;
            }
        }

        // Player 2 collision
        if (this.snake2) {
            for (const seg of this.snake2.segments) {
                if (head.x === seg.x && head.y === seg.y && !this.snake.invincible) {
                    this.gameOver();
                    return;
                }
            }
        }

        // Echo collision (paradox)
        for (const echo of this.echoes) {
            if (echo.checkCollision(this.snake) && !this.snake.phaseMode) {
                if (!this.paradoxMode) {
                    this.triggerParadox();
                }
            }
        }

        // Food collision
        for (let i = this.food.length - 1; i >= 0; i--) {
            const f = this.food[i];
            if (head.x === f.x && head.y === f.y) {
                this.collectFood(f, i);
            }
            // AI snake food collision
            if (this.aiSnake && this.aiSnake.head.x === f.x && this.aiSnake.head.y === f.y) {
                this.aiSnake.grow();
                this.food.splice(i, 1);
                this.spawnFood();
            }
        }

        // Power-up collision
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (head.x === p.x && head.y === p.y) {
                this.applyPowerup(p.type);
                this.powerups.splice(i, 1);
            }
        }

        // Portal collision
        for (const portal of this.portals) {
            if (portal.teleport(this.snake)) {
                this.audio.play('portal');
            }
        }

        // Laser collision
        for (const laser of this.lasers) {
            if (laser.checkCollision(this.snake) && !this.snake.invincible) {
                this.gameOver();
                return;
            }
        }

        // Moving block collision
        for (const block of this.blocks) {
            if (block.checkCollision(this.snake) && !this.snake.invincible) {
                this.gameOver();
                return;
            }
        }

        // AI collision with player
        if (this.aiSnake) {
            for (const seg of this.aiSnake.segments) {
                if (head.x === seg.x && head.y === seg.y && !this.snake.invincible) {
                    this.gameOver();
                    return;
                }
            }
            // AI self collision
            if (this.aiSnake.checkSelfCollision() || this.aiSnake.checkWallCollision(this.gridWidth, this.gridHeight)) {
                // AI dies, respawn after delay
                setTimeout(() => {
                    if (this.state === 'playing') {
                        this.aiSnake = new Snake(
                            Math.floor(Math.random() * (this.gridWidth - 10)) + 5,
                            Math.floor(Math.random() * (this.gridHeight - 10)) + 5,
                            false, true
                        );
                        this.aiSnake.aiDifficulty = this.aiDifficulty;
                    }
                }, 2000);
                this.aiSnake = null;
            }
        }
    }

    collectFood(food, index, player = 1) {
        const snake = player === 1 ? this.snake : this.snake2;
        if (!snake) return;

        snake.grow();
        this.food.splice(index, 1);
        this.foodCollected++;

        // Combo system
        this.combo++;
        this.comboTimer = 2000;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // Score calculation
        const basePoints = food.type === 'chrono' ? 50 : 10;
        const comboBonus = this.combo;
        const points = basePoints * this.multiplier * (1 + comboBonus * 0.1);
        if (player === 1) {
            this.score += Math.floor(points);
        } else {
            this.score2 += Math.floor(points);
        }

        // Effects
        this.particles.emit(
            food.x * TILE_SIZE + TILE_SIZE/2,
            food.y * TILE_SIZE + TILE_SIZE/2,
            food.type === 'chrono' ? COLORS.chronoFruit : '#ff6b6b',
            15
        );
        this.audio.play('eat', { combo: this.combo });

        // Update difficulty
        this.updateDifficulty();

        // Spawn new food
        this.spawnFood();

        // Chance to spawn chrono fruit or powerup
        if (Math.random() < 0.15) {
            this.spawnChronoFruit();
        }
        if (Math.random() < 0.08) {
            this.spawnPowerup();
        }
        if (Math.random() < 0.05 && this.portals.length < 3) {
            this.spawnPortal();
        }

        // Food frenzy extra spawns
        if (this.foodFrenzyActive && Math.random() < 0.5) {
            this.spawnFood();
        }

        // Paradox mode extra spawns
        if (this.paradoxMode) {
            this.spawnFood();
        }

        this.updateHUD();
    }

    // Render
    draw() {
        const ctx = this.ctx;
        const time = Date.now();

        // Apply screen shake
        ctx.save();
        if (this.screenShake > 0.5) {
            ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }

        // Clear and draw background
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw starfield
        this.starField.draw(ctx);

        // Draw grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        const gridPulse = Math.sin(time * 0.002) * 0.1 + 0.9;
        ctx.globalAlpha = 0.3 * gridPulse;

        for (let x = 0; x <= this.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE, 0);
            ctx.lineTo(x * TILE_SIZE, this.gridHeight * TILE_SIZE);
            ctx.stroke();
        }
        for (let y = 0; y <= this.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * TILE_SIZE);
            ctx.lineTo(this.gridWidth * TILE_SIZE, y * TILE_SIZE);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        if (this.state === 'playing' || this.state === 'paused') {
            // Draw custom walls
            ctx.fillStyle = '#444466';
            ctx.strokeStyle = '#666688';
            ctx.lineWidth = 2;
            this.walls.forEach(w => {
                ctx.beginPath();
                ctx.roundRect(
                    w.x * TILE_SIZE + 2,
                    w.y * TILE_SIZE + 2,
                    TILE_SIZE - 4,
                    TILE_SIZE - 4,
                    4
                );
                ctx.fill();
                ctx.stroke();
            });

            // Draw portals
            this.portals.forEach(p => p.draw(ctx, time));

            // Draw obstacles
            this.lasers.forEach(l => l.draw(ctx, time));
            this.blocks.forEach(b => b.draw(ctx));

            // Draw food
            this.food.forEach(f => f.draw(ctx, time));

            // Draw powerups
            this.powerups.forEach(p => p.draw(ctx, time));

            // Draw echoes
            this.echoes.forEach(e => e.draw(ctx, time));

            // Draw AI snake
            if (this.aiSnake) {
                this.aiSnake.draw(ctx, time);
            }

            // Draw player 2 snake
            if (this.snake2) {
                this.snake2.draw(ctx, time);
            }

            // Draw player 1 snake
            this.snake.draw(ctx, time);

            // Draw particles
            this.particles.draw(ctx);

            // Chromatic aberration effect
            if (this.chromaticAberration > 0.1) {
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = this.chromaticAberration * 0.3;

                // Red channel offset
                ctx.drawImage(this.canvas,
                    -this.chromaticAberration * 5, 0);

                // Blue channel offset
                ctx.drawImage(this.canvas,
                    this.chromaticAberration * 5, 0);

                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            }

            // Combo display
            if (this.combo > 1) {
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `COMBO x${this.combo}!`,
                    CANVAS_WIDTH / 2,
                    80
                );
            }
        }

        ctx.restore();
    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Start the game
const game = new Game();
