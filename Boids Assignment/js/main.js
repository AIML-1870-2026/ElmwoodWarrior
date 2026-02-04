// Main entry point - initializes simulation and runs animation loop

// Global instances
let canvas, renderer, flock, ui;

// FPS tracking
let lastTime = 0;
let frameCount = 0;
let fps = 0;
let fpsUpdateTime = 0;

// Initialize simulation
function init() {
    // Get canvas
    canvas = document.getElementById('canvas');

    // Create renderer
    renderer = new Renderer(canvas);
    const { width, height } = renderer.resize();

    // Create flock
    flock = new Flock(width, height);
    flock.init(CONFIG.agentCount);

    // Create UI controller
    ui = new UI(flock);

    // Set initial theme
    ui.setTheme(CONFIG.theme);

    // Setup event listeners
    setupEvents();

    // Start animation loop
    requestAnimationFrame(animate);
}

// Setup window and mouse events
function setupEvents() {
    // Handle window resize
    window.addEventListener('resize', () => {
        const { width, height } = renderer.resize();
        flock.resize(width, height);
    });

    // Track mouse position
    canvas.addEventListener('mousemove', (e) => {
        flock.setMouse(e.clientX, e.clientY);
    });

    // Clear mouse when leaving canvas
    canvas.addEventListener('mouseleave', () => {
        flock.setMouse(-1000, -1000);
    });

    // Handle touch for mobile
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        flock.setMouse(touch.clientX, touch.clientY);
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        flock.setMouse(-1000, -1000);
    });
}

// Main animation loop
function animate(currentTime) {
    // Calculate FPS
    frameCount++;
    const elapsed = currentTime - fpsUpdateTime;

    if (elapsed >= 500) { // Update FPS every 500ms
        fps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        fpsUpdateTime = currentTime;

        // Update stats display
        const stats = flock.getStats();
        ui.updateStats(fps, stats);
    }

    // Update simulation
    flock.update();

    // Render
    renderer.render(flock);

    // Continue loop
    requestAnimationFrame(animate);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
