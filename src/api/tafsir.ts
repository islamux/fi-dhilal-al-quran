import type { Surah, TafsirResponse } from '../types';

export async function fetchTafsir(surah: Surah, range = 'كاملة'): Promise<TafsirResponse> {
  const res = await fetch('/api/tafsir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      surahId: surah.id,
      surahName: surah.arName,
      verseRange: range
    })
  });
  if (!res.ok) throw new Error('API server returned error');
  return res.json();
}
