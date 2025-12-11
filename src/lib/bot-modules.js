import { sendKey, sendMouse, sleep, randomInt } from './utils.js';

export const BotModules = {
    // --- NAVIGATION ---
    nav: {
        nextTweet: async () => await sendKey("j"),
        previousTweet: async () => await sendKey("k")
    },

    // --- SCANNER ---
    scanner: {
        readCurrentTweet: () => {
            const focusedEl = document.activeElement;
            if (!focusedEl || focusedEl === document.body) return null;
            const article = focusedEl.closest('article');
            if (!article) return null;

            const textEl = article.querySelector('div[data-testid="tweetText"]');
            const userEl = article.querySelector('div[data-testid="User-Name"]');
            
            return {
                text: textEl ? textEl.innerText.toLowerCase() : "",
                user: userEl ? userEl.innerText : "Unknown",
                element: article
            };
        },
        checkKeywords: (text, keywords) => {
            if (!text) return false;
            return keywords.some(k => text.includes(k.toLowerCase()));
        }
    },

    // --- ACTIONS ---
    actions: {
        replyToCurrent: async (text, isSimulation) => {
            console.log("💬 Opening Reply Modal...");
            await sendKey("r");
            await sleep(1500);

            const inputBox = document.querySelector('div[data-testid="tweetTextarea_0"]');
            if (!inputBox) {
                console.error("❌ Reply modal failed to open.");
                await sendKey("Escape");
                return;
            }

            // Visual Mouse Move (Ghost Cursor)
            const rect = inputBox.getBoundingClientRect();
            await sendMouse(rect.left + (rect.width / 2), rect.top + (rect.height / 2));
            
            // Type & Send/Discard
            console.log(`⌨️ Typing: "${text}"`);
            await chrome.runtime.sendMessage({ action: "typeText", text: text });
            await sleep(text.length * 50 + 800);

            if (isSimulation) {
                console.log("🎭 SIMULATION: Discarding...");
                await sendKey("Escape");
                await sleep(800);
                // Confirm discard if dialog appears
                const discardBtn = document.querySelector('[data-testid="confirmationSheetCancel"]');
                if (discardBtn) {
                    const dRect = discardBtn.getBoundingClientRect();
                    await sendMouse(dRect.left + 20, dRect.top + 10);
                    await chrome.runtime.sendMessage({ action: "simulateClick", x: dRect.left + 20, y: dRect.top + 10 });
                }
            } else {
                console.log("🚀 SENDING TWEET...");
                await sendKey("Enter", "ctrl"); 
            }
            await sleep(2000);
        }
    }
};