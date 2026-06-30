import { useState, useRef } from 'react';
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

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    setResults(searchTafsir(query, TAFSIR_DATA, surahNameMap));
    setSearching(false);
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
