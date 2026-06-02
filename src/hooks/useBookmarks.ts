import { useState, useEffect } from 'react';
import type { Bookmark } from '../types';

const BOOKMARKS_KEY = 'thilal_bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  const persist = (next: Bookmark[]) => {
    setBookmarks(next);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  };

  const toggleBookmark = (surahId: number, verseIndex?: number) => {
    const id = verseIndex !== undefined ? `${surahId}-${verseIndex}` : `${surahId}`;
    const already = bookmarks.some(b => b.id === id);
    if (already) {
      persist(bookmarks.filter(b => b.id !== id));
    } else {
      const newB: Bookmark = {
        id,
        surahId,
        verseIndex,
        addedAt: new Date().toLocaleDateString('ar-EG')
      };
      persist([newB, ...bookmarks]);
    }
  };

  const isBookmarked = (surahId: number, verseIndex?: number) => {
    const id = verseIndex !== undefined ? `${surahId}-${verseIndex}` : `${surahId}`;
    return bookmarks.some(b => b.id === id);
  };

  const removeBookmark = (id: string) => {
    persist(bookmarks.filter(b => b.id !== id));
  };

  const clearAll = () => persist([]);

  return { bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll };
}
