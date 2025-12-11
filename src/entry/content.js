/**
 * TITAN TWITTER BOT - CONTENT SCRIPT
 * Version: 4.0 (Custom UI Integration)
 * Modules: Utils, Panel, Visualizer, HumanPhysics, InputSimulator, BotLogic
 */

// ==========================================
// 1. UTILITIES & CONFIGURATION
// ==========================================
const CONFIG = {
    DEBUG_VISUALS: true, 
    
    // Human timings (in milliseconds)
    ACTION_DELAY: { MIN: 800, MAX: 3500 },
    SCROLL_PAUSE: { MIN: 1500, MAX: 6000 },
    HESITATION: { MIN: 150, MAX: 450 },
    
    // Physics
    SCROLL_SPEED_VARIANCE: 0.3, 
};

const Utils = {
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    randomFloat: (min, max) => Math.random() * (max - min) + min,
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    humanSleep: async (min, max, reason) => {
        const duration = Utils.randomInt(min, max);
        // Log the action to the panel
        Panel.log(`Thinking (${reason})...`);
        await Utils.sleep(duration);
    }
};

// ==========================================
// 2. UI PANEL (Merged from your snippet)
// ==========================================
const Panel = {
    el: null,
    statusEl: null,
    logEl: null,

    init() {
        if (document.getElementById('ghost-panel')) return;

        // 1. Inject CSS Styles
        const style = document.createElement('style');
        style.textContent = `
            #ghost-panel {
                position: fixed; bottom: 20px; left: 20px;
                background: rgba(10, 10, 10, 0.95); color: #e0e0e0;
                border: 1px solid #333; border-radius: 8px;
                padding: 12px; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px;
                z-index: 2147483647; width: 260px; 
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                backdrop-filter: blur(8px);
                transition: opacity 0.2s;
                user-select: none;
            }
            #ghost-panel:hover { opacity: 1; }
            
            .ghost-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .ghost-title { font-weight: 700; font-size: 14px; color: #fff; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;}
            
            .ghost-status { 
                padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; 
                background: #222; color: #777; border: 1px solid #333; letter-spacing: 0.5px;
                transition: all 0.3s;
            }
            .ghost-status.running { 
                background: rgba(0, 255, 0, 0.1); color: #00ff00; border-color: #00ff00; 
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.1);
            }

            .ghost-log { 
                color: #999; font-family: 'Consolas', monospace; font-size: 11px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
                margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #333;
            }

            .ghost-footer { display: flex; justify-content: space-between; align-items: center; color: #666; font-size: 11px; }
            .key-badge { background: #2a2a2a; padding: 2px 5px; border-radius: 4px; color: #eee; border: 1px solid #444; font-size: 10px;}
            .dash-link { color: #1d9bf0; text-decoration: none; cursor: pointer; transition: color 0.2s; font-weight: 600;}
            .dash-link:hover { color: #fff; text-decoration: underline; }
        `;
        document.head.appendChild(style);

        // 2. Create Panel HTML
        this.el = document.createElement('div');
        this.el.id = 'ghost-panel';
        this.el.innerHTML = `
            <div class="ghost-header">
                <span class="ghost-title">👻 Ghost Bot</span>
                <span id="ghost-status" class="ghost-status">STOPPED</span>
            </div>
            <div id="ghost-log" class="ghost-log">Ready to start...</div>
            <div class="ghost-footer">
                <span>Toggle: <span class="key-badge">Alt</span> + <span class="key-badge">S</span></span>
                <a id="ghost-dash-link" class="dash-link">Dashboard ↗</a>
            </div>
        `;
        document.body.appendChild(this.el);

        this.statusEl = this.el.querySelector('#ghost-status');
        this.logEl = this.el.querySelector('#ghost-log');

        // 3. Link Dashboard
        const link = this.el.querySelector('#ghost-dash-link');
        if(link) {
            link.addEventListener('click', () => {
                chrome.runtime.sendMessage({ action: "OPEN_DASHBOARD" });
            });
        }
    },

    setStatus(isRunning) {
        if (!this.statusEl) return;
        if (isRunning) {
            this.statusEl.textContent = "RUNNING";
            this.statusEl.className = "ghost-status running";
        } else {
            this.statusEl.textContent = "STOPPED";
            this.statusEl.className = "ghost-status";
        }
    },

    log(msg) {
        if (this.logEl) {
            // Clean emojis/timestamps if redundant
            const cleanMsg = msg.replace(/^\[.*?\]\s*/, '').replace(/[\u{1F600}-\u{1F6FF}]/gu, ''); 
            this.logEl.textContent = `> ${cleanMsg}`;
            this.logEl.title = msg;
        }
    }
};

// ==========================================
// 3. VISUALIZER (The Red Dot)
// ==========================================
class Visualizer {
    constructor() {
        this.cursor = null;
        if (CONFIG.DEBUG_VISUALS) {
            this.initCursor();
        }
    }

    initCursor() {
        this.cursor = document.createElement('div');
        this.cursor.id = 'titan-ghost-cursor';
        Object.assign(this.cursor.style, {
            width: '12px',
            height: '12px',
            backgroundColor: 'rgba(255, 0, 0, 0.7)',
            borderRadius: '50%',
            position: 'fixed',
            zIndex: '999999',
            pointerEvents: 'none',
            top: '0px',
            left: '0px',
            transition: 'none',
            border: '1px solid white'
        });
        document.body.appendChild(this.cursor);
    }

    move(x, y) {
        if (this.cursor) {
            this.cursor.style.transform = `translate(${x}px, ${y}px)`;
        }
    }

    clickAnimation() {
        if (this.cursor) {
            this.cursor.style.transform += ' scale(0.8)';
            this.cursor.style.backgroundColor = 'rgba(0, 255, 0, 0.8)';
            setTimeout(() => {
                this.cursor.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                this.cursor.style.transform = this.cursor.style.transform.replace(' scale(0.8)', '');
            }, 150);
        }
    }
}

// ==========================================
// 4. HUMAN PHYSICS ENGINE
// ==========================================
class HumanPhysics {
    static cubicBezier(t, p0, p1, p2, p3) {
        const cX = 3 * (p1.x - p0.x);
        const bX = 3 * (p2.x - p1.x) - cX;
        const aX = p3.x - p0.x - cX - bX;

        const cY = 3 * (p1.y - p0.y);
        const bY = 3 * (p2.y - p1.y) - cY;
        const aY = p3.y - p0.y - cY - bY;

        const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
        const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

        return { x, y };
    }

    static generateHumanPath(start, end) {
        const distance = Math.hypot(end.x - start.x, end.y - start.y);
        const variance = Math.max(distance * 0.2, 50); 
        
        const control1 = {
            x: start.x + Utils.randomInt(-variance, variance),
            y: start.y + Utils.randomInt(-variance, variance)
        };
        const control2 = {
            x: end.x + Utils.randomInt(-variance, variance),
            y: end.y + Utils.randomInt(-variance, variance)
        };
        
        return { start, control1, control2, end };
    }
}

// ==========================================
// 5. INPUT SIMULATOR
// ==========================================
class InputSimulator {
    constructor() {
        this.virtualMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.visualizer = new Visualizer();
        this.visualizer.move(this.virtualMouse.x, this.virtualMouse.y);
    }

    async moveMouseToElement(element) {
        const rect = element.getBoundingClientRect();
        const targetX = rect.left + (rect.width * Utils.randomFloat(0.2, 0.8));
        const targetY = rect.top + (rect.height * Utils.randomFloat(0.2, 0.8));
        
        Panel.log("Moving mouse...");
        
        const path = HumanPhysics.generateHumanPath(
            this.virtualMouse, 
            { x: targetX, y: targetY }
        );

        const steps = Utils.randomInt(25, 50);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const easedT = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            
            const pos = HumanPhysics.cubicBezier(
                easedT, path.start, path.control1, path.control2, path.end
            );

            this.virtualMouse = pos;
            this.visualizer.move(pos.x, pos.y);

            const event = new MouseEvent('mousemove', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: pos.x,
                clientY: pos.y
            });
            document.dispatchEvent(event);

            await Utils.sleep(Utils.randomInt(5, 12)); 
        }
    }

    async smoothScroll(direction = 'down', amount = 600) {
        let scroller = 0;
        Panel.log("Scrolling (Mouse Wheel)");
        
        while (scroller < amount) {
            const step = Utils.randomInt(10, 60);
            
            // Micro-correction
            if (Utils.randomInt(0, 100) < 5) {
                Panel.log("Micro-correction (Scroll UP)");
                window.scrollBy(0, -Utils.randomInt(10, 30));
                await Utils.sleep(Utils.randomInt(100, 300));
            }

            window.scrollBy(0, direction === 'down' ? step : -step);
            scroller += step;
            await Utils.sleep(Utils.randomInt(10, 30));
        }
    }

    async click(element) {
        await this.moveMouseToElement(element);
        
        // Hesitation
        await Utils.humanSleep(CONFIG.HESITATION.MIN, CONFIG.HESITATION.MAX, "Hesitating");

        this.visualizer.clickAnimation();
        Panel.log("Click event fired.");

        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            const evt = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: this.virtualMouse.x,
                clientY: this.virtualMouse.y
            });
            element.dispatchEvent(evt);
        });
    }
    
    async keyboardNavigate() {
        Panel.log("Keypress: J");
        const evt = new KeyboardEvent('keydown', {
            key: 'j',
            code: 'KeyJ',
            charCode: 74,
            keyCode: 74,
            view: window,
            bubbles: true
        });
        document.dispatchEvent(evt);
    }
}

// ==========================================
// 6. MAIN BOT LOGIC
// ==========================================
class TwitterBot {
    constructor() {
        this.sim = new InputSimulator();
        this.isRunning = false;
    }

    init() {
        // Initialize UI immediately
        Panel.init();
        console.log("🤖 Titan Bot: System Loaded.");
        
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === "start_bot") {
                if (!this.isRunning) {
                    this.isRunning = true;
                    Panel.setStatus(true); // Turn badge GREEN
                    Panel.log("Command received: START");
                    this.startLoop();
                    sendResponse({ status: "Started" });
                }
            } else if (request.action === "stop_bot") {
                this.isRunning = false;
                Panel.setStatus(false); // Turn badge GREY
                Panel.log("Command received: STOP");
                sendResponse({ status: "Stopped" });
            }
        });
    }

    async startLoop() {
        Panel.log("Loop Engaged");
        
        while (this.isRunning) {
            // 1. SCROLL PHASE
            const useKeyboard = Math.random() > 0.7;
            
            if (useKeyboard) {
                Panel.log("Reading (Keyboard)");
                const presses = Utils.randomInt(2, 5);
                for(let i=0; i<presses; i++) {
                    await this.sim.keyboardNavigate();
                    await Utils.humanSleep(500, 1500, "Reading tweet");
                }
            } else {
                await this.sim.smoothScroll('down', Utils.randomInt(300, 800));
            }

            // 2. RANDOM PAUSE
            await Utils.humanSleep(CONFIG.SCROLL_PAUSE.MIN, CONFIG.SCROLL_PAUSE.MAX, "Reading/Idle");

            // 3. ACTION PHASE
            const likeButtons = document.querySelectorAll('[data-testid="like"]');
            if (likeButtons.length > 0) {
                // 40% chance to like
                if (Math.random() > 0.6) { 
                    const target = likeButtons[Math.floor(Math.random() * Math.min(3, likeButtons.length))];
                    
                    Panel.log("Targeting Like Button");
                    await this.sim.click(target);
                    
                    Panel.log("Like successful.");
                    await Utils.humanSleep(1000, 2000, "Post-action Cooldown");
                }
            }
        }
    }
}

const bot = new TwitterBot();
bot.init();