function startScan() {
    const target = document.getElementById('target-input').value.trim();
    const startPort = parseInt(document.getElementById('start-port').value);
    const endPort = parseInt(document.getElementById('end-port').value);

    if (!target) {
        showError('Please enter a target hostname or IP address');
        return;
    }

    if (startPort > endPort) {
        showError('Start port must be less than or equal to end port');
        return;
    }

    showLoading();

    fetch('/api/scan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            target: target,
            start_port: startPort,
            end_port: endPort
        })
    })
    .then(response => response.json())
    .then(displayResults)
    .catch(error => showError(error.message));
}

function showLoading() {
    document.getElementById('scan-results').innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Scanning ports, please wait...</p>
        </div>
    `;
}

function showError(message) {
    document.getElementById('scan-results').innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

function displayResults(data) {
    if (data.error) {
        showError(data.error);
        return;
    }

    const resultBox = document.getElementById('scan-results');
    
    resultBox.innerHTML = `
        <div class="scan-summary">
            <div class="stat-item">
                <span class="stat-label">Open Ports</span>
                <span class="stat-value">${data.open_ports.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Time</span>
                <span class="stat-value">${data.total_time}</span>
            </div>
        </div>
        <div class="port-list">
            ${data.port_details.map(port => `
                <div class="port-item">
                    <span class="port-number">Port ${port.port}</span>
                    <span class="port-status ${port.status.toLowerCase()}">${port.status}</span>
                    <span class="port-service">${port.service}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function copyResults() {
    const results = document.getElementById('scan-results').innerText;
    navigator.clipboard.writeText(results)
        .then(() => alert('Results copied to clipboard'))
        .catch(err => alert('Failed to copy results'));
}

function clearResults() {
    document.getElementById('scan-results').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-fingerprint"></i>
            <p>Enter target details and click Start Scan</p>
        </div>
    `;
}