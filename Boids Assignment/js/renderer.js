// Renderer class - handles all drawing with multiple themes

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        // Rush Hour theme car colors
        this.carColors = [
            '#4a6fa5', // Blue
            '#6b7b8c', // Gray
            '#8b9a6b', // Olive
            '#a55a4a', // Rust
            '#7a6b8c'  // Purple-gray
        ];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        return { width: this.canvas.width, height: this.canvas.height };
    }

    clear() {
        const theme = THEMES[CONFIG.theme];
        this.ctx.fillStyle = theme.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid for F1 theme
        if (CONFIG.theme === 'f1') {
            this.drawGrid();
        }

        // Draw boundary for bounce mode
        if (CONFIG.boundaryMode === 'bounce') {
            this.drawBoundary();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawBoundary() {
        this.ctx.strokeStyle = CONFIG.theme === 'rush' ? '#666' : '#444';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);
    }

    // Draw mouse influence radius
    drawMouse(x, y) {
        if (x < 0 || y < 0) return;

        this.ctx.beginPath();
        this.ctx.arc(x, y, CONFIG.mouseRadius, 0, Math.PI * 2);

        if (CONFIG.theme === 'night') {
            this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
            this.ctx.fillStyle = 'rgba(255, 50, 50, 0.1)';
        } else if (CONFIG.theme === 'rush') {
            this.ctx.strokeStyle = 'rgba(200, 50, 50, 0.4)';
            this.ctx.fillStyle = 'rgba(200, 50, 50, 0.1)';
        } else {
            this.ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
            this.ctx.fillStyle = 'rgba(255, 50, 50, 0.15)';
        }

        this.ctx.lineWidth = 2;
        this.ctx.fill();
        this.ctx.stroke();
    }

    // Main render function
    render(flock) {
        this.clear();

        // Draw mouse influence area
        this.drawMouse(flock.mouseX, flock.mouseY);

        // Draw boids based on current theme
        switch (CONFIG.theme) {
            case 'night':
                this.renderNightCity(flock.boids);
                break;
            case 'rush':
                this.renderRushHour(flock.boids);
                break;
            case 'f1':
                this.renderF1(flock.boids);
                break;
        }
    }

    // Night City theme - long exposure photography style
    renderNightCity(boids) {
        for (const boid of boids) {
            // Draw trail (taillights)
            if (boid.trail.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(boid.trail[0].x, boid.trail[0].y);

                for (let i = 1; i < boid.trail.length; i++) {
                    this.ctx.lineTo(boid.trail[i].x, boid.trail[i].y);
                }

                const gradient = this.ctx.createLinearGradient(
                    boid.trail[0].x, boid.trail[0].y,
                    boid.x, boid.y
                );
                gradient.addColorStop(0, 'rgba(255, 50, 50, 0)');
                gradient.addColorStop(1, 'rgba(255, 80, 80, 0.8)');

                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
            }

            // Draw headlights (white glow in front)
            this.ctx.save();
            this.ctx.translate(boid.x, boid.y);
            this.ctx.rotate(boid.heading);

            // Headlight beam
            const beamGradient = this.ctx.createRadialGradient(8, 0, 0, 8, 0, 25);
            beamGradient.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
            beamGradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.3)');
            beamGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

            this.ctx.beginPath();
            this.ctx.arc(8, 0, 25, -0.5, 0.5);
            this.ctx.lineTo(8, 0);
            this.ctx.closePath();
            this.ctx.fillStyle = beamGradient;
            this.ctx.fill();

            // Main headlight
            this.ctx.beginPath();
            this.ctx.arc(6, -2, 2, 0, Math.PI * 2);
            this.ctx.arc(6, 2, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffee';
            this.ctx.fill();

            // Taillights
            this.ctx.beginPath();
            this.ctx.arc(-6, -2, 2, 0, Math.PI * 2);
            this.ctx.arc(-6, 2, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    // Rush Hour theme - GPS/map view style
    renderRushHour(boids) {
        for (const boid of boids) {
            this.ctx.save();
            this.ctx.translate(boid.x, boid.y);
            this.ctx.rotate(boid.heading);

            // Car body (rectangle)
            const width = 18 * boid.size;
            const height = 8 * boid.size;

            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(-width / 2 + 2, -height / 2 + 2, width, height);

            // Car body
            this.ctx.fillStyle = this.carColors[boid.colorIndex];
            this.ctx.fillRect(-width / 2, -height / 2, width, height);

            // Windshield
            this.ctx.fillStyle = 'rgba(200, 220, 240, 0.8)';
            this.ctx.fillRect(width / 6, -height / 3, width / 4, height / 1.5);

            // Outline
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(-width / 2, -height / 2, width, height);

            this.ctx.restore();
        }
    }

    // Formula 1 theme - telemetry/racing style
    renderF1(boids) {
        for (const boid of boids) {
            const speed = boid.getSpeed();
            const speedRatio = speed / CONFIG.maxSpeed;

            // Speed-based color (green -> yellow -> red)
            let r, g, b;
            if (speedRatio < 0.5) {
                // Green to yellow
                r = Math.floor(speedRatio * 2 * 255);
                g = 255;
                b = 0;
            } else {
                // Yellow to red
                r = 255;
                g = Math.floor((1 - (speedRatio - 0.5) * 2) * 255);
                b = 0;
            }
            const color = `rgb(${r}, ${g}, ${b})`;

            this.ctx.save();
            this.ctx.translate(boid.x, boid.y);
            this.ctx.rotate(boid.heading);

            // Draw velocity vector line
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-speed * 4, 0);
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Sleek wedge/arrow shape
            this.ctx.beginPath();
            this.ctx.moveTo(12, 0);        // Front point
            this.ctx.lineTo(-8, -5);       // Back left
            this.ctx.lineTo(-5, 0);        // Back indent
            this.ctx.lineTo(-8, 5);        // Back right
            this.ctx.closePath();

            // Glow effect
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 8;

            this.ctx.fillStyle = color;
            this.ctx.fill();

            // White cockpit
            this.ctx.shadowBlur = 0;
            this.ctx.beginPath();
            this.ctx.ellipse(2, 0, 3, 2, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();

            // Number/ID indicator
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '6px monospace';
            this.ctx.fillText(Math.floor(speedRatio * 100), -4, 2);

            this.ctx.restore();
        }
    }
}
