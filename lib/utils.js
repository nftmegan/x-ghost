// lib/utils.js

// Standard Uniform Random (Still needed for sleep timers)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Async sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- DEAD CENTER TARGETING (No Jitter) ---
function getHumanCoords(rect) {
    return {
        x: rect.left + (rect.width / 2),
        y: rect.top + (rect.height / 2)
    };
}

// Logger
async function logToStorage(msg, type = "INFO") {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] [${type}] ${msg}`;
    console.log(entry);

    const data = await chrome.storage.local.get("logs");
    let logs = data.logs || [];
    logs.unshift(entry);
    if (logs.length > 50) logs.pop();
    
    await chrome.storage.local.set({ logs: logs });
}