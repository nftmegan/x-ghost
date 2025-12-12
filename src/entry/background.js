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
        return; // Synchronous
    }

    const tabId = sender.tab?.id;
    if (!tabId) return;

    if (req.action === "ATTACH_DEBUGGER") {
        chrome.debugger.attach({ tabId }, "1.3", () => {
            if (chrome.runtime.lastError) console.log("Debugger attached");
        });
        return;
    }

    // 2. Handle Input Actions Synchronously
    // We wrap this in an async function and return true to keep the message channel open
    const handleInput = async () => {
        try {
            if (req.action === "MOVE_MOUSE") await moveMouseSmoothly(tabId, req.x, req.y);
            if (req.action === "CLICK") await clickMouse(tabId);
            if (req.action === "TYPE") await typeKeys(tabId, req.text);
            if (req.action === "PRESS") await pressKey(tabId, req.key, req.modifier);
            
            sendResponse({ status: "done" });
        } catch (e) {
            sendResponse({ status: "error", message: e.message });
        }
    };

    handleInput();
    return true; // CRITICAL: Tells Chrome we will sendResponse asynchronously
});