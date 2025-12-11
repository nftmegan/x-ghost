// background/input_sim.js

let virtualMouse = { x: 100, y: 100 };

// Persist mouse state
chrome.storage.session.get("virtualMouse", (data) => {
    if (data.virtualMouse) virtualMouse = data.virtualMouse;
});

async function updateMouseState(x, y) {
    virtualMouse = { x, y };
    await chrome.storage.session.set({ virtualMouse });
}

export async function attachDebugger(tabId) {
    return new Promise((resolve) => {
        chrome.debugger.attach({ tabId }, "1.3", () => {
            if (chrome.runtime.lastError) {} // Ignore if already attached
            resolve();
        });
    });
}

// Clean Bezier (No Randomness)
function cubicBezier(t, p0, p1, p2, p3) {
    const oneMinusT = 1 - t;
    return (
        Math.pow(oneMinusT, 3) * p0 +
        3 * Math.pow(oneMinusT, 2) * t * p1 +
        3 * oneMinusT * Math.pow(t, 2) * p2 +
        Math.pow(t, 3) * p3
    );
}

export async function moveMouse(tabId, toX, toY) {
    const fromX = virtualMouse.x;
    const fromY = virtualMouse.y;

    // Linear control points for smooth arc
    const control1X = fromX + (toX - fromX) * 0.33;
    const control1Y = fromY + (toY - fromY) * 0.33;
    const control2X = fromX + (toX - fromX) * 0.66;
    const control2Y = fromY + (toY - fromY) * 0.66;

    const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const steps = Math.max(5, Math.floor(distance / 20)); // Fast and smooth

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = cubicBezier(t, fromX, control1X, control2X, toX);
        const y = cubicBezier(t, fromY, control1Y, control2Y, toY);

        try {
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
                type: "mouseMoved", x: x, y: y, button: "none", clickCount: 0
            });
            // Visual Feedback
            chrome.tabs.sendMessage(tabId, { action: "drawCursor", x, y }).catch(() => {});
        } catch (e) {}

        await new Promise(r => setTimeout(r, 5));
    }
    
    await updateMouseState(toX, toY);
}

export async function sendClick(tabId, x, y) {
    try {
        await attachDebugger(tabId);
        await moveMouse(tabId, x, y);
        
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
        chrome.tabs.sendMessage(tabId, { action: "drawClick", x, y }).catch(() => {});
        await new Promise(r => setTimeout(r, 50)); 
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    } catch (e) { console.error(e); }
}

export async function sendSpecialKey(tabId, keyName, modifier = null) {
    try {
        await attachDebugger(tabId);
        let def = { key: keyName, code: keyName };
        if (keyName === "Enter") def = { key: "Enter", code: "Enter", text: "\r" };
        
        let modifiers = 0;
        if (modifier === "ctrl") modifiers = 2; // 2 = Ctrl, 1 = Alt, 4 = Meta/Command

        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyDown", modifiers: modifiers, ...def });
        await new Promise(r => setTimeout(r, 50));
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyUp", modifiers: modifiers, ...def });
    } catch (e) { console.error(e); }
}

export async function sendKeystrokes(tabId, text) {
    try {
        await attachDebugger(tabId);
        for (const char of text) {
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyDown", text: char, unmodifiedText: char, key: char });
            await new Promise(r => setTimeout(r, 20));
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyUp", text: char, unmodifiedText: char, key: char });
            await new Promise(r => setTimeout(r, 20));
        }
    } catch (e) { console.error(e); }
}