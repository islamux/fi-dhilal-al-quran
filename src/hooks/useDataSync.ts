import { useEffect, useState } from 'react';
import { syncBackend } from '../utils/syncBackend';
import { localStorageBackend } from '../utils/localStorage';

export function useDataSync() {
  const [syncPending, setSyncPending] = useState(syncBackend.isSyncPending());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await syncBackend.initFromServer();
      if (cancelled) return;

      const unsubLocal = localStorageBackend.onChange(() => syncBackend.notifyChange());

      const unsubSync = syncBackend.onChange(() => {
        setSyncPending(syncBackend.isSyncPending());
      });

      return () => {
        unsubLocal();
        unsubSync();
      };
    })();
  }, []);

  return { syncPending };
}
