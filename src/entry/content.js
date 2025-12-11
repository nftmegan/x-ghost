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

// Helper to log to both internal storage and the visual panel
const Log = {
    info: (msg) => { 
        Logger.info(msg); 
        Panel.log(msg, 'info'); 
    },
    error: (msg) => { 
        Logger.error(msg); 
        Panel.log(msg, 'error'); 
    },
    // Special logger for "Thinking" states that doesn't save to DB (too spammy)
    think: (msg) => {
        Panel.log(`💭 ${msg}`, 'info');
    }
};

const Bot = {
    async start() {
        if (isRunning) return;
        isRunning = true;
        
        Panel.setStatus(true);
        GhostCursor.init();
        
        // Load latest config
        const storage = await chrome.storage.local.get("config");
        if (storage.config) config = { ...config, ...storage.config };
        
        // Attach Debugger
        chrome.runtime.sendMessage({ action: "ATTACH_DEBUGGER" });
        Log.info(`System Started. Sim Mode: ${config.SIMULATION_MODE}`);
        
        // Ensure focus
        document.body.click();
        
        this.loop();
    },
    
    stop() {
        isRunning = false;
        Panel.setStatus(false);
        Log.info("System Stopped by User.");
    },
    
    async loop() {
        while (isRunning) {
            // --- STEP 1: NAVIGATION ---
            Log.think("Pressing 'J' to navigate...");
            await this.sendKey("j");
            
            // --- STEP 2: READING (HUMAN DELAY) ---
            const readTime = randomGaussian(1500, 4500); 
            Log.think(`Reading tweet... (${Math.floor(readTime)}ms)`);
            await wait(readTime);
            
            if (!isRunning) break;

            // --- STEP 3: SCANNING ---
            const tweet = Scanner.readActiveTweet();
            if (!tweet) {
                Log.think("No valid tweet found, skipping...");
                await wait(1000); 
                continue;
            }

            // --- STEP 4: DECISION ---
            if (Scanner.hasKeyword(tweet.text, config.KEYWORDS)) {
                Log.info(`MATCH FOUND: "${tweet.text.substring(0, 30)}..."`);
                
                await this.performReply(tweet);
                
                // Long cooldown after action
                const cooldown = randomGaussian(10000, 25000); 
                Log.think(`Cooldown active (${Math.floor(cooldown/1000)}s)...`);
                await wait(cooldown);
            } else {
                Log.think("No keywords matched.");
            }
        }
    },

    async performReply(tweet) {
        const replyText = config.REPLIES[random(0, config.REPLIES.length - 1)];
        
        Log.think("Moving mouse to tweet...");
        const tweetCenter = getElementCenter(tweet.element);
        await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: tweetCenter.x, y: tweetCenter.y });
        await wait(random(300, 800));

        Log.think("Opening reply modal ('R')...");
        await this.sendKey("r");
        await wait(2500); 

        const inputEl = document.querySelector(SELECTORS.INPUT_YZ);
        if (!inputEl) {
            Log.error("Modal failed to open.");
            await this.sendKey("Escape");
            return;
        }

        Log.think(`Typing reply: "${replyText}"`);
        constTX = getElementCenter(inputEl);
        await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: constTX.x, y: constTX.y });
        await chrome.runtime.sendMessage({ action: "TYPE", text: replyText });
        
        // Wait based on typing length
        await wait(replyText.length * 50 + 1000);

        if (config.SIMULATION_MODE) {
            Log.info("SIMULATION: Discarding draft.");
            await this.sendKey("Escape");
            await wait(800);
            
            const confirmBtn = document.querySelector(SELECTORS.DISCARD_BTN);
            if (confirmBtn) {
                const btnCenter = getElementCenter(confirmBtn);
                await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: btnCenter.x, y: btnCenter.y });
                await chrome.runtime.sendMessage({ action: "CLICK" });
            }
        } else {
            Log.info("SENDING REPLY...");
            await this.sendKey("Enter", 2); // Ctrl+Enter
            await Database.add({ type: "REPLY", text: replyText, target: tweet.user });
        }
        
        await wait(2000);
        Log.info("Reply sequence complete.");
    },

    async sendKey(key, modifier = 0) {
        await chrome.runtime.sendMessage({ action: "PRESS", key, modifier });
    }
};

// --- INITIALIZATION ---

// 1. Inject the UI immediately
Panel.init();

// 2. Listen for Alt+S (The Hotkey)
document.addEventListener('keydown', (e) => {
    // Alt + S
    if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        if (isRunning) Bot.stop();
        else Bot.start();
    }
});

// 3. Listen for Popup/Background Messages
chrome.runtime.onMessage.addListener((req) => {
    if (req.action === "START_BOT") Bot.start();
    if (req.action === "STOP_BOT") Bot.stop();
    if (req.type === "DRAW_CURSOR") GhostCursor.move(req.x, req.y);
    if (req.type === "DRAW_CLICK") GhostCursor.click();
});