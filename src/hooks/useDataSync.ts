import { useEffect, useState } from 'react';
import { syncBackend } from '../utils/syncBackend';
import { localStorageBackend } from '../utils/localStorage';

export function useDataSync() {
  const [syncPending, setSyncPending] = useState(syncBackend.isSyncPending());

  useEffect(() => {
    syncBackend.initFromServer();

    localStorageBackend.onChange(() => syncBackend.notifyChange());

    const unsub = syncBackend.onChange(() => {
      setSyncPending(syncBackend.isSyncPending());
    });

    return () => unsub();
  }, []);

  return { syncPending };
}
