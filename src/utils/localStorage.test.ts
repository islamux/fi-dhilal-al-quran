import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageBackend, createMemoryBackend } from './localStorage';

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
});

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
