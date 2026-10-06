/**
 * A minimal synchronous key-value storage contract for platform decoupling.
 *
 * Web defaults to `localStorage` (with cross-tab sync via `StorageEvent`).
 * Mobile injects `expo-secure-store` / memory cache adapter at bootstrap.
 */
export type KeyValueStorage = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /**
   * Subscribe to storage clearing from outside this process/tab (e.g. cross-tab on web).
   * Returns an unsubscribe function.
   */
  subscribeExternalClear?(key: string, cb: () => void): () => void;
};

const defaultStorage: KeyValueStorage = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignored */
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignored */
    }
  },

  subscribeExternalClear(key: string, cb: () => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (event: StorageEvent) => {
      // event.key === null means localStorage.clear()
      if (event.key !== null && event.key !== key) return;
      if (event.newValue === null) {
        cb();
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};

let currentStorage: KeyValueStorage = defaultStorage;

export function getStorage(): KeyValueStorage {
  return currentStorage;
}

export function setStorage(impl: KeyValueStorage): void {
  currentStorage = impl;
}
