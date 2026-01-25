/**
 * Offline Provider
 * PWA offline support with IndexedDB storage
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface OfflineState {
  isOnline: boolean;
  isOfflineReady: boolean;
  pendingSyncCount: number;
  lastSyncAt: Date | null;
  syncNow: () => Promise<void>;
  saveOffline: <T>(key: string, data: T) => Promise<void>;
  getOffline: <T>(key: string) => Promise<T | null>;
  clearOffline: (key: string) => Promise<void>;
}

// ============================================================================
// INDEXEDDB HELPERS
// ============================================================================

const DB_NAME = 'sommers-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline-data';

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

async function setItem<T>(key: string, data: T): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.put({
      key,
      data,
      timestamp: new Date().toISOString(),
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getItem<T>(key: string): Promise<T | null> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };
  });
}

async function removeItem(key: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getAllKeys(): Promise<string[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAllKeys();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string[]);
  });
}

// ============================================================================
// CONTEXT
// ============================================================================

const OfflineContext = createContext<OfflineState | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // Initialize
  useEffect(() => {
    initDB()
      .then(() => {
        setIsOfflineReady(true);
        checkPendingSync();
      })
      .catch(console.error);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending sync count
  const checkPendingSync = async () => {
    try {
      const keys = await getAllKeys();
      const pendingKeys = keys.filter((k) => k.startsWith('pending:'));
      setPendingSyncCount(pendingKeys.length);
    } catch (error) {
      console.error('Error checking pending sync:', error);
    }
  };

  // Sync now
  const syncNow = async () => {
    if (!isOnline) {
      console.log('Cannot sync while offline');
      return;
    }

    try {
      const keys = await getAllKeys();
      const pendingKeys = keys.filter((k) => k.startsWith('pending:'));

      for (const key of pendingKeys) {
        const data = await getItem(key);
        if (data) {
          // TODO: Send to server
          console.log('Syncing:', key, data);
          await removeItem(key);
        }
      }

      setLastSyncAt(new Date());
      await checkPendingSync();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  // Save offline
  const saveOffline = async <T,>(key: string, data: T): Promise<void> => {
    await setItem(key, data);

    if (key.startsWith('pending:')) {
      await checkPendingSync();
    }
  };

  // Get offline
  const getOffline = async <T,>(key: string): Promise<T | null> => {
    return await getItem<T>(key);
  };

  // Clear offline
  const clearOffline = async (key: string): Promise<void> => {
    await removeItem(key);
    await checkPendingSync();
  };

  const value: OfflineState = {
    isOnline,
    isOfflineReady,
    pendingSyncCount,
    lastSyncAt,
    syncNow,
    saveOffline,
    getOffline,
    clearOffline,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useOffline(): OfflineState {
  const context = useContext(OfflineContext);

  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }

  return context;
}

export function useIsOnline(): boolean {
  const { isOnline } = useOffline();
  return isOnline;
}

export default OfflineContext;
