/* ============================================
   NEO Sentinel — app.js
   React SPA with 4 tabs: Orbital View, Near Earth Watch,
   Close Approaches, Impact Risk Monitor
   ============================================ */

const { useState, useEffect, useRef, useCallback, useMemo } = React;
const {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ScatterChart, Scatter, ZAxis, Cell,
    AreaChart, Area, ResponsiveContainer, LineChart, Line
} = Recharts;

// ── API Config ──
const NASA_KEY = 'xiuMYewZyC6JdsrBAMSS3tTtmbhbBdD8HW3yPYki';
const NEOWS_BASE = 'https://api.nasa.gov/neo/rest/v1';
// JPL APIs lack CORS headers, so route through a proxy
const CORS_PROXY = 'https://corsproxy.io/?';
const CAD_RAW = 'https://ssd-api.jpl.nasa.gov/cad.api';
const SENTRY_RAW = 'https://ssd-api.jpl.nasa.gov/sentry.api';

// ── Helpers ──
function formatDate(d) {
    return d.toISOString().split('T')[0];
}
function todayStr() { return formatDate(new Date()); }
function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}
function auToLD(au) { return (parseFloat(au) / 0.00257).toFixed(2); }
function auToKm(au) { return (parseFloat(au) * 149597870.7).toFixed(0); }
function numberWithCommas(x) { return x ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—'; }

// ── Data cache ──
const cache = {};
function getCached(key) {
    const item = cache[key];
    if (item && Date.now() - item.ts < 5 * 60 * 1000) return item.data;
    return null;
}
function setCache(key, data) {
    cache[key] = { data, ts: Date.now() };
}

// ── API Fetchers ──
async function fetchNeoFeed() {
    const cached = getCached('neofeed');
    if (cached) return cached;
    const start = todayStr();
    const end = formatDate(addDays(new Date(), 6));
    const url = `${NEOWS_BASE}/feed?start_date=${start}&end_date=${end}&api_key=${NASA_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NeoWs error: ${res.status}`);
    const json = await res.json();
    setCache('neofeed', json);
    return json;
}

async function fetchCAD(params = {}) {
    const p = new URLSearchParams({
        'date-min': params.dateMin || todayStr(),
        'date-max': params.dateMax || formatDate(addDays(new Date(), 365)),
        'dist-max': params.distMax || '0.2',
        'sort': params.sort || 'date',
        'diameter': 'true',
        'fullname': 'true',
        'limit': params.limit || '300',
    });
    const key = 'cad_' + p.toString();
    const cached = getCached(key);
    if (cached) return cached;
    const res = await fetch(CORS_PROXY + encodeURIComponent(`${CAD_RAW}?${p}`));
    if (!res.ok) throw new Error(`CAD API error: ${res.status}`);
    const json = await res.json();
    setCache(key, json);
    return json;
}

async function fetchSentry() {
    const cached = getCached('sentry');
    if (cached) return cached;
    const res = await fetch(CORS_PROXY + encodeURIComponent(SENTRY_RAW));
    if (!res.ok) throw new Error(`Sentry API error: ${res.status}`);
    const json = await res.json();
    setCache('sentry', json);
    return json;
}

// ── Parse NeoWs feed into flat list ──
function parseNeoFeed(json) {
    const neos = [];
    const dates = Object.keys(json.near_earth_objects).sort();
    dates.forEach(date => {
        json.near_earth_objects[date].forEach(obj => {
            const ca = obj.close_approach_data[0] || {};
            neos.push({
                id: obj.id,
                name: obj.name,
                date,
                hazardous: obj.is_potentially_hazardous_asteroid,
                diamMin: parseFloat(obj.estimated_diameter?.meters?.estimated_diameter_min || 0),
                diamMax: parseFloat(obj.estimated_diameter?.meters?.estimated_diameter_max || 0),
                diamKmMin: parseFloat(obj.estimated_diameter?.kilometers?.estimated_diameter_min || 0),
                diamKmMax: parseFloat(obj.estimated_diameter?.kilometers?.estimated_diameter_max || 0),
                magnitude: parseFloat(obj.absolute_magnitude_h || 0),
                missKm: parseFloat(ca.miss_distance?.kilometers || 0),
                missLD: parseFloat(ca.miss_distance?.lunar || 0),
                missAU: parseFloat(ca.miss_distance?.astronomical || 0),
                velocityKms: parseFloat(ca.relative_velocity?.kilometers_per_second || 0),
                velocityKmh: parseFloat(ca.relative_velocity?.kilometers_per_hour || 0),
                approachDate: ca.close_approach_date_full || ca.close_approach_date || date,
                orbitId: ca.orbit_id || '—',
            });
        });
    });
    return { neos, dates };
}

// ── Parse CAD data ──
function parseCAD(json) {
    if (!json.data || !json.fields) return [];
    const fi = {};
    json.fields.forEach((f, i) => fi[f] = i);
    return json.data.map(row => ({
        des: row[fi['des']] || '—',
        fullname: row[fi['fullname']] || row[fi['des']] || '—',
        cd: row[fi['cd']] || '—',
        dist: parseFloat(row[fi['dist']] || 0),
        distMin: parseFloat(row[fi['dist_min']] || 0),
        distMax: parseFloat(row[fi['dist_max']] || 0),
        vRel: parseFloat(row[fi['v_rel']] || 0),
        vInf: parseFloat(row[fi['v_inf']] || 0),
        h: parseFloat(row[fi['h']] || 0),
        diameter: row[fi['diameter']] ? parseFloat(row[fi['diameter']]) : null,
        diameterSigma: row[fi['diameter_sigma']] ? parseFloat(row[fi['diameter_sigma']]) : null,
    }));
}

// ── Parse Sentry data ──
function parseSentry(json) {
    if (!json.data) return [];
    return json.data.map(obj => ({
        des: obj.des || '—',
        fullname: obj.fullname || obj.des || '—',
        ip: parseFloat(obj.ip || 0),
        ps: parseFloat(obj.ps_cum || obj.ps || 0),
        ts: parseInt(obj.ts_max || obj.ts || 0),
        nImp: parseInt(obj.n_imp || 0),
        lastObs: obj.last_obs || '—',
        range: obj.range || '—',
        diameter: obj.diameter ? parseFloat(obj.diameter) : null,
        vInf: obj.v_inf ? parseFloat(obj.v_inf) : null,
        h: obj.h ? parseFloat(obj.h) : null,
    }));
}

// ══════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════

// ── Loading Skeletons ──
function SkeletonCards() {
    return (
        <div className="stats-row">
            {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
    );
}
function SkeletonTable() {
    return (
        <div style={{padding: '20px'}}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-row"></div>)}
        </div>
    );
}
function SkeletonChart() {
    return <div className="skeleton skeleton-chart"></div>;
}

// ── Error Card ──
function ErrorCard({ message, detail, onRetry }) {
    return (
        <div className="error-card">
            <div className="error-icon">⚠️</div>
            <div className="error-msg">{message || 'Failed to load data'}</div>
            {detail && <div className="error-detail">{detail}</div>}
            {onRetry && <button className="retry-btn" onClick={onRetry}>Retry</button>}
        </div>
    );
}

// ── Stat Card ──
function StatCard({ label, value, sub, color }) {
    return (
        <div className="stat-card">
            <div className="label">{label}</div>
            <div className={`value ${color || ''}`}>{value}</div>
            {sub && <div className="sub">{sub}</div>}
        </div>
    );
}

// ── Sort helpers for tables ──
function useSortable(data, defaultKey, defaultDir = 'asc') {
    const [sortKey, setSortKey] = useState(defaultKey);
    const [sortDir, setSortDir] = useState(defaultDir);
    const sorted = useMemo(() => {
        if (!data) return [];
        const copy = [...data];
        copy.sort((a, b) => {
            let va = a[sortKey], vb = b[sortKey];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return copy;
    }, [data, sortKey, sortDir]);
    const toggleSort = (key) => {
        if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };
    const arrow = (key) => key === sortKey ? (sortDir === 'asc' ? '▲' : '▼') : '';
    return { sorted, toggleSort, arrow, sortKey, sortDir };
}

// ── Pagination ──
function usePagination(data, perPage = 25) {
    const [page, setPage] = useState(0);
    useEffect(() => setPage(0), [data]);
    const totalPages = Math.ceil((data?.length || 0) / perPage);
    const paged = data ? data.slice(page * perPage, (page + 1) * perPage) : [];
    return { paged, page, setPage, totalPages };
}

function Pagination({ page, totalPages, setPage }) {
    if (totalPages <= 1) return null;
    return (
        <div className="pagination">
            <button className="page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {page + 1} / {totalPages}
            </span>
            <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
    );
}

// ══════════════════════════════════════
// TAB 0 — ORBITAL VIEW
// ══════════════════════════════════════

function OrbitalView({ neoData, dates, onSelectNeo }) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const tooltipRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
    const [hudInfo, setHudInfo] = useState({ range: '', total: 0, hazardous: 0 });

    useEffect(() => {
        if (!neoData || !containerRef.current) return;
        if (sceneRef.current) return; // already initialized

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Stats
        const total = neoData.length;
        const hazCount = neoData.filter(n => n.hazardous).length;
        const range = dates.length > 0 ? `${dates[0]} — ${dates[dates.length - 1]}` : '';
        setHudInfo({ range, total, hazardous: hazCount });

        // Scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
        camera.position.set(0, 15, 40);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 5;
        controls.maxDistance = 500;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
        scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(50, 30, 50);
        scene.add(sunLight);
        const pointLight = new THREE.PointLight(0x00b4d8, 0.4, 100);
        pointLight.position.set(-10, 10, -10);
        scene.add(pointLight);

        // Starfield (distant backdrop only)
        const starGeo = new THREE.BufferGeometry();
        const starCount = 1500;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            // Place stars on a distant shell so they never mix with scene objects
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 800 + Math.random() * 200;
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = r * Math.cos(phi);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({ color: 0x888899, size: 0.3, sizeAttenuation: true });
        scene.add(new THREE.Points(starGeo, starMat));

        // Earth with real texture
        const earthRadius = 4;
        const textureLoader = new THREE.TextureLoader();
        const earthGeo = new THREE.SphereGeometry(earthRadius, 128, 128);
        const earthMat = new THREE.MeshPhongMaterial({
            color: 0x2244aa,
            emissive: 0x112244,
            specular: 0x4488cc,
            shininess: 25,
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        scene.add(earth);

        // Load real Earth textures
        textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-blue-marble.jpg', tex => {
            earthMat.map = tex;
            earthMat.color.set(0xffffff);
            earthMat.emissive.set(0x050510);
            earthMat.needsUpdate = true;
        });
        // Bump map for terrain relief
        textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-topology.png', tex => {
            earthMat.bumpMap = tex;
            earthMat.bumpScale = 0.15;
            earthMat.needsUpdate = true;
        });
        // Specular map (water shines, land doesn't)
        textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-water.png', tex => {
            earthMat.specularMap = tex;
            earthMat.needsUpdate = true;
        });

        // Earth atmosphere glow (inner)
        const glowGeo = new THREE.SphereGeometry(earthRadius * 1.03, 64, 64);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x4499ff,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
        });
        scene.add(new THREE.Mesh(glowGeo, glowMat));

        // Earth atmosphere glow (outer)
        const outerGlowGeo = new THREE.SphereGeometry(earthRadius * 1.12, 64, 64);
        const outerGlowMat = new THREE.MeshBasicMaterial({
            color: 0x3399ff,
            transparent: true,
            opacity: 0.04,
            side: THREE.BackSide,
        });
        scene.add(new THREE.Mesh(outerGlowGeo, outerGlowMat));

        // Clouds layer with real texture
        const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.015, 64, 64);
        const cloudMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
        });
        const clouds = new THREE.Mesh(cloudGeo, cloudMat);
        scene.add(clouds);
        textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-clouds.png', tex => {
            cloudMat.map = tex;
            cloudMat.alphaMap = tex;
            cloudMat.needsUpdate = true;
        });

        // No separate land mesh needed - texture handles it
        const land = clouds; // keep reference for rotation sync

        // Night lights on dark side
        const nightGeo = new THREE.SphereGeometry(earthRadius * 1.001, 128, 128);
        const nightMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const nightMesh = new THREE.Mesh(nightGeo, nightMat);
        scene.add(nightMesh);
        textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-night.jpg', tex => {
            nightMat.map = tex;
            nightMat.opacity = 0.4;
            nightMat.needsUpdate = true;
        });

        // Moon with real texture
        const moonRadius = 1.2;
        const moonGeo = new THREE.SphereGeometry(moonRadius, 64, 64);
        const moonMat = new THREE.MeshPhongMaterial({
            color: 0xbbbbbb,
            emissive: 0x222222,
            shininess: 3,
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        textureLoader.load('https://unpkg.com/three-globe@2.24.10/example/img/moon.jpg', tex => {
            moonMat.map = tex;
            moonMat.color.set(0xffffff);
            moonMat.needsUpdate = true;
        });
        const moonDist = 30; // 1 LD in scene
        moon.position.set(moonDist, 0, 0);
        scene.add(moon);

        // Moon glow
        const moonGlow = new THREE.Mesh(
            new THREE.SphereGeometry(moonRadius * 1.15, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.06, side: THREE.BackSide })
        );
        moonGlow.position.copy(moon.position);
        scene.add(moonGlow);

        // Distance reference spheres (wireframe) — true 3D distance shells
        const ringDistances = [
            { ld: 1, label: '1 LD' },
            { ld: 2, label: '2 LD' },
            { ld: 5, label: '5 LD' },
            { ld: 10, label: '10 LD' },
            { ld: 20, label: '20 LD' },
            { ld: 40, label: '40 LD' },
        ];
        // Logarithmic distance scaling: keeps close objects spread out, compresses far ones
        // so 1 LD, 10 LD, and 40 LD are all visually distinct
        function ldToScene(ld) {
            return Math.log2(1 + ld) * moonDist;
        }

        ringDistances.forEach(r => {
            const radius = ldToScene(r.ld);
            const shellGeo = new THREE.SphereGeometry(radius, 32, 16);
            const shellMat = new THREE.MeshBasicMaterial({
                color: 0x1e3a5f,
                transparent: true,
                opacity: 0.06,
                wireframe: true,
            });
            const shell = new THREE.Mesh(shellGeo, shellMat);
            scene.add(shell);
            // Also keep a flat reference ring on the ecliptic
            const ringGeo = new THREE.RingGeometry(radius - 0.03, radius + 0.03, 128);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x1e293b,
                transparent: true,
                opacity: 0.25,
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            scene.add(ring);
        });

        // Asteroids — positioned in full 3D space using approach data
        // Use velocity as a proxy for approach direction and date for angular spread
        const asteroidMeshes = [];
        const top50 = [...neoData].sort((a, b) => a.missLD - b.missLD).slice(0, 50);
        top50.forEach((neo, idx) => {
            const sizeScale = Math.max(1.2, Math.min(5.0, neo.diamMax / 60));
            const geo = neo.hazardous
                ? new THREE.IcosahedronGeometry(sizeScale, 1)
                : new THREE.DodecahedronGeometry(sizeScale, 1);
            // Color-coded: hazardous = pulsing red/orange, safe = cyan/blue
            const baseColor = neo.hazardous ? 0xff4400 : 0x00b4d8;
            const emissiveColor = neo.hazardous ? 0xff2200 : 0x0066aa;
            const mat = new THREE.MeshPhongMaterial({
                color: baseColor,
                emissive: emissiveColor,
                emissiveIntensity: neo.hazardous ? 1.0 : 0.6,
                flatShading: true,
                shininess: 30,
            });
            // Store default colors for hover reset
            mat.userData = { emissiveColor, emissiveIntensity: mat.emissiveIntensity };
            const mesh = new THREE.Mesh(geo, mat);

            // Add outer glow shell — hazardous gets a bigger, brighter glow
            const glowGeo = neo.hazardous
                ? new THREE.IcosahedronGeometry(sizeScale * 1.8, 0)
                : new THREE.DodecahedronGeometry(sizeScale * 1.4, 0);
            const glowShell = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
                color: neo.hazardous ? 0xff2200 : 0x0088cc,
                transparent: true,
                opacity: neo.hazardous ? 0.25 : 0.12,
                side: THREE.BackSide,
            }));
            mesh.add(glowShell);

            // 3D positioning using golden spiral for uniform spherical distribution
            // Log scale so distant objects don't all pile up at the same radius
            const dist = ldToScene(neo.missLD);
            // Golden angle spiral — evenly distributes points on a sphere
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const theta = goldenAngle * idx;
            // Map index to full [-1, 1] range for uniform vertical spread
            const y = 1 - (2 * idx) / Math.max(top50.length - 1, 1);
            const sinPhi = Math.sqrt(1 - y * y);
            // Convert to cartesian — full sphere coverage, top and bottom
            mesh.position.set(
                dist * sinPhi * Math.cos(theta),
                dist * y,
                dist * sinPhi * Math.sin(theta)
            );
            mesh.userData = neo;
            scene.add(mesh);
            asteroidMeshes.push(mesh);
        });

        // Raycaster for hover
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredMesh = null;

        function onMouseMove(e) {
            const rect = container.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(asteroidMeshes);
            if (intersects.length > 0) {
                container.style.cursor = 'crosshair';
                const mesh = intersects[0].object;
                if (hoveredMesh !== mesh) {
                    if (hoveredMesh) {
                        const defaults = hoveredMesh.material.userData;
                        hoveredMesh.material.emissive.set(defaults.emissiveColor);
                        hoveredMesh.material.emissiveIntensity = defaults.emissiveIntensity;
                    }
                    hoveredMesh = mesh;
                    mesh.material.emissive.set(0xffffff);
                    mesh.material.emissiveIntensity = 1.5;
                }
                setTooltip({
                    visible: true,
                    x: e.clientX - rect.left + 16,
                    y: e.clientY - rect.top - 10,
                    data: mesh.userData,
                });
            } else {
                container.style.cursor = 'default';
                if (hoveredMesh) {
                    const defaults = hoveredMesh.material.userData;
                    hoveredMesh.material.emissive.set(defaults.emissiveColor);
                    hoveredMesh.material.emissiveIntensity = defaults.emissiveIntensity;
                    hoveredMesh = null;
                }
                setTooltip(t => ({ ...t, visible: false }));
            }
        }
        container.addEventListener('mousemove', onMouseMove);

        // Click to navigate to asteroid detail
        function onClick(e) {
            if (!hoveredMesh) return;
            const neo = hoveredMesh.userData;
            if (onSelectNeo) onSelectNeo(neo);
        }
        container.addEventListener('click', onClick);

        // Animate
        let animId;
        function animate() {
            animId = requestAnimationFrame(animate);
            earth.rotation.y += 0.001;
            nightMesh.rotation.y += 0.001;
            clouds.rotation.y += 0.0013;
            clouds.rotation.x += 0.0001;
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // Resize
        function onResize() {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);

        sceneRef.current = { renderer, animId, onResize, onMouseMove, onClick };

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            container.removeEventListener('mousemove', onMouseMove);
            container.removeEventListener('click', onClick);
            renderer.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
            sceneRef.current = null;
        };
    }, [neoData, dates]);

    return (
        <div id="orbital-canvas-container" ref={containerRef}>
            <div className="orbital-hud">
                <h2>THIS WEEK</h2>
                <div className="hud-stat">{hudInfo.range}</div>
                <div className="hud-stat">Total NEOs: <span>{hudInfo.total}</span></div>
                <div className="hud-stat">Hazardous: <span style={{ color: 'var(--accent-amber)' }}>{hudInfo.hazardous}</span></div>
            </div>
            <div
                className={`asteroid-tooltip ${tooltip.visible ? 'visible' : ''}`}
                style={{ left: tooltip.x, top: tooltip.y }}
                ref={tooltipRef}
            >
                {tooltip.data && (
                    <>
                        <div className="tt-name">{tooltip.data.name}</div>
                        <div className="tt-row">Diameter: <span>{tooltip.data.diamMin.toFixed(0)}–{tooltip.data.diamMax.toFixed(0)} m</span></div>
                        <div className="tt-row">Miss Dist: <span>{tooltip.data.missLD.toFixed(2)} LD</span></div>
                        <div className="tt-row">Velocity: <span>{tooltip.data.velocityKms.toFixed(1)} km/s</span></div>
                        <div className="tt-row">Hazardous: <span style={{ color: tooltip.data.hazardous ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                            {tooltip.data.hazardous ? 'YES' : 'No'}
                        </span></div>
                        <div className="tt-row" style={{ marginTop: 4, opacity: 0.6, fontSize: '0.7rem' }}>Click for full details</div>
                    </>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// TAB 1 — NEAR EARTH WATCH
// ══════════════════════════════════════

function NearEarthWatch({ neoData, dates, loading, error, onRetry, highlightNeoId }) {
    const [hazOnly, setHazOnly] = useState(false);
    const [dayFilter, setDayFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const highlightRef = useRef(null);

    // Auto-expand and scroll to highlighted NEO from 3D view click
    useEffect(() => {
        if (highlightNeoId) {
            setExpandedId(highlightNeoId);
            setHazOnly(false);
            setDayFilter('all');
            // Scroll after render
            setTimeout(() => {
                if (highlightRef.current) {
                    highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [highlightNeoId]);

    if (loading) return <><SkeletonCards /><SkeletonChart /><SkeletonTable /></>;
    if (error) return <ErrorCard message="Failed to load NEO data" detail={error} onRetry={onRetry} />;
    if (!neoData) return null;

    // Filter
    let filtered = neoData;
    if (hazOnly) filtered = filtered.filter(n => n.hazardous);
    if (dayFilter !== 'all') filtered = filtered.filter(n => n.date === dayFilter);

    // Stats
    const totalNeos = neoData.length;
    const hazCount = neoData.filter(n => n.hazardous).length;
    const closest = [...neoData].sort((a, b) => a.missLD - b.missLD)[0];
    const fastest = [...neoData].sort((a, b) => b.velocityKms - a.velocityKms)[0];

    // Chart data: NEOs per day
    const dailyData = dates.map(d => {
        const dayNeos = neoData.filter(n => n.date === d);
        return {
            date: d.slice(5),
            hazardous: dayNeos.filter(n => n.hazardous).length,
            safe: dayNeos.filter(n => !n.hazardous).length,
        };
    });

    // Scatter data
    const scatterData = neoData.map(n => ({
        x: (n.diamMin + n.diamMax) / 2,
        y: n.missLD,
        z: n.velocityKms,
        name: n.name,
        hazardous: n.hazardous,
    }));

    const { sorted, toggleSort, arrow } = useSortable(filtered, 'missLD', 'asc');
    const { paged, page, setPage, totalPages } = usePagination(sorted, 25);

    return (
        <div>
            <div className="stats-row">
                <StatCard label="Total NEOs This Week" value={totalNeos} color="blue" />
                <StatCard label="Potentially Hazardous" value={hazCount} color="amber" />
                <StatCard label="Closest Approach" value={closest ? `${closest.missLD.toFixed(2)} LD` : '—'} sub={closest?.name} color="blue" />
                <StatCard label="Fastest Object" value={fastest ? `${fastest.velocityKms.toFixed(1)} km/s` : '—'} sub={fastest?.name} color="blue" />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>NEOs Per Day (This Week)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="date" stroke="#475569" />
                            <YAxis stroke="#475569" allowDecimals={false} />
                            <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid #1e293b', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }} />
                            <Legend />
                            <Bar dataKey="safe" stackId="a" fill="#00b4d8" name="Non-Hazardous" radius={[4,4,0,0]} />
                            <Bar dataKey="hazardous" stackId="a" fill="#f59e0b" name="Hazardous" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3>Miss Distance vs Diameter</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" dataKey="x" name="Diameter" unit=" m" stroke="#475569" />
                            <YAxis type="number" dataKey="y" name="Miss Distance" unit=" LD" stroke="#475569" />
                            <ZAxis type="number" dataKey="z" range={[30, 300]} name="Velocity" />
                            <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid #1e293b', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter data={scatterData} isAnimationActive={true}>
                                {scatterData.map((entry, i) => (
                                    <Cell key={i} fill={entry.hazardous ? '#f59e0b' : '#00b4d8'} fillOpacity={0.7} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="data-table-wrapper">
                <div className="table-header-bar">
                    <h3>NEO Details — {filtered.length} objects</h3>
                    <div className="table-filters">
                        <label>
                            <input type="checkbox" checked={hazOnly} onChange={e => setHazOnly(e.target.checked)} />
                            Hazardous only
                        </label>
                        <select value={dayFilter} onChange={e => setDayFilter(e.target.value)}>
                            <option value="all">All days</option>
                            {dates.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th onClick={() => toggleSort('name')}>Name <span className="sort-arrow">{arrow('name')}</span></th>
                                <th onClick={() => toggleSort('date')}>Date <span className="sort-arrow">{arrow('date')}</span></th>
                                <th onClick={() => toggleSort('missLD')}>Miss Dist (LD) <span className="sort-arrow">{arrow('missLD')}</span></th>
                                <th onClick={() => toggleSort('missKm')}>Miss Dist (km) <span className="sort-arrow">{arrow('missKm')}</span></th>
                                <th onClick={() => toggleSort('velocityKms')}>Velocity (km/s) <span className="sort-arrow">{arrow('velocityKms')}</span></th>
                                <th onClick={() => toggleSort('diamMin')}>Diameter (m) <span className="sort-arrow">{arrow('diamMin')}</span></th>
                                <th onClick={() => toggleSort('magnitude')}>Magnitude <span className="sort-arrow">{arrow('magnitude')}</span></th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.map(neo => (
                                <React.Fragment key={neo.id}>
                                    <tr
                                        ref={neo.id === highlightNeoId ? highlightRef : null}
                                        onClick={() => setExpandedId(expandedId === neo.id ? null : neo.id)}
                                        style={{
                                            cursor: 'pointer',
                                            background: neo.id === highlightNeoId ? 'rgba(0, 180, 216, 0.15)' : undefined,
                                            boxShadow: neo.id === highlightNeoId ? 'inset 3px 0 0 var(--accent-blue)' : undefined,
                                        }}
                                    >
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{neo.name}</td>
                                        <td>{neo.date}</td>
                                        <td>{neo.missLD.toFixed(4)}</td>
                                        <td>{numberWithCommas(neo.missKm.toFixed(0))}</td>
                                        <td>{neo.velocityKms.toFixed(2)}</td>
                                        <td>{neo.diamMin.toFixed(0)}–{neo.diamMax.toFixed(0)}</td>
                                        <td>{neo.magnitude.toFixed(2)}</td>
                                        <td>
                                            {neo.hazardous
                                                ? <span className="badge hazardous pulse-hazard">Hazardous</span>
                                                : <span className="badge safe">Safe</span>}
                                        </td>
                                    </tr>
                                    {expandedId === neo.id && (
                                        <tr className="expanded-row">
                                            <td colSpan="8">
                                                <div className="expanded-detail">
                                                    <div className="detail-item">
                                                        <div className="detail-label">Orbit ID</div>
                                                        <div className="detail-value">{neo.orbitId}</div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <div className="detail-label">Full Diameter Range</div>
                                                        <div className="detail-value">{neo.diamMin.toFixed(1)} – {neo.diamMax.toFixed(1)} m ({neo.diamKmMin.toFixed(4)} – {neo.diamKmMax.toFixed(4)} km)</div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <div className="detail-label">Miss Distance (AU)</div>
                                                        <div className="detail-value">{neo.missAU.toFixed(6)} AU</div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <div className="detail-label">Velocity (km/h)</div>
                                                        <div className="detail-value">{numberWithCommas(neo.velocityKmh.toFixed(0))} km/h</div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <div className="detail-label">JPL Link</div>
                                                        <div className="detail-value"><a href={`https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${neo.id}`} target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)' }}>View on JPL →</a></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// TAB 2 — CLOSE APPROACHES
// ══════════════════════════════════════

function CloseApproaches() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateMin, setDateMin] = useState(todayStr());
    const [dateMax, setDateMax] = useState(formatDate(addDays(new Date(), 365)));
    const [distMax, setDistMax] = useState('0.2');
    const [sortBy, setSortBy] = useState('date');
    const [expandedDes, setExpandedDes] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const raw = await fetchCAD({ dateMin, dateMax, distMax, sort: sortBy });
            setData(parseCAD(raw));
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    }, [dateMin, dateMax, distMax, sortBy]);

    useEffect(() => { loadData(); }, []);

    // Timeline chart: approaches per month
    const timelineData = useMemo(() => {
        if (!data) return [];
        const months = {};
        data.forEach(d => {
            const m = d.cd.substring(0, 7); // YYYY-MM or first 7 chars
            months[m] = (months[m] || 0) + 1;
        });
        return Object.entries(months).sort().map(([m, c]) => ({ month: m, count: c }));
    }, [data]);

    // Scatter data — cap at 100 closest points to avoid rendering 300+ Cell components
    const scatterData = useMemo(() => {
        if (!data) return [];
        const limited = data.length > 100 ? [...data].sort((a, b) => a.dist - b.dist).slice(0, 100) : data;
        return limited.map(d => ({
            x: new Date(d.cd).getTime() || 0,
            y: d.dist,
            z: d.diameter || (d.h ? (1329 / Math.sqrt(0.15)) * Math.pow(10, -d.h / 5) : 0.05),
            vRel: d.vRel,
            name: d.fullname,
        }));
    }, [data]);

    const { sorted, toggleSort, arrow } = useSortable(data, 'dist', 'asc');
    const { paged, page, setPage, totalPages } = usePagination(sorted, 25);

    return (
        <div>
            <div className="data-table-wrapper" style={{ marginBottom: 24 }}>
                <div className="table-header-bar">
                    <h3>Filter Close Approaches</h3>
                    <div className="table-filters">
                        <label>
                            From
                            <input type="date" value={dateMin} onChange={e => setDateMin(e.target.value)} />
                        </label>
                        <label>
                            To
                            <input type="date" value={dateMax} onChange={e => setDateMax(e.target.value)} />
                        </label>
                        <label>
                            Max Dist
                            <select value={distMax} onChange={e => setDistMax(e.target.value)}>
                                <option value="0.01">0.01 AU</option>
                                <option value="0.02">0.02 AU</option>
                                <option value="0.05">0.05 AU</option>
                                <option value="0.1">0.1 AU</option>
                                <option value="0.2">0.2 AU</option>
                                <option value="0.5">0.5 AU</option>
                            </select>
                        </label>
                        <label>
                            Sort
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="date">Date</option>
                                <option value="dist">Distance</option>
                                <option value="v-rel">Velocity</option>
                            </select>
                        </label>
                        <button className="filter-btn" onClick={loadData}>Apply Filters</button>
                        {data && <span className="badge safe">{data.length} results</span>}
                    </div>
                </div>
            </div>

            {loading ? (
                <><SkeletonChart /><div style={{ height: 16 }}></div><SkeletonTable /></>
            ) : error ? (
                <ErrorCard message="Failed to load Close Approach data" detail={error} onRetry={loadData} />
            ) : (
                <>
                    <div className="charts-grid">
                        <div className="chart-card full-width">
                            <h3>Approaches Per Month</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={timelineData}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#00b4d8" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#00b4d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="month" stroke="#475569" />
                                    <YAxis stroke="#475569" allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid #1e293b', borderRadius: 8 }} />
                                    <Area type="monotone" dataKey="count" stroke="#00b4d8" fill="url(#areaGrad)" strokeWidth={2} name="Approaches" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-card full-width">
                            <h3>Distance (AU) vs Time {data && data.length > 100 && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>(closest 100)</span>}</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis type="number" dataKey="x" name="Date" stroke="#475569" domain={['dataMin', 'dataMax']} tickFormatter={v => { const d = new Date(v); return d.getTime() ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : ''; }} />
                                    <YAxis type="number" dataKey="y" name="Dist (AU)" unit=" AU" stroke="#475569" />
                                    <ZAxis type="number" dataKey="z" range={[20, 200]} name="Diameter" />
                                    <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid #1e293b', borderRadius: 8 }} formatter={(val, name) => {
                                        if (name === 'Date') return new Date(val).toLocaleDateString();
                                        return typeof val === 'number' ? val.toFixed(4) : val;
                                    }} />
                                    <Scatter data={scatterData} isAnimationActive={false}>
                                        {scatterData.map((entry, i) => {
                                            const t = Math.min(entry.vRel / 30, 1);
                                            const r = Math.round(t * 239);
                                            const g = Math.round((1-t) * 100 + t * 68);
                                            const b = Math.round((1-t) * 216 + t * 68);
                                            return <Cell key={i} fill={`rgb(${r},${g},${b})`} fillOpacity={0.7} />;
                                        })}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="data-table-wrapper">
                        <div className="table-header-bar">
                            <h3>Close Approach Data</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => toggleSort('des')}>Designation <span className="sort-arrow">{arrow('des')}</span></th>
                                        <th onClick={() => toggleSort('fullname')}>Full Name <span className="sort-arrow">{arrow('fullname')}</span></th>
                                        <th onClick={() => toggleSort('cd')}>Date <span className="sort-arrow">{arrow('cd')}</span></th>
                                        <th onClick={() => toggleSort('dist')}>Dist (AU) <span className="sort-arrow">{arrow('dist')}</span></th>
                                        <th>Dist (LD)</th>
                                        <th onClick={() => toggleSort('vRel')}>Velocity (km/s) <span className="sort-arrow">{arrow('vRel')}</span></th>
                                        <th onClick={() => toggleSort('diameter')}>Diameter (m) <span className="sort-arrow">{arrow('diameter')}</span></th>
                                        <th onClick={() => toggleSort('h')}>Mag (H) <span className="sort-arrow">{arrow('h')}</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paged.map((row, i) => (
                                        <React.Fragment key={row.des + '_' + i}>
                                            <tr onClick={() => setExpandedDes(expandedDes === row.des + i ? null : row.des + i)} style={{ cursor: 'pointer' }}>
                                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.des}</td>
                                                <td>{row.fullname}</td>
                                                <td>{row.cd}</td>
                                                <td>{row.dist.toFixed(6)}</td>
                                                <td>{auToLD(row.dist)}</td>
                                                <td>{row.vRel.toFixed(2)}</td>
                                                <td>{row.diameter ? (row.diameter * 1000).toFixed(0) : '—'}</td>
                                                <td>{row.h ? row.h.toFixed(1) : '—'}</td>
                                            </tr>
                                            {expandedDes === row.des + i && (
                                                <tr className="expanded-row">
                                                    <td colSpan="8">
                                                        <div className="expanded-detail">
                                                            <div className="detail-item"><div className="detail-label">Min Distance</div><div className="detail-value">{row.distMin.toFixed(6)} AU</div></div>
                                                            <div className="detail-item"><div className="detail-label">Max Distance</div><div className="detail-value">{row.distMax.toFixed(6)} AU</div></div>
                                                            <div className="detail-item"><div className="detail-label">V∞</div><div className="detail-value">{row.vInf.toFixed(2)} km/s</div></div>
                                                            <div className="detail-item"><div className="detail-label">Diameter σ</div><div className="detail-value">{row.diameterSigma ? row.diameterSigma.toFixed(4) + ' km' : '—'}</div></div>
                                                            <div className="detail-item"><div className="detail-label">Distance (km)</div><div className="detail-value">{numberWithCommas(auToKm(row.dist))}</div></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
                    </div>
                </>
            )}
        </div>
    );
}

// ══════════════════════════════════════
// TAB 3 — IMPACT RISK MONITOR
// ══════════════════════════════════════

function ImpactRisk() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [expandedDes, setExpandedDes] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const raw = await fetchSentry();
            setData(parseSentry(raw));
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, []);

    const filtered = useMemo(() => {
        if (!data) return [];
        return search
            ? data.filter(d => d.des.toLowerCase().includes(search.toLowerCase()) || d.fullname.toLowerCase().includes(search.toLowerCase()))
            : data;
    }, [data, search]);

    // Stats — memoized to avoid re-sorting 1000+ items on every render
    const { totalMonitored, highestPS, nearestImpact, mostRecent, anyTorino } = useMemo(() => {
        if (!data) return { totalMonitored: 0, highestPS: null, nearestImpact: null, mostRecent: null, anyTorino: false };
        const highestPS = [...data].sort((a, b) => b.ps - a.ps)[0];
        const nearestImpact = [...data].sort((a, b) => {
            const ya = parseInt(a.range) || 9999;
            const yb = parseInt(b.range) || 9999;
            return ya - yb;
        })[0];
        const mostRecent = [...data].sort((a, b) => (b.lastObs || '').localeCompare(a.lastObs || ''))[0];
        return { totalMonitored: data.length, highestPS, nearestImpact, mostRecent, anyTorino: data.some(d => d.ts > 0) };
    }, [data]);

    // Risk matrix scatter — cap at 100 highest-risk points to avoid 1000+ Cell components crashing the browser
    const riskScatter = useMemo(() => {
        if (!data) return [];
        const top = data.length > 100 ? [...data].sort((a, b) => b.ps - a.ps).slice(0, 100) : data;
        return top.map(d => {
            const yearStart = parseInt(d.range) || 2030;
            return {
                x: yearStart,
                y: d.ps,
                z: Math.max(Math.abs(d.ip) * 1e9, 5),
                name: d.fullname,
                ip: d.ip,
            };
        });
    }, [data]);

    // Palermo histogram — use fixed bins from -10 to 1 so distribution is clear
    const histogramData = useMemo(() => {
        if (!data) return [];
        const bins = [];
        for (let i = -10; i <= 0; i++) {
            bins.push({ low: i, high: i + 1, count: 0 });
        }
        data.forEach(d => {
            const idx = Math.max(0, Math.min(bins.length - 1, Math.floor(d.ps) + 10));
            bins[idx].count++;
        });
        return bins.filter(b => b.count > 0).map(b => ({
            bin: `${b.low}`,
            count: b.count,
        }));
    }, [data]);

    if (loading) return <><SkeletonCards /><SkeletonChart /><SkeletonTable /></>;
    if (error) return <ErrorCard message="Failed to load Sentry data" detail={error} onRetry={loadData} />;
    if (!data) return null;

    return (
        <div>
            {/* Alert Banner */}
            {anyTorino ? (
                <div className="alert-banner warning pulse-hazard">
                    ⚠️ Elevated Torino Scale detected — {data.filter(d => d.ts > 0).map(d => `${d.fullname} (TS ${d.ts})`).join(', ')}
                </div>
            ) : (
                <div className="alert-banner all-clear">
                    ✅ All Clear — No objects currently at elevated Torino Scale threat level
                </div>
            )}

            <div className="stats-row">
                <StatCard label="Total Monitored" value={totalMonitored} color="blue" />
                <StatCard label="Highest Palermo Scale" value={highestPS ? highestPS.ps.toFixed(2) : '—'} sub={highestPS?.fullname} color="amber" />
                <StatCard label="Nearest Impact Year" value={nearestImpact ? nearestImpact.range : '—'} sub={nearestImpact?.fullname} color="red" />
                <StatCard label="Most Recently Observed" value={mostRecent ? mostRecent.lastObs : '—'} sub={mostRecent?.fullname} color="green" />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Risk Matrix — Impact Year vs Palermo Scale {data.length > 100 && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>(top 100 by risk)</span>}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" dataKey="x" name="Year" stroke="#475569" domain={['auto', 'auto']} />
                            <YAxis type="number" dataKey="y" name="Palermo Scale" stroke="#475569" domain={['auto', 'auto']} />
                            <ZAxis type="number" dataKey="z" range={[15, 150]} />
                            <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid #1e293b', borderRadius: 8 }} />
                            <Scatter data={riskScatter} isAnimationActive={false}>
                                {riskScatter.map((entry, i) => {
                                    const t = Math.min(Math.max((entry.y + 10) / 10, 0), 1);
                                    const color = t > 0.8 ? '#ef4444' : t > 0.5 ? '#f59e0b' : '#00b4d8';
                                    return <Cell key={i} fill={color} fillOpacity={0.7} />;
                                })}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3>Palermo Scale Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={histogramData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="bin" stroke="#475569" />
                            <YAxis stroke="#475569" allowDecimals={false} />
                            <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid #1e293b', borderRadius: 8 }} />
                            <Bar dataKey="count" fill="#a78bfa" name="Objects" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="data-table-wrapper">
                <div className="table-header-bar">
                    <h3>Sentry Monitored Objects — {filtered.length} entries</h3>
                    <div className="table-filters">
                        <input type="text" placeholder="Search designation..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 180 }} />
                    </div>
                </div>
                <SentryTable data={filtered} expandedDes={expandedDes} setExpandedDes={setExpandedDes} />
            </div>
        </div>
    );
}

function SentryTable({ data, expandedDes, setExpandedDes }) {
    const { sorted, toggleSort, arrow } = useSortable(data, 'ps', 'desc');
    const { paged, page, setPage, totalPages } = usePagination(sorted, 25);

    return (
        <>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th onClick={() => toggleSort('des')}>Designation <span className="sort-arrow">{arrow('des')}</span></th>
                            <th onClick={() => toggleSort('fullname')}>Full Name <span className="sort-arrow">{arrow('fullname')}</span></th>
                            <th onClick={() => toggleSort('ip')}>Impact Prob <span className="sort-arrow">{arrow('ip')}</span></th>
                            <th onClick={() => toggleSort('ps')}>Palermo <span className="sort-arrow">{arrow('ps')}</span></th>
                            <th onClick={() => toggleSort('ts')}>Torino <span className="sort-arrow">{arrow('ts')}</span></th>
                            <th onClick={() => toggleSort('nImp')}>Impacts <span className="sort-arrow">{arrow('nImp')}</span></th>
                            <th onClick={() => toggleSort('range')}>Year Range <span className="sort-arrow">{arrow('range')}</span></th>
                            <th onClick={() => toggleSort('diameter')}>Diam (km) <span className="sort-arrow">{arrow('diameter')}</span></th>
                            <th onClick={() => toggleSort('vInf')}>V∞ (km/s) <span className="sort-arrow">{arrow('vInf')}</span></th>
                            <th onClick={() => toggleSort('lastObs')}>Last Obs <span className="sort-arrow">{arrow('lastObs')}</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.map((obj, i) => {
                            const rowBg = obj.ts > 0
                                ? 'rgba(245,158,11,0.07)'
                                : obj.ps > -2 ? 'rgba(239,68,68,0.05)' : undefined;
                            return (
                                <React.Fragment key={obj.des + '_' + i}>
                                    <tr onClick={() => setExpandedDes(expandedDes === obj.des + i ? null : obj.des + i)} style={{ cursor: 'pointer', background: rowBg }}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{obj.des}</td>
                                        <td>{obj.fullname}</td>
                                        <td>{obj.ip.toExponential(2)}</td>
                                        <td style={{ color: obj.ps > -2 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{obj.ps.toFixed(2)}</td>
                                        <td>
                                            {obj.ts > 0
                                                ? <span className="badge danger pulse-hazard">{obj.ts}</span>
                                                : <span style={{ color: 'var(--text-dim)' }}>{obj.ts}</span>}
                                        </td>
                                        <td>{obj.nImp}</td>
                                        <td>{obj.range}</td>
                                        <td>{obj.diameter ? obj.diameter.toFixed(3) : '—'}</td>
                                        <td>{obj.vInf ? obj.vInf.toFixed(2) : '—'}</td>
                                        <td>{obj.lastObs}</td>
                                    </tr>
                                    {expandedDes === obj.des + i && (
                                        <tr className="expanded-row">
                                            <td colSpan="10">
                                                <div className="expanded-detail">
                                                    <div className="detail-item"><div className="detail-label">Impact Probability</div><div className="detail-value">{obj.ip.toExponential(4)}</div></div>
                                                    <div className="detail-item"><div className="detail-label">Potential Impacts</div><div className="detail-value">{obj.nImp}</div></div>
                                                    <div className="detail-item"><div className="detail-label">Absolute Magnitude</div><div className="detail-value">{obj.h || '—'}</div></div>
                                                    <div className="detail-item">
                                                        <div className="detail-label">JPL Sentry Page</div>
                                                        <div className="detail-value"><a href={`https://cneos.jpl.nasa.gov/sentry/details.html#?des=${encodeURIComponent(obj.des)}`} target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)' }}>View Details →</a></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
    );
}

// ══════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════

function App() {
    const [activeTab, setActiveTab] = useState(0);
    const [neoRaw, setNeoRaw] = useState(null);
    const [neoLoading, setNeoLoading] = useState(true);
    const [neoError, setNeoError] = useState(null);
    const [utcTime, setUtcTime] = useState('');
    const [lastRefresh, setLastRefresh] = useState(null);
    const [selectedNeoId, setSelectedNeoId] = useState(null);

    // Called when user clicks an asteroid in 3D view
    const handleSelectNeo = useCallback((neo) => {
        setSelectedNeoId(neo.id);
        setActiveTab(1); // Switch to Near Earth Watch tab
    }, []);

    // UTC clock
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // Load NeoWs (shared by Tab 0 & 1)
    const loadNeo = useCallback(async () => {
        setNeoLoading(true);
        setNeoError(null);
        try {
            const raw = await fetchNeoFeed();
            setNeoRaw(raw);
            setLastRefresh(new Date().toLocaleTimeString());
        } catch (e) {
            setNeoError(e.message);
        }
        setNeoLoading(false);
    }, []);

    useEffect(() => { loadNeo(); }, []);

    const { neos, dates } = useMemo(() => neoRaw ? parseNeoFeed(neoRaw) : { neos: [], dates: [] }, [neoRaw]);

    const tabs = [
        { icon: '🌍', label: 'Orbital View' },
        { icon: '📡', label: 'Near Earth Watch' },
        { icon: '🔭', label: 'Close Approaches' },
        { icon: '⚠️', label: 'Impact Risk' },
    ];

    return (
        <div>
            {/* Header */}
            <header className="neo-header">
                <div className="brand">
                    <span className="icon">☄️</span>
                    NEO SENTINEL
                </div>
                <div className="clock">
                    <div className="utc-time">{utcTime}</div>
                    {lastRefresh && <div>Last refresh: {lastRefresh}</div>}
                </div>
            </header>

            {/* Tab Nav */}
            <nav className="tab-nav">
                {tabs.map((tab, i) => (
                    <button
                        key={i}
                        className={`tab-btn ${activeTab === i ? 'active' : ''}`}
                        onClick={() => setActiveTab(i)}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </nav>

            {/* Tab Content */}
            <div className="tab-content" key={activeTab}>
                {activeTab === 0 && (
                    neoLoading ? <SkeletonChart />
                    : neoError ? <ErrorCard message="Failed to load NEO data" detail={neoError} onRetry={loadNeo} />
                    : <OrbitalView neoData={neos} dates={dates} onSelectNeo={handleSelectNeo} />
                )}
                {activeTab === 1 && (
                    <NearEarthWatch neoData={neos} dates={dates} loading={neoLoading} error={neoError} onRetry={loadNeo} highlightNeoId={selectedNeoId} />
                )}
                {activeTab === 2 && <CloseApproaches />}
                {activeTab === 3 && <ImpactRisk />}
            </div>
        </div>
    );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
