/**
 * Renderer for Turing Patterns
 * Handles canvas rendering and color scheme mapping
 */

class Renderer {
    constructor(canvas, simulation) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.simulation = simulation;

        // Create ImageData for efficient pixel manipulation
        this.imageData = this.ctx.createImageData(simulation.width, simulation.height);

        // Current color scheme
        this.colorScheme = 'neon';

        // Precompute color maps for performance
        this.viridisMap = this.generateViridisMap();
        this.plasmaMap = this.generatePlasmaMap();
        this.infernoMap = this.generateInfernoMap();
    }

    /**
     * Generate Viridis color map lookup table
     */
    generateViridisMap() {
        return this.generateColorMap([
            { t: 0.0, r: 68, g: 1, b: 84 },
            { t: 0.25, r: 59, g: 82, b: 139 },
            { t: 0.5, r: 33, g: 145, b: 140 },
            { t: 0.75, r: 94, g: 201, b: 98 },
            { t: 1.0, r: 253, g: 231, b: 37 }
        ]);
    }

    /**
     * Generate Plasma color map lookup table
     */
    generatePlasmaMap() {
        return this.generateColorMap([
            { t: 0.0, r: 13, g: 8, b: 135 },
            { t: 0.25, r: 126, g: 3, b: 168 },
            { t: 0.5, r: 204, g: 71, b: 120 },
            { t: 0.75, r: 248, g: 149, b: 64 },
            { t: 1.0, r: 240, g: 249, b: 33 }
        ]);
    }

    /**
     * Generate Inferno color map lookup table
     */
    generateInfernoMap() {
        return this.generateColorMap([
            { t: 0.0, r: 0, g: 0, b: 4 },
            { t: 0.2, r: 40, g: 11, b: 84 },
            { t: 0.4, r: 101, g: 21, b: 110 },
            { t: 0.6, r: 186, g: 55, b: 85 },
            { t: 0.8, r: 249, g: 142, b: 9 },
            { t: 1.0, r: 252, g: 255, b: 164 }
        ]);
    }

    /**
     * Generate a color map from stops
     */
    generateColorMap(stops) {
        const map = new Array(256);

        for (let i = 0; i < 256; i++) {
            const t = i / 255;

            // Find the two stops we're between
            let s1 = stops[0], s2 = stops[1];
            for (let j = 1; j < stops.length; j++) {
                if (stops[j].t >= t) {
                    s1 = stops[j - 1];
                    s2 = stops[j];
                    break;
                }
            }

            // Interpolate
            const localT = (t - s1.t) / (s2.t - s1.t);
            map[i] = {
                r: Math.round(s1.r + (s2.r - s1.r) * localT),
                g: Math.round(s1.g + (s2.g - s1.g) * localT),
                b: Math.round(s1.b + (s2.b - s1.b) * localT)
            };
        }

        return map;
    }

    /**
     * Set the color scheme
     */
    setColorScheme(scheme) {
        this.colorScheme = scheme;
    }

    /**
     * Map concentration value to RGB based on current color scheme
     */
    mapColor(value) {
        // Clamp value
        value = Math.max(0, Math.min(1, value));
        const idx = Math.floor(value * 255);

        switch (this.colorScheme) {
            case 'neon':
                return this.neonMap(value);
            case 'plasma':
                return this.plasmaMap[idx];
            case 'inferno':
                return this.infernoMap[idx];
            case 'toxic':
                return this.toxicMap(value);
            case 'ocean':
                return this.oceanMap(value);
            case 'grayscale':
                return this.grayscaleMap(value);
            case 'heatmap':
                return this.heatMap(value);
            case 'viridis':
                return this.viridisMap[idx];
            default:
                return this.neonMap(value);
        }
    }

    /**
     * Neon: Black -> Cyan -> Magenta -> White (cyberpunk style)
     */
    neonMap(value) {
        if (value < 0.33) {
            const t = value / 0.33;
            return {
                r: Math.floor(20 * t),
                g: Math.floor(255 * t),
                b: Math.floor(200 * t)
            };
        } else if (value < 0.66) {
            const t = (value - 0.33) / 0.33;
            return {
                r: Math.floor(20 + 235 * t),
                g: Math.floor(255 - 55 * t),
                b: Math.floor(200 + 55 * t)
            };
        } else {
            const t = (value - 0.66) / 0.34;
            return {
                r: 255,
                g: Math.floor(200 + 55 * t),
                b: 255
            };
        }
    }

    /**
     * Toxic: Black -> Bright Green -> Yellow
     */
    toxicMap(value) {
        if (value < 0.5) {
            const t = value / 0.5;
            return {
                r: Math.floor(30 * t),
                g: Math.floor(255 * t),
                b: Math.floor(50 * t)
            };
        } else {
            const t = (value - 0.5) / 0.5;
            return {
                r: Math.floor(30 + 225 * t),
                g: 255,
                b: Math.floor(50 + 50 * t)
            };
        }
    }

    /**
     * Grayscale: 0.0 -> black, 1.0 -> white
     */
    grayscaleMap(value) {
        const gray = Math.floor(value * 255);
        return { r: gray, g: gray, b: gray };
    }

    /**
     * Heat Map: dark blue -> cyan -> yellow -> red
     */
    heatMap(value) {
        if (value < 0.25) {
            const t = value / 0.25;
            return {
                r: 0,
                g: 0,
                b: Math.floor(100 + 155 * t)
            };
        } else if (value < 0.5) {
            const t = (value - 0.25) / 0.25;
            return {
                r: 0,
                g: Math.floor(255 * t),
                b: 255
            };
        } else if (value < 0.75) {
            const t = (value - 0.5) / 0.25;
            return {
                r: Math.floor(255 * t),
                g: 255,
                b: Math.floor(255 * (1 - t))
            };
        } else {
            const t = (value - 0.75) / 0.25;
            return {
                r: 255,
                g: Math.floor(255 * (1 - t)),
                b: 0
            };
        }
    }

    /**
     * Ocean: deep blue -> cyan -> white
     */
    oceanMap(value) {
        if (value < 0.4) {
            const t = value / 0.4;
            return {
                r: Math.floor(10 * t),
                g: Math.floor(50 + 80 * t),
                b: Math.floor(80 + 120 * t)
            };
        } else if (value < 0.7) {
            const t = (value - 0.4) / 0.3;
            return {
                r: Math.floor(10 + 90 * t),
                g: Math.floor(130 + 125 * t),
                b: Math.floor(200 + 55 * t)
            };
        } else {
            const t = (value - 0.7) / 0.3;
            return {
                r: Math.floor(100 + 155 * t),
                g: 255,
                b: 255
            };
        }
    }

    /**
     * Render the simulation to the canvas
     */
    render() {
        const { simulation, imageData, ctx, canvas } = this;
        const grid = simulation.getGridB();
        const width = simulation.width;
        const height = simulation.height;
        const data = imageData.data;

        // Map grid values to pixel colors
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const gridIdx = y * width + x;
                const pixelIdx = gridIdx * 4;

                const value = grid[gridIdx];
                const color = this.mapColor(value);

                data[pixelIdx] = color.r;
                data[pixelIdx + 1] = color.g;
                data[pixelIdx + 2] = color.b;
                data[pixelIdx + 3] = 255; // Alpha
            }
        }

        // Put image data and scale to canvas size
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);

        // Clear and draw scaled
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    }

    /**
     * Export canvas as PNG
     */
    exportImage() {
        return this.canvas.toDataURL('image/png');
    }
}

/**
 * Parameter Space Map Renderer
 * Shows the F/K parameter space with pattern regions
 */
class ParameterMapRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Parameter ranges
        this.kMin = 0.045;
        this.kMax = 0.070;
        this.fMin = 0.010;
        this.fMax = 0.050;

        // Current position
        this.currentF = 0.037;
        this.currentK = 0.060;

        this.render();
    }

    /**
     * Render the parameter space map
     */
    render() {
        const { canvas, ctx, kMin, kMax, fMin, fMax } = this;
        const width = canvas.width;
        const height = canvas.height;

        // Create gradient based on typical pattern regions
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const k = kMin + (x / width) * (kMax - kMin);
                const f = fMax - (y / height) * (fMax - fMin);

                const color = this.getRegionColor(f, k);
                const idx = (y * width + x) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw crosshairs at current position
        this.drawCrosshairs();
    }

    /**
     * Get color for a parameter region (cyberpunk palette)
     */
    getRegionColor(f, k) {
        if (f < 0.02) {
            // Waves/spirals region - cyan
            return { r: 0, g: 180, b: 200 };
        } else if (f > 0.035 && k > 0.058) {
            // Spots region - magenta
            return { r: 180, g: 50, b: 150 };
        } else if (f > 0.03 && k < 0.058) {
            // Stripes region - green
            return { r: 0, g: 200, b: 100 };
        } else if (f > 0.025 && f < 0.035) {
            // Maze/unstable region - orange
            return { r: 220, g: 120, b: 30 };
        } else if (f > 0.035 && k >= 0.058 && k <= 0.062) {
            // Fingerprint region - purple
            return { r: 120, g: 80, b: 200 };
        } else {
            // Mixed/transition - dark blue
            return { r: 30, g: 40, b: 80 };
        }
    }

    /**
     * Draw crosshairs at current F/K position
     */
    drawCrosshairs() {
        const { canvas, ctx, currentF, currentK, kMin, kMax, fMin, fMax } = this;

        const x = ((currentK - kMin) / (kMax - kMin)) * canvas.width;
        const y = ((fMax - currentF) / (fMax - fMin)) * canvas.height;

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';

        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        // Center circle
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff88';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

    /**
     * Update current position
     */
    setPosition(f, k) {
        this.currentF = f;
        this.currentK = k;
        this.render();
    }

    /**
     * Get F/K values from click position
     */
    getValuesFromClick(x, y) {
        const { canvas, kMin, kMax, fMin, fMax } = this;

        const k = kMin + (x / canvas.width) * (kMax - kMin);
        const f = fMax - (y / canvas.height) * (fMax - fMin);

        return {
            f: Math.max(fMin, Math.min(fMax, f)),
            k: Math.max(kMin, Math.min(kMax, k))
        };
    }
}

// Export for use in other modules
window.Renderer = Renderer;
window.ParameterMapRenderer = ParameterMapRenderer;
