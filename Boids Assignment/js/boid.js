// Boid (Agent) class with steering behaviors

class Boid {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        // Random initial velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = CONFIG.maxSpeed * (0.5 + Math.random() * 0.5);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Heading (rotation angle)
        this.heading = angle;

        // Acceleration
        this.ax = 0;
        this.ay = 0;

        // Trail history for Night City theme
        this.trail = [];
        this.maxTrailLength = CONFIG.trailLength;

        // Individual variation for Rush Hour theme
        this.size = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        this.colorIndex = Math.floor(Math.random() * 5);

        // Neighbor count for stats
        this.neighborCount = 0;
    }

    // Update position and physics
    update() {
        // Store position for trail
        if (THEMES[CONFIG.theme].showTrails) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        } else {
            this.trail = [];
        }

        // Apply acceleration to velocity
        this.vx += this.ax;
        this.vy += this.ay;

        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.maxSpeed) {
            this.vx = (this.vx / speed) * CONFIG.maxSpeed;
            this.vy = (this.vy / speed) * CONFIG.maxSpeed;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Update heading
        if (speed > 0.1) {
            this.heading = Math.atan2(this.vy, this.vx);
        }

        // Reset acceleration
        this.ax = 0;
        this.ay = 0;

        // Handle boundaries
        this.handleBoundary();
    }

    // Apply a force (limited by maxForce)
    applyForce(fx, fy) {
        this.ax += fx;
        this.ay += fy;
    }

    // Handle screen boundaries
    handleBoundary() {
        if (CONFIG.boundaryMode === 'wrap') {
            // Toroidal wrapping
            if (this.x < 0) this.x += this.width;
            if (this.x > this.width) this.x -= this.width;
            if (this.y < 0) this.y += this.height;
            if (this.y > this.height) this.y -= this.height;
        } else {
            // Bounce off edges
            const margin = 10;
            if (this.x < margin) {
                this.x = margin;
                this.vx *= -1;
            }
            if (this.x > this.width - margin) {
                this.x = this.width - margin;
                this.vx *= -1;
            }
            if (this.y < margin) {
                this.y = margin;
                this.vy *= -1;
            }
            if (this.y > this.height - margin) {
                this.y = this.height - margin;
                this.vy *= -1;
            }
        }
    }

    // Check if neighbor is within perception cone (270 degrees FOV)
    isInPerceptionCone(dx, dy) {
        const angleToNeighbor = Math.atan2(dy, dx);
        let relativeAngle = angleToNeighbor - this.heading;

        // Normalize angle to [-PI, PI]
        while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
        while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;

        // Check if within FOV (270 degrees = ±135 degrees from heading)
        return Math.abs(relativeAngle) < CONFIG.fovHalfAngle;
    }

    // Calculate steering behaviors
    flock(neighbors) {
        // Filter neighbors by perception cone
        const visibleNeighbors = neighbors.filter(n =>
            this.isInPerceptionCone(n.dx, n.dy)
        );

        this.neighborCount = visibleNeighbors.length;

        if (visibleNeighbors.length === 0) return;

        // Calculate separation, alignment, and cohesion forces
        const separation = this.separate(visibleNeighbors);
        const alignment = this.align(visibleNeighbors);
        const cohesion = this.cohere(visibleNeighbors);

        // Apply weighted forces
        this.applyForce(
            separation.x * CONFIG.separation +
            alignment.x * CONFIG.alignment +
            cohesion.x * CONFIG.cohesion,
            separation.y * CONFIG.separation +
            alignment.y * CONFIG.alignment +
            cohesion.y * CONFIG.cohesion
        );
    }

    // Separation: Steer away from nearby neighbors
    separate(neighbors) {
        let steerX = 0;
        let steerY = 0;

        for (const n of neighbors) {
            const dist = Math.sqrt(n.distSq);
            if (dist > 0) {
                // Weight by inverse distance (closer = stronger repulsion)
                const weight = 1 / dist;
                steerX -= (n.dx / dist) * weight;
                steerY -= (n.dy / dist) * weight;
            }
        }

        return this.limitForce(steerX, steerY);
    }

    // Alignment: Steer toward average heading of neighbors
    align(neighbors) {
        let avgVx = 0;
        let avgVy = 0;

        for (const n of neighbors) {
            avgVx += n.boid.vx;
            avgVy += n.boid.vy;
        }

        avgVx /= neighbors.length;
        avgVy /= neighbors.length;

        // Steering = desired - current
        const steerX = avgVx - this.vx;
        const steerY = avgVy - this.vy;

        return this.limitForce(steerX, steerY);
    }

    // Cohesion: Steer toward center of mass of neighbors
    cohere(neighbors) {
        let centerX = 0;
        let centerY = 0;

        for (const n of neighbors) {
            centerX += n.boid.x;
            centerY += n.boid.y;
        }

        centerX /= neighbors.length;
        centerY /= neighbors.length;

        // Direction to center
        const dx = centerX - this.x;
        const dy = centerY - this.y;

        return this.limitForce(dx, dy);
    }

    // Flee from mouse cursor
    flee(mouseX, mouseY) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distSq = dx * dx + dy * dy;
        const radiusSq = CONFIG.mouseRadius * CONFIG.mouseRadius;

        if (distSq < radiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            // Stronger force when closer
            const strength = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce;
            const force = this.limitForce(dx / dist * strength, dy / dist * strength);
            this.applyForce(force.x * 3, force.y * 3);
        }
    }

    // Limit force magnitude
    limitForce(fx, fy) {
        const mag = Math.sqrt(fx * fx + fy * fy);
        if (mag > CONFIG.maxForce) {
            return {
                x: (fx / mag) * CONFIG.maxForce,
                y: (fy / mag) * CONFIG.maxForce
            };
        }
        return { x: fx, y: fy };
    }

    // Get current speed
    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    // Update screen dimensions
    setDimensions(width, height) {
        this.width = width;
        this.height = height;
    }
}
