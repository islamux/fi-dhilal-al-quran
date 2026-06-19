import { describe, it, expect } from 'vitest';
import { searchTafsir } from './search';

const mockData = {
  1: [
    { startVerse: 1, endVerse: 7, text: 'الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين' },
    { startVerse: 8, endVerse: 15, text: 'إياك نعبد وإياك نستعين اهدنا الصراط المستقيم' },
  ],
  2: [
    { startVerse: 1, endVerse: 5, text: 'الم ذلك الكتاب لا ريب فيه هدى للمتقين' },
  ],
};

const nameMap = new Map<number, string>([
  [1, 'الفاتحة'],
  [2, 'البقرة'],
]);

describe('searchTafsir', () => {
  it('returns empty array for empty query', () => {
    expect(searchTafsir('', mockData, nameMap)).toEqual([]);
  });

  it('returns empty array for whitespace-only query', () => {
    expect(searchTafsir('   ', mockData, nameMap)).toEqual([]);
  });

  it('finds matching sections by word', () => {
    const results = searchTafsir('الحمد', mockData, nameMap);
    expect(results).toHaveLength(1);
    expect(results[0].surahName).toBe('الفاتحة');
  });

  it('finds matches across multiple surahs', () => {
    const results = searchTafsir('الكتاب', mockData, nameMap);
    expect(results).toHaveLength(1);
    expect(results[0].surahId).toBe(2);
  });

  it('returns empty when no match', () => {
    const results = searchTafsir('xyz_not_found', mockData, nameMap);
    expect(results).toHaveLength(0);
  });

  it('sorts by score descending', () => {
    const multiWordData = {
      1: [
        { startVerse: 1, endVerse: 1, text: 'نص عربي' },
        { startVerse: 2, endVerse: 2, text: 'نص عربي آخر' },
      ],
    };
    const results = searchTafsir('عربي', multiWordData, new Map([[1, 'س']]));
    expect(results).toHaveLength(2);
  });

  it('generates excerpt with context around match', () => {
    const longData = {
      1: [
        { startVerse: 1, endVerse: 1, text: 'هذا نص طويل للبحث عن كلمة محددة في النص العربي' },
      ],
    };
    const results = searchTafsir('كلمة', longData, new Map([[1, 'س']]));
    expect(results).toHaveLength(1);
    expect(results[0].excerpt).toContain('كلمة');
  });

  it('resolves surah name from map', () => {
    const results = searchTafsir('الحمد', mockData, nameMap);
    expect(results[0].surahName).toBe('الفاتحة');
  });

  it('falls back to default name when surah not in map', () => {
    const results = searchTafsir('الحمد', mockData, new Map());
    expect(results[0].surahName).toContain('السورة');
  });

  it('caps results at 50', () => {
    const largeData: Record<number, { startVerse: number; endVerse: number; text: string }[]> = {};
    for (let i = 0; i < 60; i++) {
      largeData[i] = [{ startVerse: 1, endVerse: 1, text: 'match' }];
    }
    const results = searchTafsir('match', largeData, new Map());
    expect(results.length).toBeLessThanOrEqual(50);
  });

  it('handles multi-word queries', () => {
    const results = searchTafsir('الحمد رب', mockData, nameMap);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('is case-insensitive for Latin characters', () => {
    const latinData = {
      1: [{ startVerse: 1, endVerse: 1, text: 'Allah is the Most Gracious' }],
    };
    const results = searchTafsir('allah', latinData, new Map([[1, 'س']]));
    expect(results).toHaveLength(1);
  });
});
