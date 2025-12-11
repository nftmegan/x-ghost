import { CONFIG } from '../config/constants.js';
import { SELECTORS } from '../config/selectors.js';
import { Logger } from '../core/logger.js';
import { Database } from '../core/database.js';
import { GhostCursor } from '../features/ghost-cursor.js';
import { Scanner } from '../features/scanner.js';
import { wait, random, getElementCenter } from '../utils/helpers.js';

let isRunning = false;
let config = { ...CONFIG }; // Local copy of settings

// --- COMMAND CENTER ---
const Bot = {
    // 1. Initialize and Start
    async start() {
        if (isRunning) return;
        isRunning = true;
        
        // Load latest user config from storage (overriding defaults)
        const storage = await chrome.storage.local.get("config");
        if (storage.config) config = { ...config, ...storage.config };
        
        // Initialize Visuals
        GhostCursor.init();
        
        // Connect to Background (for Mouse/Keyboard simulation)
        chrome.runtime.sendMessage({ action: "ATTACH_DEBUGGER" });
        
        Logger.info(`🚀 Bot Started. Sim Mode: ${config.SIMULATION_MODE}`);
        
        // Start the Main Loop
        this.loop();
    },
    
    // 2. Stop
    stop() {
        isRunning = false;
        Logger.info("🛑 Bot Stopped");
    },
    
    // 3. The Main Logic Loop
    async loop() {
        while (isRunning) {
            // A. Move to Next Tweet (Simulate 'j' key)
            // This is the most "human" way to scroll Twitter
            await this.sendKey("j");
            
            // Random human pause after scrolling
            await wait(random(2000, 3500)); 
            
            if (!isRunning) break;

            // B. Scan the active tweet
            const tweet = Scanner.readActiveTweet();
            if (!tweet) {
                Logger.info("⚠️ No active tweet found in focus, skipping...");
                continue;
            }

            // C. Check for Keywords
            if (Scanner.hasKeyword(tweet.text, config.KEYWORDS)) {
                Logger.info(`🎯 Keyword Match Found: "${tweet.text.substring(0, 30)}..."`);
                
                // D. Perform the Action
                await this.performReply(tweet);
                
                // E. Long Cooldown after an action (Safety)
                const cooldown = random(config.WORK_MIN * 1000, config.WORK_MAX * 1000) / 2; // Example math
                Logger.info(`⏳ Cooling down for ${Math.floor(cooldown/1000)}s...`);
                await wait(cooldown);
            }
        }
    },

    // 4. The Reply Logic
    async performReply(tweet) {
        // Pick a random reply
        const replyText = config.REPLIES[random(0, config.REPLIES.length - 1)];
        
        // Open Reply Modal (Simulate 'r' key)
        await this.sendKey("r");
        await wait(2000); // Wait for modal animation

        // Check if Modal Opened
        const inputEl = document.querySelector(SELECTORS.INPUT_YZ);
        if (!inputEl) {
            Logger.error("Reply modal did not open. Retrying...");
            await this.sendKey("Escape");
            return;
        }

        // Move Ghost Cursor to the input box (Visual only)
        const center = getElementCenter(inputEl);
        await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: center.x, y: center.y });
        
        // Type the text
        await chrome.runtime.sendMessage({ action: "TYPE", text: replyText });
        await wait(replyText.length * 50 + 1000); // Wait for typing to finish

        // Handle Send vs Simulation
        if (config.SIMULATION_MODE) {
            Logger.info("🎭 Simulation Mode: Discarding draft...");
            
            // Close Modal
            await this.sendKey("Escape");
            await wait(800);
            
            // Handle "Discard?" Confirmation Dialog if it appears
            const confirmBtn = document.querySelector(SELECTORS.DISCARD_BTN);
            if (confirmBtn) {
                const btnCenter = getElementCenter(confirmBtn);
                await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: btnCenter.x, y: btnCenter.y });
                await chrome.runtime.sendMessage({ action: "CLICK" });
            }
        } else {
            Logger.info("🚀 Sending Tweet!");
            // Ctrl + Enter to send
            await this.sendKey("Enter", 2); 
            
            // Log to Database
            await Database.add({ 
                type: "REPLY", 
                text: replyText, 
                target: tweet.user 
            });
        }
        
        await wait(2000);
    },

    // Helper to send keys via Background script
    async sendKey(key, modifier = 0) {
        await chrome.runtime.sendMessage({ action: "PRESS", key, modifier });
    }
};

// --- LISTENERS ---
// Responds to messages from Popup or Background
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "START_BOT") Bot.start();
    if (req.action === "STOP_BOT") Bot.stop();
    
    // Visuals (Red Dot) updates driven by Background input sim
    if (req.type === "DRAW_KcCURSOR") GhostCursor.move(req.x, req.y);
    if (req.type === "DRAW_CLICK") GhostCursor.click();
});