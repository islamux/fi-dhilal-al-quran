import { useCallback, useEffect, useState } from 'react';
import { localStorageBackend } from '../utils/localStorage';

export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorageBackend.get<T>(key);
    if (stored !== null) setValue(stored);
    setHydrated(true);
  }, [key]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev: T) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next));
  }, []);

  useEffect(() => {
    if (hydrated) localStorageBackend.set(key, value);
  }, [key, value, hydrated]);

  return [value, set, hydrated] as const;
}
