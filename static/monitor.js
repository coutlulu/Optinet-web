// Initialize Socket.IO
const socket = io();

// Format bytes to human readable format
function formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Smooth value updates
function updateValueWithAnimation(element, newValue, unit = '') {
    const currentValue = parseFloat(element.textContent);
    element.textContent = `${newValue.toFixed(2)} ${unit}`;
    
    if (Math.abs(currentValue - newValue) > 0.1) {
        element.classList.add('value-changed');
        setTimeout(() => element.classList.remove('value-changed'), 300);
    }
}

// Handle bandwidth updates
socket.on('bandwidth_update', (data) => {
    updateValueWithAnimation(
        document.getElementById('download-speed'),
        data.download,
        'Mbps'
    );
    updateValueWithAnimation(
        document.getElementById('upload-speed'),
        data.upload,
        'Mbps'
    );
});

// Interface filtering
let currentFilter = 'all';

function setInterfaceFilter(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // Apply filter to interface list
    document.querySelectorAll('.interface-item').forEach(item => {
        const status = item.dataset.status;
        if (filter === 'all' || status === filter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Setup filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setInterfaceFilter(btn.dataset.filter);
    });
});

// Handle interface updates
socket.on('interface_update', (interfaces) => {
    const interfaceList = document.getElementById('interface-list');
    interfaceList.innerHTML = '';
    
    interfaces.forEach(iface => {
        const status = iface.status.toLowerCase();
        const statusIcon = status === 'up' 
            ? '<i class="fas fa-check-circle status-up"></i>' 
            : '<i class="fas fa-times-circle status-down"></i>';
            
        const addresses = iface.addresses
            .map(addr => {
                const icon = addr.type === 'IPv4' 
                    ? '<i class="fas fa-network-wired"></i>' 
                    : '<i class="fas fa-globe"></i>';
                return `
                    <div class="address-item">
                        ${icon}
                        <span class="address-type">${addr.type}:</span>
                        <span class="address-value">${addr.address}</span>
                    </div>
                `;
            })
            .join('');

        const interfaceItem = document.createElement('div');
        interfaceItem.className = 'interface-item';
        interfaceItem.dataset.status = status;
        interfaceItem.style.display = (currentFilter === 'all' || currentFilter === status) ? 'block' : 'none';
        
        interfaceItem.innerHTML = `
            <div class="interface-header">
                <div class="interface-name">
                    ${statusIcon}
                    <span>${iface.name}</span>
                </div>
                <div class="interface-speed">
                    <i class="fas fa-tachometer-alt"></i>
                    ${iface.speed}
                </div>
            </div>
            
            <div class="interface-details">
                <div class="interface-addresses">
                    ${addresses}
                </div>
                
                <div class="interface-stats">
                    <div class="stat-item">
                        <i class="fas fa-download"></i>
                        <span class="stat-label">Received</span>
                        <span class="stat-value">${formatBytes(iface.bytes_recv)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-upload"></i>
                        <span class="stat-label">Sent</span>
                        <span class="stat-value">${formatBytes(iface.bytes_sent)}</span>
                    </div>
                </div>
            </div>
        `;
        
        interfaceList.appendChild(interfaceItem);
    });
});

// Handle WebSocket errors
socket.on('connect_error', () => {
    console.error('WebSocket connection failed');
    // Add UI error handling if needed
});