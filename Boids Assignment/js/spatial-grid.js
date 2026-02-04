// Spatial Hash Grid for O(n) neighbor lookups
// Divides space into cells and only checks adjacent cells for neighbors

class SpatialGrid {
    constructor(cellSize, width, height) {
        this.cellSize = cellSize;
        this.width = width;
        this.height = height;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.cells = new Map();
    }

    // Get cell key from position
    getKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }

    // Get cell indices from position
    getCellIndices(x, y) {
        return {
            col: Math.floor(x / this.cellSize),
            row: Math.floor(y / this.cellSize)
        };
    }

    // Clear all cells
    clear() {
        this.cells.clear();
    }

    // Update grid dimensions
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.cols = Math.ceil(width / this.cellSize);
        this.rows = Math.ceil(height / this.cellSize);
    }

    // Update cell size (when neighbor radius changes)
    setCellSize(cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(this.width / cellSize);
        this.rows = Math.ceil(this.height / cellSize);
    }

    // Insert a boid into the grid
    insert(boid) {
        const key = this.getKey(boid.x, boid.y);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(boid);
    }

    // Get all potential neighbors (boids in adjacent cells)
    getNearby(x, y, radius) {
        const nearby = [];
        const { col, row } = this.getCellIndices(x, y);

        // Calculate how many cells we need to check based on radius
        const cellsToCheck = Math.ceil(radius / this.cellSize);

        // Check surrounding cells (typically 9 cells for radius <= cellSize)
        for (let i = -cellsToCheck; i <= cellsToCheck; i++) {
            for (let j = -cellsToCheck; j <= cellsToCheck; j++) {
                const checkCol = col + i;
                const checkRow = row + j;
                const key = `${checkCol},${checkRow}`;

                if (this.cells.has(key)) {
                    nearby.push(...this.cells.get(key));
                }
            }
        }

        return nearby;
    }

    // Get neighbors within radius (with actual distance check)
    getNeighbors(boid, radius) {
        const nearby = this.getNearby(boid.x, boid.y, radius);
        const neighbors = [];
        const radiusSq = radius * radius;

        for (const other of nearby) {
            if (other === boid) continue;

            const dx = other.x - boid.x;
            const dy = other.y - boid.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < radiusSq && distSq > 0) {
                neighbors.push({
                    boid: other,
                    distSq: distSq,
                    dx: dx,
                    dy: dy
                });
            }
        }

        return neighbors;
    }
}
