type ChangeCallback = (key: string, value: unknown) => void;

export const localStorageBackend = {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
    this._callbacks.forEach(cb => { try { cb(key, value); } catch { /* swallow */ } });
  },
  _callbacks: [] as ChangeCallback[],
  onChange(callback: ChangeCallback): void {
    this._callbacks.push(callback);
  },
};
