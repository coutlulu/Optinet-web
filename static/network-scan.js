async function getCurrentIP() {
    try {
        const response = await fetch('/api/current-ip');
        const data = await response.json();
        document.getElementById('current-ip').innerHTML = `
            <div class="info-item">
                <i class="fas fa-network-wired"></i>
                <div>
                    <div class="info-label">IP Address</div>
                    <div class="info-value">${data.ip}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching IP:', error);
    }
}

async function startScan() {
    const ipRange = document.getElementById('ip-range-input').value.trim();
    
    if (!ipRange) {
        showError('Please enter an IP range');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/scan-network', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip_range: ipRange })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data.devices);
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError(error.message);
    }
}

function showLoading() {
    document.getElementById('scan-results').innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Scanning network, please wait...</p>
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

function displayResults(devices) {
    const resultBox = document.getElementById('scan-results');
    
    if (devices.length === 0) {
        resultBox.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No devices found in the specified range</p>
            </div>
        `;
        return;
    }
    
    resultBox.innerHTML = `
        <div class="devices-count">
            <i class="fas fa-laptop"></i>
            Found ${devices.length} device${devices.length > 1 ? 's' : ''} on network
        </div>
        <div class="device-list">
            ${devices.map(device => `
                <div class="device-item">
                    <div class="device-icon">
                        <i class="fas fa-laptop"></i>
                    </div>
                    <div class="device-info">
                        <div class="device-ip">${device.ip}</div>
                        <div class="device-mac">${device.mac}</div>
                    </div>
                    <button class="action-button" onclick="copyDeviceInfo('${device.ip}', '${device.mac}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function copyDeviceInfo(ip, mac) {
    const info = `IP: ${ip}\nMAC: ${mac}`;
    navigator.clipboard.writeText(info)
        .then(() => {
            // Could add a toast notification here
            console.log('Device info copied');
        })
        .catch(err => console.error('Copy failed:', err));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    getCurrentIP();
});