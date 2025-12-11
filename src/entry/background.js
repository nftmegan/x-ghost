import { moveMouseSmoothly, clickMouse, typeKeys, pressKey } from '../features/input-sim.js';

// Attach Debugger automatically when bot starts
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    if (req.action === "ATTACH_DEBUGGER") {
        chrome.debugger.attach({ tabId }, "1.3", () => {
            if (chrome.runtime.lastError) console.log("Debugger already attached");
        });
    }

    if (req.action === "MOVE_MOUSE") moveMouseSmoothly(tabId, req.x, req.y);
    if (req.action === "CLICK") clickMouse(tabId);
    if (req.action === "TYPE") typeKeys(tabId, req.text);
    if (req.action === "PRESS") pressKey(tabId, req.key, req.modifier);
});