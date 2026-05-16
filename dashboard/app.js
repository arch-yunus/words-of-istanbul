let chart;

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 3500);
}

function matchNode(m, q, layer) {
    const qq = (q || '').trim().toLowerCase();
    if (layer && m.layer !== layer) return false;
    if (!qq) return true;
    const blob = [m.content, m.mood, m.layer, m.category, m.source, m.essay_id].join(' ').toLowerCase();
    return blob.includes(qq);
}

function renderFeed(list) {
    const feed = document.getElementById('feed');
    const empty = document.getElementById('empty');
    if (!list.length) {
        feed.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    empty?.classList.add('hidden');
    feed.innerHTML = list.map(m => `
        <article class="card">
            <p class="quote">"${esc(m.content)}"</p>
            <footer>
                <span>${esc(m.layer)}</span>
                <a href="../${esc(m.source || '')}" target="_blank" rel="noopener">${esc(m.source || '')}</a>
            </footer>
        </article>
    `).join('');
}

function renderPillars(essays) {
    const el = document.getElementById('pillars');
    if (!el) return;
    const byPillar = {};
    essays.forEach(e => {
        byPillar[e.pillar] = byPillar[e.pillar] || [];
        byPillar[e.pillar].push(e);
    });
    el.innerHTML = Object.keys(byPillar).sort().map(p => `
        <section class="pillar-block">
            <h2>${esc(p)}</h2>
            <ul>${byPillar[p].map(e => `
                <li><a href="../${esc(e.path)}">${esc(e.title)}</a></li>
            `).join('')}</ul>
        </section>
    `).join('');
}

function renderChart(matrix) {
    const layers = {};
    matrix.forEach(m => { layers[m.layer] = (layers[m.layer] || 0) + 1; });
    const canvas = document.getElementById('moodChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (chart) chart.destroy();
    chart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(layers),
            datasets: [{
                data: Object.values(layers),
                backgroundColor: ['#c5a059', '#8b4513', '#2e4057', '#5c4d7d', '#18453B', '#4a4a4a']
            }]
        },
        options: { plugins: { legend: { labels: { color: '#aaa', font: { size: 10 } } } } }
    });
}

function bindControls(matrix) {
    const q = document.getElementById('q');
    const layer = document.getElementById('layer-filter');
    const layers = [...new Set(matrix.map(m => m.layer))].sort();
    layer.innerHTML = '<option value="">Tüm katmanlar</option>' +
        layers.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');

    const apply = () => {
        const filtered = matrix.filter(m => matchNode(m, q?.value, layer?.value));
        renderFeed(filtered);
    };
    q?.addEventListener('input', apply);
    layer?.addEventListener('change', apply);

    document.getElementById('oracle')?.addEventListener('click', () => {
        const m = matrix[Math.floor(Math.random() * matrix.length)];
        toast(`[${m.layer}] ${m.content.slice(0, 100)}…`);
    });
    document.getElementById('derive')?.addEventListener('click', () => {
        const pick = [...matrix].sort(() => Math.random() - 0.5).slice(0, 3);
        toast(pick.map((m, i) => `${i + 1}. ${m.layer}`).join(' → '));
    });
    apply();
}

async function init() {
    try {
        const [matrixRes, corpusRes] = await Promise.all([
            fetch('../archive/matrix.json'),
            fetch('../archive/corpus.json')
        ]);
        if (!matrixRes.ok) throw new Error('matrix');
        const matrixData = await matrixRes.json();
        const matrix = matrixData.matrix || [];
        const corpus = corpusRes.ok ? await corpusRes.json() : { essays: [] };

        document.getElementById('meta-line').textContent =
            `${matrixData.version || 'v6'} · ${matrix.length} düğüm`;
        document.getElementById('essay-count').textContent =
            `${corpus.essays?.length || 0} deneme · son sync ${corpus.metadata?.last_sync || '—'}`;

        renderChart(matrix);
        renderPillars(corpus.essays || []);
        bindControls(matrix);
    } catch (e) {
        toast('Veri yüklenemedi. python src/ruh.py --serve ile açın.');
        console.error(e);
    }
}

init();
