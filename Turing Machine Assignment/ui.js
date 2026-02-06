/**
 * UI Controller for Turing Patterns Explorer
 * Handles all user interface interactions
 */

class UIController {
    constructor(app) {
        this.app = app;
        this.isDrawing = false;
        this.brushSize = 20;
        this.toolMode = 'addB';

        // Preset patterns with F and K values
        this.presets = {
            'Spots': { f: 0.035, k: 0.065 },
            'Stripes': { f: 0.035, k: 0.060 },
            'Spirals': { f: 0.014, k: 0.054 },
            'Maze': { f: 0.029, k: 0.057 },
            'Waves': { f: 0.014, k: 0.045 },
            'Unstable': { f: 0.026, k: 0.051 }
        };

        this.init();
    }

    /**
     * Initialize all UI event listeners
     */
    init() {
        this.setupPresetButtons();
        this.setupSliders();
        this.setupControlButtons();
        this.setupToolControls();
        this.setupColorScheme();
        this.setupCanvasInteraction();
        this.setupParameterMap();
        this.setupExport();
        this.setupKeyboardShortcuts();
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
        const spotsBtn = document.querySelector('.preset-btn[data-k="0.065"]');
        if (spotsBtn) spotsBtn.classList.add('active');
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
        if (this.app.running) {
            btn.textContent = 'Pause';
            btn.classList.remove('paused');
        } else {
            btn.textContent = 'Play';
            btn.classList.add('paused');
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

            // Show and position brush cursor
            brushCursor.style.display = 'block';
            brushCursor.style.left = (rect.left + x) + 'px';
            brushCursor.style.top = (rect.top + y) + 'px';
            brushCursor.style.width = (this.brushSize * 2) + 'px';
            brushCursor.style.height = (this.brushSize * 2) + 'px';

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

        // Handle touch events for mobile
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
     * Paint chemical at position
     */
    paint(x, y, rect) {
        // Scale coordinates to canvas size
        const canvas = document.getElementById('simulation-canvas');
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        let chemType;
        switch (this.toolMode) {
            case 'addB':
                chemType = 'B';
                break;
            case 'addA':
                chemType = 'A';
                break;
            case 'noise':
                chemType = 'noise';
                break;
            default:
                chemType = 'B';
        }

        this.app.addChemical(canvasX, canvasY, this.brushSize, chemType);
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

            const values = this.app.paramMapRenderer.getValuesFromClick(x, y);

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
            link.download = `turing-pattern-F${f}-K${k}-${timestamp}.png`;
            link.href = dataUrl;
            link.click();
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case ' ':
                    // Space: toggle play/pause
                    e.preventDefault();
                    this.app.running = !this.app.running;
                    this.updatePlayPauseButton();
                    break;
                case 'r':
                    // R: reset
                    this.app.reset();
                    break;
                case 'c':
                    // C: clear
                    this.app.clear();
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
