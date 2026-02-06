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
        this.colorScheme = 'grayscale';

        // Precompute Viridis color map (256 entries)
        this.viridisMap = this.generateViridisMap();
    }

    /**
     * Generate Viridis color map lookup table
     */
    generateViridisMap() {
        const map = new Array(256);

        // Viridis color stops (simplified approximation)
        const stops = [
            { t: 0.0, r: 68, g: 1, b: 84 },
            { t: 0.25, r: 59, g: 82, b: 139 },
            { t: 0.5, r: 33, g: 145, b: 140 },
            { t: 0.75, r: 94, g: 201, b: 98 },
            { t: 1.0, r: 253, g: 231, b: 37 }
        ];

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
     * @param {number} value - Concentration (0.0 to 1.0)
     * @returns {object} - { r, g, b }
     */
    mapColor(value) {
        // Clamp value
        value = Math.max(0, Math.min(1, value));

        switch (this.colorScheme) {
            case 'grayscale':
                return this.grayscaleMap(value);
            case 'heatmap':
                return this.heatMap(value);
            case 'viridis':
                return this.viridisMap[Math.floor(value * 255)];
            case 'ocean':
                return this.oceanMap(value);
            default:
                return this.grayscaleMap(value);
        }
    }

    /**
     * Grayscale: 0.0 -> white, 1.0 -> black
     */
    grayscaleMap(value) {
        const gray = Math.floor((1.0 - value) * 255);
        return { r: gray, g: gray, b: gray };
    }

    /**
     * Heat Map: dark blue -> cyan -> yellow -> red
     */
    heatMap(value) {
        if (value < 0.33) {
            const t = value / 0.33;
            return {
                r: 0,
                g: Math.floor(255 * t),
                b: Math.floor(128 + 127 * (1 - t))
            };
        } else if (value < 0.66) {
            const t = (value - 0.33) / 0.33;
            return {
                r: Math.floor(255 * t),
                g: 255,
                b: Math.floor(255 * (1 - t))
            };
        } else {
            const t = (value - 0.66) / 0.34;
            return {
                r: 255,
                g: Math.floor(255 * (1 - t)),
                b: 0
            };
        }
    }

    /**
     * Ocean: dark blue -> cyan -> white
     */
    oceanMap(value) {
        if (value < 0.5) {
            const t = value / 0.5;
            return {
                r: 0,
                g: Math.floor(128 * t),
                b: Math.floor(64 + 191 * t)
            };
        } else {
            const t = (value - 0.5) / 0.5;
            return {
                r: Math.floor(255 * t),
                g: Math.floor(128 + 127 * t),
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
     * @returns {string} - Data URL of the image
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
        this.currentF = 0.035;
        this.currentK = 0.065;

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
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const k = kMin + (x / width) * (kMax - kMin);
                const f = fMax - (y / height) * (fMax - fMin);

                const color = this.getRegionColor(f, k);
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        // Draw crosshairs at current position
        this.drawCrosshairs();
    }

    /**
     * Get color for a parameter region
     */
    getRegionColor(f, k) {
        // Approximate pattern regions based on F/K values
        // These are rough estimates based on Gray-Scott behavior

        const ratio = k / f;

        if (f < 0.02) {
            // Waves/spirals region
            return { r: 100, g: 150, b: 200 };
        } else if (f > 0.03 && k > 0.062) {
            // Spots region
            return { r: 200, g: 100, b: 100 };
        } else if (f > 0.03 && k < 0.062) {
            // Stripes region
            return { r: 100, g: 200, b: 100 };
        } else if (f > 0.025 && f < 0.035) {
            // Maze/unstable region
            return { r: 200, g: 200, b: 100 };
        } else {
            // Mixed/transition
            return { r: 150, g: 150, b: 150 };
        }
    }

    /**
     * Draw crosshairs at current F/K position
     */
    drawCrosshairs() {
        const { canvas, ctx, currentF, currentK, kMin, kMax, fMin, fMax } = this;

        const x = ((currentK - kMin) / (kMax - kMin)) * canvas.width;
        const y = ((fMax - currentF) / (fMax - fMin)) * canvas.height;

        ctx.strokeStyle = 'white';
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
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
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
