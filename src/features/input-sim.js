// src/features/input-sim.js
// This runs in BACKGROUND context

let virtualMouse = { x: 100, y: 100 };

const KEY_DEFINITIONS = {
    'j': { code: 'KeyJ', key: 'j', text: 'j', keyCode: 74 },
    'k': { code: 'KeyK', key: 'k', text: 'k', keyCode: 75 },
    'r': { code: 'KeyR', key: 'r', text: 'r', keyCode: 82 },
    'Enter': { code: 'Enter', key: 'Enter', text: '\r', keyCode: 13 },
    'Escape': { code: 'Escape', key: 'Escape', text: '', keyCode: 27 },
    'ArrowDown': { code: 'ArrowDown', key: 'ArrowDown', text: '', keyCode: 40 },
    'ArrowUp': { code: 'ArrowUp', key: 'ArrowUp', text: '', keyCode: 38 }
};

// --- PHYSICS ENGINE ---

function cubicBezier(t, p0, p1, p2, p3) {
    const oneMinusT = 1 - t;
    const oneMinusTSqr = oneMinusT * oneMinusT;
    const oneMinusTCube = oneMinusTSqr * oneMinusT;
    const tSqr = t * t;
    const tCube = tSqr * t;
    
    const x = oneMinusTCube * p0.x + 3 * oneMinusTSqr * t * p1.x + 3 * oneMinusT * tSqr * p2.x + tCube * p3.x;
    const y = oneMinusTCube * p0.y + 3 * oneMinusTSqr * t * p1.y + 3 * oneMinusT * tSqr * p2.y + tCube * p3.y;
    return { x, y };
}

function generateHumanPath(start, end) {
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    
    // Less dramatic arc for short moves, more for long ones
    const arcScale = Math.min(distance * 0.3, 100); 
    const spread = (Math.random() - 0.5) * arcScale;

    const p0 = start;
    const p3 = end;
    
    const p1 = {
        x: start.x + (end.x - start.x) * 0.25 + spread,
        y: start.y + (end.y - start.y) * 0.25 + spread
    };
    
    const p2 = {
        x: start.x + (end.x - start.x) * 0.75 + spread,
        y: start.y + (end.y - start.y) * 0.75 - spread 
    };

    return { p0, p1, p2, p3, distance };
}

export async function moveMouseSmoothly(tabId, toX, toY) {
    const start = { ...virtualMouse };
    const end = { x: toX, y: toY };
    
    const path = generateHumanPath(start, end);
    
    // SLOWER SPEED: 0.5 pixels per ms (was 0.8)
    // This makes the cursor feel "heavier" and less erratic.
    const speed = 0.5; 
    const duration = Math.max(path.distance / speed, 400); // Minimum 400ms duration
    const steps = Math.floor(duration / 8); 

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        
        // Smoother easing (Ease-In-Out-Sine approximation)
        const easedT = -(Math.cos(Math.PI * t) - 1) / 2;
        
        const pos = cubicBezier(easedT, path.p0, path.p1, path.p2, path.p3);
        
        try {
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
                type: "mouseMoved", x: pos.x, y: pos.y, button: "none", clickCount: 0
            });
            chrome.tabs.sendMessage(tabId, { type: "DRAW_CURSOR", x: pos.x, y: pos.y }).catch(() => {});
        } catch (e) { break; }
        
        await new Promise(r => setTimeout(r, 8)); 
    }
    
    virtualMouse = end;
}

export async function clickMouse(tabId) {
    const { x, y } = virtualMouse;
    try {
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
        chrome.tabs.sendMessage(tabId, { type: "DRAW_CLICK" }).catch(() => {});
        
        // Longer hold time (human click)
        const holdTime = Math.floor(Math.random() * (180 - 90 + 1) + 90);
        await new Promise(r => setTimeout(r, holdTime));
        
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    } catch(e) {}
}

export async function typeKeys(tabId, text) {
    try {
        for (const char of text) {
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyDown", text: char });
            
            // Slower typing
            const typeSpeed = Math.random() * 80 + 40;
            await new Promise(r => setTimeout(r, typeSpeed));
            
            await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { type: "keyUp", text: char });
            await new Promise(r => setTimeout(r, typeSpeed)); 
        }
    } catch(e) {}
}

export async function pressKey(tabId, keyName, modifiers = 0) {
    const def = KEY_DEFINITIONS[keyName] || { key: keyName, code: keyName, text: "" };
    
    try {
        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { 
            type: "keyDown", key: def.key, code: def.code, text: def.text, unmodifiedText: def.text,
            windowsVirtualKeyCode: def.keyCode, nativeVirtualKeyCode: def.keyCode, modifiers 
        });

        // Key hold
        await new Promise(r => setTimeout(r, Math.random() * 60 + 60));

        await chrome.debugger.sendCommand({ tabId }, "Input.dispatchKeyEvent", { 
            type: "keyUp", key: def.key, code: def.code, modifiers 
        });
    } catch(e) { console.error("Key Error:", e); }
}