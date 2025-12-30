import { SELECTORS } from '../config/selectors.js';

export const Scanner = {
    readActiveTweet() {
        const focused = document.activeElement;
        // RELIABILITY UPGRADE: Ensure we are inside a tweet
        const article = focused?.closest(SELECTORS.TWEET);
        
        if (!article) return null;
        
        const textEl = article.querySelector(SELECTORS.TEXT);
        const userEl = article.querySelector(SELECTORS.USER);
        
        const rawName = userEl ? userEl.innerText : "Unknown";
        const rawText = textEl ? textEl.innerText.toLowerCase() : "";

        return {
            text: rawText,
            userRaw: rawName,
            // NEW: Clean the name for the extraction engine
            userClean: this.cleanUsername(rawName),
            // NEW: Read the vibes of the tweet
            energy: this.readEnergy(rawText),
            element: article
        };
    },

    hasKeyword(text, keywords) {
        if (!text) return false;
        return keywords.some(k => text.includes(k.toLowerCase()));
    },

    // --- SMART EXTRACTION LOGIC ---

    cleanUsername(raw) {
        if (!raw || raw === "Unknown") return null;

        // 1. Stop at delimiters (e.g. "John | ETH" -> "John")
        // Delimiters: | - ( [ { •
        let name = raw.split(/[|\-([\{•]/)[0];

        // 2. Remove Emojis (Ranges for common surrogate pairs)
        name = name.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        // 3. Cleanup whitespace
        name = name.trim();

        // 4. Validations
        if (name.length < 2) return null; // Too short
        if (name.length > 15) return null; // Too long (probably a sentence)
        if (name.startsWith('@')) return null; // Is a handle, not a name
        if (name.toLowerCase().includes('nft')) return null; // Generic project name

        return name;
    },

    readEnergy(text) {
        // Simple heuristic sentiment analysis
        // This effectively replaces the "Market API" by reading the room directly
        
        const bullishTerms = ['gm!', 'wagmi', 'bullish', 'moon', 'green', 'pumping', 'lfg', 'great day', 'building'];
        const bearishTerms = ['tough', 'crash', 'dump', 'red', 'down', 'sad', 'pain', 'rekt', 'bear'];

        const isBullish = bullishTerms.some(t => text.includes(t));
        const isBearish = bearishTerms.some(t => text.includes(t));

        if (isBullish && !isBearish) return 'bullish';
        if (isBearish && !isBullish) return 'bearish';
        
        return 'neutral';
    }
};