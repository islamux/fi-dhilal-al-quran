export interface SearchMatch {
  surahId: number;
  surahName: string;
  startVerse: number;
  endVerse: number;
  excerpt: string;
  score: number;
}

interface RawSection {
  startVerse: number;
  endVerse: number;
  text: string;
}

export function searchTafsir(
  query: string,
  data: Record<number, RawSection[]>,
  nameMap: Map<number, string>
): SearchMatch[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const matches: SearchMatch[] = [];

  for (const [surahIdStr, sections] of Object.entries(data)) {
    const surahId = parseInt(surahIdStr);
    const surahName = nameMap.get(surahId) || `السورة ${surahId}`;

    for (const section of sections) {
      const textLower = section.text.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (textLower.includes(word)) score++;
      }

      if (score === 0) continue;

      const firstIdx = section.text.toLowerCase().indexOf(words[0]);
      const start = Math.max(0, firstIdx - 80);
      const end = Math.min(section.text.length, firstIdx + 200);
      const excerpt = (start > 0 ? '...' : '') +
        section.text.slice(start, end) +
        (end < section.text.length ? '...' : '');

      matches.push({
        surahId,
        surahName,
        startVerse: section.startVerse,
        endVerse: section.endVerse,
        excerpt: excerpt.replace(/\n+/g, ' '),
        score,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 50);
}
