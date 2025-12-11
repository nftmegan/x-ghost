// lib/selectors.js
const SELECTORS = {
    tweetArticle: 'article[data-testid="tweet"]',
    tweetText: 'div[data-testid="tweetText"]',
    userName: 'div[data-testid="User-Name"]',
    timestamp: 'time',
    
    // Profile Interaction
    userAvatar: 'div[data-testid="Tweet-User-Avatar"]',
    hoverCard: 'div[data-testid="HoverCard"]',
    hoverCardButton: 'div[data-testid="HoverCard"] button[role="button"]', 
    
    // SAFETY & ERRORS
    captcha: [
        'iframe[src*="arkoselabs"]', 
        'iframe[src*="funcaptcha"]', 
        'div[data-testid="challengePage"]'
    ],
    
    buttons: {
        like: 'button[data-testid="like"]',
        reply: 'button[data-testid="reply"]',
        sendTweet: 'button[data-testid="tweetButton"]',
        
        // MODAL ACTIONS
        modal: 'div[role="dialog"]',
        closeModal: '[aria-label="Close"]', // The X button
        saveDraft: 'button[data-testid="confirmationSheetConfirm"]', 
        discardDraft: 'button[data-testid="confirmationSheetCancel"]' 
    },
    input: {
        replyBox: 'div[data-testid="tweetTextarea_0"]'
    }
};