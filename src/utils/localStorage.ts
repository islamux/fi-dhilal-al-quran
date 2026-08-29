type ChangeCallback = (key: string, value: unknown) => void;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const localStorageBackend = {
  get<T>(key: string): T | null {
    if (!canUseStorage()) return null;
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  set<T>(key: string, value: T): void {
    if (!canUseStorage()) return;
    localStorage.setItem(key, JSON.stringify(value));
    this._callbacks.forEach(cb => { try { cb(key, value); } catch { /* swallow */ } });
  },
  _callbacks: [] as ChangeCallback[],
  onChange(callback: ChangeCallback): () => void {
    this._callbacks.push(callback);
    return () => {
      this._callbacks = this._callbacks.filter(cb => cb !== callback);
    };
  },
};
