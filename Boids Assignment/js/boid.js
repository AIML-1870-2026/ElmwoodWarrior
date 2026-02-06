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

        // Heading (rotation angle) with smoothing
        this.heading = angle;
        this.targetHeading = angle;

        // Acceleration
        this.ax = 0;
        this.ay = 0;

        // Trail history for Night City theme
        this.trail = [];
        this.maxTrailLength = CONFIG.trailLength;

        // Individual variation
        this.size = 0.8 + Math.random() * 0.4;
        this.colorIndex = Math.floor(Math.random() * 5);
        this.maxSpeedVariation = 0.85 + Math.random() * 0.3; // 85% to 115% of max speed

        // Unique ID for visual variety
        this.id = Math.floor(Math.random() * 100);

        // Neighbor count for stats
        this.neighborCount = 0;

        // Wander angle for more natural movement when alone
        this.wanderAngle = Math.random() * Math.PI * 2;
    }

    // Update position and physics
    update(dt = 1) {
        // Update trail length from config
        this.maxTrailLength = CONFIG.trailLength;

        // Store position for trail
        if (THEMES[CONFIG.theme].showTrails) {
            this.trail.push({ x: this.x, y: this.y, vx: this.vx, vy: this.vy });
            while (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        } else if (this.trail.length > 0) {
            this.trail = [];
        }

        // Apply soft boundary avoidance for bounce mode
        if (CONFIG.boundaryMode === 'bounce') {
            this.applySoftBoundary();
        }

        // Apply acceleration to velocity
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;

        // Apply subtle wander when no neighbors (more natural movement)
        if (this.neighborCount === 0) {
            this.wanderAngle += (Math.random() - 0.5) * 0.3;
            this.vx += Math.cos(this.wanderAngle) * 0.02;
            this.vy += Math.sin(this.wanderAngle) * 0.02;
        }

        // Limit speed (with individual variation)
        const personalMaxSpeed = CONFIG.maxSpeed * this.maxSpeedVariation;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > personalMaxSpeed) {
            this.vx = (this.vx / speed) * personalMaxSpeed;
            this.vy = (this.vy / speed) * personalMaxSpeed;
        }

        // Minimum speed to keep things moving
        if (speed < 0.5) {
            const boost = 0.5 / (speed || 0.1);
            this.vx *= boost;
            this.vy *= boost;
        }

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Smooth heading interpolation for more natural rotation
        if (speed > 0.1) {
            this.targetHeading = Math.atan2(this.vy, this.vx);
            // Smoothly interpolate heading
            let diff = this.targetHeading - this.heading;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.heading += diff * 0.15;
        }

        // Reset acceleration
        this.ax = 0;
        this.ay = 0;

        // Handle boundaries
        this.handleBoundary();
    }

    // Soft boundary avoidance - gradual steering away from edges
    applySoftBoundary() {
        const margin = 100;
        const strength = 0.5;

        // Left edge
        if (this.x < margin) {
            const force = (margin - this.x) / margin;
            this.ax += force * strength;
        }
        // Right edge
        if (this.x > this.width - margin) {
            const force = (this.x - (this.width - margin)) / margin;
            this.ax -= force * strength;
        }
        // Top edge
        if (this.y < margin) {
            const force = (margin - this.y) / margin;
            this.ay += force * strength;
        }
        // Bottom edge
        if (this.y > this.height - margin) {
            const force = (this.y - (this.height - margin)) / margin;
            this.ay -= force * strength;
        }
    }

    // Apply a force
    applyForce(fx, fy) {
        this.ax += fx;
        this.ay += fy;
    }

    // Handle screen boundaries
    handleBoundary() {
        if (CONFIG.boundaryMode === 'wrap') {
            // Toroidal wrapping - clear trail when wrapping to prevent lines across screen
            let wrapped = false;
            if (this.x < 0) { this.x += this.width; wrapped = true; }
            if (this.x > this.width) { this.x -= this.width; wrapped = true; }
            if (this.y < 0) { this.y += this.height; wrapped = true; }
            if (this.y > this.height) { this.y -= this.height; wrapped = true; }
            if (wrapped) this.trail = [];
        } else {
            // Hard boundary fallback (soft boundary handles most cases)
            const margin = 5;
            if (this.x < margin) {
                this.x = margin;
                this.vx = Math.abs(this.vx) * 0.8;
            }
            if (this.x > this.width - margin) {
                this.x = this.width - margin;
                this.vx = -Math.abs(this.vx) * 0.8;
            }
            if (this.y < margin) {
                this.y = margin;
                this.vy = Math.abs(this.vy) * 0.8;
            }
            if (this.y > this.height - margin) {
                this.y = this.height - margin;
                this.vy = -Math.abs(this.vy) * 0.8;
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

        return Math.abs(relativeAngle) < CONFIG.fovHalfAngle;
    }

    // Calculate steering behaviors
    flock(neighbors, totalAgents) {
        // Filter neighbors by perception cone
        let visibleNeighbors = neighbors.filter(n =>
            this.isInPerceptionCone(n.dx, n.dy)
        );

        // Limit group size based on percentage of total agents
        const maxGroupSize = Math.max(1, Math.floor(totalAgents * CONFIG.maxGroupPercent / 100));
        if (visibleNeighbors.length > maxGroupSize) {
            // Keep only the closest neighbors up to max group size
            visibleNeighbors.sort((a, b) => a.distSq - b.distSq);
            visibleNeighbors = visibleNeighbors.slice(0, maxGroupSize);
        }

        this.neighborCount = visibleNeighbors.length;

        // Hard collision avoidance - always active, ignores FOV
        const minDist = 25;
        for (const n of neighbors) {
            const dist = Math.sqrt(n.distSq);
            if (dist > 0 && dist < minDist) {
                // Strong push away - bypasses normal force limits
                const push = (minDist - dist) / minDist * 0.5;
                this.applyForce(
                    -(n.dx / dist) * push,
                    -(n.dy / dist) * push
                );
            }
        }

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

        // Minimum distance to prevent overlap (based on car size ~20px)
        const minDist = 25;

        for (const n of neighbors) {
            const dist = Math.sqrt(n.distSq);
            if (dist > 0) {
                let weight;
                if (dist < minDist) {
                    // Hard repulsion when too close - exponential force
                    weight = Math.pow((minDist - dist) / minDist, 2) * 200;
                } else {
                    // Normal quadratic falloff for smoother separation
                    weight = 1 / (dist * dist) * 50;
                }
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

        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Scale cohesion by distance
        if (dist > 0) {
            return this.limitForce(dx / dist, dy / dist);
        }
        return { x: 0, y: 0 };
    }

    // Flee from mouse cursor
    flee(mouseX, mouseY) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distSq = dx * dx + dy * dy;
        const radiusSq = CONFIG.mouseRadius * CONFIG.mouseRadius;

        if (distSq < radiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            // Exponential falloff for smoother flee response
            const strength = Math.pow(1 - dist / CONFIG.mouseRadius, 2) * CONFIG.mouseForce;
            this.applyForce(
                (dx / dist) * strength * 3,
                (dy / dist) * strength * 3
            );
        }
    }

    // Seek toward mouse cursor (attract mode)
    seek(mouseX, mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distSq = dx * dx + dy * dy;
        const attractRadius = CONFIG.mouseRadius * 3; // Larger radius for attraction
        const radiusSq = attractRadius * attractRadius;

        if (distSq < radiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            // Stronger force when further away (inverse of flee)
            const strength = (dist / attractRadius) * CONFIG.mouseForce * 0.8;
            this.applyForce(
                (dx / dist) * strength,
                (dy / dist) * strength
            );
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
