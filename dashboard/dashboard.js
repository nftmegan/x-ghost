import { dbService } from '../lib/database.js';

document.addEventListener('DOMContentLoaded', async () => {
    setupTabs();
    await loadConfig();
    await loadDatabase();

    // Event Listeners
    document.getElementById('btn-save-config').addEventListener('click', saveConfig);
    document.getElementById('btn-refresh').addEventListener('click', loadDatabase);
    document.getElementById('btn-clear').addEventListener('click', async () => {
        if(confirm("Clear entire database?")) {
            await dbService.clear();
            loadDatabase();
        }
    });
});

// --- TABS ---
function setupTabs() {
    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Activate clicked
            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// --- CONFIGURATION ---
async function loadConfig() {
    const data = await chrome.storage.local.get("config");
    // Merge with defaults from lib/config.js (loaded in html)
    const config = { ...DEFAULT_CONFIG, ...(data.config || {}) };

    document.getElementById('conf-enableActions').checked = config.enableActions;
    document.getElementById('conf-simulationMode').checked = config.simulationMode;
    document.getElementById('conf-keywords').value = (config.keywords || []).join(", ");
    document.getElementById('conf-replies').value = (config.replies || []).join("\n");
    document.getElementById('conf-followLimit').value = config.followLimitCount;
    document.getElementById('conf-maxActions').value = config.maxActionsPerSession;
}

async function saveConfig() {
    const data = await chrome.storage.local.get("config");
    const current = data.config || DEFAULT_CONFIG;

    const newConfig = {
        ...current,
        enableActions: document.getElementById('conf-enableActions').checked,
        simulationMode: document.getElementById('conf-simulationMode').checked,
        keywords: document.getElementById('conf-keywords').value.split(',').map(s => s.trim()).filter(s => s),
        replies: document.getElementById('conf-replies').value.split('\n').map(s => s.trim()).filter(s => s),
        followLimitCount: parseInt(document.getElementById('conf-followLimit').value) || 15,
        maxActionsPerSession: parseInt(document.getElementById('conf-maxActions').value) || 20
    };

    await chrome.storage.local.set({ config: newConfig });
    alert("Configuration Saved!");
}

// --- DATABASE ---
async function loadDatabase() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    
    try {
        const records = await dbService.getAll();
        tbody.innerHTML = '';
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No actions recorded.</td></tr>';
            return;
        }

        records.forEach(row => {
            const tr = document.createElement('tr');
            const date = new Date(row.timestamp).toLocaleTimeString();
            const statusClass = `status-${row.status.toLowerCase()}`;
            const details = `Reply: "${row.details.replyText || ''}"`;

            tr.innerHTML = `
                <td>${date}</td>
                <td>${row.type}</td>
                <td class="${statusClass}"><strong>${row.status}</strong></td>
                <td><a href="${row.targetUrl}" target="_blank" style="color:#1d9bf0">Link</a></td>
                <td>${details}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error: ${e.message}</td></tr>`;
    }
}