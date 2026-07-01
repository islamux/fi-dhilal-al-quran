import type { TafsirSection } from '../types';

let dataPromise: Promise<Record<number, TafsirSection[]>> | null = null;

export function loadTafsirData(): Promise<Record<number, TafsirSection[]>> {
  if (!dataPromise) {
    dataPromise = import('./tafsir').then(m => m.TAFSIR_DATA)
      .catch(err => {
        dataPromise = null;
        throw err;
      });
  }
  return dataPromise;
}
