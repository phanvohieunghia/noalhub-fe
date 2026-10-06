/**
 * Lightweight crypto polyfill for React Native / Hermes environment.
 * Required by uuid and packages using crypto.getRandomValues.
 */
declare const global: Record<string, any> | undefined;

if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.getRandomValues) {
  const polyfill = {
    getRandomValues<T extends ArrayBufferView | null>(array: T): T {
      if (!array) return array;
      const uint8 = new Uint8Array(
        array.buffer,
        array.byteOffset,
        array.byteLength,
      );
      for (let i = 0; i < uint8.length; i++) {
        uint8[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomUUID(): string {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
  };

  (globalThis as any).crypto = polyfill;
  if (typeof global !== "undefined") {
    global.crypto = polyfill;
  }
}

export {};
