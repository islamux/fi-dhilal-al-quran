export interface TafsirSegment {
  text: string;
  isVerse: boolean;
}

export function splitVerseSegments(text: string): TafsirSegment[] {
  if (!text) return [{ text: '', isVerse: false }];

  const segments: TafsirSegment[] = [];
  const parts = text.split(/(«[^»]*»)/g);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('«') && part.endsWith('»')) {
      segments.push({ text: part, isVerse: true });
    } else {
      const verseMatch = part.match(/.*\(\d+\)/);
      if (verseMatch) {
        const verseEnd = verseMatch[0].length;
        if (verseEnd > 0) {
          segments.push({ text: part.slice(0, verseEnd), isVerse: true });
        }
        const commentary = part.slice(verseEnd);
        if (commentary) {
          segments.push({ text: commentary, isVerse: false });
        }
      } else {
        segments.push({ text: part, isVerse: false });
      }
    }
  }

  return segments;
}

export function formatTafsirParagraphs(text: string | null): string[] {
  if (!text) return [];

  const paragraphs: string[] = [];

  for (const section of text.split('\n\n')) {
    if (!section.trim()) continue;

    const lines = section.split('\n').filter(Boolean);
    let current: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (/^\(\d+\)/.test(line)) {
        if (current.length > 0) {
          current[current.length - 1] += ' ' + line;
        } else {
          current.push(line);
        }
        continue;
      }

      const prevEnd = current.length > 0 ? current[current.length - 1].trim() : '';
      const prevEndsPunct = /[\.\»\!\؟…]\.?$|\.\.$|\(\d+\)$/.test(prevEnd);
      const isNewPara = prevEndsPunct && /^(?:إن\s+|إنه|إنها|إنما|إنَّ|والبدء|ووصفه|هذه|هذا|ذلك|تلك|فإن\s+|فإنَّ|فإذا|ثم\s|لكن|بل\s|قد\s|لقد|أما|فأما|هنا|ومِن\s|وقد\s|ولقد\s|ولكن|وبعد\s|تبدأ|يردد|يبدأ|يقول|يذكر|وكذلك|فهو\s|فهي\s|فهذا|فهذه|انتهى|نزلت|يمضي|يشير|يتحدث|ينتقل|يختم)/.test(line);

      if (isNewPara) {
        paragraphs.push(current.join(' '));
        current = [line];
      } else {
        current.push(line);
      }
    }

    if (current.length > 0) {
      paragraphs.push(current.join(' '));
    }
  }

  return paragraphs.length > 0 ? paragraphs : [text.replace(/\n/g, ' ')];
}
