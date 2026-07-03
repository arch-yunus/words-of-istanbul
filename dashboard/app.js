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
                <a href="#" class="feed-essay-link" data-path="${esc(m.source || '')}">${esc(m.source || '')}</a>
            </footer>
        </article>
    `).join('');

    // Bind click events on feed links
    feed.querySelectorAll('.feed-essay-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = link.getAttribute('data-path');
            if (path) openReader(path);
        });
    });
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
                <li><a href="#" class="essay-link" data-path="${esc(e.path)}">${esc(e.title)}</a></li>
            `).join('')}</ul>
        </section>
    `).join('');

    // Bind click events to open essays in reader modal
    el.querySelectorAll('.essay-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = link.getAttribute('data-path');
            openReader(path);
        });
    });
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

function showInteractiveCard(html) {
    const display = document.getElementById('interactive-display');
    if (!display) return;
    display.innerHTML = `
        <button type="button" class="display-close" id="display-close-btn">&times;</button>
        ${html}
    `;
    display.classList.remove('hidden');
    
    // Close button event
    document.getElementById('display-close-btn')?.addEventListener('click', () => {
        display.classList.add('hidden');
        display.innerHTML = '';
    });

    // Re-bind click events inside the display if there are read buttons
    display.querySelectorAll('.read-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const path = btn.getAttribute('data-path');
            if (path) openReader(path);
        });
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
        const cardHtml = `
            <div class="oracle-display-card">
                <h4>🔮 Kahinin Fısıltısı (Oracle)</h4>
                <div class="oracle-quote">"${esc(m.content)}"</div>
                <div class="display-meta">
                    <span>Katman: <strong>${esc(m.layer)}</strong> · Hissiyat: <strong>${esc(m.mood)}</strong></span>
                    ${m.source ? `<button type="button" class="read-btn" data-path="${esc(m.source)}">Denemeyi Oku →</button>` : ''}
                </div>
            </div>
        `;
        showInteractiveCard(cardHtml);
        toast(`[${m.layer}] Kahin bir fısıltı getirdi!`);
    });
    
    document.getElementById('derive')?.addEventListener('click', () => {
        const pick = [...matrix].sort(() => Math.random() - 0.5).slice(0, 3);
        const routeHtml = `
            <div class="derive-display-card">
                <h4>🚶 Psikocoğrafi Keşif Rotası (Dérive)</h4>
                <p class="meta" style="margin-bottom: 0.50rem;">Şehir ruhunda kaybolmak için 3 duraklı yürüyüş planı. İncelemek için duraklara tıklayabilirsiniz.</p>
                <div class="derive-route">
                    ${pick.map((m, i) => `
                        <div class="derive-step read-btn" data-path="${esc(m.source)}">
                            <div class="derive-step-header">
                                <span>📍 Durak ${i + 1} / 3</span>
                                <span>${esc(m.layer)} (${esc(m.mood)})</span>
                            </div>
                            <div class="derive-step-content">"${esc(m.content)}"</div>
                        </div>
                        ${i < 2 ? '<div class="derive-arrow">↓</div>' : ''}
                    `).join('')}
                </div>
            </div>
        `;
        showInteractiveCard(routeHtml);
        toast("Derive rotası hazırlandı. Şehri hisset!");
    });
    apply();
}

/* --- Document Reader Functions --- */
async function openReader(path) {
    if (!path) return;
    const modal = document.getElementById('reader-modal');
    const body = document.getElementById('reader-body');
    if (!modal || !body) return;

    body.innerHTML = '<p style="text-align: center; color: var(--gold); font-family: var(--serif);">Yükleniyor...</p>';
    modal.classList.remove('hidden');

    try {
        const res = await fetch(`../${path}`);
        if (!res.ok) throw new Error('Yüklenemedi');
        const md = await res.text();
        body.innerHTML = parseMarkdown(md);
    } catch (err) {
        body.innerHTML = `<p style="text-align: center; color: #ff5555;">Hata: Metin yüklenemedi. (${esc(err.message)})</p>`;
    }
}

function parseMarkdown(md) {
    const lines = md.split('\n');
    let output = [];
    let inList = false;
    let inBlockquote = false;
    
    for (let line of lines) {
        let trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('# ')) {
            if (inList) { output.push('</ul>'); inList = false; }
            if (inBlockquote) { output.push('</blockquote>'); inBlockquote = false; }
            output.push(`<h1>${esc(trimmed.substring(2))}</h1>`);
            continue;
        }
        if (trimmed.startsWith('## ')) {
            if (inList) { output.push('</ul>'); inList = false; }
            if (inBlockquote) { output.push('</blockquote>'); inBlockquote = false; }
            output.push(`<h2>${esc(trimmed.substring(3))}</h2>`);
            continue;
        }
        if (trimmed.startsWith('### ')) {
            if (inList) { output.push('</ul>'); inList = false; }
            if (inBlockquote) { output.push('</blockquote>'); inBlockquote = false; }
            output.push(`<h3>${esc(trimmed.substring(4))}</h3>`);
            continue;
        }
        
        // HR line
        if (trimmed === '---') {
            if (inList) { output.push('</ul>'); inList = false; }
            if (inBlockquote) { output.push('</blockquote>'); inBlockquote = false; }
            output.push('<hr>');
            continue;
        }
        
        // Blockquotes
        if (trimmed.startsWith('>')) {
            if (inList) { output.push('</ul>'); inList = false; }
            let quoteText = trimmed.replace(/^>\s*/, '').trim();
            // Remove leading/trailing bold or italic markups
            quoteText = quoteText.replace(/^\*+\s*/, '').replace(/\*+\s*$/, '');
            quoteText = quoteText.replace(/^"+\s*/, '').replace(/"+\s*$/, '');
            if (!inBlockquote) {
                output.push('<blockquote>');
                inBlockquote = true;
            }
            output.push(`<p>${esc(quoteText)}</p>`);
            continue;
        } else {
            if (inBlockquote) {
                output.push('</blockquote>');
                inBlockquote = false;
            }
        }
        
        // List items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            let itemText = trimmed.substring(2).trim();
            // Parse bold inside list item
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (!inList) {
                output.push('<ul>');
                inList = true;
            }
            output.push(`<li>${itemText}</li>`);
            continue;
        } else {
            if (inList) {
                output.push('</ul>');
                inList = false;
            }
        }
        
        // Empty lines
        if (trimmed === '') {
            continue;
        }
        
        // Paragraph
        let para = esc(trimmed);
        para = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        para = para.replace(/\*(.*?)\*/g, '<em>$1</em>');
        output.push(`<p>${para}</p>`);
    }
    
    if (inList) output.push('</ul>');
    if (inBlockquote) output.push('</blockquote>');
    
    return output.join('\n');
}

// Modal control events
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('reader-modal');
    
    // Close button click
    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Outside click close
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // ESC key close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });
});

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
