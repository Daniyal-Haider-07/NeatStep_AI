
import { ActivityLogEntry, AppStats } from "../types";

const DB_NAME = "NeatStepPersistenceDB";
const STORE_LOGS = "ActivityLogs";
const STORE_STATS = "AppStats";
const DB_VERSION = 4; // Version 4 to ensure all multiplatform stores are correctly instantiated

class DBService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Activity Logs Store - Stores chronological history of all AI actions
        if (!db.objectStoreNames.contains(STORE_LOGS)) {
          db.createObjectStore(STORE_LOGS, { keyPath: "id" });
        }
        
        // App Stats Store - Stores cumulative dashboard metrics
        if (!db.objectStoreNames.contains(STORE_STATS)) {
          db.createObjectStore(STORE_STATS, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // LOG OPERATIONS
  async getAllLogs(): Promise<ActivityLogEntry[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_LOGS, "readonly");
        const store = transaction.objectStore(STORE_LOGS);
        const request = store.getAll();

        request.onsuccess = () => {
          const logs = request.result as ActivityLogEntry[];
          // Always return most recent activities first
          resolve(logs.sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Audit retrieval failed:", e);
      return [];
    }
  }

  async saveLog(log: ActivityLogEntry): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_LOGS, "readwrite");
        const store = transaction.objectStore(STORE_LOGS);
        const request = store.put(log);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Audit persistence failed:", e);
    }
  }

  async clearAllLogs(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_LOGS, "readwrite");
        const store = transaction.objectStore(STORE_LOGS);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Audit wipe failed:", e);
    }
  }

  // STATS OPERATIONS
  async getStats(): Promise<AppStats | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_STATS, "readonly");
        const store = transaction.objectStore(STORE_STATS);
        const request = store.get("main_stats");

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Metric retrieval failed:", e);
      return null;
    }
  }

  async saveStats(stats: AppStats): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_STATS, "readwrite");
        const store = transaction.objectStore(STORE_STATS);
        // Persist with a fixed ID to ensure single record updates
        const request = store.put({ ...stats, id: "main_stats" });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Metric persistence failed:", e);
    }
  }
}

export const dbService = new DBService();
