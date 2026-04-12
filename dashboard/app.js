/**
 * Words of Istanbul — dashboard client
 * Expects ../archive/matrix.json (serve repo root: python src/ruh.py --serve)
 */

let moodChart = null;

function showToast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add('hidden'), 3200);
}

function normalize(s) {
    return (s || '').toString().toLowerCase();
}

function nodeMatches(m, q, layer) {
    const qq = normalize(q).trim();
    if (layer && normalize(m.layer) !== normalize(layer)) return false;
    if (!qq) return true;
    const blob = [m.content, m.mood, m.layer, m.category, m.id].map(normalize).join(' ');
    return blob.includes(qq);
}

function sample(arr, n) {
    const copy = [...arr];
    const out = [];
    while (out.length < n && copy.length) {
        const i = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(i, 1)[0]);
    }
    return out;
}

function renderFeed(list) {
    const feed = document.getElementById('main-feed');
    const empty = document.getElementById('feed-empty');
    if (!feed) return;

    if (!list.length) {
        feed.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    empty?.classList.add('hidden');

    feed.innerHTML = list.map(m => `
        <article class="intelligence-item" data-id="${escapeHtml(m.id || '')}">
            <div class="insight-body">"${escapeHtml(m.content)}"</div>
            <div class="insight-footer">
                <span>[${escapeHtml(String(m.layer).toUpperCase())}]</span>
                <span>${escapeHtml(m.mood)} · STRAT ${m.strat}/10 · IMP ${m.impact}/10</span>
            </div>
        </article>
    `).join('');
}

function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function populateLayerFilter(matrix) {
    const sel = document.getElementById('layer-filter');
    if (!sel) return;
    const layers = [...new Set(matrix.map(m => m.layer))].sort((a, b) => a.localeCompare(b, 'tr'));
    const current = sel.value;
    sel.innerHTML = '<option value="">Tüm katmanlar</option>' +
        layers.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
    if (layers.includes(current)) sel.value = current;
}

function renderAnalytics(matrix) {
    const moods = {};
    matrix.forEach(m => {
        moods[m.mood] = (moods[m.mood] || 0) + 1;
    });

    const canvas = document.getElementById('moodDistribution');
    if (!canvas || typeof Chart === 'undefined') return;

    if (moodChart) moodChart.destroy();

    const ctx = canvas.getContext('2d');
    moodChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(moods),
            datasets: [{
                label: 'Mood frequency',
                data: Object.values(moods),
                backgroundColor: 'rgba(197, 160, 89, 0.2)',
                borderColor: '#c5a059',
                pointBackgroundColor: '#c5a059',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#888', font: { size: 10 } },
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function initializeMapIntelligence() {
    const paths = document.querySelectorAll('.district-path');
    const intelView = document.getElementById('zone-intel');

    const zoneData = {
        historic: 'HISTORIC PENINSULA: PRIMARY SOVEREIGN NODE. HIGH SEISMIC RISK.',
        pera: 'BEYOĞLU/PERA: CHAOTIC ENERGY OVERLAY. ACTIVE NEUROSIS ZONE.',
        asian: 'ANATOLIAN SIDE: RESILIENCE BUFFER. STRATEGIC DEPTH LAYER.',
        bosphorus: 'BOSPHORUS: GLOBAL JUGULAR VEIN. POWER FLOW 100%.'
    };

    paths.forEach(p => {
        p.addEventListener('mouseenter', () => {
            intelView?.classList.add('active-pulse');
            if (intelView) intelView.innerText = zoneData[p.id] || 'SCANNING_NODE...';
        });
        p.addEventListener('mouseleave', () => {
            intelView?.classList.remove('active-pulse');
            if (intelView) intelView.innerText = 'SELECT_ZONE_FOR_INTELLIGENCE';
        });
        p.addEventListener('focus', () => {
            if (intelView) intelView.innerText = zoneData[p.id] || 'SCANNING_NODE...';
        });
        p.addEventListener('blur', () => {
            if (intelView) intelView.innerText = 'SELECT_ZONE_FOR_INTELLIGENCE';
        });
        p.setAttribute('tabindex', '0');
        p.setAttribute('role', 'button');
    });
}

function bindFeedControls(matrix) {
    const search = document.getElementById('feed-search');
    const layer = document.getElementById('layer-filter');
    const btnOracle = document.getElementById('btn-oracle');
    const btnDerive = document.getElementById('btn-derive');

    const apply = () => {
        const q = search?.value || '';
        const ly = layer?.value || '';
        const filtered = matrix.filter(m => nodeMatches(m, q, ly));
        renderFeed(filtered);
    };

    search?.addEventListener('input', apply);
    layer?.addEventListener('change', apply);

    btnOracle?.addEventListener('click', () => {
        if (!matrix.length) return;
        const m = matrix[Math.floor(Math.random() * matrix.length)];
        showToast(`Oracle: [${m.layer}] ${m.content.slice(0, 90)}${m.content.length > 90 ? '…' : ''}`);
    });

    btnDerive?.addEventListener('click', () => {
        if (!matrix.length) return;
        const steps = sample(matrix, Math.min(3, matrix.length));
        const msg = steps.map((s, i) => `${i + 1}. ${s.layer}`).join(' → ');
        showToast(`Dérive: ${msg}`);
    });

    apply();
}

function setMeta(data, matrix) {
    const el = document.getElementById('matrix-meta');
    const sync = document.getElementById('sync-state');
    const meta = data.metadata || {};
    const ver = data.version || '—';
    const n = matrix.length;
    if (el) {
        el.textContent = `v${ver} · ${n} nodes${meta.last_sync ? ` · sync ${meta.last_sync}` : ''}`;
    }
    if (sync) sync.textContent = 'CALIBRATED';
}

async function initEngine() {
    const sync = document.getElementById('sync-state');
    try {
        const response = await fetch('../archive/matrix.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const matrix = data.matrix || [];

        setMeta(data, matrix);
        populateLayerFilter(matrix);
        renderAnalytics(matrix);
        bindFeedControls(matrix);
        initializeMapIntelligence();

        if (typeof Chart === 'undefined' && sync) {
            sync.textContent = 'CHART_JS_UNAVAILABLE';
        }
    } catch (error) {
        console.error('ETERNAL_MATRIX_FETCH_ERROR:', error);
        if (sync) sync.textContent = 'OFFLINE (use: python src/ruh.py --serve)';
        showToast('matrix.json yüklenemedi — depo kökünden sunucu başlatın.');
    }
}

initEngine();
