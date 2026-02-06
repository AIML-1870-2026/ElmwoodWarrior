// Configuration and Presets for Traffic Boids Simulation

const CONFIG = {
    // Default flocking parameters - tuned for organic schooling behavior
    separation: 1.0,
    alignment: 2.0,
    cohesion: 1.2,
    neighborRadius: 100,
    maxSpeed: 3.5,
    maxForce: 0.05,

    // Agent settings
    agentCount: 300,

    // Perception cone (270 degrees = 3/4 of a circle)
    fovAngle: Math.PI * 1.5,
    fovHalfAngle: Math.PI * 0.75,

    // Mouse interaction settings
    mouseRadius: 120,
    mouseForce: 2.5,
    mouseAttract: false, // false = flee from mouse, true = follow mouse

    // Boundary mode: 'wrap' or 'bounce'
    boundaryMode: 'wrap',

    // Visual theme: 'night', 'rush', or 'f1'
    theme: 'rush',

    // Simulation state
    paused: false,

    // Trail settings for Night City theme
    trailLength: 25,
    trailFade: 0.92,

    // Max group size (percentage of total agents)
    maxGroupPercent: 100
};

// Preset configurations that produce visibly distinct behaviors
const PRESETS = {
    schooling: {
        separation: 0.8,
        alignment: 3.5,
        cohesion: 1.0,
        neighborRadius: 120,
        maxSpeed: 3.5,
        maxForce: 0.04,
        description: 'Synchronized formations - fish school behavior'
    },
    chaotic: {
        separation: 2.0,
        alignment: 0.2,
        cohesion: 0.2,
        neighborRadius: 40,
        maxSpeed: 6,
        maxForce: 0.2,
        description: 'Erratic swarm - panicked crowd behavior'
    },
    cluster: {
        separation: 0.6,
        alignment: 2.0,
        cohesion: 3.5,
        neighborRadius: 150,
        maxSpeed: 2.5,
        maxForce: 0.03,
        description: 'Dense flock that flows together organically'
    }
};

// Theme configurations
const THEMES = {
    night: {
        name: 'Night City',
        background: '#0a0a0f',
        bodyClass: 'theme-night',
        showTrails: true
    },
    rush: {
        name: 'Rush Hour',
        background: '#e8e8e8',
        bodyClass: 'theme-rush',
        showTrails: false
    },
    f1: {
        name: 'Formula 1',
        background: '#1a1a1a',
        bodyClass: 'theme-f1',
        showTrails: false
    }
};

// Theme order for cycling
const THEME_ORDER = ['night', 'rush', 'f1'];
