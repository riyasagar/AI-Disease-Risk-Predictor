document.addEventListener('DOMContentLoaded', async function() {
    const historyListDiv = document.getElementById('history-list');

    try {
        const response = await fetch('/api/history');
        const historyData = await response.json();

        if (!response.ok) {
            throw new Error(historyData.error || 'Failed to fetch history');
        }

        if (historyData.length === 0) {
            historyListDiv.innerHTML = '<p>You have no prediction history yet. Go to the Predictor to get started!</p>';
            return;
        }

        historyListDiv.innerHTML = ''; // Clear loading message

        historyData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';

            const date = new Date(item.timestamp).toLocaleString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            
            // Nicely format symptoms from an array into a comma-separated string
            const symptoms = item.symptoms.join(', ').replace(/_/g, ' ');

            card.innerHTML = `
                <h3>${item.prediction}</h3>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Symptoms Reported:</strong> ${symptoms}</p>
            `;
            historyListDiv.appendChild(card);
        });

    } catch (error) {
        console.error('Failed to fetch history:', error);
        historyListDiv.innerHTML = `<p style="color: #e74c3c;">Could not load history. ${error.message}</p>`;
    }
});
