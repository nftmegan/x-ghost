import { SELECTORS } from '../config/selectors.js';

export const Scanner = {
    readActiveTweet() {
        // We rely on keyboard focus (j/k keys)
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
        return keywords.some(k => text.includes(k.toLowerCase()));
    }
};