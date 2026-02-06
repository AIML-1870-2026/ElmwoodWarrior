// Renderer class - handles all drawing with multiple themes

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        // Car colors for Rush Hour theme
        this.carColors = [
            '#2c3e50', // Dark blue
            '#7f8c8d', // Gray
            '#c0392b', // Red
            '#f39c12', // Yellow/Gold
            '#27ae60', // Green
            '#8e44ad', // Purple
            '#e74c3c', // Bright red
            '#3498db'  // Blue
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

        // Draw boundary for bounce mode
        if (CONFIG.boundaryMode === 'bounce') {
            this.drawBoundary();
        }
    }

    drawBoundary() {
        const ctx = this.ctx;
        ctx.strokeStyle = CONFIG.theme === 'rush' ? '#aaa' : 'rgba(100, 100, 120, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);
    }

    // Draw mouse influence radius
    drawMouse(x, y) {
        if (x < 0 || y < 0) return;

        const ctx = this.ctx;
        const radius = CONFIG.mouseRadius;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = CONFIG.theme === 'rush' ? 'rgba(100, 100, 100, 0.3)' : 'rgba(255, 100, 100, 0.3)';
        ctx.fillStyle = CONFIG.theme === 'rush' ? 'rgba(100, 100, 100, 0.1)' : 'rgba(255, 50, 50, 0.1)';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
    }

    // Main render function
    render(flock) {
        this.clear();
        this.drawMouse(flock.mouseX, flock.mouseY);

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

    // Draw a proper car shape (top-down view)
    drawCar(ctx, width, height, bodyColor, windowColor, hasLights = false) {
        const w = width;
        const h = height;

        // Car body with rounded front
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, -h * 0.5);  // Back left
        ctx.lineTo(w * 0.3, -h * 0.5);   // To front left
        ctx.quadraticCurveTo(w * 0.5, -h * 0.4, w * 0.5, 0);  // Rounded front
        ctx.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.3, h * 0.5);  // Rounded front
        ctx.lineTo(-w * 0.4, h * 0.5);   // To back right
        ctx.lineTo(-w * 0.5, h * 0.4);   // Back corner
        ctx.lineTo(-w * 0.5, -h * 0.4);  // Back
        ctx.lineTo(-w * 0.4, -h * 0.5);  // Back corner
        ctx.closePath();
        ctx.fillStyle = bodyColor;
        ctx.fill();

        // Windshield (front window)
        ctx.fillStyle = windowColor;
        ctx.beginPath();
        ctx.moveTo(w * 0.15, -h * 0.35);
        ctx.lineTo(w * 0.35, -h * 0.25);
        ctx.quadraticCurveTo(w * 0.4, 0, w * 0.35, h * 0.25);
        ctx.lineTo(w * 0.15, h * 0.35);
        ctx.closePath();
        ctx.fill();

        // Rear window
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, -h * 0.3);
        ctx.lineTo(-w * 0.2, -h * 0.35);
        ctx.lineTo(-w * 0.2, h * 0.35);
        ctx.lineTo(-w * 0.35, h * 0.3);
        ctx.closePath();
        ctx.fill();

        // Side windows
        ctx.fillStyle = windowColor;
        ctx.fillRect(-w * 0.15, -h * 0.45, w * 0.25, h * 0.15);
        ctx.fillRect(-w * 0.15, h * 0.3, w * 0.25, h * 0.15);

        if (hasLights) {
            // Headlights
            ctx.fillStyle = '#ffffcc';
            ctx.beginPath();
            ctx.arc(w * 0.4, -h * 0.25, h * 0.12, 0, Math.PI * 2);
            ctx.arc(w * 0.4, h * 0.25, h * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Taillights
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(-w * 0.45, -h * 0.3, h * 0.1, 0, Math.PI * 2);
            ctx.arc(-w * 0.45, h * 0.3, h * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Night City theme - neon traffic at night
    renderNightCity(boids) {
        const ctx = this.ctx;
        const maxJump = 50; // Max pixels between consecutive points

        // Draw all trails first (batched for performance)
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        for (const boid of boids) {
            if (boid.trail.length < 2) continue;

            // Quick validation - check current position to last trail point
            const last = boid.trail[boid.trail.length - 1];
            const dx = Math.abs(boid.x - last.x);
            const dy = Math.abs(boid.y - last.y);
            if (dx >= maxJump || dy >= maxJump) continue;

            // Draw trail with simple fading segments (no gradients)
            const len = boid.trail.length;
            for (let i = 1; i < len; i++) {
                const prev = boid.trail[i - 1];
                const curr = boid.trail[i];
                const segDx = Math.abs(curr.x - prev.x);
                const segDy = Math.abs(curr.y - prev.y);
                if (segDx >= maxJump || segDy >= maxJump) continue;

                const alpha = (i / len) * 0.7;
                ctx.strokeStyle = `rgba(255, 70, 55, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(curr.x, curr.y);
                ctx.stroke();
            }
            // Final segment to current position
            ctx.strokeStyle = 'rgba(255, 80, 60, 0.8)';
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(boid.x, boid.y);
            ctx.stroke();
        }

        // Draw all cars (no shadow blur - use simple glow instead)
        for (const boid of boids) {
            ctx.save();
            ctx.translate(boid.x, boid.y);
            ctx.rotate(boid.heading);

            const carWidth = 22 * boid.size;
            const carHeight = 10 * boid.size;

            // Simple headlight glow (no expensive shadowBlur)
            ctx.fillStyle = 'rgba(255, 255, 180, 0.15)';
            ctx.beginPath();
            ctx.arc(carWidth * 0.4, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // Car body (dark silhouette)
            this.drawCar(ctx, carWidth, carHeight, '#1a1a2e', 'rgba(40, 40, 60, 0.8)', true);

            // Headlight beams (simple triangles, no gradient)
            ctx.fillStyle = 'rgba(255, 255, 200, 0.25)';
            ctx.beginPath();
            ctx.moveTo(carWidth * 0.4, -carHeight * 0.3);
            ctx.lineTo(carWidth * 0.4 + 35, -12);
            ctx.lineTo(carWidth * 0.4 + 35, 12);
            ctx.lineTo(carWidth * 0.4, carHeight * 0.3);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    // Rush Hour theme - clean GPS/map view
    renderRushHour(boids) {
        const ctx = this.ctx;

        for (const boid of boids) {
            ctx.save();
            ctx.translate(boid.x, boid.y);
            ctx.rotate(boid.heading);

            const carWidth = 20 * boid.size;
            const carHeight = 9 * boid.size;
            const color = this.carColors[boid.colorIndex % this.carColors.length];

            // Shadow
            ctx.save();
            ctx.translate(2, 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(0, 0, carWidth * 0.5, carHeight * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw the car
            this.drawCar(ctx, carWidth, carHeight, color, 'rgba(180, 210, 230, 0.9)', false);

            ctx.restore();
        }
    }

    // Formula 1 theme - racing telemetry style
    renderF1(boids) {
        const ctx = this.ctx;

        // Subtle grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        for (const boid of boids) {
            const speed = boid.getSpeed();
            const speedRatio = Math.min(speed / CONFIG.maxSpeed, 1);

            // Speed color gradient
            let r, g;
            if (speedRatio < 0.5) {
                r = Math.floor(speedRatio * 2 * 255);
                g = 255;
            } else {
                r = 255;
                g = Math.floor((1 - (speedRatio - 0.5) * 2) * 255);
            }
            const speedColor = `rgb(${r}, ${g}, 50)`;

            ctx.save();
            ctx.translate(boid.x, boid.y);
            ctx.rotate(boid.heading);

            // Speed trail
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(-8 - speed * 4, 0);
            ctx.strokeStyle = `rgba(${r}, ${g}, 50, 0.4)`;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();

            // F1 car shape (more detailed)
            ctx.shadowColor = speedColor;
            ctx.shadowBlur = 8;

            // Main body
            ctx.beginPath();
            ctx.moveTo(16, 0);           // Nose tip
            ctx.lineTo(10, -2);          // Nose side
            ctx.lineTo(12, -5);          // Front wing outer
            ctx.lineTo(8, -5);           // Front wing
            ctx.lineTo(6, -3);           // Front suspension
            ctx.lineTo(2, -3.5);         // Sidepod front
            ctx.lineTo(-6, -4);          // Sidepod back
            ctx.lineTo(-8, -3);          // Engine cover
            ctx.lineTo(-12, -6);         // Rear wing outer
            ctx.lineTo(-12, -3);         // Rear wing
            ctx.lineTo(-14, -2);         // Rear
            ctx.lineTo(-14, 2);          // Rear
            ctx.lineTo(-12, 3);          // Rear wing
            ctx.lineTo(-12, 6);          // Rear wing outer
            ctx.lineTo(-8, 3);           // Engine cover
            ctx.lineTo(-6, 4);           // Sidepod back
            ctx.lineTo(2, 3.5);          // Sidepod front
            ctx.lineTo(6, 3);            // Front suspension
            ctx.lineTo(8, 5);            // Front wing
            ctx.lineTo(12, 5);           // Front wing outer
            ctx.lineTo(10, 2);           // Nose side
            ctx.closePath();

            ctx.fillStyle = speedColor;
            ctx.fill();

            // Cockpit
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Helmet
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(1, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Wheels (4 of them)
            ctx.fillStyle = '#222';
            ctx.fillRect(4, -6, 4, 2);   // Front left
            ctx.fillRect(4, 4, 4, 2);    // Front right
            ctx.fillRect(-10, -7, 4, 2); // Rear left
            ctx.fillRect(-10, 5, 4, 2);  // Rear right

            ctx.restore();
        }
    }
}
