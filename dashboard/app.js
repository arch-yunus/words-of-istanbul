async function initEngine() {
    try {
        const response = await fetch('../archive/matrix.json');
        const data = await response.json();
        const matrix = data.matrix;

        renderAnalytics(matrix);
        renderSovereignFeed(matrix);
        initializeMapIntelligence();
    } catch (error) {
        console.error("ETERNAL_MATRIX_FETCH_ERROR:", error);
    }
}

function renderAnalytics(matrix) {
    const moods = {};
    matrix.forEach(m => {
        moods[m.mood] = (moods[m.mood] || 0) + 1;
    });

    const ctx = document.getElementById('moodDistribution').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(moods),
            datasets: [{
                label: 'Mood Frequency',
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
                    pointLabels: { color: '#666' },
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderSovereignFeed(matrix) {
    const feed = document.getElementById('main-feed');
    feed.innerHTML = matrix.map(m => `
        <div class="intelligence-item">
            <div class="insight-body">"${m.content}"</div>
            <div class="insight-footer">
                <span>[${m.layer.toUpperCase()}]</span>
                <span>STRAT: ${m.strat}/10</span>
            </div>
        </div>
    `).join('');
}

function initializeMapIntelligence() {
    const paths = document.querySelectorAll('.district-path');
    const intelView = document.getElementById('zone-intel');

    const zoneData = {
        'historic': 'HISTORIC PENINSULA: PRIMARY SOVEREIGN NODE. HIGH SISMIC RISK.',
        'pera': 'BEYOĞLU/PERA: CHAOTIC ENERGY OVERLAY. ACTIVE NEUROSIS ZONE.',
        'asian': 'ANATOLIAN SIDE: RESILIENCE BUFFER. STRATEGIC DEPTH LAYER.',
        'bosphorus': 'BOSPHORUS: GLOBAL JUGULAR VEIN. POWER FLOW 100%.'
    };

    paths.forEach(p => {
        p.addEventListener('mouseenter', () => {
            intelView.classList.add('active-pulse');
            intelView.innerText = zoneData[p.id] || 'SCANNING_NODE...';
        });
        p.addEventListener('mouseleave', () => {
            intelView.classList.remove('active-pulse');
            intelView.innerText = 'SELECT_ZONE_FOR_INTELLIGENCE';
        });
    });
}

initEngine();
