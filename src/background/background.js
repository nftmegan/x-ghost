import { sendClick, sendKeystrokes, sendSpecialKey, moveMouse } from './input_sim.js';
import { dbService } from '../lib/database.js';

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }

async function logSys(msg) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [SYSTEM] ${msg}`);
    const data = await chrome.storage.local.get("logs");
    let logs = data.logs || [];
    logs.unshift(`[${timestamp}] ${msg}`);
    if (logs.length > 50) logs.pop();
    await chrome.storage.local.set({ logs: logs });
}

const TARGET_URL = "https://x.com/home";

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ state: "IDLE", logs: [] });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "switchState") await toggleCycle();
});

async function toggleCycle() {
    const data = await chrome.storage.local.get(["state", "config"]);
    const config = data.config || {}; 
    const currentState = data.state;

    if (currentState === "WORKING") {
        await logSys("🌙 Shift finished. Entering Sleep Mode.");
        // Optional: Close tabs if you want, or just leave them open
        // const tabs = await chrome.tabs.query({ url: "*://*.x.com/*" });
        // if (tabs.length > 0) await chrome.tabs.remove(tabs.map(t => t.id));

        const sleepTime = getRandomInt(config.sleepCycleMin || 5, config.sleepCycleMax || 15);
        await chrome.storage.local.set({ state: "SLEEPING" });
        chrome.alarms.create("switchState", { delayInMinutes: sleepTime });
        await logSys(`⏳ Sleeping for ${sleepTime} minutes.`);

    } else {
        await logSys("☀️ Starting Work Cycle.");
        
        // 1. Check if we are ALREADY on an X tab (Active)
        let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        let activeTab = tabs[0];
        
        if (activeTab && (activeTab.url.includes("x.com") || activeTab.url.includes("twitter.com"))) {
            console.log("Found active X tab. Injecting bot here.");
            chrome.tabs.sendMessage(activeTab.id, { action: "START_BOT" });
        } 
        else {
            // 2. Check background tabs
            tabs = await chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] });
            if (tabs.length > 0) {
                // Focus the first one found
                await chrome.tabs.update(tabs[0].id, { active: true });
                await new Promise(r => setTimeout(r, 1000)); // Wait for switch
                chrome.tabs.sendMessage(tabs[0].id, { action: "START_BOT" });
            } else {
                // 3. Create new if none exist
                await chrome.tabs.create({ url: TARGET_URL, active: true });
            }
        }

        const workTime = getRandomInt(config.workCycleMin || 15, config.workCycleMax || 45);
        await chrome.storage.local.set({ state: "WORKING" });
        chrome.alarms.create("switchState", { delayInMinutes: workTime });
        await logSys(`🔨 Working for ${workTime} minutes.`);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === "START_BOT") {
        logSys("🚀 Manual Start.");
        chrome.storage.local.set({ state: "IDLE" }).then(toggleCycle);
    }
    
    if (request.action === "STOP_BOT") {
        logSys("🛑 Manual Stop.");
        chrome.alarms.clearAll();
        chrome.storage.local.set({ state: "IDLE" });
        // Send stop to all X tabs
        chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] }, (tabs) => {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, { action: "STOP_BOT" }).catch(() => {});
            }
        });
    }

    // --- INPUT RELAY ---
    if (sender.tab) {
        if (request.action === "simulateClick") sendClick(sender.tab.id, request.x, request.y);
        if (request.action === "moveMouse") moveMouse(sender.tab.id, request.x, request.y);
        if (request.action === "typeText") sendKeystrokes(sender.tab.id, request.text);
        if (request.action === "sendKey") sendSpecialKey(sender.tab.id, request.key, request.modifier);
    }

    if (request.action === "SAVE_DB_ENTRY") {
        dbService.add(request.data).catch(err => console.error(err));
    }
});