import { CONFIG } from '../config/constants.js';
import { DEFAULT_GM_SETTINGS, DEFAULT_GM_CORPUS } from '../config/gm-reply-corpus.js';
import { SELECTORS } from '../config/selectors.js';
import { Logger } from '../core/logger.js';
import { Database } from '../core/database.js';
import { GhostCursor } from '../features/ghost-cursor.js';
import { Scanner } from '../features/scanner.js';
import { Panel } from '../features/ui-panel.js';
import { wait, random, randomGaussian, getElementCenter } from '../utils/helpers.js';
import { GmReplyEngine } from '../features/gm-reply-engine.js';

let isRunning = false;
let config = { ...CONFIG };
let gmConfig = { ...DEFAULT_GM_SETTINGS }; 
let gmCorpus = { ...DEFAULT_GM_CORPUS };

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
        GhostCursor.init(); 
        
        // LOAD CONFIGURATION
        const storage = await chrome.storage.local.get(["config", "gmSettings", "gmCorpus"]);
        if (storage.config) config = { ...config, ...storage.config };
        // Shallow merge is fine here as we load full objects in dashboard save
        if (storage.gmSettings) gmConfig = { ...gmConfig, ...storage.gmSettings }; 
        if (storage.gmCorpus) gmCorpus = { ...gmCorpus, ...storage.gmCorpus };

        chrome.runtime.sendMessage({ action: "ATTACH_DEBUGGER" });
        Log.info(`Cycle Started. Safe Mode: ON`);
        
        document.body.click(); 
        this.loop();
    },
    
    stop() {
        isRunning = false;
        Panel.setStatus(false);
        Log.info("Cycle Stopped.");
    },
    
    async loop() {
        while (isRunning) {
            const navChance = Math.random();
            
            if (navChance < 0.05) {
                Log.think("Correction: Overshot...");
                if (Math.random() > 0.5) await this.sendKey("k");
                else await this.scrollSmoothly(-200);
                await wait(random(1000, 2000));
            }
            else if (navChance < 0.35) {
                Log.think("Nav: Mouse Scroll");
                await this.parkMouse(); 
                await this.scrollSmoothly(random(300, 600));
                await wait(random(500, 1200));
                await this.sendKey("j"); 
            } 
            else {
                Log.think("Nav: Key 'J'");
                await this.sendKey("j");
            }
            
            const readTime = randomGaussian(1500, 4500); 
            Log.think(`Reading (${Math.floor(readTime)}ms)...`);
            await wait(readTime);
            
            if (!isRunning) break;

            const tweet = Scanner.readActiveTweet();
            if (!tweet) {
                Log.think("No valid tweet. Skipping.");
                await wait(800); 
                continue;
            }

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
        // PASS SETTINGS AND CORPUS TO ENGINE
        const replyText = GmReplyEngine.generate(tweet.userClean, tweet.energy, gmConfig, gmCorpus);
        
        await this.parkMouse();
        
        Log.think(`Generated: "${replyText.replace(/\n/g, ' ')}"`);
        
        await this.sendKey("r");
        await wait(2500); 

        const inputEl = document.querySelector(SELECTORS.INPUT_YZ);
        if (!inputEl) {
            Log.error("Modal failed to load.");
            await this.sendKey("Escape");
            return;
        }

        Log.think(`Typing reply...`);
        await chrome.runtime.sendMessage({ action: "TYPE", text: replyText });
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
            await this.sendKey("Enter", 2); 
            await Database.add({ type: "REPLY", text: replyText, target: tweet.userRaw });
        }
        
        await wait(2000);
        await this.parkMouse(); 
    },

    async parkMouse() {
        const { innerWidth, innerHeight } = window;
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