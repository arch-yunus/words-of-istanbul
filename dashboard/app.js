async function init() {
    try {
        const response = await fetch('../archive/quotes.json');
        const data = await response.json();
        const quotes = data.quotes;

        renderStats(quotes);
        renderFeed(quotes);
        setupMapInteractions(quotes);
    } catch (error) {
        console.error("Masterclass data loading failure:", error);
    }
}

function renderStats(quotes) {
    const moods = {};
    quotes.forEach(q => {
        moods[q.mood] = (moods[q.mood] || 0) + 1;
    });

    const ctx = document.getElementById('moodChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(moods),
            datasets: [{
                data: Object.values(moods),
                backgroundColor: [
                    '#c5a059', '#1a1a3a', '#4a4a4a', '#8b0000', '#004d40', '#3e2723'
                ],
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#808080', font: { family: 'Inter' } }
                }
            }
        }
    });
}

function renderFeed(quotes) {
    const container = document.getElementById('feed-container');
    container.innerHTML = quotes.map(q => `
        <div class="insight-item">
            <div class="insight-content">"${q.content}"</div>
            <div class="insight-meta">
                <span>? ${q.author}</span>
                <span>? ${q.mood} | Impact: ${q.impact_factor || '1.0'}</span>
            </div>
        </div>
    `).join('');
}

function setupMapInteractions(quotes) {
    const paths = document.querySelectorAll('path');
    const target = document.getElementById('map-target');

    const zoneDetails = {
        'peninsula': 'Historic Peninsula: The Byzantine and Ottoman core. High strategic value (9/10).',
        'beyoglu': 'Beyoğlu (Pera): The European face of Istanbul. Chaotic energy (8/10).',
        'kadikoy': 'Kadıköy (Chalcedon): The land of the blind. High hüzün and resilience (8/10).',
        'bogazici': 'Bosphorus: The jugular vein of the world. Vitality and Power (10/10).',
        'uskudar': 'Üsküdar: The spiritual gateway. Deep historical resonance (7/10).'
    };

    paths.forEach(path => {
        path.addEventListener('mouseenter', () => {
            const id = path.id;
            target.innerText = zoneDetails[id] || 'Scanning zone...';
        });

        path.addEventListener('mouseleave', () => {
            target.innerText = '';
        });

        path.addEventListener('click', () => {
             // Filter feed by a related mood if wanted, or just highlight
             alert(`Entering ${path.id.toUpperCase()} Intelligence Zone...`);
        });
    });
}

init();
