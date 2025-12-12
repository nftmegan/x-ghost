import { CONFIG } from '../config/constants.js';
import { SELECTORS } from '../config/selectors.js';
import { Logger } from '../core/logger.js';
import { Database } from '../core/database.js';
import { GhostCursor } from '../features/ghost-cursor.js';
import { Scanner } from '../features/scanner.js';
import { Panel } from '../features/ui-panel.js';
import { wait, random, randomGaussian, getElementCenter } from '../utils/helpers.js';

let isRunning = false;
let config = { ...CONFIG };

const Log = {
    info: (msg) => { Logger.info(msg); Panel.log(msg, 'info'); },
    error: (msg) => { Logger.error(msg); Panel.log(msg, 'error'); },
    think: (msg) => { Panel.log(`💭 ${msg}`, 'info'); }
};

const Bot = {
    async start() {
        if (isRunning) return;
        isRunning = true;
        
        Panel.setStatus(true);
        GhostCursor.init(); // Ensure visibility
        
        const storage = await chrome.storage.local.get("config");
        if (storage.config) config = { ...config, ...storage.config };
        
        chrome.runtime.sendMessage({ action: "ATTACH_DEBUGGER" });
        Log.info(`Cycle Started. Safe Mode: ON`);
        
        document.body.click(); // Ensure focus
        
        this.loop();
    },
    
    stop() {
        isRunning = false;
        Panel.setStatus(false);
        Log.info("Cycle Stopped.");
    },
    
    async loop() {
        while (isRunning) {
            // --- PHASE 1: NAVIGATION ---
            const navChance = Math.random();
            
            // Correction (5%)
            if (navChance < 0.05) {
                Log.think("Correction: Overshot...");
                if (Math.random() > 0.5) await this.sendKey("k");
                else await this.scrollSmoothly(-200);
                await wait(random(1000, 2000));
            }
            // Mouse Scroll (30%)
            else if (navChance < 0.35) {
                Log.think("Nav: Mouse Scroll");
                await this.parkMouse(); // Keep mouse safe
                await this.scrollSmoothly(random(300, 600));
                await wait(random(500, 1200));
                await this.sendKey("j"); // Snap focus
            } 
            // Key J (65%)
            else {
                Log.think("Nav: Key 'J'");
                await this.sendKey("j");
            }
            
            // --- PHASE 2: READING ---
            const readTime = randomGaussian(1500, 4500); 
            Log.think(`Reading (${Math.floor(readTime)}ms)...`);
            await wait(readTime);
            
            if (!isRunning) break;

            // --- PHASE 3: SCANNING ---
            const tweet = Scanner.readActiveTweet();
            if (!tweet) {
                Log.think("No valid tweet. Skipping.");
                await wait(800); 
                continue;
            }

            // --- PHASE 4: DECISION ---
            if (Scanner.hasKeyword(tweet.text, config.KEYWORDS)) {
                Log.info(`MATCH: "${tweet.text.substring(0, 30)}..."`);
                await this.performReply(tweet);
                
                const cooldown = randomGaussian(10000, 25000); 
                Log.think(`Cooling down (${Math.floor(cooldown/1000)}s)...`);
                await wait(cooldown);
            }
        }
    },

    async performReply(tweet) {
        const replyText = config.REPLIES[random(0, config.REPLIES.length - 1)];
        
        // 1. Park mouse safely before opening anything
        // This prevents the "random movement" inside the modal
        await this.parkMouse();
        
        Log.think("Opening reply modal...");
        await this.sendKey("r");
        await wait(2500); // Wait for animation

        const inputEl = document.querySelector(SELECTORS.INPUT_YZ);
        if (!inputEl) {
            Log.error("Modal failed to load.");
            await this.sendKey("Escape");
            return;
        }

        Log.think(`Typing reply...`);
        // Note: We do NOT move the mouse to the input box anymore.
        // We just type while the mouse is safely parked.
        
        // This 'await' now waits for the BACKGROUND process to fully finish typing
        // regardless of how long it takes. No more cut-offs.
        await chrome.runtime.sendMessage({ action: "TYPE", text: replyText });
        
        // Extra human hesitation after typing finishes
        await wait(random(800, 1500));

        if (config.SIMULATION_MODE) {
            Log.info("SIM: Discarding.");
            await this.sendKey("Escape");
            await wait(800);
            
            const confirmBtn = document.querySelector(SELECTORS.DISCARD_BTN);
            if (confirmBtn) {
                const btnCenter = getElementCenter(confirmBtn);
                await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: btnCenter.x, y: btnCenter.y });
                await chrome.runtime.sendMessage({ action: "CLICK" });
            }
        } else {
            Log.info("SENDING.");
            await this.sendKey("Enter", 2); // Ctrl + Enter
            await Database.add({ type: "REPLY", text: replyText, target: tweet.user });
        }
        
        await wait(2000);
        await this.parkMouse(); // Ensure we end parked
    },

    async parkMouse() {
        const { innerWidth, innerHeight } = window;
        // Park in the right 15% of the screen, middle height
        const safeX = innerWidth - (innerWidth * 0.15) + random(-20, 20); 
        const safeY = (innerHeight / 2) + random(-100, 100); 
        
        await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: safeX, y: safeY });
    },

    async scrollSmoothly(amount) {
        window.scrollBy({ top: amount, behavior: 'smooth' });
        await wait(500);
    },

    async sendKey(key, modifier = 0) {
        await chrome.runtime.sendMessage({ action: "PRESS", key, modifier });
    }
};

// --- INIT ---
Panel.init();
GhostCursor.init();

document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        if (isRunning) Bot.stop();
        else Bot.start();
    }
});

chrome.runtime.onMessage.addListener((req) => {
    if (req.action === "START_BOT") Bot.start();
    if (req.action === "STOP_BOT") Bot.stop();
    if (req.type === "DRAW_CURSOR") GhostCursor.move(req.x, req.y);
    if (req.type === "DRAW_CLICK") GhostCursor.click();
});