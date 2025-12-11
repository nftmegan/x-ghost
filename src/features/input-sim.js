// src/features/input-sim.js
// This runs in BACKGROUND context

let virtualMouse = { x: 100, y: 100 };

// Map logic keys to physical keyboard data
const KEY_DEFINITIONS = {
    'j': { code: 'KeyJ', key: 'j', text: 'j', keyCode: 74 },
    'k': { code: 'KeyK', key: 'k', text: 'k', keyCode: 75 },
    'r': { code: 'KeyR', key: 'r', text: 'r', keyCode: 82 },
    'Enter': { code: 'Enter', key: 'Enter', text: '\r', keyCode: 13 },
    'Escape': { code: 'Escape', key: 'Escape', text: '', keyCode: 27 },
    'ArrowDown': { code: 'ArrowDown', key: 'ArrowDown', text: '', keyCode: 40 },
    'ArrowUp': { code: 'ArrowUp', key: 'ArrowUp', text: '', keyCode: 38 }
};

export async function moveMouseSmoothly(tabId, toX, toY) {
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
            chrome.tabs.sendMessage(tabId, { type: "DRAW_CURSOR", x, y }).catch(() => {});
        } catch (e) { }
        
        await new Promise(r => setTimeout(r, 10)); 
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
            await new Promise(r => setTimeout(r, 30)); 
        }
    } catch(e) {}
}

export async function pressKey(tabId, keyName, modifiers = 0) {
    // 1. Get the full definition (or fallback to basic)
    const def = KEY_DEFINITIONS[keyName] || { key: keyName, code: keyName, text: "" };
    
    try {
        // 2. Send detailed keyDown (Required for Shortcuts)
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { 
            type: "keyDown", 
            key: def.key, 
            code: def.code,
            text: def.text,
            unmodifiedText: def.text,
            windowsVirtualKeyCode: def.keyCode,
            nativeVirtualKeyCode: def.keyCode,
            modifiers 
        });

        // 3. Wait like a human (hold time)
        await new Promise(r => setTimeout(r, 80));

        // 4. Release
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { 
            type: "keyUp", 
            key: def.key, 
            code: def.code,
            modifiers 
        });
    } catch(e) {
        console.error("Key Error:", e);
    }
}