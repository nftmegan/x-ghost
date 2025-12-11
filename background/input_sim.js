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
            if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("already attached")) {
                // Ignore
            }
            resolve();
        });
    });
}

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

    // Control points for curve
    const control1X = fromX + (Math.random() * (toX - fromX)) * 0.5;
    const control1Y = fromY + (Math.random() * (toY - fromY)) * 0.2;
    const control2X = fromX + (Math.random() * (toX - fromX)) * 0.8;
    const control2Y = toY + (Math.random() * (toY - fromY)) * 0.5;

    const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const steps = Math.max(10, Math.floor(distance / 15));

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        
        // NO TREMOR - Clean Math
        const x = cubicBezier(t, fromX, control1X, control2X, toX);
        const y = cubicBezier(t, fromY, control1Y, control2Y, toY);

        // Send Event to Chrome Debugger
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
            type: "mouseMoved", x: x, y: y, button: "none", clickCount: 0
        }).catch(() => {});

        // --- VISUALIZATION: Send coordinates to Content Script to draw the Red Dot ---
        chrome.tabs.sendMessage(tabId, { action: "drawCursor", x, y }).catch(() => {});

        await new Promise(r => setTimeout(r, 10));
    }
    
    await updateMouseState(toX, toY);
}

export async function sendClick(tabId, x, y) {
    try {
        await attachDebugger(tabId);
        await moveMouse(tabId, x, y);
        
        // Click Down
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
        
        // Visual Feedback (Make dot Green on click)
        chrome.tabs.sendMessage(tabId, { action: "drawClick", x, y }).catch(() => {});

        await new Promise(r => setTimeout(r, 100)); // Solid 100ms click
        
        // Click Up
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });

    } catch (e) {
        console.error("Debug Click Failed:", e);
    }
}

export async function sendSpecialKey(tabId, keyName) {
    try {
        await attachDebugger(tabId);
        let definition = { key: keyName, code: keyName, text: "" };
        
        if (keyName === "Enter") definition = { key: "Enter", code: "Enter", text: "\r" };
        if (keyName === "Escape") definition = { key: "Escape", code: "Escape", text: "" };
        if (keyName === "ArrowDown") definition = { key: "ArrowDown", code: "ArrowDown", text: "" };
        if (keyName === "ArrowUp") definition = { key: "ArrowUp", code: "ArrowUp", text: "" };

        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyDown", ...definition });
        await new Promise(r => setTimeout(r, 100));
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyUp", ...definition });
    } catch (e) {
        console.error("Debug Key Failed:", e);
    }
}

export async function sendKeystrokes(tabId, text) {
    try {
        await attachDebugger(tabId);
        for (const char of text) {
            const code = `Key${char.toUpperCase()}`;
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyDown", text: char, unmodifiedText: char, key: char, code: code });
            await new Promise(r => setTimeout(r, 50));
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyUp", text: char, unmodifiedText: char, key: char, code: code });
            await new Promise(r => setTimeout(r, 50));
        }
    } catch (e) {
        console.error("Debug Type Failed:", e);
    }
}