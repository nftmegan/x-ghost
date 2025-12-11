// src/features/ui-panel.js

export const Panel = {
    el: null,
    statusEl: null,
    logEl: null,

    init() {
        if (document.getElementById('ghost-panel')) return;

        // 1. Inject CSS Styles
        const style = document.createElement('style');
        style.textContent = `
            #ghost-panel {
                position: fixed; bottom: 20px; left: 20px;
                background: rgba(10, 10, 10, 0.95); color: #e0e0e0;
                border: 1px solid #333; border-radius: 8px;
                padding: 12px; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px;
                z-index: 2147483647; width: 260px; 
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                backdrop-filter: blur(8px);
                transition: opacity 0.2s;
                user-select: none;
            }
            #ghost-panel:hover { opacity: 1; }
            
            .ghost-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .ghost-title { font-weight: 700; font-size: 14px; color: #fff; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;}
            
            .ghost-status { 
                padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; 
                background: #222; color: #777; border: 1px solid #333; letter-spacing: 0.5px;
                transition: all 0.3s;
            }
            .ghost-status.running { 
                background: rgba(0, 255, 0, 0.1); color: #00ff00; border-color: #00ff00; 
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.1);
            }

            .ghost-log { 
                color: #999; font-family: 'Consolas', monospace; font-size: 11px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
                margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #333;
            }

            .ghost-footer { display: flex; justify-content: space-between; align-items: center; color: #666; font-size: 11px; }
            .key-badge { background: #2a2a2a; padding: 2px 5px; border-radius: 4px; color: #eee; border: 1px solid #444; font-size: 10px;}
            .dash-link { color: #1d9bf0; text-decoration: none; cursor: pointer; transition: color 0.2s; font-weight: 600;}
            .dash-link:hover { color: #fff; text-decoration: underline; }
        `;
        document.head.appendChild(style);

        // 2. Create Panel HTML
        this.el = document.createElement('div');
        this.el.id = 'ghost-panel';
        this.el.innerHTML = `
            <div class="ghost-header">
                <span class="ghost-title">👻 Ghost Bot</span>
                <span id="ghost-status" class="ghost-status">STOPPED</span>
            </div>
            <div id="ghost-log" class="ghost-log">Ready to start...</div>
            <div class="ghost-footer">
                <span>Toggle: <span class="key-badge">Alt</span> + <span class="key-badge">S</span></span>
                <a id="ghost-dash-link" class="dash-link">Dashboard ↗</a>
            </div>
        `;
        document.body.appendChild(this.el);

        this.statusEl = this.el.querySelector('#ghost-status');
        this.logEl = this.el.querySelector('#ghost-log');

        // 3. Link Dashboard (The FIX: Send message to background)
        this.el.querySelector('#ghost-dash-link').addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: "OPEN_DASHBOARD" });
        });
    },

    setStatus(isRunning) {
        if (!this.statusEl) return;
        if (isRunning) {
            this.statusEl.textContent = "RUNNING";
            this.statusEl.className = "ghost-status running";
        } else {
            this.statusEl.textContent = "STOPPED";
            this.statusEl.className = "ghost-status";
        }
    },

    log(msg) {
        if (this.logEl) {
            const cleanMsg = msg.replace(/^\[.*?\]\s*/, '').replace(/[\u{1F600}-\u{1F6FF}]/gu, ''); 
            this.logEl.textContent = `> ${cleanMsg}`;
            this.logEl.title = msg;
        }
    }
};