document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get(["state", "logs"]);
    updateUI(data.state);
    renderLogs(data.logs || []);
    checkTargetTabs(data.state); // Check on load

    // HANDLERS
    document.getElementById("btn-toggle-cycle").addEventListener("click", async () => {
        const btn = document.getElementById("btn-toggle-cycle");
        
        // Don't allow click if disabled
        if (btn.disabled) return;

        if (btn.innerText.includes("Start")) {
            chrome.runtime.sendMessage({ action: "START_BOT" });
            updateUI("WORKING");
        } else {
            chrome.runtime.sendMessage({ action: "STOP_BOT" });
            updateUI("IDLE");
        }
    });

    document.getElementById("btn-dashboard").addEventListener("click", () => {
        chrome.tabs.create({ url: "dashboard/dashboard.html" });
    });

    // POLLING
    setInterval(async () => {
        const d = await chrome.storage.local.get(["state", "logs"]);
        updateUI(d.state);
        renderLogs(d.logs);
        checkTargetTabs(d.state); // Continuously check tabs
    }, 2000);
});

async function checkTargetTabs(currentState) {
    const btn = document.getElementById("btn-toggle-cycle");
    
    // Only apply restriction if bot is IDLE. 
    // If it's WORKING, we allow Stop even if tabs are closed (to reset state).
    if (currentState === "WORKING") {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        return;
    }

    const tabs = await chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] });
    
    if (tabs.length === 0) {
        btn.disabled = true;
        btn.innerText = "Open X to Start";
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
        btn.className = "btn primary"; // Reset color to neutral/primary
    } else {
        btn.disabled = false;
        // Text is handled by updateUI
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    }
}

function updateUI(state) {
    const statusEl = document.getElementById("status-indicator");
    const btn = document.getElementById("btn-toggle-cycle");
    
    statusEl.innerText = state || "IDLE";
    statusEl.className = (state === "WORKING") ? "status-on" : "status-off";

    // Only update text/class if button is enabled (tabs exist)
    if (!btn.disabled) {
        if (state === "WORKING") {
            btn.innerText = "Stop Cycle";
            btn.className = "btn danger";
        } else {
            btn.innerText = "Start Cycle";
            btn.className = "btn primary";
        }
    }
}

function renderLogs(logs) {
    const container = document.getElementById("log-window");
    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="log-entry" style="color:#666">No logs yet...</div>';
        return;
    }
    container.innerHTML = logs.map(l => `<div class="log-entry">${l}</div>`).join("");
}