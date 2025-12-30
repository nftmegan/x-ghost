import { DEFAULT_GM_SETTINGS, DEFAULT_GM_CORPUS } from '../config/gm-reply-corpus.js';
import { random } from '../utils/helpers.js';

export const GmReplyEngine = {
    /**
     * Generates an organic GM reply string.
     * @param {string|null} targetName - Cleaned name of user (e.g. "John")
     * @param {string} sentiment - 'neutral', 'bullish', 'bearish'
     * @param {object} settings - Configuration probabilities
     * @param {object} corpus - The text database
     */
    generate(targetName = null, sentiment = 'neutral', settings = DEFAULT_GM_SETTINGS, corpus = DEFAULT_GM_CORPUS) {
        // 1. Lazy Mode Override
        if (Math.random() < settings.behavior.lazy_mode_chance) {
            return this._pickRandom(corpus.lazy_overrides);
        }

        // 2. Build The Hook (Line 1)
        let line1 = this._buildHook(targetName, sentiment, settings, corpus);

        // 3. Build The Closer (Line 2)
        let line2 = "";
        if (Math.random() < settings.structure.include_sign_off_chance) {
            line2 = this._buildCloser(line1, settings, corpus);
        }

        // 4. Formatting & Assembly
        if (!line2) return line1;

        const breakStyle = Math.random() < settings.formatting.sign_off_style.double_break_weight 
            ? "\n\n" 
            : "\n";
            
        return `${line1}${breakStyle}${line2}`;
    },

    _buildHook(targetName, sentiment, settings, corpus) {
        // A. Pick Opener
        // Fallback to neutral if sentiment list is empty
        const category = (corpus.openers[sentiment] && corpus.openers[sentiment].length > 0) 
            ? sentiment 
            : 'neutral';
        const opener = this._pickRandom(corpus.openers[category]);

        // B. Add Name
        let addressee = "";
        if (targetName) {
            addressee = targetName;
        } else if (Math.random() < settings.structure.include_addressee_chance) {
            addressee = this._pickRandom(corpus.addressees);
        }

        let currentLine = addressee ? `${opener} ${addressee}` : opener;

        // C. Extension (The Bridge)
        if (Math.random() < settings.structure.include_extension_chance) {
            const extension = this._getExtension(currentLine, settings, corpus);
            if (extension) {
                const useEmoji = Math.random() < settings.formatting.separator_weights.emoji;
                const separator = useEmoji 
                    ? ` ${this._pickRandom(corpus.separators)} ` 
                    : ", ";
                
                const formattedExt = settings.formatting.force_lowercase_extension 
                    ? extension.toLowerCase() 
                    : extension;

                currentLine = `${currentLine}${separator}${formattedExt}`;
            }
        }

        // D. Anti-Bot: Caps Lock Rage
        if (Math.random() < settings.behavior.caps_lock_rage_chance) {
            currentLine = currentLine.toUpperCase();
        }

        // E. Anti-Bot: Typo
        if (Math.random() < settings.behavior.typo_chance) {
            currentLine = this._injectTypo(currentLine);
        }

        return currentLine;
    },

    _buildCloser(line1Text, settings, corpus) {
        for (let i = 0; i < 5; i++) {
            const closer = this._pickRandom(corpus.sign_offs);
            if (!this._hasWordCollision(line1Text, closer)) {
                return settings.formatting.force_lowercase_sign_off 
                    ? closer.toLowerCase() 
                    : closer;
            }
        }
        return ""; 
    },

    _getExtension(existingText, settings, corpus) {
        const day = new Date().getDay();
        const isWeekend = (day === 0 || day === 6 || day === 5); // Fri/Sat/Sun
        
        const dayVarChance = isWeekend 
            ? settings.structure.extension_type_weights.day_variation_weekend 
            : settings.structure.extension_type_weights.day_variation_weekday;

        let list = corpus.extensions.questions;
        let isDayVar = false;

        if (Math.random() < dayVarChance) {
            list = corpus.extensions.day_variations;
            isDayVar = true;
        }

        for (let i = 0; i < 10; i++) {
            const candidate = this._pickRandom(list);
            if (!this._hasWordCollision(existingText, candidate)) {
                if (isDayVar) {
                    return `${candidate} ${this._getDayName()}`;
                }
                return candidate;
            }
        }
        return null;
    },

    _pickRandom(arr) {
        if (!arr || arr.length === 0) return "";
        return arr[Math.floor(Math.random() * arr.length)];
    },

    _getDayName() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    },

    _hasWordCollision(str1, str2) {
        if(!str2) return false;
        const words1 = new Set(str1.toLowerCase().split(/\W+/));
        const words2 = str2.toLowerCase().split(/\W+/);
        const ignore = new Set(['a', 'the', 'is', 'it', 'to', 'you', 'u']);
        return words2.some(w => w.length > 2 && !ignore.has(w) && words1.has(w));
    },

    _injectTypo(text) {
        if (text.length < 3) return text;
        const idx = Math.floor(Math.random() * (text.length - 2));
        const chars = text.split('');
        const temp = chars[idx];
        chars[idx] = chars[idx + 1];
        chars[idx + 1] = temp;
        return chars.join('');
    }
};