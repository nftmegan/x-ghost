// content/content.js - Visual Debug Mode

let isRunning = false;
let processedTweets = new Set();
let sessionActionCount = 0;
let ghostCursor = null;

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "STOP_BOT") {
        console.log("🛑 STOP COMMAND RECEIVED.");
        isRunning = false;
        if(ghostCursor) ghostCursor.style.display = 'none';
    }
    if (request.action === "START_BOT") {
        if (!isRunning) {
            isRunning = true;
            createGhostCursor(); // Init Cursor
            chrome.storage.local.get("config", (data) => {
                const safeConfig = { ...DEFAULT_CONFIG, ...(data.config || {}) };
                startScanner(safeConfig);
            });
        }
    }
    // --- VISUALIZATION HANDLERS ---
    if (request.action === "drawCursor") updateGhostCursor(request.x, request.y);
    if (request.action === "drawClick") animateGhostClick();
});

// --- INITIALIZATION ---
(async function init() {
    createGhostCursor();
    const data = await chrome.storage.local.get(["state", "config"]);
    const config = { ...DEFAULT_CONFIG, ...(data.config || {}) };
    
    if (data.state === "WORKING") {
        console.log("👻 GM Bot: Resuming Work Cycle");
        isRunning = true;
        await sleep(2000); 
        startScanner(config);
    }
})();

async function startScanner(config) {
    console.log("🚀 Scanner Logic Started (Debug Mode).");

    while (isRunning) {
        if (checkForCaptcha()) break;
        if (sessionActionCount >= config.maxActionsPerSession) {
            console.log("🛑 Max actions reached.");
            break;
        }

        const articles = Array.from(document.querySelectorAll(SELECTORS.tweetArticle));
        let targetMatch = null;

        for (const article of articles) {
            if (article.innerText.includes("Promoted") || article.innerText.includes("Ad")) continue;
            
            const timeEl = article.querySelector(SELECTORS.timestamp);
            const linkEl = timeEl ? timeEl.closest('a') : null;
            if (!linkEl) continue;

            const link = linkEl.href;
            if (processedTweets.has(link)) continue;

            const textEl = article.querySelector(SELECTORS.tweetText);
            const text = textEl ? textEl.innerText.toLowerCase() : "";
            
            if (config.keywords.some(k => text.includes(k.toLowerCase()))) {
                targetMatch = { article, link, text };
                break; 
            }
            
            processedTweets.add(link);
        }

        if (targetMatch) {
            await engageTarget(targetMatch, config);
        } else {
            await humanScroll();
        }
    }
}

async function engageTarget(target, config) {
    console.log(`🎯 MATCH: ${target.link}`);
    
    target.article.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(2000);

    const replyText = config.replies[randomInt(0, config.replies.length - 1)];
    
    if (config.enableActions || config.simulationMode) {
        await doReply(target.article, replyText, config);
        // await doLike(target.article, config); // Temporarily disabled to focus on Reply
        // await doFollowCheck(target.article, config); // Temporarily disabled

        sessionActionCount++;
        processedTweets.add(target.link);
        await sleep(3000);
    } else {
        processedTweets.add(target.link);
    }
}

async function doReply(article, text, config) {
    if (!isRunning) return;

    // 1. Find and Click Reply Button (Modal Opener)
    const replyBtn = article.querySelector(SELECTORS.buttons.reply);
    if (!replyBtn) {
        console.error("❌ Reply button not found on tweet.");
        return;
    }

    console.log("🖱️ Clicking Reply Button...");
    sendClick(replyBtn);
    
    // 2. Wait for Modal
    await sleep(3000); 

    // 3. Find Input Field in Modal
    const input = document.querySelector(SELECTORS.input.replyBox);
    if (input) {
        console.log("📝 Found Input. Clicking...");
        sendClick(input);
        await sleep(500);
        
        console.log(`⌨️ Typing: "${text}"`);
        chrome.runtime.sendMessage({ action: "typeText", text: text });
        await sleep(text.length * 100 + 1000);

        if (config.simulationMode && !config.enableActions) {
            console.log("🎭 Sim Mode: Discarding...");
            await simulateDiscard();
        } else {
            const sendBtn = document.querySelector(SELECTORS.buttons.sendTweet);
            if (sendBtn) {
                sendClick(sendBtn);
                console.log("🚀 Reply Sent.");
                await sleep(4000);
            }
        }
    } else {
        console.error("❌ Modal Input not found. Did the click miss?");
    }
}

async function simulateDiscard() {
    // Click Close (X)
    const closeBtn = document.querySelector('[aria-label="Close"]');
    if (closeBtn) {
        sendClick(closeBtn);
        await sleep(1500);
        
        // Click Discard
        const discardBtn = document.querySelector('[data-testid="confirmationSheetCancel"]');
        if (discardBtn) {
            sendClick(discardBtn);
        } else {
            // Text Fallback
            const allBtns = Array.from(document.querySelectorAll('button'));
            const txtBtn = allBtns.find(b => b.innerText === "Discard");
            if (txtBtn) sendClick(txtBtn);
        }
    } else {
        // Fallback: Escape
        chrome.runtime.sendMessage({ action: "sendKey", key: "Escape" });
    }
    await sleep(2000);
}

// --- VISUALIZATION HELPERS ---
function createGhostCursor() {
    if (document.getElementById('ghost-cursor')) return;
    ghostCursor = document.createElement('div');
    ghostCursor.id = 'ghost-cursor';
    Object.assign(ghostCursor.style, {
        position: 'fixed', top: '0', left: '0', width: '15px', height: '15px',
        backgroundColor: 'rgba(255, 0, 0, 0.8)', border: '2px solid white', borderRadius: '50%',
        zIndex: '2147483647', pointerEvents: 'none', transition: 'transform 0.02s linear', // faster transition for accuracy
        transform: 'translate3d(-100px, -100px, 0)'
    });
    document.body.appendChild(ghostCursor);
}

function updateGhostCursor(x, y) {
    if (!ghostCursor) createGhostCursor();
    ghostCursor.style.display = 'block';
    ghostCursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function animateGhostClick() {
    if (!ghostCursor) return;
    ghostCursor.style.backgroundColor = 'rgba(0, 255, 0, 1)'; // Green on click
    ghostCursor.style.transform += ' scale(0.8)';
    setTimeout(() => {
        ghostCursor.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        ghostCursor.style.transform = ghostCursor.style.transform.replace(' scale(0.8)', '');
    }, 150);
}

// --- UTILS ---
async function humanScroll() {
    if (!isRunning) return;
    const direction = "ArrowDown";
    chrome.runtime.sendMessage({ action: "sendKey", key: direction });
    await sleep(400); 
    
    // JS Fallback if key sim fails
    const startY = window.scrollY;
    await sleep(100);
    if (Math.abs(window.scrollY - startY) < 5) {
        window.scrollBy({ top: 300, behavior: "smooth" });
    }
    await sleep(randomInt(1500, 3000));
}

function sendClick(el) {
    const c = getHumanCoords(el);
    chrome.runtime.sendMessage({ action: "simulateClick", x: c.x, y: c.y });
}

function checkForCaptcha() { 
    if (document.querySelector('iframe[src*="arkoselabs"]')) return true;
    return false;
}