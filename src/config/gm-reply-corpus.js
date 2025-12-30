export const DEFAULT_GM_SETTINGS = {
    structure: {
        include_addressee_chance: 0.70,
        include_extension_chance: 0.25,
        include_sign_off_chance: 0.20,
        extension_type_weights: {
            question: 0.90,
            day_variation_weekday: 0.10,
            day_variation_weekend: 0.50
        }
    },
    formatting: {
        separator_weights: { comma: 0.80, emoji: 0.20 },
        sign_off_style: { single_break_weight: 0.70, double_break_weight: 0.30 },
        force_lowercase_extension: true,
        force_lowercase_sign_off: true
    },
    behavior: {
        lazy_mode_chance: 0.05,
        caps_lock_rage_chance: 0.01,
        typo_chance: 0.005,
        sentiment_enabled: true 
    }
};

export const DEFAULT_GM_CORPUS = {
    openers: {
        neutral: [
            "Rise and shine", "rise and shine", "Grand rising", "grand rising",
            "Top morning", "top morning", "Top of the morning", "top of the morning",
            "G'morning", "g'morning", "Top GM", "top gm", "GM", "gm",
            "GMGM", "gmgm", "GMGMGM", "gmgmgm", "GM GM", "gm gm",
            "What's up", "what's up", "Whats up", "whats up",
            "Sup", "sup", "Wassup", "wassup",
            "Morning", "morning", "Happy morning", "happy morning",
            "Gee to the m", "G to the M", "gee to the m"
        ],
        bullish: [
            "Let's get it", "Bullish morning", "bullish morning",
            "Green candles only", "We are so back", "WAGMI"
        ],
        bearish: [
            "gm i guess", "back to the mine", "tough scenes",
            "morning", "stay strong"
        ]
    },
    addressees: [
        "broski", "fam", "pal", "gang", "legend", "brother", "boss", "bro"
    ],
    extensions: {
        questions: [
            "how's your day going", "how is your day going",
            "everything good", "u good",
            "hope everything's good", "hope u good"
        ],
        day_variations: [
            "happy", "wish you a good",
            "wish you a wonderful", "have a great"
        ]
    },
    sign_offs: [
        "Let's build", "What we building?"
    ],
    separators: [
        "☀️", "☕"
    ],
    lazy_overrides: [
        "gm", "gm.", "coffee.", "..", "morning"
    ]
};