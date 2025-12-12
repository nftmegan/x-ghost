// src/features/ghost-cursor.js
let cursorEl = null;

export const GhostCursor = {
    init() {
        if (document.getElementById('ghost-cursor')) return;
        
        cursorEl = document.createElement('div');
        cursorEl.id = 'ghost-cursor';
        
        // Define styles inline to ensure they apply
        Object.assign(cursorEl.style, {
            position: 'fixed', 
            top: '0', 
            left: '0', 
            width: '18px', 
            height: '18px',
            backgroundColor: 'rgba(255, 0, 50, 0.8)', 
            border: '2px solid white', 
            borderRadius: '50%',
            zIndex: '2147483647', 
            pointerEvents: 'none', 
            transition: 'transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)', // Smooth CSS interpolation
            transform: 'translate3d(-100px, -100px, 0)',
            boxShadow: '0 0 15px rgba(255, 0, 50, 0.6)'
        });
        
        document.documentElement.appendChild(cursorEl);
    },

    move(x, y) {
        if (!cursorEl) this.init();
        cursorEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    },

    click() {
        if (!cursorEl) return;
        const oldColor = cursorEl.style.backgroundColor;
        cursorEl.style.backgroundColor = '#00ff41'; // Bright green click
        cursorEl.style.transform += ' scale(0.8)';
        
        setTimeout(() => {
            cursorEl.style.backgroundColor = oldColor;
            cursorEl.style.transform = cursorEl.style.transform.replace(' scale(0.8)', '');
        }, 150);
    }
};