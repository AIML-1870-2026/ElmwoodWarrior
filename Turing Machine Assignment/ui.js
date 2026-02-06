/**
 * UI Controller for Morphogenesis Lab
 * Handles all user interface interactions
 */

class UIController {
    constructor(app) {
        this.app = app;
        this.isDrawing = false;
        this.brushSize = 20;
        this.toolMode = 'addB';
        this.symmetryMode = 0; // 0=off, 1=2-fold, 2=4-fold, 3=8-fold
        this.isFullscreen = false;

        // Preset patterns with F and K values
        this.presets = {
            'Coral': { f: 0.037, k: 0.060 },
            'Worms': { f: 0.030, k: 0.055 },
            'Bubbles': { f: 0.025, k: 0.060 },
            'Fingerprint': { f: 0.039, k: 0.058 },
            'Mitosis': { f: 0.022, k: 0.051 },
            'Solitons': { f: 0.040, k: 0.062 },
            'Pulsing': { f: 0.018, k: 0.050 },
            'Chaos': { f: 0.062, k: 0.061 }
        };

        this.init();
    }

    /**
     * Initialize all UI event listeners
     */
    init() {
        this.setupPresetButtons();
        this.setupSeedButtons();
        this.setupSliders();
        this.setupControlButtons();
        this.setupToolControls();
        this.setupColorScheme();
        this.setupCanvasInteraction();
        this.setupParameterMap();
        this.setupExport();
        this.setupKeyboardShortcuts();
        this.setupCanvasControls();
    }

    /**
     * Setup preset pattern buttons
     */
    setupPresetButtons() {
        const buttons = document.querySelectorAll('.preset-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const f = parseFloat(btn.dataset.f);
                const k = parseFloat(btn.dataset.k);

                this.app.setParameters(f, k);
                this.app.reset();
                this.app.running = true;

                // Update UI
                document.getElementById('feed-rate').value = f;
                document.getElementById('kill-rate').value = k;
                document.getElementById('feed-value').textContent = f.toFixed(3);
                document.getElementById('kill-value').textContent = k.toFixed(3);

                this.updatePatternLabel(f, k);
                this.updateActivePreset(btn);
                this.updatePlayPauseButton();
            });
        });

        // Set initial active state
        const coralBtn = document.querySelector('.preset-btn[data-k="0.060"][data-f="0.037"]');
        if (coralBtn) coralBtn.classList.add('active');
    }

    /**
     * Setup seed pattern buttons
     */
    setupSeedButtons() {
        const buttons = document.querySelectorAll('.seed-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const seed = btn.dataset.seed;
                this.app.simulation.setSeedPattern(seed);
                this.app.reset();

                // Update active state
                document.querySelectorAll('.seed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    /**
     * Update active preset button styling
     */
    updateActivePreset(activeBtn) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    /**
     * Setup parameter sliders
     */
    setupSliders() {
        const feedSlider = document.getElementById('feed-rate');
        const killSlider = document.getElementById('kill-rate');
        const feedValue = document.getElementById('feed-value');
        const killValue = document.getElementById('kill-value');

        feedSlider.addEventListener('input', () => {
            const f = parseFloat(feedSlider.value);
            feedValue.textContent = f.toFixed(3);
            this.app.setParameters(f, parseFloat(killSlider.value));
            this.updatePatternLabel(f, parseFloat(killSlider.value));
            this.updateActivePreset(null);
        });

        killSlider.addEventListener('input', () => {
            const k = parseFloat(killSlider.value);
            killValue.textContent = k.toFixed(3);
            this.app.setParameters(parseFloat(feedSlider.value), k);
            this.updatePatternLabel(parseFloat(feedSlider.value), k);
            this.updateActivePreset(null);
        });

        // Speed slider
        const speedSlider = document.getElementById('speed');
        const speedValue = document.getElementById('speed-value');

        speedSlider.addEventListener('input', () => {
            const speed = parseInt(speedSlider.value);
            speedValue.textContent = speed;
            this.app.stepsPerFrame = speed;
        });
    }

    /**
     * Update the pattern label based on current F/K values
     */
    updatePatternLabel(f, k) {
        const patternName = document.getElementById('pattern-name');
        const infoF = document.getElementById('info-f');
        const infoK = document.getElementById('info-k');

        // Update info panel
        infoF.textContent = f.toFixed(3);
        infoK.textContent = k.toFixed(3);

        // Check if current values match a preset
        for (const [name, values] of Object.entries(this.presets)) {
            if (Math.abs(values.f - f) < 0.001 && Math.abs(values.k - k) < 0.001) {
                patternName.textContent = name;
                return;
            }
        }
        patternName.textContent = 'Custom';
    }

    /**
     * Setup control buttons (play/pause, reset, clear)
     */
    setupControlButtons() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const clearBtn = document.getElementById('clear-btn');

        playPauseBtn.addEventListener('click', () => {
            this.app.running = !this.app.running;
            this.updatePlayPauseButton();
        });

        resetBtn.addEventListener('click', () => {
            this.app.reset();
        });

        clearBtn.addEventListener('click', () => {
            this.app.clear();
        });
    }

    /**
     * Update play/pause button text and styling
     */
    updatePlayPauseButton() {
        const btn = document.getElementById('play-pause-btn');
        const overlay = document.getElementById('canvas-overlay');

        if (this.app.running) {
            btn.innerHTML = '<span class="btn-icon">||</span> PAUSE';
            btn.classList.remove('paused');
            overlay.classList.remove('visible');
        } else {
            btn.innerHTML = '<span class="btn-icon">></span> PLAY';
            btn.classList.add('paused');
            overlay.classList.add('visible');
        }
    }

    /**
     * Setup tool controls (brush size, tool mode)
     */
    setupToolControls() {
        const brushSlider = document.getElementById('brush-size');
        const brushValue = document.getElementById('brush-value');
        const toolSelect = document.getElementById('tool-mode');

        brushSlider.addEventListener('input', () => {
            this.brushSize = parseInt(brushSlider.value);
            brushValue.textContent = this.brushSize;
        });

        toolSelect.addEventListener('change', () => {
            this.toolMode = toolSelect.value;
        });
    }

    /**
     * Setup color scheme selector
     */
    setupColorScheme() {
        const colorSelect = document.getElementById('color-scheme');

        colorSelect.addEventListener('change', () => {
            this.app.setColorScheme(colorSelect.value);
        });
    }

    /**
     * Setup canvas controls (fullscreen, symmetry, randomize)
     */
    setupCanvasControls() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const symmetryBtn = document.getElementById('symmetry-btn');
        const randomizeBtn = document.getElementById('randomize-btn');

        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        symmetryBtn.addEventListener('click', () => this.toggleSymmetry());
        randomizeBtn.addEventListener('click', () => this.randomizeParameters());
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        document.body.classList.toggle('fullscreen', this.isFullscreen);

        const btn = document.getElementById('fullscreen-btn');
        btn.querySelector('.icon').textContent = this.isFullscreen ? 'X' : '[ ]';
    }

    /**
     * Toggle symmetry mode
     */
    toggleSymmetry() {
        this.symmetryMode = (this.symmetryMode + 1) % 4;
        this.app.simulation.symmetryMode = this.symmetryMode;

        const display = document.getElementById('symmetry-display');
        const labels = ['OFF', '2X', '4X', '8X'];
        display.textContent = labels[this.symmetryMode];
    }

    /**
     * Randomize F/K parameters to find interesting patterns
     */
    randomizeParameters() {
        // Generate random F/K in interesting regions
        const f = 0.01 + Math.random() * 0.06;
        const k = 0.045 + Math.random() * 0.03;

        this.app.setParameters(f, k);
        this.app.reset();
        this.app.running = true;

        // Update UI
        document.getElementById('feed-rate').value = f;
        document.getElementById('kill-rate').value = k;
        document.getElementById('feed-value').textContent = f.toFixed(3);
        document.getElementById('kill-value').textContent = k.toFixed(3);

        this.updatePatternLabel(f, k);
        this.updateActivePreset(null);
        this.updatePlayPauseButton();
    }

    /**
     * Setup canvas interaction (click, drag)
     */
    setupCanvasInteraction() {
        const canvas = document.getElementById('simulation-canvas');
        const brushCursor = document.getElementById('brush-cursor');

        // Update brush cursor on mouse move
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate scaled brush size
            const displayScale = rect.width / canvas.width;
            const displayBrushSize = this.brushSize * displayScale;

            // Position brush cursor
            brushCursor.style.display = 'block';
            brushCursor.style.left = (e.clientX - displayBrushSize) + 'px';
            brushCursor.style.top = (e.clientY - displayBrushSize) + 'px';
            brushCursor.style.width = (displayBrushSize * 2) + 'px';
            brushCursor.style.height = (displayBrushSize * 2) + 'px';

            // Draw if mouse is down
            if (this.isDrawing) {
                this.paint(x, y, rect);
            }
        });

        // Hide cursor when leaving canvas
        canvas.addEventListener('mouseleave', () => {
            brushCursor.style.display = 'none';
        });

        // Start drawing
        canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.paint(x, y, rect);
        });

        // Stop drawing
        canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        document.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        // Handle touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.paint(x, y, rect);
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDrawing) {
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.paint(x, y, rect);
            }
        });

        canvas.addEventListener('touchend', () => {
            this.isDrawing = false;
        });
    }

    /**
     * Paint chemical at position with symmetry
     */
    paint(x, y, rect) {
        const canvas = document.getElementById('simulation-canvas');
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        let chemType;
        switch (this.toolMode) {
            case 'addB': chemType = 'B'; break;
            case 'addA': chemType = 'A'; break;
            case 'noise': chemType = 'noise'; break;
            default: chemType = 'B';
        }

        // Apply symmetry
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        this.app.addChemical(canvasX, canvasY, this.brushSize, chemType);

        if (this.symmetryMode >= 1) {
            // 2-fold symmetry (180 degrees)
            const mirrorX = 2 * centerX - canvasX;
            const mirrorY = 2 * centerY - canvasY;
            this.app.addChemical(mirrorX, mirrorY, this.brushSize, chemType);
        }

        if (this.symmetryMode >= 2) {
            // 4-fold symmetry
            this.app.addChemical(2 * centerX - canvasX, canvasY, this.brushSize, chemType);
            this.app.addChemical(canvasX, 2 * centerY - canvasY, this.brushSize, chemType);
        }

        if (this.symmetryMode >= 3) {
            // 8-fold symmetry (diagonal mirrors)
            const dx = canvasX - centerX;
            const dy = canvasY - centerY;
            this.app.addChemical(centerX + dy, centerY + dx, this.brushSize, chemType);
            this.app.addChemical(centerX - dy, centerY - dx, this.brushSize, chemType);
            this.app.addChemical(centerX + dy, centerY - dx, this.brushSize, chemType);
            this.app.addChemical(centerX - dy, centerY + dx, this.brushSize, chemType);
        }
    }

    /**
     * Setup parameter space map interaction
     */
    setupParameterMap() {
        const paramMap = document.getElementById('param-map');

        paramMap.addEventListener('click', (e) => {
            const rect = paramMap.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Scale to actual canvas size
            const scaleX = paramMap.width / rect.width;
            const scaleY = paramMap.height / rect.height;

            const values = this.app.paramMapRenderer.getValuesFromClick(x * scaleX, y * scaleY);

            // Update sliders and simulation
            document.getElementById('feed-rate').value = values.f;
            document.getElementById('kill-rate').value = values.k;
            document.getElementById('feed-value').textContent = values.f.toFixed(3);
            document.getElementById('kill-value').textContent = values.k.toFixed(3);

            this.app.setParameters(values.f, values.k);
            this.updatePatternLabel(values.f, values.k);
            this.updateActivePreset(null);
        });
    }

    /**
     * Setup image export
     */
    setupExport() {
        const saveBtn = document.getElementById('save-image-btn');

        saveBtn.addEventListener('click', () => {
            const dataUrl = this.app.renderer.exportImage();
            const f = this.app.simulation.F.toFixed(3);
            const k = this.app.simulation.K.toFixed(3);
            const timestamp = Date.now();

            const link = document.createElement('a');
            link.download = `morphogenesis-F${f}-K${k}-${timestamp}.png`;
            link.href = dataUrl;
            link.click();
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.app.running = !this.app.running;
                    this.updatePlayPauseButton();
                    break;
                case 'r':
                    this.app.reset();
                    break;
                case 'c':
                    this.app.clear();
                    break;
                case 's':
                    this.toggleSymmetry();
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
                case '?':
                case '/':
                    this.randomizeParameters();
                    break;
            }
        });
    }

    /**
     * Update FPS counter
     */
    updateFPS(fps) {
        document.getElementById('fps-counter').textContent = fps.toFixed(0);
    }
}

// Export for use in other modules
window.UIController = UIController;
