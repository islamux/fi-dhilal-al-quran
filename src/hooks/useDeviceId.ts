import { useState } from 'react';
import { localStorageBackend } from '../utils/localStorage';

const DEVICE_ID_KEY = 'dhilal_device_id';

export function getDeviceId(): string {
  const existing = localStorageBackend.get<string>(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorageBackend.set(DEVICE_ID_KEY, id);
  return id;
}

export function useDeviceId(): string {
  const [deviceId] = useState(getDeviceId);
  return deviceId;
}
