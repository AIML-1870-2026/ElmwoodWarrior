// Renderer class - handles all drawing with multiple themes

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        // Rush Hour theme car colors (more varied)
        this.carColors = [
            '#3d5a80', // Blue
            '#5c677d', // Slate
            '#7a8b6e', // Sage
            '#b8860b', // Dark gold
            '#8b4513', // Saddle brown
            '#cd5c5c', // Indian red
            '#4a4a4a', // Dark gray
            '#2f4f4f'  // Dark slate
        ];

        // F1 team colors for variety
        this.f1Colors = [
            { primary: '#ff0000', accent: '#fff' },   // Ferrari red
            { primary: '#00d2be', accent: '#000' },   // Mercedes teal
            { primary: '#0600ef', accent: '#fff' },   // Red Bull blue
            { primary: '#ff8700', accent: '#000' },   // McLaren orange
            { primary: '#006f62', accent: '#fff' },   // Aston Martin green
        ];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        return { width: this.canvas.width, height: this.canvas.height };
    }

    clear() {
        const theme = THEMES[CONFIG.theme];

        if (CONFIG.theme === 'night') {
            // Slight fade effect for trail persistence
            this.ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = theme.background;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw grid for F1 theme
        if (CONFIG.theme === 'f1') {
            this.drawGrid();
        }

        // Draw road markings for Rush Hour theme
        if (CONFIG.theme === 'rush') {
            this.drawRoadMarkings();
        }

        // Draw boundary for bounce mode
        if (CONFIG.boundaryMode === 'bounce') {
            this.drawBoundary();
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // Draw coordinate markers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = '10px monospace';
        for (let x = 100; x < this.canvas.width; x += 200) {
            ctx.fillText(x, x + 2, 12);
        }
    }

    drawRoadMarkings() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.setLineDash([20, 30]);
        ctx.lineWidth = 2;

        // Horizontal lanes
        for (let y = 100; y < this.canvas.height; y += 200) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // Vertical lanes
        for (let x = 100; x < this.canvas.width; x += 200) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    drawBoundary() {
        const ctx = this.ctx;
        if (CONFIG.theme === 'rush') {
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 4;
        } else if (CONFIG.theme === 'f1') {
            // Racing track boundary
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 5;
        } else {
            ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
            ctx.lineWidth = 3;
        }
        ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);

        // Corner markers for F1
        if (CONFIG.theme === 'f1') {
            ctx.fillStyle = '#ffcc00';
            const cornerSize = 20;
            ctx.fillRect(5, 5, cornerSize, cornerSize);
            ctx.fillRect(this.canvas.width - 25, 5, cornerSize, cornerSize);
            ctx.fillRect(5, this.canvas.height - 25, cornerSize, cornerSize);
            ctx.fillRect(this.canvas.width - 25, this.canvas.height - 25, cornerSize, cornerSize);
        }
    }

    // Draw mouse influence radius
    drawMouse(x, y) {
        if (x < 0 || y < 0) return;

        const ctx = this.ctx;

        // Animated pulse effect
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.9;
        const radius = CONFIG.mouseRadius * pulse;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (CONFIG.theme === 'night') {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(255, 80, 80, 0.3)');
            gradient.addColorStop(0.7, 'rgba(255, 50, 50, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
            ctx.fillStyle = gradient;
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
        } else if (CONFIG.theme === 'rush') {
            ctx.strokeStyle = 'rgba(200, 50, 50, 0.5)';
            ctx.fillStyle = 'rgba(200, 50, 50, 0.1)';
        } else {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(255, 50, 50, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
            ctx.fillStyle = gradient;
            ctx.strokeStyle = 'rgba(255, 100, 50, 0.6)';
        }

        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Center crosshair
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.strokeStyle = CONFIG.theme === 'rush' ? 'rgba(150, 50, 50, 0.5)' : 'rgba(255, 100, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
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
        const ctx = this.ctx;

        for (const boid of boids) {
            // Draw trail (taillights) with glow
            if (boid.trail.length > 2) {
                // Outer glow trail
                ctx.beginPath();
                ctx.moveTo(boid.trail[0].x, boid.trail[0].y);
                for (let i = 1; i < boid.trail.length; i++) {
                    ctx.lineTo(boid.trail[i].x, boid.trail[i].y);
                }
                ctx.lineTo(boid.x, boid.y);
                ctx.strokeStyle = 'rgba(255, 30, 30, 0.15)';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();

                // Main trail
                ctx.beginPath();
                ctx.moveTo(boid.trail[0].x, boid.trail[0].y);
                for (let i = 1; i < boid.trail.length; i++) {
                    const alpha = i / boid.trail.length;
                    ctx.lineTo(boid.trail[i].x, boid.trail[i].y);
                }
                ctx.lineTo(boid.x, boid.y);

                const gradient = ctx.createLinearGradient(
                    boid.trail[0].x, boid.trail[0].y,
                    boid.x, boid.y
                );
                gradient.addColorStop(0, 'rgba(255, 50, 50, 0)');
                gradient.addColorStop(0.5, 'rgba(255, 60, 40, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 80, 60, 1)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Draw car with lights
            ctx.save();
            ctx.translate(boid.x, boid.y);
            ctx.rotate(boid.heading);

            // Headlight beams (cone of light)
            const beamGradient = ctx.createRadialGradient(10, 0, 0, 10, 0, 35);
            beamGradient.addColorStop(0, 'rgba(255, 255, 220, 0.8)');
            beamGradient.addColorStop(0.3, 'rgba(255, 255, 200, 0.3)');
            beamGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

            ctx.beginPath();
            ctx.moveTo(6, -3);
            ctx.lineTo(40, -12);
            ctx.lineTo(40, 12);
            ctx.lineTo(6, 3);
            ctx.closePath();
            ctx.fillStyle = beamGradient;
            ctx.fill();

            // Car body silhouette
            ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
            ctx.fillRect(-8, -3, 14, 6);

            // Headlights (bright)
            ctx.shadowColor = '#ffffcc';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(5, -2, 2, 0, Math.PI * 2);
            ctx.arc(5, 2, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffee';
            ctx.fill();

            // Taillights (red glow)
            ctx.shadowColor = '#ff3333';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
            ctx.arc(-6, 2, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4444';
            ctx.fill();

            ctx.restore();
        }
    }

    // Rush Hour theme - GPS/map view style
    renderRushHour(boids) {
        const ctx = this.ctx;

        for (const boid of boids) {
            ctx.save();
            ctx.translate(boid.x, boid.y);
            ctx.rotate(boid.heading);

            const width = 16 * boid.size;
            const height = 7 * boid.size;
            const color = this.carColors[boid.colorIndex % this.carColors.length];

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            this.roundRect(ctx, -width / 2 + 2, -height / 2 + 2, width, height, 2);
            ctx.fill();

            // Car body
            ctx.fillStyle = color;
            this.roundRect(ctx, -width / 2, -height / 2, width, height, 2);
            ctx.fill();

            // Roof/cabin (darker)
            ctx.fillStyle = this.darkenColor(color, 0.2);
            this.roundRect(ctx, -width / 4, -height / 2.5, width / 2.2, height / 1.25, 1);
            ctx.fill();

            // Windshield
            ctx.fillStyle = 'rgba(180, 210, 230, 0.9)';
            ctx.fillRect(width / 8, -height / 3, width / 5, height / 1.5);

            // Rear window
            ctx.fillStyle = 'rgba(160, 190, 210, 0.7)';
            ctx.fillRect(-width / 3.5, -height / 3, width / 6, height / 1.5);

            ctx.restore();
        }
    }

    // Formula 1 theme - telemetry/racing style
    renderF1(boids) {
        const ctx = this.ctx;

        for (const boid of boids) {
            const speed = boid.getSpeed();
            const speedRatio = Math.min(speed / CONFIG.maxSpeed, 1);

            // Speed-based color (green -> yellow -> red)
            let r, g, b;
            if (speedRatio < 0.5) {
                r = Math.floor(speedRatio * 2 * 255);
                g = 255;
                b = 50;
            } else {
                r = 255;
                g = Math.floor((1 - (speedRatio - 0.5) * 2) * 255);
                b = 50;
            }
            const speedColor = `rgb(${r}, ${g}, ${b})`;

            // Team color based on boid ID
            const teamIndex = boid.id % this.f1Colors.length;
            const teamColor = this.f1Colors[teamIndex];

            ctx.save();
            ctx.translate(boid.x, boid.y);
            ctx.rotate(boid.heading);

            // Velocity vector trail
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(-5 - speed * 5, 0);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Glow effect
            ctx.shadowColor = speedColor;
            ctx.shadowBlur = 12;

            // F1 car body shape
            ctx.beginPath();
            ctx.moveTo(14, 0);          // Nose
            ctx.lineTo(8, -2);          // Front wing connection
            ctx.lineTo(10, -4);         // Front wing outer
            ctx.lineTo(6, -4);          // Front wing inner
            ctx.lineTo(4, -2.5);        // Chassis front
            ctx.lineTo(-6, -3);         // Sidepod
            ctx.lineTo(-10, -5);        // Rear wing outer
            ctx.lineTo(-8, -2);         // Rear wing inner
            ctx.lineTo(-10, 0);         // Rear
            ctx.lineTo(-8, 2);
            ctx.lineTo(-10, 5);
            ctx.lineTo(-6, 3);
            ctx.lineTo(4, 2.5);
            ctx.lineTo(6, 4);
            ctx.lineTo(10, 4);
            ctx.lineTo(8, 2);
            ctx.closePath();

            ctx.fillStyle = teamColor.primary;
            ctx.fill();

            // Cockpit
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.ellipse(1, 0, 4, 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fill();

            // Driver helmet
            ctx.beginPath();
            ctx.arc(2, 0, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = teamColor.accent;
            ctx.fill();

            // Speed indicator bar
            ctx.fillStyle = speedColor;
            ctx.fillRect(-8, -7, speedRatio * 16, 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-8, -7, 16, 2);

            ctx.restore();
        }
    }

    // Helper: Draw rounded rectangle
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // Helper: Darken a hex color
    darkenColor(hex, amount) {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.max(0, (num >> 16) - Math.floor(255 * amount));
        const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.floor(255 * amount));
        const b = Math.max(0, (num & 0x0000FF) - Math.floor(255 * amount));
        return `rgb(${r}, ${g}, ${b})`;
    }
}
