/**
 * Turing Patterns Explorer - Main Application
 * Initializes and coordinates all components
 */

class TuringPatternsApp {
    constructor() {
        // Get canvas elements
        this.canvas = document.getElementById('simulation-canvas');
        this.paramMapCanvas = document.getElementById('param-map');

        // Initialize simulation (256x256 grid)
        this.simulation = new Simulation(256, 256);

        // Initialize renderers
        this.renderer = new Renderer(this.canvas, this.simulation);
        this.paramMapRenderer = new ParameterMapRenderer(this.paramMapCanvas);

        // Initialize UI controller
        this.ui = new UIController(this);

        // Animation state
        this.running = true;
        this.stepsPerFrame = 5;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsUpdateInterval = 500; // Update FPS every 500ms
        this.lastFPSUpdate = 0;

        // Start the main loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    /**
     * Main animation loop
     */
    animate(timestamp) {
        // Calculate FPS
        this.frameCount++;
        if (timestamp - this.lastFPSUpdate >= this.fpsUpdateInterval) {
            const fps = (this.frameCount * 1000) / (timestamp - this.lastFPSUpdate);
            this.ui.updateFPS(fps);
            this.frameCount = 0;
            this.lastFPSUpdate = timestamp;
        }

        // Update simulation if running
        if (this.running) {
            this.simulation.update(this.stepsPerFrame);
        }

        // Always render
        this.renderer.render();

        // Continue animation loop
        requestAnimationFrame(this.animate);
    }

    /**
     * Set F and K parameters
     */
    setParameters(f, k) {
        this.simulation.setParameters(f, k);
        this.paramMapRenderer.setPosition(f, k);
    }

    /**
     * Reset simulation to initial conditions
     */
    reset() {
        this.simulation.reset();
    }

    /**
     * Clear simulation (fill with chemical A)
     */
    clear() {
        this.simulation.clear();
    }

    /**
     * Set color scheme
     */
    setColorScheme(scheme) {
        this.renderer.setColorScheme(scheme);
    }

    /**
     * Add chemical at canvas position
     */
    addChemical(x, y, radius, type) {
        this.simulation.addChemical(x, y, radius, type);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TuringPatternsApp();
});
