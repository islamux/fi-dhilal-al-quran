import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const DEVICE_ID = 'test-device-uuid';

vi.mock('../hooks/useDeviceId', () => ({
  getDeviceId: () => DEVICE_ID,
}));

const { syncBackend } = await import('./syncBackend');

describe('syncBackend', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('isSyncPending', () => {
    it('returns false when no sync pending', () => {
      expect(syncBackend.isSyncPending()).toBe(false);
    });

    it('returns true when sync pending flag is set', () => {
      localStorage.setItem('dhilal_sync_pending', 'true');
      expect(syncBackend.isSyncPending()).toBe(true);
    });
  });

  describe('onChange', () => {
    it('registers a callback', () => {
      const cb = vi.fn();
      const unsub = syncBackend.onChange(cb);
      expect(typeof unsub).toBe('function');
    });

    it('unsubscribe removes the callback', () => {
      const cb = vi.fn();
      const unsub = syncBackend.onChange(cb);
      unsub();
    });
  });

  describe('notifyChange', () => {
    it('debounces and calls PUT /api/user-data', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ bookmarks: [] }), { status: 200 }),
      );

      localStorage.setItem('dhilal_bookmarks', '[]');
      localStorage.setItem('dhilal_history', '[]');
      localStorage.setItem('dhilal_completed', '[]');
      localStorage.setItem('dhilal_theme', '"dark"');

      syncBackend.notifyChange();

      await vi.advanceTimersByTimeAsync(2000);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('/api/user-data', expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Device-Id': DEVICE_ID,
        }),
      }));
    });

    it('cancels previous debounce on rapid calls', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ bookmarks: [] }), { status: 200 }),
      );

      syncBackend.notifyChange();
      await vi.advanceTimersByTimeAsync(500);

      syncBackend.notifyChange();
      await vi.advanceTimersByTimeAsync(500);

      syncBackend.notifyChange();
      await vi.advanceTimersByTimeAsync(2000);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('sets sync pending flag on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

      syncBackend.notifyChange();
      await vi.advanceTimersByTimeAsync(1501);
      await vi.advanceTimersByTimeAsync(1001);
      await vi.advanceTimersByTimeAsync(2001);

      expect(localStorage.getItem('dhilal_sync_pending')).toBe('true');
    });

    it('clears sync pending flag on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ bookmarks: [] }), { status: 200 }),
      );

      syncBackend.notifyChange();
      await vi.advanceTimersByTimeAsync(2000);

      expect(localStorage.getItem('dhilal_sync_pending')).toBe('false');
    });
  });

  describe('initFromServer', () => {
    it('fetches and writes data to localStorage', async () => {
      const serverData = {
        bookmarks: [{ id: '1', surahId: 5, addedAt: '2024-01-01' }],
        history: [],
        completed: [1, 2, 3],
        theme: 'light',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(serverData), { status: 200 }),
      );

      await syncBackend.initFromServer();

      expect(JSON.parse(localStorage.getItem('dhilal_bookmarks') || '[]')).toEqual(serverData.bookmarks);
      expect(JSON.parse(localStorage.getItem('dhilal_completed') || '[]')).toEqual(serverData.completed);
      expect(localStorage.getItem('dhilal_theme')).toBe('light');
    });

    it('does nothing when server returns no data', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 404 }),
      );

      localStorage.setItem('dhilal_bookmarks', JSON.stringify([{ id: 'local' }]));

      await syncBackend.initFromServer();

      expect(JSON.parse(localStorage.getItem('dhilal_bookmarks') || '[]')).toEqual([{ id: 'local' }]);
    });

    it('does not overwrite local data when server response is empty', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ bookmarks: null, history: null }), { status: 200 }),
      );

      localStorage.setItem('dhilal_bookmarks', JSON.stringify([{ id: 'local' }]));

      await syncBackend.initFromServer();

      expect(JSON.parse(localStorage.getItem('dhilal_bookmarks') || '[]')).toEqual([{ id: 'local' }]);
    });
  });
});
