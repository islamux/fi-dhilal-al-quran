import { useState, useRef } from 'react';
import { TAFSIR_DATA } from '../data/tafsir';
import { SURAHS } from '../data/surahs';

export interface SearchMatch {
  surahId: number;
  surahName: string;
  startVerse: number;
  endVerse: number;
  excerpt: string;
}

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

    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches: { match: SearchMatch; score: number }[] = [];

    for (const [surahIdStr, sections] of Object.entries(TAFSIR_DATA)) {
      const surahId = parseInt(surahIdStr);
      const surahName = surahNameMap.get(surahId) || `السورة ${surahId}`;

      for (const section of sections) {
        const textLower = section.text.toLowerCase();
        let score = 0;

        for (const word of words) {
          if (textLower.includes(word)) score++;
        }

        if (score > 0) {
          const firstIdx = section.text.toLowerCase().indexOf(words[0]);
          const start = Math.max(0, firstIdx - 80);
          const end = Math.min(section.text.length, firstIdx + 200);
          const excerpt = (start > 0 ? '...' : '') +
            section.text.slice(start, end) +
            (end < section.text.length ? '...' : '');

          matches.push({
            match: {
              surahId,
              surahName,
              startVerse: section.startVerse,
              endVerse: section.endVerse,
              excerpt: excerpt.replace(/\n+/g, ' '),
            },
            score,
          });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    setResults(matches.slice(0, 50).map(m => m.match));
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
