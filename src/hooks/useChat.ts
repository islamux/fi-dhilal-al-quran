import { useState, useRef } from 'react';
import { SURAHS } from '../data/surahs';
import { loadTafsirData } from '../data/tafsir-loader';
import { searchTafsir, type SearchMatch } from '../utils/search';

const surahNameMap = new Map<number, string>();
SURAHS.forEach(s => surahNameMap.set(s.id, s.arName));

export function useSearch() {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await loadTafsirData();
      setResults(searchTafsir(query, data, surahNameMap));
    } finally {
      setSearching(false);
    }
  };

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
