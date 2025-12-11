export const Logger = {
    info: async (msg) => {
        const entry = `[${new Date().toLocaleTimeString()}] ℹ️ ${msg}`;
        console.log(entry);
        await Logger.save(entry);
    },
    error: async (msg) => {
        const entry = `[${new Date().toLocaleTimeString()}] ❌ ${msg}`;
        console.error(entry);
        await Logger.save(entry);
    },
    save: async (entry) => {
        const data = await chrome.storage.local.get("logs");
        const logs = data.logs || [];
        logs.unshift(entry);
        if (logs.length > 100) logs.pop(); // Keep last 100
        await chrome.storage.local.set({ logs });
    }
};