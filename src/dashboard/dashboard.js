import { Database } from '../core/database.js';
import { CONFIG } from '../config/constants.js';
import { DEFAULT_GM_SETTINGS, DEFAULT_GM_CORPUS } from '../config/gm-reply-corpus.js';

document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    await loadSettings();
    await loadHistory();

    document.getElementById('btn-save-general').addEventListener('click', saveGeneralSettings);
    document.getElementById('btn-save-gm').addEventListener('click', saveGMSettings);
    
    document.getElementById('btn-refresh').addEventListener('click', loadHistory);
    document.getElementById('btn-clear').addEventListener('click', async () => {
        if(confirm("Delete all logs?")) {
            await Database.clear();
            await loadHistory();
        }
    });

    ['addressee', 'extension', 'signoff', 'emoji', 'doublebreak', 'lazy', 'typo'].forEach(id => {
        const el = document.getElementById(`slider-${id}`);
        const disp = document.getElementById(`val-${id}`);
        if(el && disp) {
            el.addEventListener('input', () => disp.textContent = el.value);
        }
    });
});

function initTabs() {
    const tabs = document.querySelectorAll('.menu-item');
    
    // 1. Restore previously active tab from LocalStorage
    const savedTab = localStorage.getItem('ghost_active_tab');
    if (savedTab) {
        const targetTab = document.querySelector(`.menu-item[data-tab="${savedTab}"]`);
        const targetContent = document.getElementById(`tab-${savedTab}`);
        
        if (targetTab && targetContent) {
            // Deactivate defaults
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            // Activate saved
            targetTab.classList.add('active');
            targetContent.classList.add('active');
        }
    }

    // 2. Attach Click Listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            
            // Add active class to clicked
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.add('active');
            
            // Save to LocalStorage
            localStorage.setItem('ghost_active_tab', target);
        });
    });
}

// --- HELPERS FOR TEXT CORPUS ---
const listToText = (arr) => (arr || []).join('\n');
const textToList = (txt) => txt.split('\n').map(s => s.trim()).filter(Boolean);

// --- LOAD SETTINGS ---
async function loadSettings() {
    const store = await chrome.storage.local.get(["config", "gmSettings", "gmCorpus"]);
    
    // 1. General Config
    const currentConfig = { ...CONFIG, ...(store.config || {}) };
    document.getElementById('conf-simulation').checked = currentConfig.SIMULATION_MODE;
    document.getElementById('conf-keywords').value = currentConfig.KEYWORDS.join(", ");

    // 2. GM Strategy Config (Merge stored with defaults)
    const currentGM = mergeDeep(structuredClone(DEFAULT_GM_SETTINGS), store.gmSettings || {});
    
    setSlider('slider-addressee', 'val-addressee', currentGM.structure.include_addressee_chance);
    setSlider('slider-extension', 'val-extension', currentGM.structure.include_extension_chance);
    setSlider('slider-signoff', 'val-signoff', currentGM.structure.include_sign_off_chance);
    
    setSlider('slider-emoji', 'val-emoji', currentGM.formatting.separator_weights.emoji);
    setSlider('slider-doublebreak', 'val-doublebreak', currentGM.formatting.sign_off_style.double_break_weight);
    
    document.getElementById('check-lowercase-ext').checked = currentGM.formatting.force_lowercase_extension;
    document.getElementById('check-lowercase-signoff').checked = currentGM.formatting.force_lowercase_sign_off;

    setSlider('slider-lazy', 'val-lazy', currentGM.behavior.lazy_mode_chance);
    setSlider('slider-typo', 'val-typo', currentGM.behavior.typo_chance);
    document.getElementById('check-sentiment').checked = currentGM.behavior.sentiment_enabled;

    // 3. GM Corpus (Text Lists)
    const corpus = mergeDeep(structuredClone(DEFAULT_GM_CORPUS), store.gmCorpus || {});
    
    // Load text areas
    document.getElementById('txt-openers-neutral').value = listToText(corpus.openers.neutral);
    document.getElementById('txt-openers-bullish').value = listToText(corpus.openers.bullish);
    document.getElementById('txt-openers-bearish').value = listToText(corpus.openers.bearish);
    
    document.getElementById('txt-addressees').value = listToText(corpus.addressees);
    
    document.getElementById('txt-ext-questions').value = listToText(corpus.extensions.questions);
    document.getElementById('txt-ext-days').value = listToText(corpus.extensions.day_variations);
    
    document.getElementById('txt-signoffs').value = listToText(corpus.sign_offs);
    document.getElementById('txt-lazy').value = listToText(corpus.lazy_overrides);
}

function setSlider(id, labelId, val) {
    const el = document.getElementById(id);
    const label = document.getElementById(labelId);
    if(el && label) {
        el.value = val;
        label.textContent = val;
    }
}

// --- SAVE FUNCTIONS ---

async function saveGeneralSettings() {
    const newConfig = {
        SIMULATION_MODE: document.getElementById('conf-simulation').checked,
        KEYWORDS: document.getElementById('conf-keywords').value.split(',').map(s => s.trim()).filter(Boolean)
    };
    const store = await chrome.storage.local.get("config");
    const merged = { ...CONFIG, ...(store.config || {}), ...newConfig };
    await chrome.storage.local.set({ config: merged });
    showFeedback('save-msg-general');
}

async function saveGMSettings() {
    // 1. Capture Probabilities & Boolean logic
    const newSettings = {
        structure: {
            include_addressee_chance: parseFloat(document.getElementById('slider-addressee').value),
            include_extension_chance: parseFloat(document.getElementById('slider-extension').value),
            include_sign_off_chance: parseFloat(document.getElementById('slider-signoff').value),
            // Keep hardcoded weights for internal logic as they aren't in UI yet
            extension_type_weights: DEFAULT_GM_SETTINGS.structure.extension_type_weights 
        },
        formatting: {
            separator_weights: { 
                comma: 1 - parseFloat(document.getElementById('slider-emoji').value),
                emoji: parseFloat(document.getElementById('slider-emoji').value)
            },
            sign_off_style: {
                single_break_weight: 1 - parseFloat(document.getElementById('slider-doublebreak').value),
                double_break_weight: parseFloat(document.getElementById('slider-doublebreak').value)
            },
            force_lowercase_extension: document.getElementById('check-lowercase-ext').checked,
            force_lowercase_sign_off: document.getElementById('check-lowercase-signoff').checked
        },
        behavior: {
            lazy_mode_chance: parseFloat(document.getElementById('slider-lazy').value),
            typo_chance: parseFloat(document.getElementById('slider-typo').value),
            sentiment_enabled: document.getElementById('check-sentiment').checked,
            caps_lock_rage_chance: DEFAULT_GM_SETTINGS.behavior.caps_lock_rage_chance
        }
    };

    // 2. Capture Text Corpus
    const newCorpus = {
        openers: {
            neutral: textToList(document.getElementById('txt-openers-neutral').value),
            bullish: textToList(document.getElementById('txt-openers-bullish').value),
            bearish: textToList(document.getElementById('txt-openers-bearish').value)
        },
        addressees: textToList(document.getElementById('txt-addressees').value),
        extensions: {
            questions: textToList(document.getElementById('txt-ext-questions').value),
            day_variations: textToList(document.getElementById('txt-ext-days').value)
        },
        sign_offs: textToList(document.getElementById('txt-signoffs').value),
        lazy_overrides: textToList(document.getElementById('txt-lazy').value),
        separators: DEFAULT_GM_CORPUS.separators // Emojis stay hardcoded for now
    };

    await chrome.storage.local.set({ gmSettings: newSettings, gmCorpus: newCorpus });
    showFeedback('save-msg-gm');
}

function showFeedback(id) {
    const msg = document.getElementById(id);
    if(msg) {
        msg.style.opacity = 1;
        setTimeout(() => msg.style.opacity = 0, 2000);
    }
}

// Deep merge helper to ensure we don't overwrite nested defaults with nulls
function mergeDeep(target, source) {
    for (const key in source) {
        // If it's an object BUT NOT an array, we recurse
        if (source[key] instanceof Object && key in target && !Array.isArray(source[key])) {
            Object.assign(source[key], mergeDeep(target[key], source[key]));
        }
    }
    // For arrays and primitives, this will overwrite target with source (which is what we want for lists)
    Object.assign(target || {}, source);
    return target;
}

// --- DATABASE LOAD (Legacy) ---
async function loadHistory() {
    const tbody = document.getElementById('table-body');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    try {
        const records = await Database.getAll();
        tbody.innerHTML = '';
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#777;">No activity yet.</td></tr>';
            return;
        }
        records.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(row.timestamp).toLocaleString()}</td>
                <td><span class="tag">${row.type}</span></td>
                <td>${row.text || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" style="color:red">Error: ${e.message}</td></tr>`;
    }
}