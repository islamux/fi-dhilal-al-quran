import { useState, useRef, useCallback } from 'react';
import { TAFSIR_DATA } from '../data/tafsir';
import { SURAHS } from '../data/surahs';
import { searchTafsir, type SearchMatch } from '../utils/search';

const surahNameMap = new Map<number, string>();
SURAHS.forEach(s => surahNameMap.set(s.id, s.arName));

export function useSearch() {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      setResults(searchTafsir(query, TAFSIR_DATA, surahNameMap));
      setSearching(false);
    }, 50);
  }, []);

  const clearResults = () => {
    setResults([]);
    setSearchInput('');
  };

  return {
    searchInput,
    setSearchInput,
    results,
    searching,
    bottomRef,
    handleSearch,
    clearResults,
  };
}

export type { SearchMatch } from '../utils/search';
