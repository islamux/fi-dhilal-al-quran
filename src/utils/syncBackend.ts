import { getDeviceId } from '../hooks/useDeviceId';

const SYNC_DEBOUNCE_MS = 1500;
const MAX_RETRIES = 3;
const SYNC_PENDING_KEY = 'thilal_sync_pending';

function getApiBase(): string {
  return '';
}

async function putUserData(data: {
  bookmarks: unknown[];
  history: unknown[];
  completed: number[];
  theme: string;
}): Promise<boolean> {
  const deviceId = getDeviceId();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${getApiBase()}/api/user-data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }
  return false;
}

async function fetchUserData(): Promise<Record<string, unknown> | null> {
  const deviceId = getDeviceId();
  try {
    const res = await fetch(`${getApiBase()}/api/user-data`, {
      headers: { 'X-Device-Id': deviceId },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function createSyncBackend() {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let callbacks: Array<() => void> = [];

  function notifyChange(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const bookmarks = JSON.parse(localStorage.getItem('thilal_bookmarks') || '[]');
      const history = JSON.parse(localStorage.getItem('thilal_history') || '[]');
      const completed = JSON.parse(localStorage.getItem('thilal_completed') || '[]');
      const theme = localStorage.getItem('thilal_theme') || 'dark';

      const success = await putUserData({ bookmarks, history, completed, theme });
      localStorage.setItem(SYNC_PENDING_KEY, success ? 'false' : 'true');
      callbacks.forEach(cb => cb());
    }, SYNC_DEBOUNCE_MS);
  }

  async function initFromServer(): Promise<void> {
    const serverData = await fetchUserData();
    if (!serverData) return;

    if (serverData.bookmarks) {
      localStorage.setItem('thilal_bookmarks', JSON.stringify(serverData.bookmarks));
    }
    if (serverData.history) {
      localStorage.setItem('thilal_history', JSON.stringify(serverData.history));
    }
    if (serverData.completed) {
      localStorage.setItem('thilal_completed', JSON.stringify(serverData.completed));
    }
    if (serverData.theme) {
      localStorage.setItem('thilal_theme', serverData.theme as string);
    }
  }

  function isSyncPending(): boolean {
    return localStorage.getItem(SYNC_PENDING_KEY) === 'true';
  }

  function onChange(cb: () => void): void {
    callbacks.push(cb);
  }

  return { notifyChange, initFromServer, isSyncPending, onChange };
}

export const syncBackend = createSyncBackend();
