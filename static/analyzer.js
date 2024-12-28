// Tool configurations
const toolConfig = {
    ping: {
        icon: 'fa-exchange-alt',
        title: 'Ping Test',
        hint: 'Measures the round-trip time and packet loss between your device and the target host.',
        placeholder: 'Enter hostname or IP (e.g., google.com)',
        loadingMessage: 'Pinging host...'
    },
    nslookup: {
        icon: 'fa-search',
        title: 'DNS Lookup',
        hint: 'Retrieves DNS records and domain information from nameservers.',
        placeholder: 'Enter domain name (e.g., example.com)',
        loadingMessage: 'Looking up DNS records...'
    },
    traceroute: {
        icon: 'fa-route',
        title: 'Traceroute',
        hint: 'Traces the network path and shows each hop between your device and the target.',
        placeholder: 'Enter hostname or IP (e.g., github.com)',
        loadingMessage: 'Tracing route...'
    }
};

let currentTool = 'ping';

// Tool selection
function selectAnalysisTool(tool) {
    currentTool = tool;
    
    // Update UI state
    document.querySelectorAll('.tool-card').forEach(card => {
        card.classList.remove('active');
    });
    document.getElementById(`${tool}-tool`).classList.add('active');
    
    // Update input placeholder
    const hostInput = document.getElementById('host-input');
    hostInput.placeholder = toolConfig[tool].placeholder;
    
    // Update hint text
    document.getElementById('tool-hint').textContent = toolConfig[tool].hint;
    
    // Clear previous results
    showEmpty();
}

// Handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        runAnalysis();
    }
}

// Run analysis
async function runAnalysis() {
    const hostInput = document.getElementById('host-input');
    const host = hostInput.value.trim();
    
    if (!host) {
        showError('Please enter a hostname or IP address');
        hostInput.focus();
        return;
    }
    
    showLoading(toolConfig[currentTool].loadingMessage);
    
    try {
        const response = await fetch(`/api/${currentTool}/${encodeURIComponent(host)}`);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        switch (currentTool) {
            case 'nslookup':
                displayNSLookup(data.result);
                break;
            case 'ping':
                displayPing(data.result);
                break;
            case 'traceroute':
                displayTraceroute(data.result);
                break;
        }
    } catch (error) {
        showError(error.message);
    }
}

// Display Functions
function showLoading(message) {
    document.getElementById('analysis-result').innerHTML = `
        <div class="result-content">
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        </div>
    `;
}

function showError(message) {
    document.getElementById('analysis-result').innerHTML = `
        <div class="result-content">
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        </div>
    `;
}

function showEmpty() {
    document.getElementById('analysis-result').innerHTML = `
        <div class="result-content">
            <div class="empty-state">
                <i class="fas fa-terminal"></i>
                <p>Enter a hostname or IP address and click Analyze to begin</p>
            </div>
        </div>
    `;
}

function displayPing(result) {
    // Extract statistics if available
    const stats = extractPingStats(result);
    
    document.getElementById('analysis-result').innerHTML = `
        <div class="result-content">
            ${stats ? `
                <div class="ping-stats">
                    <div class="stat-item">
                        <span class="stat-label">Min Response</span>
                        <span class="stat-value">${stats.min}ms</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Max Response</span>
                        <span class="stat-value">${stats.max}ms</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Average</span>
                        <span class="stat-value">${stats.avg}ms</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Packet Loss</span>
                        <span class="stat-value">${stats.loss}%</span>
                    </div>
                </div>
            ` : ''}
            <div class="command-result">
                ${result}
            </div>
        </div>
    `;
}

function displayNSLookup(records) {
    if (typeof records === 'string') {
        showError(records);
        return;
    }
    
    const recordsByType = groupRecordsByType(records);
    
    document.getElementById('analysis-result').innerHTML = `
        <div class="result-content">
            <div class="dns-results">
                ${Object.entries(recordsByType).map(([type, records]) => `
                    <div class="dns-record">
                        <span class="record-type">${type}</span>
                        <span class="record-value">${records.join(', ')}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function displayTraceroute(result) {
    document.getElementById('analysis-result').innerHTML = `
        <div class="result-content">
            <div class="command-result">
                ${result}
            </div>
        </div>
    `;
}

// Helper Functions
function groupRecordsByType(records) {
    return records.reduce((acc, [type, value]) => {
        if (!acc[type]) acc[type] = [];
        acc[type].push(value);
        return acc;
    }, {});
}

function extractPingStats(result) {
    try {
        const lines = result.split('\n');
        const statsLine = lines.find(line => line.includes('statistics'));
        const timingLine = lines.find(line => line.includes('round-trip'));
        
        if (!statsLine || !timingLine) return null;
        
        const loss = statsLine.match(/(\d+)%/)?.[1] || '0';
        const [min, avg, max] = timingLine.match(/[\d.]+/g) || ['0', '0', '0'];
        
        return { min, avg, max, loss };
    } catch {
        return null;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    selectAnalysisTool('ping');
});