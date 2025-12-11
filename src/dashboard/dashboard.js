import { Database } from '../core/database.js';
import { CONFIG } from '../config/constants.js';

document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    await loadSettings();
    await loadHistory();

    // Event Listeners
    document.getElementById('btn-save').addEventListener('click', saveSettings);
    document.getElementById('btn-refresh').addEventListener('click', loadHistory);
    document.getElementById('btn-clear').addEventListener('click', async () => {
        if(confirm("Are you sure you want to delete all logs?")) {
            await Database.clear();
            await loadHistory();
        }
    });
});

// --- TABS ---
function initTabs() {
    const tabs = document.querySelectorAll('.menu-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            // Add active
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });
}

// --- CONFIGURATION ---
async function loadSettings() {
    const store = await chrome.storage.local.get("config");
    // Merge stored config with defaults
    const current = { ...CONFIG, ...(store.config || {}) };

    document.getElementById('conf-simulation').checked = current.SIMULATION_MODE;
    document.getElementById('conf-keywords').value = current.KEYWORDS.join(", ");
    document.getElementById('conf-replies').value = current.REPLIES.join("\n");
}

async function saveSettings() {
    const newConfig = {
        SIMULATION_MODE: document.getElementById('conf-simulation').checked,
        KEYWORDS: document.getElementById('conf-keywords').value.split(',').map(s => s.trim()).filter(Boolean),
        REPLIES: document.getElementById('conf-replies').value.split('\n').map(s => s.trim()).filter(Boolean)
    };

    // Keep other defaults if not in UI
    const store = await chrome.storage.local.get("config");
    const merged = { ...CONFIG, ...(store.config || {}), ...newConfig };

    await chrome.storage.local.set({ config: merged });
    
    // Show feedback
    const msg = document.getElementById('save-msg');
    msg.style.opacity = 1;
    setTimeout(() => msg.style.opacity = 0, 2000);
}

// --- DATABASE ---
async function loadHistory() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    
    try {
        const records = await Database.getAll();
        tbody.innerHTML = '';
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#777;">No activity yet.</td></tr>';
            return;
        }

        records.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(row.timestamp).toLocaleString()}</td>
                <td><span class="tag">${row.type}</span></td>
                <td>${row.text || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" style="color:red">Error: ${e.message}</td></tr>`;
    }
}