import { sendClick, sendKeystrokes, sendSpecialKey, moveMouse } from './input_sim.js';
import { dbService } from '../lib/database.js';

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }
async function logSys(msg) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] [SYSTEM] ${msg}`;
    console.log(entry);
    const data = await chrome.storage.local.get("logs");
    let logs = data.logs || [];
    logs.unshift(entry);
    if (logs.length > 50) logs.pop();
    await chrome.storage.local.set({ logs: logs });
}

const TARGET_URL = "https://x.com/home";
const DECOY_URLS = ["https://www.google.com", "https://news.ycombinator.com"];

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ state: "IDLE", logs: [] });
    logSys("👻 Ghost Bot Installed. DB Ready.");
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "switchState") {
        await toggleCycle();
    }
});

async function toggleCycle() {
    const data = await chrome.storage.local.get(["state", "config"]);
    const config = data.config || {}; 
    const currentState = data.state;

    if (currentState === "WORKING") {
        await logSys("🌙 Shift finished. Closing Twitter. Entering Sleep Mode.");
        const tabs = await chrome.tabs.query({ url: "*://*.x.com/*" });
        if (tabs.length > 0) await chrome.tabs.remove(tabs.map(t => t.id));

        const decoy = DECOY_URLS[getRandomInt(0, DECOY_URLS.length - 1)];
        await chrome.tabs.create({ url: decoy, active: true });

        const sleepTime = getRandomInt(config.sleepCycleMin || 5, config.sleepCycleMax || 15);
        await chrome.storage.local.set({ state: "SLEEPING" });
        chrome.alarms.create("switchState", { delayInMinutes: sleepTime });
        await logSys(`⏳ Sleeping for ${sleepTime} minutes.`);

    } else {
        await logSys("☀️ Break over. Starting Work Cycle.");
        const existingTabs = await chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] });
        
        if (existingTabs.length > 0) {
            const tabId = existingTabs[0].id;
            await chrome.tabs.update(tabId, { active: true });
            
            console.log("Found existing tab. Waking up content script...");
            chrome.tabs.sendMessage(tabId, { action: "START_BOT" }).catch(() => {
                console.log("Script unresponsive. Reloading tab as fallback.");
                chrome.tabs.reload(tabId);
            });

        } else {
            await chrome.tabs.create({ url: TARGET_URL, active: true });
        }

        const workTime = getRandomInt(config.workCycleMin || 15, config.workCycleMax || 45);
        await chrome.storage.local.set({ state: "WORKING" });
        chrome.alarms.create("switchState", { delayInMinutes: workTime });
        await logSys(`🔨 Working for ${workTime} minutes.`);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === "START_BOT") {
        logSys("🚀 Manual Start Initiated.");
        chrome.storage.local.set({ state: "IDLE" }).then(toggleCycle);
    }
    
    if (request.action === "STOP_BOT") {
        logSys("🛑 Manual Stop Initiated.");
        chrome.alarms.clearAll();
        chrome.storage.local.set({ state: "IDLE" });

        chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] }, (tabs) => {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, { action: "STOP_BOT" }).catch(() => {});
            }
        });
    }

    if (request.action === "simulateClick") {
        sendClick(sender.tab.id, request.x, request.y);
    }

    // --- NEW: MOVE MOUSE WITHOUT CLICKING ---
    if (request.action === "moveMouse") {
        moveMouse(sender.tab.id, request.x, request.y);
    }
    
    if (request.action === "sendKey") {
        sendSpecialKey(sender.tab.id, request.key);
    }

    if (request.action === "typeText") {
        sendKeystrokes(sender.tab.id, request.text);
    }

    if (request.action === "logAction") {
        logSys(`🤖 [ACTION] ${request.message}`);
    }

    if (request.action === "SAVE_DB_ENTRY") {
        logSys(`💾 Database Write: ${request.data.type} (${request.data.status})`);
        dbService.add(request.data)
            .then(() => console.log("DB Write Success"))
            .catch(err => console.error("DB Write Failed", err));
    }
});