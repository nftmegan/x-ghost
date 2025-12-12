// src/features/ui-panel.js

export const Panel = {
    el: null,
    statusEl: null,
    logContainer: null,

    init() {
        if (document.getElementById('ghost-panel')) return;

        const style = document.createElement('style');
        style.textContent = `
            #ghost-panel {
                position: fixed; 
                top: 20px; 
                bottom: 20px; 
                left: 20px;
                width: 280px; /* Fixed width as requested */
                background: rgba(10, 10, 10, 0.95); 
                color: #e0e0e0;
                border: 1px solid #333; 
                border-radius: 8px;
                padding: 12px; 
                font-family: 'Segoe UI', system-ui, sans-serif; 
                font-size: 12px;
                z-index: 2147483647; 
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                backdrop-filter: blur(8px);
                transition: opacity 0.2s;
                user-select: none;
                
                /* FLEX LAYOUT FOR FULL HEIGHT */
                display: flex;
                flex-direction: column;
            }
            #ghost-panel:hover { opacity: 1; }
            
            .ghost-header { 
                display: flex; justify-content: space-between; align-items: center; 
                margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #333; 
                flex-shrink: 0;
            }
            .ghost-title { font-weight: 700; font-size: 14px; color: #fff; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;}
            
            .ghost-status { 
                padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; 
                background: #222; color: #777; border: 1px solid #333; letter-spacing: 0.5px;
                transition: all 0.3s;
            }
            .ghost-status.running { 
                background: rgba(0, 255, 65, 0.15); color: #00ff41; border-color: #00ff41; 
                box-shadow: 0 0 8px rgba(0, 255, 65, 0.2);
            }

            /* FLEXIBLE CONSOLE AREA */
            .ghost-console {
                flex-grow: 1; /* Fills all remaining height */
                overflow-y: auto;
                background: #000;
                border: 1px solid #222;
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 10px;
                display: flex;
                flex-direction: column-reverse; 
            }
            
            .log-entry {
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 11px;
                margin-bottom: 4px;
                line-height: 1.4;
                color: #888;
                border-bottom: 1px solid #111;
                word-wrap: break-word;
            }
            .log-entry:first-child { color: #00ff41; font-weight: 600; } 
            .log-entry.error { color: #ff4444; }
            .log-entry .time { color: #555; margin-right: 4px; font-size: 10px; }

            .ghost-console::-webkit-scrollbar { width: 4px; }
            .ghost-console::-webkit-scrollbar-track { background: #111; }
            .ghost-console::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }

            .ghost-footer { 
                display: flex; justify-content: space-between; align-items: center; 
                color: #666; font-size: 11px; flex-shrink: 0;
            }
            .key-badge { background: #2a2a2a; padding: 2px 5px; border-radius: 4px; color: #eee; border: 1px solid #444; font-size: 10px;}
            .dash-link { color: #1d9bf0; text-decoration: none; cursor: pointer; transition: color 0.2s; font-weight: 600;}
            .dash-link:hover { color: #fff; text-decoration: underline; }
        `;
        document.head.appendChild(style);

        this.el = document.createElement('div');
        this.el.id = 'ghost-panel';
        this.el.innerHTML = `
            <div class="ghost-header">
                <span class="ghost-title">👻 Ghost Bot</span>
                <span id="ghost-status" class="ghost-status">STOPPED</span>
            </div>
            
            <div id="ghost-console" class="ghost-console">
                <div class="log-entry">UI Initialized. Height Maximized.</div>
            </div>

            <div class="ghost-footer">
                <span>Toggle: <span class="key-badge">Alt</span> + <span class="key-badge">S</span></span>
                <a id="ghost-dash-link" class="dash-link">Dashboard ↗</a>
            </div>
        `;
        document.body.appendChild(this.el);

        this.statusEl = this.el.querySelector('#ghost-status');
        this.logContainer = this.el.querySelector('#ghost-console');

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

    log(msg, type = 'info') {
        if (!this.logContainer) return;
        const time = new Date().toLocaleTimeString().split(' ')[0];
        const entry = document.createElement('div');
        entry.className = type === 'error' ? 'log-entry error' : 'log-entry';
        entry.innerHTML = `<span class="time">[${time}]</span> ${msg}`;
        this.logContainer.prepend(entry);
        if (this.logContainer.children.length > 100) {
            this.logContainer.removeChild(this.logContainer.lastChild);
        }
    }
};