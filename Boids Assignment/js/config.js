// Configuration and Presets for Traffic Boids Simulation

const CONFIG = {
    // Default flocking parameters
    separation: 1.5,
    alignment: 1.0,
    cohesion: 1.0,
    neighborRadius: 75,
    maxSpeed: 4,
    maxForce: 0.1,

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
    theme: 'night',

    // Simulation state
    paused: false,

    // Trail settings for Night City theme
    trailLength: 25,
    trailFade: 0.92
};

// Preset configurations that produce visibly distinct behaviors
const PRESETS = {
    schooling: {
        separation: 0.5,
        alignment: 3.0,
        cohesion: 1.5,
        neighborRadius: 100,
        maxSpeed: 4,
        maxForce: 0.1,
        description: 'Synchronized formations moving as a coordinated unit'
    },
    chaotic: {
        separation: 1.2,
        alignment: 0.3,
        cohesion: 0.3,
        neighborRadius: 30,
        maxSpeed: 7,
        maxForce: 0.25,
        description: 'Erratic, unpredictable motion; panicked crowd behavior'
    },
    cluster: {
        separation: 1.0,
        alignment: 1.5,
        cohesion: 4.0,
        neighborRadius: 75,
        maxSpeed: 3,
        maxForce: 0.08,
        description: 'Dense blob that moves together toward center mass'
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
