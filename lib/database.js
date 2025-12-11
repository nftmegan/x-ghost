// lib/database.js
// A wrapper for IndexedDB to store bot actions

const DB_CONFIG = {
    name: 'XGhostBotDB',
    version: 1,
    storeName: 'interactions'
};

export const dbService = {
    // Open Database Connection
    open: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create the object store if it doesn't exist
                if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
                    const store = db.createObjectStore(DB_CONFIG.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    // Add a new Record
    add: async (record) => {
        const db = await dbService.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
            const store = transaction.objectStore(DB_CONFIG.storeName);
            
            // Default Structure
            const entry = {
                timestamp: new Date().toISOString(),
                type: record.type || "UNKNOWN", // e.g., "TIMELINE_REPLY", "DM_REPLY"
                targetUrl: record.targetUrl || "",
                status: record.status || "DRY_RUN", // "EXECUTED", "DRY_RUN", "FAILED"
                details: {
                    liked: record.details?.liked || false,
                    followed: record.details?.followed || false,
                    replyText: record.details?.replyText || null,
                    error: record.details?.error || null
                }
            };

            const request = store.add(entry);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get All Records (Newest First)
    getAll: async () => {
        const db = await dbService.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
            const store = transaction.objectStore(DB_CONFIG.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by timestamp descending (newest first)
                const sorted = request.result.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                resolve(sorted);
            };
            request.onerror = () => reject(request.error);
        });
    },
    
    // Clear Database
    clear: async () => {
        const db = await dbService.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
            const store = transaction.objectStore(DB_CONFIG.storeName);
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
};