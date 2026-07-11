// Words of Istanbul v6.5 — Living Soul Matrix Dashboard Logic
let chart;
let matrixDataGlobal = [];
let corpusDataGlobal = { essays: [] };
let graphNodes = [];
let hoveredNode = null;
let selectedNode = null;
let activeRouteNodes = []; // Holds the 3 nodes of active Derive route

// Graph state controls
let physicsEnabled = true;
let linesEnabled = true;

const layerColors = {
    'Psikoloji': '#c5a059',
    'İmparatorluk': '#c0392b',
    'Edebiyat': '#2980b9',
    'Şehir': '#27ae60',
    'Mitoloji': '#8e44ad',
    'Genel': '#888888',
    'Belirsiz': '#888888'
};

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

// ----------------------------------------------------
// HTML5 Canvas Constellation Graph Engine
// ----------------------------------------------------
class GraphNode {
    constructor(data, width, height) {
        this.data = data;
        this.id = data.id;
        this.layer = data.layer;
        
        // Random positioning
        this.x = Math.random() * (width - 40) + 20;
        this.y = Math.random() * (height - 40) + 20;
        
        // Random slow velocities
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        
        this.color = layerColors[this.layer] || '#888888';
        this.baseRadius = 5 + (data.impact ? data.impact * 0.4 : 2); // Radius based on impact
        this.radius = this.baseRadius;
        this.targetRadius = this.baseRadius;
        this.opacity = 1.0;
        this.targetOpacity = 1.0;
    }

    update(width, height) {
        if (physicsEnabled) {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 15) { this.x = 15; this.vx *= -1; }
            if (this.x > width - 15) { this.x = width - 15; this.vx *= -1; }
            if (this.y < 15) { this.y = 15; this.vy *= -1; }
            if (this.y > height - 15) { this.y = height - 15; this.vy *= -1; }
        }

        // Smooth radius transition
        this.radius += (this.targetRadius - this.radius) * 0.15;
        // Smooth opacity transition
        this.opacity += (this.targetOpacity - this.opacity) * 0.1;
    }

    draw(ctx, isSelected, isHovered, isRoute) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Draw shadow glow
        ctx.shadowBlur = isSelected ? 18 : (isHovered || isRoute ? 12 : 4);
        ctx.shadowColor = this.color;

        // Node fill
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer ring for selected/hovered nodes
        if (isSelected) {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
        } else if (isHovered) {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
        } else if (isRoute) {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#c5a059';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

function initConstellationGraph() {
    const canvas = document.getElementById('constellationCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    function resizeCanvas() {
        const rect = canvas.parentNode.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height || 380;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Populate graph node instances
    function rebuildNodes() {
        const w = canvas.width;
        const h = canvas.height;
        // Keep existing positions if possible, or initialize new
        const prevNodesMap = new Map(graphNodes.map(n => [n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy }]));
        
        graphNodes = matrixDataGlobal.map(m => {
            const gn = new GraphNode(m, w, h);
            if (prevNodesMap.has(m.id)) {
                const prev = prevNodesMap.get(m.id);
                gn.x = prev.x;
                gn.y = prev.y;
                gn.vx = prev.vx;
                gn.vy = prev.vy;
            }
            return gn;
        });
    }

    rebuildNodes();
    // Expose nodes rebuilder globally
    window.rebuildGraphNodes = rebuildNodes;

    // Track mouse inputs
    const tooltip = document.getElementById('graph-tooltip');
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        let found = null;
        for (let n of graphNodes) {
            // Only hover active matching nodes
            if (n.targetOpacity < 0.3) continue;
            const dist = Math.hypot(n.x - mx, n.y - my);
            if (dist < n.radius + 8) {
                found = n;
                break;
            }
        }

        if (found !== hoveredNode) {
            hoveredNode = found;
            if (found) {
                // Show custom tooltip
                tooltip.innerHTML = `
                    <div class="tooltip-layer" style="color: ${layerColors[found.layer]}">
                        ${esc(found.layer)}
                        <span class="tooltip-mood">${esc(found.data.mood)}</span>
                    </div>
                    <div class="tooltip-category">${esc(found.data.category)}</div>
                    <div class="tooltip-quote">"${esc(found.data.content.substring(0, 75))}${found.data.content.length > 75 ? '...' : ''}"</div>
                `;
                tooltip.classList.remove('hidden');
                
                // Position tooltip
                const tooltipRect = tooltip.getBoundingClientRect();
                let tx = e.clientX - rect.left + 15;
                let ty = e.clientY - rect.top + 15;
                
                // Prevent overflowing bounds
                if (tx + tooltipRect.width > rect.width) tx = e.clientX - rect.left - tooltipRect.width - 10;
                if (ty + tooltipRect.height > rect.height) ty = e.clientY - rect.top - tooltipRect.height - 10;
                
                tooltip.style.left = `${tx}px`;
                tooltip.style.top = `${ty}px`;
                
                found.targetRadius = found.baseRadius + 3;
            } else {
                tooltip.classList.add('hidden');
                graphNodes.forEach(n => n.targetRadius = n.baseRadius);
            }
        } else if (found) {
            // Keep tooltip position updated
            let tx = e.clientX - rect.left + 15;
            let ty = e.clientY - rect.top + 15;
            tooltip.style.left = `${tx}px`;
            tooltip.style.top = `${ty}px`;
        }
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredNode = null;
        tooltip.classList.add('hidden');
        graphNodes.forEach(n => n.targetRadius = n.baseRadius);
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        let clicked = null;
        for (let n of graphNodes) {
            if (n.targetOpacity < 0.3) continue;
            const dist = Math.hypot(n.x - mx, n.y - my);
            if (dist < n.radius + 8) {
                clicked = n;
                break;
            }
        }

        if (clicked) {
            selectNode(clicked.data.id);
        }
    });

    // Graph Controls
    const physicsBtn = document.getElementById('graph-physics-btn');
    const linesBtn = document.getElementById('graph-lines-btn');
    const resetBtn = document.getElementById('graph-reset-btn');

    physicsBtn?.addEventListener('click', () => {
        physicsEnabled = !physicsEnabled;
        physicsBtn.classList.toggle('active', physicsEnabled);
    });

    linesBtn?.addEventListener('click', () => {
        linesEnabled = !linesEnabled;
        linesBtn.classList.toggle('active', linesEnabled);
    });

    resetBtn?.addEventListener('click', () => {
        graphNodes.forEach(n => {
            n.x = Math.random() * (canvas.width - 40) + 20;
            n.y = Math.random() * (canvas.height - 40) + 20;
            n.vx = (Math.random() - 0.5) * 0.4;
            n.vy = (Math.random() - 0.5) * 0.4;
        });
        toast("Takımyıldız görünümü sıfırlandı.");
    });

    // Main animation frame loop
    function animate() {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 1. Draw connection lines
        if (linesEnabled) {
            ctx.save();
            ctx.lineWidth = 0.5;
            for (let i = 0; i < graphNodes.length; i++) {
                const n1 = graphNodes[i];
                if (n1.opacity < 0.3) continue;
                
                for (let j = i + 1; j < graphNodes.length; j++) {
                    const n2 = graphNodes[j];
                    if (n2.opacity < 0.3) continue;
                    if (n1.layer !== n2.layer) continue; // Connect same category

                    const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
                    if (d < 120) {
                        ctx.strokeStyle = n1.color;
                        ctx.globalAlpha = (1 - (d / 120)) * 0.18 * Math.min(n1.opacity, n2.opacity);
                        ctx.beginPath();
                        ctx.moveTo(n1.x, n1.y);
                        ctx.lineTo(n2.x, n2.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();
        }

        // 2. Draw Derive active path
        if (activeRouteNodes.length > 1) {
            ctx.save();
            ctx.strokeStyle = '#c5a059';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(197, 160, 89, 0.4)';
            
            // Collect path coordinates of the selected route nodes
            const routeCoordinates = [];
            for (let rNodeData of activeRouteNodes) {
                const matched = graphNodes.find(n => n.id === rNodeData.id);
                if (matched) {
                    routeCoordinates.push(matched);
                }
            }

            if (routeCoordinates.length > 1) {
                ctx.beginPath();
                ctx.moveTo(routeCoordinates[0].x, routeCoordinates[0].y);
                for (let k = 1; k < routeCoordinates.length; k++) {
                    ctx.lineTo(routeCoordinates[k].x, routeCoordinates[k].y);
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        // 3. Update & Draw individual nodes
        for (let n of graphNodes) {
            n.update(w, h);
            const isSelected = selectedNode && selectedNode.id === n.id;
            const isHovered = hoveredNode && hoveredNode.id === n.id;
            const isRoute = activeRouteNodes.some(rn => rn.id === n.id);
            n.draw(ctx, isSelected, isHovered, isRoute);
        }

        requestAnimationFrame(animate);
    }
    animate();
}

function selectNode(id) {
    const matched = matrixDataGlobal.find(m => m.id === id);
    if (!matched) return;
    
    selectedNode = matched;
    
    // Update Detail Card HTML
    const detailCard = document.getElementById('node-detail-card');
    const detailContent = detailCard.querySelector('.detail-content');
    const placeholder = detailCard.querySelector('.detail-placeholder');
    
    if (detailCard && detailContent && placeholder) {
        detailCard.classList.remove('empty-detail');
        placeholder.classList.add('hidden');
        detailContent.classList.remove('hidden');
        
        const layerBadge = document.getElementById('detail-layer');
        layerBadge.textContent = matched.layer;
        layerBadge.className = `detail-badge badge-${matched.layer.toLowerCase().replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c')}`;
        
        document.getElementById('detail-mood').textContent = matched.mood;
        document.getElementById('detail-quote').textContent = `"${matched.content}"`;
        document.getElementById('detail-impact').textContent = `${matched.impact}/10`;
        document.getElementById('detail-depth').textContent = `${matched.depth}/10`;
        document.getElementById('detail-strat').textContent = `${matched.strat}/10`;
        
        const readBtn = document.getElementById('detail-read-btn');
        if (matched.source) {
            readBtn.classList.remove('hidden');
            readBtn.onclick = () => openReader(matched.source);
        } else {
            readBtn.classList.add('hidden');
        }
    }

    // Highlight card in side list
    document.querySelectorAll('.feed .card').forEach(card => {
        card.classList.remove('selected-card');
    });
    
    const matchedCard = Array.from(document.querySelectorAll('.feed .card')).find(c => {
        const link = c.querySelector('.feed-essay-link');
        // Simple heuristic: match quote content snippet
        return c.querySelector('.quote').textContent.includes(matched.content.substring(0, 10));
    });
    
    if (matchedCard) {
        matchedCard.classList.add('selected-card');
        matchedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ----------------------------------------------------
// Layout & Data Rendering Functions
// ----------------------------------------------------
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
        <article class="card" onclick="selectNode('${esc(m.id)}')">
            <p class="quote">"${esc(m.content)}"</p>
            <footer>
                <span class="detail-badge badge-${esc(m.layer.toLowerCase().replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c'))}">${esc(m.layer)}</span>
                <a href="#" class="feed-essay-link" data-path="${esc(m.source || '')}">${esc(m.source || '').split('/').pop()}</a>
            </footer>
        </article>
    `).join('');

    // Bind click events on feed links
    feed.querySelectorAll('.feed-essay-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop trigger card selection click
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
    
    // HSL Colors converted to Hex matching style.css design variables
    const backgroundColors = Object.keys(layers).map(layerName => layerColors[layerName] || '#888888');
    
    chart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(layers),
            datasets: [{
                data: Object.values(layers),
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)'
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { 
                        color: '#a0a2af', 
                        font: { size: 9, family: 'Inter' },
                        boxWidth: 8,
                        padding: 6
                    } 
                } 
            } 
        }
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
        activeRouteNodes = []; // Clear graph route highlighted connections
    });

    // Re-bind click events inside the display if there are read buttons
    display.querySelectorAll('.read-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const path = btn.getAttribute('data-path');
            if (path) openReader(path);
        });
    });
}

function updateData(matrixJSON) {
    matrixDataGlobal = matrixJSON.matrix || [];
    
    // Update headers and text strings
    document.getElementById('meta-line').textContent =
        `${matrixJSON.version || 'v6.5'} · ${matrixDataGlobal.length} düğüm`;
        
    // Apply filters and reload graph nodes
    if (window.rebuildGraphNodes) {
        window.rebuildGraphNodes();
    }
    
    // Refresh components
    renderChart(matrixDataGlobal);
    applyFilters();
}

function applyFilters() {
    const q = document.getElementById('q');
    const layerFilter = document.getElementById('layer-filter');
    const filtered = matrixDataGlobal.filter(m => matchNode(m, q?.value, layerFilter?.value));
    
    // Render the text feed
    renderFeed(filtered);
    
    // Propagate opacity changes to Graph Nodes based on filter matches
    const filteredIds = new Set(filtered.map(m => m.id));
    graphNodes.forEach(gn => {
        if (filteredIds.has(gn.id)) {
            gn.targetOpacity = 1.0;
        } else {
            gn.targetOpacity = 0.12; // fade out non-matching stars
        }
    });
}

function bindControls(matrix) {
    const q = document.getElementById('q');
    const layerFilter = document.getElementById('layer-filter');
    
    const layers = [...new Set(matrix.map(m => m.layer))].sort();
    layerFilter.innerHTML = '<option value="">Tüm katmanlar</option>' +
        layers.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');

    q?.addEventListener('input', applyFilters);
    layerFilter?.addEventListener('change', applyFilters);

    // Oracle (Günün Kahini) button
    document.getElementById('oracle')?.addEventListener('click', () => {
        if (!matrixDataGlobal.length) return;
        const m = matrixDataGlobal[Math.floor(Math.random() * matrixDataGlobal.length)];
        
        // Highlight in graph & selection
        selectNode(m.id);
        activeRouteNodes = [m]; // Draw indicator around it
        
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
    
    // Derive (Yürüyüş rotası) button
    document.getElementById('derive')?.addEventListener('click', () => {
        if (matrixDataGlobal.length < 3) return;
        const pick = [...matrixDataGlobal].sort(() => Math.random() - 0.5).slice(0, 3);
        
        // Populate active route for canvas drawer
        activeRouteNodes = pick;
        
        // Auto select the first route point
        selectNode(pick[0].id);

        const routeHtml = `
            <div class="derive-display-card">
                <h4>🚶 Psikocoğrafi Keşif Rotası (Dérive)</h4>
                <p class="meta" style="margin-bottom: 0.50rem;">Şehir ruhunda kaybolmak için 3 duraklı yürüyüş planı. İncelemek için duraklara tıklayabilirsiniz.</p>
                <div class="derive-route">
                    ${pick.map((m, i) => `
                        <div class="derive-step" onclick="selectNode('${esc(m.id)}')">
                            <div class="derive-step-header">
                                <span>📍 Durak ${i + 1} / 3</span>
                                <span style="color: ${layerColors[m.layer]}">${esc(m.layer)} (${esc(m.mood)})</span>
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

    // Form Contribution Submission
    const form = document.getElementById('contrib-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('contrib-submit');
        const quoteEl = document.getElementById('c-quote');
        const layerEl = document.getElementById('c-layer');
        const moodEl = document.getElementById('c-mood');
        
        if (submitBtn.classList.contains('loading')) return;
        
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Mühürleniyor...';
        
        try {
            const response = await fetch('/api/observation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quote: quoteEl.value.trim(),
                    layer_choice: layerEl.value,
                    mood: moodEl.value.trim()
                })
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Gözlem mühürlenemedi.');
            }
            
            toast('Gözleminiz başarıyla mühürlendi ve Matrix derlendi!');
            quoteEl.value = '';
            moodEl.value = '';
            
            // Update UI with newly rebuilt matrix
            if (result.data) {
                updateData(result.data);
                
                // Fetch corpus.json again since it was also rebuilt
                const corpusRes = await fetch('../archive/corpus.json');
                if (corpusRes.ok) {
                    corpusDataGlobal = await corpusRes.json();
                    renderPillars(corpusDataGlobal.essays || []);
                    document.getElementById('essay-count').textContent =
                        `${corpusDataGlobal.essays?.length || 0} deneme · son sync ${corpusDataGlobal.metadata?.last_sync || '—'}`;
                }
            }
        } catch (err) {
            toast('Mühürleme Hatası: ' + err.message);
            console.error(err);
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Matrix\'e Mühürle';
        }
    });

    applyFilters();
}

// ----------------------------------------------------
// Document Reader Functions
// ----------------------------------------------------
async function openReader(path) {
    if (!path) return;
    const modal = document.getElementById('reader-modal');
    const body = document.getElementById('reader-body');
    if (!modal || !body) return;

    body.innerHTML = '<p style="text-align: center; color: var(--gold); font-family: var(--serif); padding: 2rem;">Yükleniyor...</p>';
    modal.classList.remove('hidden');

    try {
        const res = await fetch(`../${path}`);
        if (!res.ok) throw new Error('Yüklenemedi');
        const md = await res.text();
        body.innerHTML = parseMarkdown(md);
    } catch (err) {
        body.innerHTML = `<p style="text-align: center; color: #ff5555; padding: 2rem;">Hata: Metin yüklenemedi. (${esc(err.message)})</p>`;
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
        
        matrixDataGlobal = (await matrixRes.json()).matrix || [];
        corpusDataGlobal = corpusRes.ok ? await corpusRes.json() : { essays: [] };

        // Expose matrix data globally
        const matrixJSON = {
            version: corpusDataGlobal.version || 'v6.5',
            matrix: matrixDataGlobal
        };
        
        document.getElementById('meta-line').textContent =
            `${matrixJSON.version} · ${matrixDataGlobal.length} düğüm`;
        document.getElementById('essay-count').textContent =
            `${corpusDataGlobal.essays?.length || 0} deneme · son sync ${corpusDataGlobal.metadata?.last_sync || '—'}`;

        renderChart(matrixDataGlobal);
        renderPillars(corpusDataGlobal.essays || []);
        
        // Initialize HTML5 canvas graph engine
        initConstellationGraph();
        
        bindControls(matrixDataGlobal);
    } catch (e) {
        toast('Veri yüklenemedi. python src/ruh.py --serve ile açın.');
        console.error(e);
    }
}

init();
// Expose functions to window for onclick handlers in dynamically generated HTML
window.selectNode = selectNode;
