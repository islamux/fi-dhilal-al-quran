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
