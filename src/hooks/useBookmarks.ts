import { useState, useEffect } from 'react';
import type { Bookmark } from '../types';
import { localStorageBackend } from '../utils/localStorage';

const BOOKMARKS_KEY = 'dhilal_bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() =>
    localStorageBackend.get<Bookmark[]>(BOOKMARKS_KEY) ?? []
  );

  useEffect(() => {
    localStorageBackend.set(BOOKMARKS_KEY, bookmarks);
  }, [bookmarks]);

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
