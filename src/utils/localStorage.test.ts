import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageBackend } from './localStorage';

describe('localStorageBackend', () => {
  beforeEach(() => localStorage.clear());

  it('stores and retrieves a value', () => {
    localStorageBackend.set('key1', { a: 1 });
    expect(localStorageBackend.get<{ a: number }>('key1')).toEqual({ a: 1 });
  });

  it('returns null for missing key', () => {
    expect(localStorageBackend.get('nonexistent')).toBeNull();
  });

  it('overwrites existing value', () => {
    localStorageBackend.set('key', 'old');
    localStorageBackend.set('key', 'new');
    expect(localStorageBackend.get('key')).toBe('new');
  });

  it('fires single onChange callback on set', () => {
    const calls: [string, unknown][] = [];
    localStorageBackend.onChange((k, v) => calls.push([k, v]));
    localStorageBackend.set('key', { x: 1 });
    expect(calls).toEqual([['key', { x: 1 }]]);
  });

  it('fires all registered onChange callbacks', () => {
    let count = 0;
    localStorageBackend.onChange(() => count++);
    localStorageBackend.onChange(() => count++);
    localStorageBackend.set('k', 'v');
    expect(count).toBe(2);
  });

  it('does not throw with zero callbacks', () => {
    expect(() => localStorageBackend.set('k', 'v')).not.toThrow();
  });

  it('other callbacks still run when one throws', () => {
    let count = 0;
    localStorageBackend.onChange(() => { throw new Error('fail'); });
    localStorageBackend.onChange(() => count++);
    expect(() => localStorageBackend.set('k', 'v')).not.toThrow();
    expect(count).toBe(1);
  });
});

function createMemoryBackend() {
  const store = new Map<string, string>();
  return {
    get<T>(key: string): T | null {
      const raw = store.get(key);
      if (raw === undefined) return null;
      try { return JSON.parse(raw) as T; } catch { return null; }
    },
    set<T>(key: string, value: T): void {
      store.set(key, JSON.stringify(value));
    },
  };
}

describe('createMemoryBackend', () => {
  it('stores and retrieves a value', () => {
    const mem = createMemoryBackend();
    mem.set('key', 42);
    expect(mem.get<number>('key')).toBe(42);
  });

  it('returns null for missing key', () => {
    const mem = createMemoryBackend();
    expect(mem.get('nonexistent')).toBeNull();
  });

  it('isolates storage between instances', () => {
    const a = createMemoryBackend();
    const b = createMemoryBackend();
    a.set('shared', 'from-a');
    expect(b.get('shared')).toBeNull();
  });

  it('overwrites existing value', () => {
    const mem = createMemoryBackend();
    mem.set('key', [1]);
    mem.set('key', [2]);
    expect(mem.get<number[]>('key')).toEqual([2]);
  });
});
