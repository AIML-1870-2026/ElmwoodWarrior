// UI Controller - handles control panel interactions

class UI {
    constructor(flock) {
        this.flock = flock;

        // Cache DOM elements
        this.panel = document.getElementById('control-panel');
        this.header = document.getElementById('panel-header');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.wrapBtn = document.getElementById('wrap-btn');
        this.bounceBtn = document.getElementById('bounce-btn');
        this.themeSelect = document.getElementById('theme-select');

        // Stats elements
        this.fpsDisplay = document.getElementById('fps');
        this.countDisplay = document.getElementById('agent-count');
        this.speedDisplay = document.getElementById('avg-speed');
        this.neighborsDisplay = document.getElementById('avg-neighbors');

        // Sliders
        this.sliders = {
            separation: document.getElementById('separation'),
            alignment: document.getElementById('alignment'),
            cohesion: document.getElementById('cohesion'),
            radius: document.getElementById('radius'),
            maxSpeed: document.getElementById('max-speed'),
            maxForce: document.getElementById('max-force'),
            agentCount: document.getElementById('agent-count-slider'),
            trailLength: document.getElementById('trail-length')
        };

        // Value displays
        this.valueDisplays = {
            separation: document.getElementById('separation-value'),
            alignment: document.getElementById('alignment-value'),
            cohesion: document.getElementById('cohesion-value'),
            radius: document.getElementById('radius-value'),
            maxSpeed: document.getElementById('max-speed-value'),
            maxForce: document.getElementById('max-force-value'),
            agentCount: document.getElementById('count-value'),
            trailLength: document.getElementById('trail-value')
        };

        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        // Panel toggle
        this.header.addEventListener('click', () => {
            this.panel.classList.toggle('collapsed');
        });

        // Sliders
        this.sliders.separation.addEventListener('input', (e) => {
            CONFIG.separation = parseFloat(e.target.value);
            this.valueDisplays.separation.textContent = CONFIG.separation.toFixed(1);
            this.clearActivePreset();
        });

        this.sliders.alignment.addEventListener('input', (e) => {
            CONFIG.alignment = parseFloat(e.target.value);
            this.valueDisplays.alignment.textContent = CONFIG.alignment.toFixed(1);
            this.clearActivePreset();
        });

        this.sliders.cohesion.addEventListener('input', (e) => {
            CONFIG.cohesion = parseFloat(e.target.value);
            this.valueDisplays.cohesion.textContent = CONFIG.cohesion.toFixed(1);
            this.clearActivePreset();
        });

        this.sliders.radius.addEventListener('input', (e) => {
            CONFIG.neighborRadius = parseInt(e.target.value);
            this.valueDisplays.radius.textContent = CONFIG.neighborRadius;
            this.flock.updateGridCellSize();
            this.clearActivePreset();
        });

        this.sliders.maxSpeed.addEventListener('input', (e) => {
            CONFIG.maxSpeed = parseFloat(e.target.value);
            this.valueDisplays.maxSpeed.textContent = CONFIG.maxSpeed.toFixed(1);
            this.clearActivePreset();
        });

        this.sliders.maxForce.addEventListener('input', (e) => {
            CONFIG.maxForce = parseFloat(e.target.value);
            this.valueDisplays.maxForce.textContent = CONFIG.maxForce.toFixed(2);
            this.clearActivePreset();
        });

        this.sliders.agentCount.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            CONFIG.agentCount = count;
            this.valueDisplays.agentCount.textContent = count;
            this.flock.setCount(count);
        });

        // Trail length slider
        this.sliders.trailLength.addEventListener('input', (e) => {
            CONFIG.trailLength = parseInt(e.target.value);
            this.valueDisplays.trailLength.textContent = CONFIG.trailLength;
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyPreset(btn.dataset.preset);
                this.setActivePreset(btn);
            });
        });

        // Boundary mode
        this.wrapBtn.addEventListener('click', () => {
            this.setBoundaryMode('wrap');
        });

        this.bounceBtn.addEventListener('click', () => {
            this.setBoundaryMode('bounce');
        });

        // Theme selector
        this.themeSelect.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        // Pause/Resume
        this.pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });

        // Reset
        this.resetBtn.addEventListener('click', () => {
            this.flock.reset();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'r':
                    this.flock.reset();
                    break;
                case 't':
                    this.cycleTheme();
                    break;
                case 'b':
                    this.toggleBoundaryMode();
                    break;
                case 's':
                    this.panel.classList.toggle('collapsed');
                    break;
                case '1':
                    this.applyPresetByIndex(0);
                    break;
                case '2':
                    this.applyPresetByIndex(1);
                    break;
                case '3':
                    this.applyPresetByIndex(2);
                    break;
            }
        });
    }

    togglePause() {
        CONFIG.paused = !CONFIG.paused;
        this.pauseBtn.textContent = CONFIG.paused ? 'Resume' : 'Pause';
        this.pauseBtn.classList.toggle('paused', CONFIG.paused);
    }

    setBoundaryMode(mode) {
        CONFIG.boundaryMode = mode;
        this.wrapBtn.classList.toggle('active', mode === 'wrap');
        this.bounceBtn.classList.toggle('active', mode === 'bounce');
    }

    toggleBoundaryMode() {
        const newMode = CONFIG.boundaryMode === 'wrap' ? 'bounce' : 'wrap';
        this.setBoundaryMode(newMode);
    }

    cycleTheme() {
        const currentIndex = THEME_ORDER.indexOf(CONFIG.theme);
        const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
        const nextTheme = THEME_ORDER[nextIndex];
        this.setTheme(nextTheme);
        this.themeSelect.value = nextTheme;
    }

    applyPresetByIndex(index) {
        const presetNames = Object.keys(PRESETS);
        if (index < presetNames.length) {
            const presetName = presetNames[index];
            this.applyPreset(presetName);
            const btn = document.querySelector(`[data-preset="${presetName}"]`);
            if (btn) this.setActivePreset(btn);
        }
    }

    applyPreset(presetName) {
        const preset = PRESETS[presetName];
        if (!preset) return;

        // Update CONFIG
        CONFIG.separation = preset.separation;
        CONFIG.alignment = preset.alignment;
        CONFIG.cohesion = preset.cohesion;
        CONFIG.neighborRadius = preset.neighborRadius;
        CONFIG.maxSpeed = preset.maxSpeed;
        CONFIG.maxForce = preset.maxForce;

        // Update sliders
        this.sliders.separation.value = preset.separation;
        this.sliders.alignment.value = preset.alignment;
        this.sliders.cohesion.value = preset.cohesion;
        this.sliders.radius.value = preset.neighborRadius;
        this.sliders.maxSpeed.value = preset.maxSpeed;
        this.sliders.maxForce.value = preset.maxForce;

        // Update displays
        this.valueDisplays.separation.textContent = preset.separation.toFixed(1);
        this.valueDisplays.alignment.textContent = preset.alignment.toFixed(1);
        this.valueDisplays.cohesion.textContent = preset.cohesion.toFixed(1);
        this.valueDisplays.radius.textContent = preset.neighborRadius;
        this.valueDisplays.maxSpeed.textContent = preset.maxSpeed.toFixed(1);
        this.valueDisplays.maxForce.textContent = preset.maxForce.toFixed(2);

        // Update spatial grid
        this.flock.updateGridCellSize();
    }

    setActivePreset(btn) {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    clearActivePreset() {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    }

    setTheme(themeName) {
        CONFIG.theme = themeName;

        // Update body class for stats styling
        document.body.className = '';
        document.body.classList.add(THEMES[themeName].bodyClass);

        // Update background color
        document.body.style.background = THEMES[themeName].background;
    }

    updateStats(fps, stats) {
        this.fpsDisplay.textContent = fps;
        this.countDisplay.textContent = stats.count;
        this.speedDisplay.textContent = stats.avgSpeed;
        this.neighborsDisplay.textContent = stats.avgNeighbors;
    }
}
