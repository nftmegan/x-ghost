// This runs in CONTENT context
let cursorEl = null;

export const GhostCursor = {
    init() {
        if (document.getElementById('ghost-cursor')) return;
        cursorEl = document.createElement('div');
        cursorEl.id = 'ghost-cursor';
        Object.assign(cursorEl.style, {
            position: 'fixed', top: '0', left: '0', width: '15px', height: '15px',
            backgroundColor: 'rgba(255, 0, 0, 0.7)', border: '2px solid white', borderRadius: '50%',
            zIndex: '9999999', pointerEvents: 'none', transition: 'transform 0.1s linear',
            transform: 'translate3d(-50px, -50px, 0)' // Start off screen
        });
        document.body.appendChild(cursorEl);
    },
    move(x, y) {
        if (!cursorEl) this.init();
        cursorEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    },
    click() {
        if (!cursorEl) return;
        cursorEl.style.backgroundColor = '#00ff00'; // Green flash
        setTimeout(() => cursorEl.style.backgroundColor = 'rgba(255, 0, 0, 0.7)', 200);
    }
};