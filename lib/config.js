// lib/config.js
const DEFAULT_CONFIG = {
    // Logic: GM Bot Defaults
    keywords: ["gm", "good morning", "morning", "rise and shine", "top of the morning", "gmgm"],
    replies: [
        "GM! ☕️",
        "Good morning! ☀️",
        "GM fam!",
        "Rise and grind! 🚀",
        "Have a great day!"
    ],
    // Timers (Minutes)
    workCycleMin: 15,
    workCycleMax: 45,
    sleepCycleMin: 5,
    sleepCycleMax: 15,
    
    // Safety & Modes
    enableActions: false,    // If TRUE: Actually Posts/Likes/Follows
    simulationMode: false,   // If TRUE (and enableActions is FALSE): Clicks UI but DOES NOT Post/Follow
    
    maxActionsPerSession: 20,
    
    // Follow Limits
    followLimitCount: 15,
    followLimitWindowMins: 30
};

const DECOY_URLS = [
    "https://www.google.com",
    "https://news.ycombinator.com",
    "https://www.wikipedia.org"
];