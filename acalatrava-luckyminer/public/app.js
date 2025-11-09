const API_BASE = '/api';

let currentStatus = false;

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadConfig() {
    try {
        const config = await fetchAPI('/config');
        document.getElementById('stratum').value = config.stratum || '';
        document.getElementById('username').value = config.username || '';
        document.getElementById('password').value = config.password || '';
    } catch (error) {
        showError('Failed to load configuration');
    }
}

async function saveConfig() {
    const config = {
        stratum: document.getElementById('stratum').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    try {
        await fetchAPI('/config', {
            method: 'POST',
            body: JSON.stringify(config)
        });
        return true;
    } catch (error) {
        showError('Failed to save configuration');
        return false;
    }
}

async function saveAndStart() {
    const saved = await saveConfig();
    if (saved) {
        await startMining();
    }
}

async function startMining() {
    try {
        const result = await fetchAPI('/start', {
            method: 'POST'
        });
        if (result.success) {
            showSuccess('Mining started successfully');
            updateStatus();
        } else {
            showError(result.error || 'Failed to start mining');
        }
    } catch (error) {
        showError('Failed to start mining: ' + error.message);
    }
}

async function stopMining() {
    try {
        const result = await fetchAPI('/stop', {
            method: 'POST'
        });
        if (result.success) {
            showSuccess('Mining stopped successfully');
            updateStatus();
        } else {
            showError('Failed to stop mining');
        }
    } catch (error) {
        showError('Failed to stop mining: ' + error.message);
    }
}

async function updateStatus() {
    try {
        const status = await fetchAPI('/status');
        currentStatus = status.running;
        updateStatusUI();
    } catch (error) {
        console.error('Failed to update status:', error);
    }
}

function updateStatusUI() {
    const indicator = document.querySelector('.status-dot');
    const statusText = document.getElementById('statusText');
    const saveAndStartBtn = document.getElementById('saveAndStartBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statsCard = document.getElementById('statsCard');
    const configCard = document.querySelector('.config-card');
    const stopCard = document.getElementById('stopCard');

    if (currentStatus) {
        indicator.className = 'status-dot running';
        statusText.textContent = 'Mining is running';
        if (saveAndStartBtn) saveAndStartBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (statsCard) statsCard.style.display = 'block';
        if (configCard) configCard.style.display = 'none';
        if (stopCard) stopCard.style.display = 'block';
    } else {
        indicator.className = 'status-dot stopped';
        statusText.textContent = 'Mining is stopped';
        if (saveAndStartBtn) saveAndStartBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (statsCard) statsCard.style.display = 'none';
        if (configCard) configCard.style.display = 'block';
        if (stopCard) stopCard.style.display = 'none';
    }
}

function formatHashRate(rate) {
    if (!rate || rate === 0) return '0 H/s';
    if (rate < 1000) return `${rate.toFixed(2)} H/s`;
    if (rate < 1000000) return `${(rate / 1000).toFixed(2)} KH/s`;
    if (rate < 1000000000) return `${(rate / 1000000).toFixed(2)} MH/s`;
    return `${(rate / 1000000000).toFixed(2)} GH/s`;
}

async function updateMiningStats() {
    if (!currentStatus) return;

    try {
        const summary = await fetchAPI('/mining/summary');
        if (summary && summary.SUMMARY) {
            const data = summary.SUMMARY[0];
            document.getElementById('hashRate').textContent = formatHashRate(parseFloat(data['MHS av']) * 1000000);
            document.getElementById('acceptedShares').textContent = data['Accepted'] || '0';
            document.getElementById('rejectedShares').textContent = data['Rejected'] || '0';
            document.getElementById('difficulty').textContent = data['Difficulty Accepted'] || '-';
        }

        const devs = await fetchAPI('/mining/devs');
        if (devs && devs.DEVS && devs.DEVS.length > 0) {
            const devicesSection = document.getElementById('devicesSection');
            const devicesList = document.getElementById('devicesList');

            if (devicesSection) devicesSection.style.display = 'block';
            if (devicesList) {
                devicesList.innerHTML = devs.DEVS.map((dev, index) => {
                    const hashRate = formatHashRate(parseFloat(dev['MHS av'] || 0) * 1000000);
                    return `
                        <div class="device-item">
                            <h4>Device ${index + 1} - ${dev.Name || 'Unknown'}</h4>
                            <div class="device-stats">
                                <div class="device-stat"><strong>Hash Rate:</strong> ${hashRate}</div>
                                <div class="device-stat"><strong>Accepted:</strong> ${dev['Accepted'] || 0}</div>
                                <div class="device-stat"><strong>Rejected:</strong> ${dev['Rejected'] || 0}</div>
                                <div class="device-stat"><strong>Temperature:</strong> ${dev['Temperature'] || 'N/A'}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Failed to update mining stats:', error);
    }
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.getElementById('configForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveAndStart();
});

document.getElementById('stopBtn').addEventListener('click', stopMining);

loadConfig();
updateStatus();
setInterval(updateStatus, 5000);
setInterval(updateMiningStats, 3000);

