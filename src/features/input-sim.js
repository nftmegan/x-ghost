// This runs in BACKGROUND context
let virtualMouse = { x: 100, y: 100 };

export async function moveMouseSmoothly(tabId, toX, toY) {
    // Simple Linear Interpolation (Lerp) for stability
    const steps = 15;
    const start = { ...virtualMouse };
    
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = start.x + (toX - start.x) * t;
        const y = start.y + (toY - start.y) * t;
        
        try {
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
                type: "mouseMoved", x, y, button: "none", clickCount: 0
            });
            // Tell content script to draw the dot
            chrome.tabs.sendMessage(tabId, { type: "DRAW_KcCURSOR", x, y }).catch(() => {});
        } catch (e) { /* Ignore debugger detach */ }
        
        await new Promise(r => setTimeout(r, 10)); // 10ms tick
    }
    virtualMouse = { x: toX, y: toY };
}

export async function clickMouse(tabId) {
    const { x, y } = virtualMouse;
    try {
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
        chrome.tabs.sendMessage(tabId, { type: "DRAW_CLICK" }).catch(() => {});
        await new Promise(r => setTimeout(r, 80));
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    } catch(e) {}
}

export async function typeKeys(tabId, text) {
    try {
        for (const char of text) {
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyDown", text: char });
            await new Promise(r => setTimeout(r, 30));
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyUp", text: char });
            await new Promise(r => setTimeout(r, 30)); // Typing speed
        }
    } catch(e) {}
}

export async function pressKey(tabId, key, modifiers = 0) {
    // modifiers: 2 = Ctrl
    try {
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyDown", key, modifiers });
        await new Promise(r => setTimeout(r, 50));
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyUp", key, modifiers });
    } catch(e) {}
}