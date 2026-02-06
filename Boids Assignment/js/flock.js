// Flock class - manages collection of boids

class Flock {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.boids = [];
        this.grid = new SpatialGrid(CONFIG.neighborRadius, width, height);

        // Stats
        this.avgSpeed = 0;
        this.avgNeighbors = 0;

        // Mouse position for predator behavior
        this.mouseX = -1000;
        this.mouseY = -1000;
    }

    // Initialize flock with random boids
    init(count) {
        this.boids = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.boids.push(new Boid(x, y, this.width, this.height));
        }
    }

    // Reset all boids to random positions
    reset() {
        for (const boid of this.boids) {
            boid.x = Math.random() * this.width;
            boid.y = Math.random() * this.height;
            const angle = Math.random() * Math.PI * 2;
            const speed = CONFIG.maxSpeed * (0.5 + Math.random() * 0.5);
            boid.vx = Math.cos(angle) * speed;
            boid.vy = Math.sin(angle) * speed;
            boid.heading = angle;
            boid.trail = [];
        }
    }

    // Set boid count (add or remove boids)
    setCount(count) {
        const currentCount = this.boids.length;

        if (count > currentCount) {
            // Add new boids
            for (let i = 0; i < count - currentCount; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                this.boids.push(new Boid(x, y, this.width, this.height));
            }
        } else if (count < currentCount) {
            // Remove excess boids
            this.boids.splice(count);
        }
    }

    // Update mouse position
    setMouse(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    // Update screen dimensions
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.grid.resize(width, height);

        for (const boid of this.boids) {
            boid.setDimensions(width, height);
        }
    }

    // Update spatial grid cell size when neighbor radius changes
    updateGridCellSize() {
        this.grid.setCellSize(CONFIG.neighborRadius);
    }

    // Main update loop
    update() {
        if (CONFIG.paused) return;

        // Rebuild spatial grid
        this.grid.clear();
        for (const boid of this.boids) {
            this.grid.insert(boid);
        }

        // Update each boid
        let totalSpeed = 0;
        let totalNeighbors = 0;

        const totalAgents = this.boids.length;

        for (const boid of this.boids) {
            // Get neighbors from spatial grid
            const neighbors = this.grid.getNeighbors(boid, CONFIG.neighborRadius);

            // Apply flocking behavior
            boid.flock(neighbors, totalAgents);

            // Apply mouse interaction (flee or seek based on config)
            if (CONFIG.mouseAttract) {
                boid.seek(this.mouseX, this.mouseY);
            } else {
                boid.flee(this.mouseX, this.mouseY);
            }

            // Update position
            boid.update();

            // Accumulate stats
            totalSpeed += boid.getSpeed();
            totalNeighbors += boid.neighborCount;
        }

        // Update average stats (smoothed)
        const count = this.boids.length;
        if (count > 0) {
            this.avgSpeed = this.avgSpeed * 0.9 + (totalSpeed / count) * 0.1;
            this.avgNeighbors = this.avgNeighbors * 0.9 + (totalNeighbors / count) * 0.1;
        }
    }

    // Get current stats
    getStats() {
        return {
            count: this.boids.length,
            avgSpeed: this.avgSpeed.toFixed(2),
            avgNeighbors: this.avgNeighbors.toFixed(1)
        };
    }
}
