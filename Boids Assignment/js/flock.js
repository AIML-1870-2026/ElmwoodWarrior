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

        // Identify groups using union-find
        const groupIds = this.identifyGroups();
        const groupSizes = this.calculateGroupSizes(groupIds);

        // Update each boid
        let totalSpeed = 0;
        let totalNeighbors = 0;

        const totalAgents = this.boids.length;
        const maxGroupSize = Math.max(1, Math.floor(totalAgents * CONFIG.maxGroupPercent / 100));

        for (let i = 0; i < this.boids.length; i++) {
            const boid = this.boids[i];
            // Get neighbors from spatial grid
            const neighbors = this.grid.getNeighbors(boid, CONFIG.neighborRadius);

            // Get this boid's group size
            const groupSize = groupSizes[groupIds[i]];

            // Apply flocking behavior with group info
            boid.flock(neighbors, totalAgents, groupSize, maxGroupSize);

            // Apply mouse interaction (flee or seek based on config)
            if (CONFIG.mouseEnabled) {
                if (CONFIG.mouseAttract) {
                    boid.seek(this.mouseX, this.mouseY);
                } else {
                    boid.flee(this.mouseX, this.mouseY);
                }
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

    // Identify groups using union-find algorithm
    identifyGroups() {
        const n = this.boids.length;
        const parent = new Array(n);
        const rank = new Array(n);

        // Initialize each boid as its own group
        for (let i = 0; i < n; i++) {
            parent[i] = i;
            rank[i] = 0;
        }

        // Find with path compression
        const find = (x) => {
            if (parent[x] !== x) {
                parent[x] = find(parent[x]);
            }
            return parent[x];
        };

        // Union by rank
        const union = (x, y) => {
            const px = find(x);
            const py = find(y);
            if (px === py) return;

            if (rank[px] < rank[py]) {
                parent[px] = py;
            } else if (rank[px] > rank[py]) {
                parent[py] = px;
            } else {
                parent[py] = px;
                rank[px]++;
            }
        };

        // Create a map from boid to index
        const boidIndex = new Map();
        for (let i = 0; i < n; i++) {
            boidIndex.set(this.boids[i], i);
        }

        // Union boids that are neighbors
        for (let i = 0; i < n; i++) {
            const boid = this.boids[i];
            const neighbors = this.grid.getNeighbors(boid, CONFIG.neighborRadius);

            for (const neighbor of neighbors) {
                const j = boidIndex.get(neighbor.boid);
                if (j !== undefined) {
                    union(i, j);
                }
            }
        }

        // Get final group IDs (with path compression)
        const groupIds = new Array(n);
        for (let i = 0; i < n; i++) {
            groupIds[i] = find(i);
        }

        return groupIds;
    }

    // Calculate size of each group
    calculateGroupSizes(groupIds) {
        const sizes = {};
        for (const id of groupIds) {
            sizes[id] = (sizes[id] || 0) + 1;
        }
        return sizes;
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
