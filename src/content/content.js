import { BotModules } from '../lib/bot-modules.js';
import { createGhostCursor, updateGhostCursor, animateGhostClick } from '../lib/visuals.js';
import { DEFAULT_CONFIG } from '../lib/config.js';
import { sleep, randomInt } from '../lib/utils.js';

let isRunning = false;
let currentConfig = {};

chrome.runtime.onMessage.addListener((req) => {
    if (req.action === "START_BOT") initBot();
    if (req.action === "STOP_BOT") isRunning = false;
    if (req.action === "drawCursor") updateGhostCursor(req.x, req.y);
    if (req.action === "drawClick") animateGhostClick();
});

async function initBot() {
    if (isRunning) return;
    isRunning = true;
    createGhostCursor();
    
    const data = await chrome.storage.local.get("config");
    currentConfig = { ...DEFAULT_CONFIG, ...(data.config || {}) };
    
    console.log("🚀 GM BOT STARTED (Pro Mode)");
    document.body.click(); // Ensure focus
    await runCycle();
}

async function runCycle() {
    while (isRunning) {
        // 1. Next Tweet
        await BotModules.nav.nextTweet(); 
        await sleep(randomInt(1500, 2500));
        if (!isRunning) break;

        // 2. Read
        const tweet = BotModules.scanner.readCurrentTweet();
        if (!tweet) {
            await sleep(2000);
            continue;
        }

        // 3. Match?
        if (BotModules.scanner.checkKeywords(tweet.text, currentConfig.keywords)) {
            console.log(`🎯 MATCH: "${tweet.text.substring(0, 30)}..."`);
            const reply = currentConfig.replies[randomInt(0, currentConfig.replies.length - 1)];
            await BotModules.actions.replyToCurrent(reply, currentConfig.simulationMode);
            
            const cooldown = randomInt(5000, 10000);
            console.log(`⏳ Cooldown: ${cooldown/1000}s`);
            await sleep(cooldown);
        }
    }
}