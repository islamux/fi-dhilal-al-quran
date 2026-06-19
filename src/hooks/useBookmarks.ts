import { useState, useEffect } from 'react';
import type { Bookmark } from '../types';
import { localStorageBackend, type StorageBackend } from '../utils/localStorage';

const BOOKMARKS_KEY = 'thilal_bookmarks';

export function useBookmarks(storage: StorageBackend = localStorageBackend) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() =>
    storage.get<Bookmark[]>(BOOKMARKS_KEY) ?? []
  );

  useEffect(() => {
    storage.set(BOOKMARKS_KEY, bookmarks);
  }, [bookmarks, storage]);

  const toggleBookmark = (surahId: number, verseIndex?: number) => {
    const id = verseIndex !== undefined ? `${surahId}-${verseIndex}` : `${surahId}`;
    const already = bookmarks.some(b => b.id === id);
    if (already) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } else {
      const newB: Bookmark = {
        id,
        surahId,
        verseIndex,
        addedAt: new Date().toLocaleDateString('ar-EG')
      };
      setBookmarks(prev => [newB, ...prev]);
    }
  };

  const isBookmarked = (surahId: number, verseIndex?: number) => {
    const id = verseIndex !== undefined ? `${surahId}-${verseIndex}` : `${surahId}`;
    return bookmarks.some(b => b.id === id);
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const clearAll = () => setBookmarks([]);

  return { bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll };
}
