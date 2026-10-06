import * as SecureStore from "expo-secure-store";
import type { KeyValueStorage } from "@noalhub/api/storage";

const memoryCache = new Map<string, string>();

/**
 * KeyValueStorage adapter backed by Expo SecureStore with in-memory sync cache
 * as designed in docs/mobile.md §5.1 (option a).
 */
export const secureStorageAdapter: KeyValueStorage = {
  get(key: string): string | null {
    return memoryCache.get(key) ?? null;
  },

  set(key: string, value: string): void {
    memoryCache.set(key, value);
    void SecureStore.setItemAsync(key, value).catch(() => {
      /* ignore write failure */
    });
  },

  remove(key: string): void {
    memoryCache.delete(key);
    void SecureStore.deleteItemAsync(key).catch(() => {
      /* ignore delete failure */
    });
  },
};

/**
 * Hydrates the in-memory cache from SecureStore on startup.
 */
export async function initStorage(
  keysToPreload: string[] = ["nh.refresh", "nh.locale"],
): Promise<void> {
  for (const key of keysToPreload) {
    try {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) {
        memoryCache.set(key, val);
      }
    } catch {
      /* ignore read failure */
    }
  }
}
