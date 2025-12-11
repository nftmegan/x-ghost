import { SELECTORS } from '../config/selectors.js';

export const Scanner = {
    readActiveTweet() {
        // RELIABILITY UPGRADE: 
        // When using 'J', Twitter natively focuses the tweet element.
        // We can just grab 'document.activeElement' which is 100% accurate.
        const focused = document.activeElement;
        const article = focused?.closest(SELECTORS.TWEET);
        
        if (!article) return null;
        
        const textEl = article.querySelector(SELECTORS.TEXT);
        const userEl = article.querySelector(SELECTORS.USER);
        
        return {
            text: textEl ? textEl.innerText.toLowerCase() : "",
            user: userEl ? userEl.innerText : "Unknown",
            element: article
        };
    },

    hasKeyword(text, keywords) {
        if (!text) return false;
        return keywords.some(k => text.includes(k.toLowerCase()));
    }
};