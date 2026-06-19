export interface TafsirSection {
  startVerse: number;
  endVerse: number;
  text: string;
}

export function getTafsirText(
  surahId: number,
  data: Record<number, TafsirSection[]>,
  range = 'كاملة'
): string | null {
  const sections = data[surahId];
  if (!sections || sections.length === 0) return null;

  if (range === 'كاملة') {
    return sections.map(s => s.text).join('\n\n');
  }

  const verseNum = parseInt(range);
  if (isNaN(verseNum)) return null;

  const matched = sections.filter(
    s => s.startVerse <= verseNum && s.endVerse >= verseNum
  );
  return matched.length > 0 ? matched.map(s => s.text).join('\n\n') : null;
}
