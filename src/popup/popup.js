document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize UI State
    const data = await chrome.storage.local.get("state");
    updateUI(data.state || "IDLE");

    // 2. Start/Stop Button
    document.getElementById("btn-toggle").addEventListener("click", async () => {
        const btn = document.getElementById("btn-toggle");
        const isRunning = btn.innerText.includes("Stop");

        if (isRunning) {
            // STOP
            await sendMessageToActiveTab("STOP_BOT");
            await chrome.storage.local.set({ state: "IDLE" });
            updateUI("IDLE");
        } else {
            // START
            await sendMessageToActiveTab("START_BOT");
            await chrome.storage.local.set({ state: "WORKING" });
            updateUI("WORKING");
        }
    });

    // 3. Open Dashboard
    document.getElementById("btn-dashboard").addEventListener("click", () => {
        chrome.tabs.create({ url: "dashboard/dashboard.html" });
    });
});

function updateUI(state) {
    const statusEl = document.getElementById("status");
    const btn = document.getElementById("btn-toggle");

    if (state === "WORKING") {
        statusEl.innerText = "RUNNING";
        statusEl.className = "status-badge on";
        btn.innerText = "Stop Cycle";
        btn.className = "btn-large stop";
    } else {
        statusEl.innerText = "IDLE";
        statusEl.className = "status-badge off";
        btn.innerText = "Start Cycle";
        btn.className = "btn-large start";
    }
}

async function sendMessageToActiveTab(action) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        chrome.tabs.sendMessage(tab.id, { action }).catch(() => {
            alert("Please refresh the X/Twitter page first!");
        });
    } else {
        alert("Open X/Twitter to start the bot.");
    }
}