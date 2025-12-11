import { moveMouseSmoothly, clickMouse, typeKeys, pressKey } from '../features/input-sim.js';

// --- OPEN DASHBOARD (Icon Click) ---
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: "dashboard.html" });
});

// --- MESSAGE HANDLER ---
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    
    // 1. Open Dashboard request from Content Script (Panel)
    if (req.action === "OPEN_DASHBOARD") {
        chrome.tabs.create({ url: "dashboard.html" });
        return;
    }

    const tabId = sender.tab?.id;
    if (!tabId) return;

    if (req.action === "ATTACH_DEBUGGER") {
        chrome.debugger.attach({ tabId }, "1.3", () => {
            if (chrome.runtime.lastError) console.log("Debugger attached");
        });
    }

    if (req.action === "MOVE_MOUSE") moveMouseSmoothly(tabId, req.x, req.y);
    if (req.action === "CLICK") clickMouse(tabId);
    if (req.action === "TYPE") typeKeys(tabId, req.text);
    if (req.action === "PRESS") pressKey(tabId, req.key, req.modifier);
});