// Connect to WebSocket
const socket = io();

// Handle bandwidth updates
socket.on('bandwidth_update', (data) => {
    document.getElementById('download-speed').textContent = `${data.download} Mbps`;
    document.getElementById('upload-speed').textContent = `${data.upload} Mbps`;
});

// Add this to your existing script.js
socket.on('interface_update', (interfaces) => {
    const interfaceList = document.getElementById('interface-list');
    interfaceList.innerHTML = ''; // Clear existing interfaces
    
    interfaces.forEach(iface => {
        const card = document.createElement('div');
        card.className = 'interface-card';
        
        const addresses = iface.addresses
            .map(addr => `${addr.type}: ${addr.address}`)
            .join('<br>');
            
        const bytesReceived = (iface.bytes_recv / (1024 * 1024)).toFixed(2);
        const bytesSent = (iface.bytes_sent / (1024 * 1024)).toFixed(2);
        
        card.innerHTML = `
            <h4>${iface.name}</h4>
            <div class="interface-details">
                <div>Status: <span class="status-${iface.status.toLowerCase()}">${iface.status}</span></div>
                <div>Speed: ${iface.speed}</div>
                <div>Addresses:<br>${addresses}</div>
                <div class="interface-stats">
                    <div class="interface-stat">
                        <div>Received</div>
                        <div>${bytesReceived} MB</div>
                    </div>
                    <div class="interface-stat">
                        <div>Sent</div>
                        <div>${bytesSent} MB</div>
                    </div>
                </div>
            </div>
        `;
        
        interfaceList.appendChild(card);
    });
});

// Function to handle tool selection
function selectTool(element) {
    document.querySelectorAll('.tool-card').forEach(card => {
        card.classList.remove('active');
    });
    element.classList.add('active');
}

// Add hover effects for tool cards
document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('mouseover', () => {
        const icon = card.querySelector('.tool-icon i');
        icon.style.transform = 'scale(1.2)';
        icon.style.transition = 'transform 0.3s ease';
    });
    
    card.addEventListener('mouseout', () => {
        const icon = card.querySelector('.tool-icon i');
        icon.style.transform = 'scale(1)';
    });
});