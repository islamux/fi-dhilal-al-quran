import { describe, it, expect } from 'vitest';
import { getTafsirText } from './tafsir-data';

const mockData = {
  1: [
    { startVerse: 1, endVerse: 7, text: 'نص الفاتحة الجزء الأول' },
    { startVerse: 8, endVerse: 15, text: 'نص الفاتحة الجزء الثاني' },
  ],
  2: [
    { startVerse: 1, endVerse: 5, text: 'نص البقرة' },
  ],
};

describe('getTafsirText', () => {
  it('returns null for missing surah', () => {
    expect(getTafsirText(999, mockData)).toBeNull();
  });

  it('returns full concatenated text for default range', () => {
    const result = getTafsirText(1, mockData);
    expect(result).toBe('نص الفاتحة الجزء الأول\n\nنص الفاتحة الجزء الثاني');
  });

  it('returns full concatenated text for explicit كاملة', () => {
    const result = getTafsirText(1, mockData, 'كاملة');
    expect(result).toBe('نص الفاتحة الجزء الأول\n\nنص الفاتحة الجزء الثاني');
  });

  it('filters sections by verse number', () => {
    const result = getTafsirText(1, mockData, '3');
    expect(result).toBe('نص الفاتحة الجزء الأول');
  });

  it('returns null when verse number out of range', () => {
    const result = getTafsirText(1, mockData, '999');
    expect(result).toBeNull();
  });

  it('returns null for NaN range', () => {
    const result = getTafsirText(1, mockData, 'not-a-number');
    expect(result).toBeNull();
  });

  it('returns null for empty data entry', () => {
    const result = getTafsirText(3, { 3: [] });
    expect(result).toBeNull();
  });

  it('returns single section text when only one matches', () => {
    const result = getTafsirText(2, mockData, '2');
    expect(result).toBe('نص البقرة');
  });
});
