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

  const parts = range.split('-');
  const startVerse = parseInt(parts[0]);
  const endVerse = parts[1] ? parseInt(parts[1]) : startVerse;
  if (isNaN(startVerse)) return null;

  const matched = sections.filter(
    s => s.startVerse <= endVerse && s.endVerse >= startVerse
  );
  return matched.length > 0 ? matched.map(s => s.text).join('\n\n') : null;
}
