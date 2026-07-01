import { useEffect, useState } from 'react';
import { syncBackend } from '../utils/syncBackend';

export function useDataSync() {
  const [syncPending, setSyncPending] = useState(syncBackend.isSyncPending());

  useEffect(() => {
    syncBackend.initFromServer();

    const unsub = syncBackend.onChange(() => {
      setSyncPending(syncBackend.isSyncPending());
    });

    return () => unsub();
  }, []);

  return { syncPending };
}
