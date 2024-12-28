async function getClientNetworkInfo() {
    try {
        const response = await fetch('/api/client-info');
        const data = await response.json();
        return {
            ip: data.ip,
            user_agent: data.user_agent,
            headers: data.headers
        };
    } catch (error) {
        return {
            ip: 'Unable to fetch client info',
            user_agent: 'Unknown',
            headers: {}
        };
    }
}

async function fetchClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Unable to fetch IP';
    }
}

// static/http-checker.js
async function checkStatus() {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Please enter a URL');
        return;
    }
    
    showLoading();
    
    try {
        const [statusResult, networkInfo] = await Promise.all([
            fetch('/api/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            }).then(r => r.json()),
            getClientNetworkInfo()
        ]);
        
        displayResult(statusResult, networkInfo);
    } catch (error) {
        showError(error.message);
    }
}

function showLoading() {
    document.getElementById('status-result').innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Checking URL status...</p>
        </div>
    `;
}

function showError(message) {
    document.getElementById('status-result').innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

function displayResult(statusData, networkInfo) {
    const resultBox = document.getElementById('status-result');
    const statusCode = statusData.status_code || 'Error';
    
    resultBox.innerHTML = `
        <div class="status-result status-${statusCode}">
            <div class="status-code">${statusCode}</div>
            <div class="status-message">${statusData.message}</div>
            <div class="status-url">${statusData.url}</div>
            <div class="server-info">
                <h4>Server Information</h4>
                <div>Response Time: ${statusData.response_time} ms</div>
                <div>Server: ${statusData.server}</div>
                <div>Content Type: ${statusData.content_type}</div>
                <div>Content Length: ${statusData.content_length}</div>
            </div>
        </div>
    `;
}

