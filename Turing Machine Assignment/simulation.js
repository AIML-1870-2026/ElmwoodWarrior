/**
 * Gray-Scott Reaction-Diffusion Simulation
 * Implements the Gray-Scott model for generating Turing patterns
 */

class Simulation {
    constructor(width = 256, height = 256) {
        this.width = width;
        this.height = height;

        // Diffusion rates
        this.dA = 1.0;
        this.dB = 0.5;

        // Reaction parameters (default: Spots pattern)
        this.F = 0.035;  // Feed rate
        this.K = 0.065;  // Kill rate

        // Time step
        this.dt = 1.0;

        // Double buffering for chemical concentrations
        this.gridA = new Float32Array(width * height);
        this.gridB = new Float32Array(width * height);
        this.nextA = new Float32Array(width * height);
        this.nextB = new Float32Array(width * height);

        // Initialize to default state
        this.reset();
    }

    /**
     * Reset simulation to initial conditions
     * Chemical A everywhere, small perturbation of B in center
     */
    reset() {
        const { width, height, gridA, gridB } = this;
        const centerX = width / 2;
        const centerY = height / 2;
        const seedRadius = 20;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;

                // Fill with chemical A
                gridA[idx] = 1.0;
                gridB[idx] = 0.0;

                // Add B in center region with random perturbation
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < seedRadius) {
                    gridB[idx] = 1.0;
                    gridA[idx] = 0.5 + Math.random() * 0.1;
                }
            }
        }
    }

    /**
     * Clear the grid - fill with chemical A only
     */
    clear() {
        this.gridA.fill(1.0);
        this.gridB.fill(0.0);
    }

    /**
     * Set the feed and kill rate parameters
     */
    setParameters(F, K) {
        this.F = F;
        this.K = K;
    }

    /**
     * Add chemical at a specific location
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Brush radius
     * @param {string} type - 'A', 'B', or 'noise'
     */
    addChemical(x, y, radius, type = 'B') {
        const { width, height, gridA, gridB } = this;

        // Scale coordinates from canvas to simulation grid
        const scaleX = this.width / 512;
        const scaleY = this.height / 512;
        const simX = Math.floor(x * scaleX);
        const simY = Math.floor(y * scaleY);
        const simRadius = Math.max(1, Math.floor(radius * scaleX));

        for (let dy = -simRadius; dy <= simRadius; dy++) {
            for (let dx = -simRadius; dx <= simRadius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= simRadius) {
                    let px = simX + dx;
                    let py = simY + dy;

                    // Wrap around (periodic boundary)
                    px = ((px % width) + width) % width;
                    py = ((py % height) + height) % height;

                    const idx = py * width + px;

                    // Strength falls off with distance from center
                    const strength = 1.0 - (dist / simRadius) * 0.5;

                    if (type === 'B') {
                        gridB[idx] = Math.min(1.0, gridB[idx] + strength);
                        gridA[idx] = Math.max(0.0, gridA[idx] - strength * 0.5);
                    } else if (type === 'A') {
                        gridA[idx] = Math.min(1.0, gridA[idx] + strength);
                        gridB[idx] = Math.max(0.0, gridB[idx] - strength * 0.5);
                    } else if (type === 'noise') {
                        gridA[idx] = 0.5 + Math.random() * 0.5;
                        gridB[idx] = Math.random() * 0.5;
                    }
                }
            }
        }
    }

    /**
     * Calculate Laplacian using 9-point stencil for better isotropy
     * Stencil weights:
     *   0.05  0.2  0.05
     *   0.2  -1.0  0.2
     *   0.05  0.2  0.05
     */
    laplacian(grid, x, y) {
        const { width, height } = this;

        // Periodic boundary conditions (wrap around)
        const xm = (x - 1 + width) % width;
        const xp = (x + 1) % width;
        const ym = (y - 1 + height) % height;
        const yp = (y + 1) % height;

        // Get indices
        const center = y * width + x;
        const left = y * width + xm;
        const right = y * width + xp;
        const top = ym * width + x;
        const bottom = yp * width + x;
        const topLeft = ym * width + xm;
        const topRight = ym * width + xp;
        const bottomLeft = yp * width + xm;
        const bottomRight = yp * width + xp;

        // 9-point stencil
        return (
            0.05 * grid[topLeft] + 0.2 * grid[top] + 0.05 * grid[topRight] +
            0.2 * grid[left] - 1.0 * grid[center] + 0.2 * grid[right] +
            0.05 * grid[bottomLeft] + 0.2 * grid[bottom] + 0.05 * grid[bottomRight]
        );
    }

    /**
     * Perform one simulation step using Euler integration
     * Gray-Scott equations:
     *   dA/dt = dA * nabla^2(A) - AB^2 + F(1-A)
     *   dB/dt = dB * nabla^2(B) + AB^2 - (K+F)B
     */
    step() {
        const { width, height, gridA, gridB, nextA, nextB, dA, dB, F, K, dt } = this;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;

                const A = gridA[idx];
                const B = gridB[idx];

                // Calculate Laplacians
                const lapA = this.laplacian(gridA, x, y);
                const lapB = this.laplacian(gridB, x, y);

                // Reaction term
                const ABB = A * B * B;

                // Gray-Scott equations
                const dAdt = dA * lapA - ABB + F * (1.0 - A);
                const dBdt = dB * lapB + ABB - (K + F) * B;

                // Euler integration
                nextA[idx] = A + dAdt * dt;
                nextB[idx] = B + dBdt * dt;

                // Clamp values to [0, 1]
                nextA[idx] = Math.max(0.0, Math.min(1.0, nextA[idx]));
                nextB[idx] = Math.max(0.0, Math.min(1.0, nextB[idx]));
            }
        }

        // Swap buffers
        [this.gridA, this.nextA] = [this.nextA, this.gridA];
        [this.gridB, this.nextB] = [this.nextB, this.gridB];
    }

    /**
     * Run multiple simulation steps
     * @param {number} steps - Number of steps to run
     */
    update(steps = 1) {
        for (let i = 0; i < steps; i++) {
            this.step();
        }
    }

    /**
     * Get chemical B concentration grid (for rendering)
     */
    getGridB() {
        return this.gridB;
    }

    /**
     * Get both grids
     */
    getGrids() {
        return { A: this.gridA, B: this.gridB };
    }
}

// Export for use in other modules
window.Simulation = Simulation;
