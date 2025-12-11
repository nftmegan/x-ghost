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
    info: (msg) => { Logger.info(msg); Panel.log(msg); },
    error: (msg) => { Logger.error(msg); Panel.log(`Error: ${msg}`); }
};

const Bot = {
    async start() {
        if (isRunning) return;
        isRunning = true;
        
        Panel.setStatus(true);
        GhostCursor.init();
        
        const storage = await chrome.storage.local.get("config");
        if (storage.config) config = { ...config, ...storage.config };
        
        chrome.runtime.sendMessage({ action: "ATTACH_DEBUGGER" });
        Log.info(`🚀 Started (J-Nav). Sim: ${config.SIMULATION_MODE}`);
        
        // Ensure we have focus so keys work
        document.body.click();
        
        this.loop();
    },
    
    stop() {
        isRunning = false;
        Panel.setStatus(false);
        Log.info("🛑 Stopped.");
    },
    
    async loop() {
        while (isRunning) {
            // 1. Navigation: Press 'J' to jump to next tweet
            // We randomize the hold duration (human keys aren't instant)
            await this.sendKey("j");
            
            // 2. Human "Reading" Pause
            // We use Gaussian random to simulate reading speed.
            // Short pauses (1s) for boring tweets, longer (4s) for interesting ones.
            const readTime = randomGaussian(800, 3500); 
            // Log.info(`👀 Reading (${Math.floor(readTime)}ms)...`); // Optional noise
            await wait(readTime);
            
            if (!isRunning) break;

            // 3. Scan the focused tweet
            const tweet = Scanner.readActiveTweet();
            if (!tweet) {
                // If 'j' hit the end or something weird, wait a bit and try again
                await wait(1000); 
                continue;
            }

            // 4. Evaluate
            if (Scanner.hasKeyword(tweet.text, config.KEYWORDS)) {
                Log.info(`🎯 Match: "${tweet.text.substring(0, 25)}..."`);
                
                await this.performReply(tweet);
                
                // 5. Cooldown after interaction
                const cooldown = randomGaussian(10000, 25000); 
                Log.info(`⏳ Cooling (${Math.floor(cooldown/1000)}s)`);
                await wait(cooldown);
            }
        }
    },

    async performReply(tweet) {
        const replyText = config.REPLIES[random(0, config.REPLIES.length - 1)];
        
        // Focus Attention: Move mouse to the tweet roughly
        const tweetCenter = getElementCenter(tweet.element);
        await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: tweetCenter.x, y: tweetCenter.y });
        await wait(random(300, 800));

        // Open Modal: 'R' key is the native shortcut to reply to the *focused* tweet
        // Since we used 'J', we KNOW this tweet is focused. This is super reliable.
        await this.sendKey("r");
        await wait(2500); // Wait for modal animation

        const inputEl = document.querySelector(SELECTORS.INPUT_YZ);
        if (!inputEl) {
            Log.error("Reply modal missing");
            await this.sendKey("Escape");
            return;
        }

        // Type Reply
        const center = getElementCenter(inputEl);
        await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: center.x, y: center.y });
        await chrome.runtime.sendMessage({ action: "TYPE", text: replyText });
        await wait(replyText.length * 50 + 1000);

        // Action: Send or Discard
        if (config.SIMULATION_MODE) {
            Log.info("🎭 Sim: Discarding...");
            await this.sendKey("Escape");
            await wait(800);
            
            const confirmBtn = document.querySelector(SELECTORS.DISCARD_BTN);
            if (confirmBtn) {
                const btnCenter = getElementCenter(confirmBtn);
                await chrome.runtime.sendMessage({ action: "MOVE_MOUSE", x: btnCenter.x, y: btnCenter.y });
                await chrome.runtime.sendMessage({ action: "CLICK" });
            }
        } else {
            Log.info("🚀 Sending!");
            // Ctrl + Enter is the shortcut to send
            await this.sendKey("Enter", 2); 
            await Database.add({ type: "REPLY", text: replyText, target: tweet.user });
        }
        await wait(2000);
    },

    async sendKey(key, modifier = 0) {
        await chrome.runtime.sendMessage({ action: "PRESS", key, modifier });
    }
};

// --- INIT ---
Panel.init();

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