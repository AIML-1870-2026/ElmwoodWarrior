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
const CAD_BASE = 'https://ssd-api.jpl.nasa.gov/cad.api';
const SENTRY_BASE = 'https://ssd-api.jpl.nasa.gov/sentry.api';

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
        'dist-max': params.distMax || '0.05',
        'sort': params.sort || 'date',
        'diameter': 'true',
        'fullname': 'true',
        'limit': params.limit || '300',
    });
    const key = 'cad_' + p.toString();
    const cached = getCached(key);
    if (cached) return cached;
    const res = await fetch(`${CAD_BASE}?${p}`);
    if (!res.ok) throw new Error(`CAD API error: ${res.status}`);
    const json = await res.json();
    setCache(key, json);
    return json;
}

async function fetchSentry() {
    const cached = getCached('sentry');
    if (cached) return cached;
    const res = await fetch(SENTRY_BASE);
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
        ps: parseFloat(obj.ps || 0),
        ts: parseInt(obj.ts || 0),
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

function OrbitalView({ neoData, dates }) {
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
        controls.maxDistance = 200;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
        scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(50, 30, 50);
        scene.add(sunLight);
        const pointLight = new THREE.PointLight(0x00b4d8, 0.4, 100);
        pointLight.position.set(-10, 10, -10);
        scene.add(pointLight);

        // Starfield
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) {
            starPositions[i] = (Math.random() - 0.5) * 1200;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
        scene.add(new THREE.Points(starGeo, starMat));

        // Earth
        const earthGeo = new THREE.SphereGeometry(1, 64, 64);
        const earthMat = new THREE.MeshPhongMaterial({
            color: 0x2244aa,
            emissive: 0x112244,
            specular: 0x333333,
            shininess: 25,
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        scene.add(earth);

        // Earth atmosphere glow
        const glowGeo = new THREE.SphereGeometry(1.08, 64, 64);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00b4d8,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
        });
        scene.add(new THREE.Mesh(glowGeo, glowMat));

        // Earth land patches (procedural)
        const landGeo = new THREE.SphereGeometry(1.003, 64, 64);
        const landMat = new THREE.MeshPhongMaterial({
            color: 0x228833,
            transparent: true,
            opacity: 0.3,
            wireframe: false,
        });
        const land = new THREE.Mesh(landGeo, landMat);
        scene.add(land);

        // Moon
        const moonGeo = new THREE.SphereGeometry(0.27, 32, 32);
        const moonMat = new THREE.MeshPhongMaterial({
            color: 0xaaaaaa,
            emissive: 0x222222,
            shininess: 5,
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        const moonDist = 30; // 1 LD in scene
        moon.position.set(moonDist, 0, 0);
        scene.add(moon);
        // Moon label
        const moonGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.1, side: THREE.BackSide })
        );
        moonGlow.position.copy(moon.position);
        scene.add(moonGlow);

        // Distance rings
        const ringDistances = [
            { ld: 0.5, label: '0.5 LD' },
            { ld: 1, label: '1 LD' },
            { ld: 2, label: '2 LD' },
            { ld: 5, label: '5 LD' },
            { ld: 10, label: '10 LD' },
        ];
        ringDistances.forEach(r => {
            const radius = r.ld * moonDist;
            const ringGeo = new THREE.RingGeometry(radius - 0.03, radius + 0.03, 128);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x1e293b,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            scene.add(ring);
        });

        // Asteroids
        const asteroidMeshes = [];
        const top50 = [...neoData].sort((a, b) => a.missLD - b.missLD).slice(0, 50);
        top50.forEach(neo => {
            const sizeScale = Math.max(0.15, Math.min(1.2, neo.diamMax / 500));
            const geo = neo.hazardous
                ? new THREE.IcosahedronGeometry(sizeScale, 0)
                : new THREE.DodecahedronGeometry(sizeScale, 0);
            const color = neo.hazardous ? 0xf59e0b : 0x64748b;
            const mat = new THREE.MeshPhongMaterial({
                color,
                emissive: neo.hazardous ? 0x3d2800 : 0x111827,
                flatShading: true,
                shininess: 10,
            });
            const mesh = new THREE.Mesh(geo, mat);
            // Position: spread by miss distance, random angle
            const dist = neo.missLD * moonDist;
            const angle = Math.random() * Math.PI * 2;
            const yOff = (Math.random() - 0.5) * dist * 0.3;
            mesh.position.set(
                Math.cos(angle) * dist,
                yOff,
                Math.sin(angle) * dist
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
                const mesh = intersects[0].object;
                if (hoveredMesh !== mesh) {
                    if (hoveredMesh) hoveredMesh.material.emissive.set(hoveredMesh.userData.hazardous ? 0x3d2800 : 0x111827);
                    hoveredMesh = mesh;
                    mesh.material.emissive.set(0x00b4d8);
                }
                setTooltip({
                    visible: true,
                    x: e.clientX - rect.left + 16,
                    y: e.clientY - rect.top - 10,
                    data: mesh.userData,
                });
            } else {
                if (hoveredMesh) {
                    hoveredMesh.material.emissive.set(hoveredMesh.userData.hazardous ? 0x3d2800 : 0x111827);
                    hoveredMesh = null;
                }
                setTooltip(t => ({ ...t, visible: false }));
            }
        }
        container.addEventListener('mousemove', onMouseMove);

        // Animate
        let animId;
        function animate() {
            animId = requestAnimationFrame(animate);
            earth.rotation.y += 0.001;
            land.rotation.y += 0.001;
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

        sceneRef.current = { renderer, animId, onResize, onMouseMove };

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            container.removeEventListener('mousemove', onMouseMove);
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
                    </>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════
// TAB 1 — NEAR EARTH WATCH
// ══════════════════════════════════════

function NearEarthWatch({ neoData, dates, loading, error, onRetry }) {
    const [hazOnly, setHazOnly] = useState(false);
    const [dayFilter, setDayFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

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
                                    <tr onClick={() => setExpandedId(expandedId === neo.id ? null : neo.id)} style={{ cursor: 'pointer' }}>
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
    const [distMax, setDistMax] = useState('0.05');
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

    // Scatter data
    const scatterData = useMemo(() => {
        if (!data) return [];
        return data.map(d => ({
            x: new Date(d.cd.replace(/\s/, 'T').replace(/\s/, '')).getTime() || 0,
            y: d.dist,
            z: d.diameter || 5,
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
                            <h3>Distance vs Time — Bubble = Diameter, Color = Velocity</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis type="number" dataKey="x" name="Date" stroke="#475569" tickFormatter={v => { const d = new Date(v); return d ? `${d.getMonth()+1}/${d.getDate()}` : ''; }} />
                                    <YAxis type="number" dataKey="y" name="Dist (AU)" unit=" AU" stroke="#475569" />
                                    <ZAxis type="number" dataKey="z" range={[20, 200]} name="Diameter" />
                                    <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid #1e293b', borderRadius: 8 }} formatter={(val, name) => {
                                        if (name === 'Date') return new Date(val).toLocaleDateString();
                                        return typeof val === 'number' ? val.toFixed(4) : val;
                                    }} />
                                    <Scatter data={scatterData} isAnimationActive={true}>
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

    if (loading) return <><SkeletonCards /><SkeletonChart /><SkeletonTable /></>;
    if (error) return <ErrorCard message="Failed to load Sentry data" detail={error} onRetry={loadData} />;
    if (!data) return null;

    const filtered = search
        ? data.filter(d => d.des.toLowerCase().includes(search.toLowerCase()) || d.fullname.toLowerCase().includes(search.toLowerCase()))
        : data;

    // Stats
    const totalMonitored = data.length;
    const highestPS = [...data].sort((a, b) => b.ps - a.ps)[0];
    const nearestImpact = [...data].sort((a, b) => {
        const ya = parseInt(a.range) || 9999;
        const yb = parseInt(b.range) || 9999;
        return ya - yb;
    })[0];
    const mostRecent = [...data].sort((a, b) => (b.lastObs || '').localeCompare(a.lastObs || ''))[0];
    const anyTorino = data.some(d => d.ts > 0);

    // Risk matrix scatter
    const riskScatter = data.map(d => {
        const yearStart = parseInt(d.range) || 2030;
        return {
            x: yearStart,
            y: d.ps,
            z: Math.max(Math.abs(d.ip) * 1e9, 5),
            name: d.fullname,
            ip: d.ip,
        };
    });

    // Palermo histogram
    const psBins = {};
    data.forEach(d => {
        const bin = Math.floor(d.ps);
        psBins[bin] = (psBins[bin] || 0) + 1;
    });
    const histogramData = Object.entries(psBins).sort((a,b) => Number(a[0]) - Number(b[0])).map(([bin, count]) => ({
        bin: `${bin} to ${Number(bin)+1}`,
        count,
    }));

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
                    <h3>Risk Matrix — Impact Year vs Palermo Scale</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" dataKey="x" name="Year" stroke="#475569" domain={['auto', 'auto']} />
                            <YAxis type="number" dataKey="y" name="Palermo Scale" stroke="#475569" />
                            <ZAxis type="number" dataKey="z" range={[15, 150]} />
                            <Tooltip contentStyle={{ background: '#0d1220', border: '1px solid #1e293b', borderRadius: 8 }} />
                            <Scatter data={riskScatter} isAnimationActive={true}>
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
                    : <OrbitalView neoData={neos} dates={dates} />
                )}
                {activeTab === 1 && (
                    <NearEarthWatch neoData={neos} dates={dates} loading={neoLoading} error={neoError} onRetry={loadNeo} />
                )}
                {activeTab === 2 && <CloseApproaches />}
                {activeTab === 3 && <ImpactRisk />}
            </div>
        </div>
    );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
