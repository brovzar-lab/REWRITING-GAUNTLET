/** The cloud API key lives in localStorage on this machine only. It is never
    written into documents, snapshots, exports, or the Dexie database, and the
    AI settings screen says so. */

const STORAGE_KEY = 'rewrite-studio.cloud-api-key';

export const keyStore = {
  get(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  },
  set(key: string): void {
    try {
      if (key) localStorage.setItem(STORAGE_KEY, key);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable: the key simply stays unset */
    }
  },
};
