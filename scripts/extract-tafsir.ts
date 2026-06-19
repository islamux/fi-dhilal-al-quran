import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

interface RawSection {
  surahId: number;
  surahName: string;
  startVerse: number;
  endVerse: number;
  text: string;
}

const SRC_DIR = new URL('../fi-thila-al-quran-word-src', import.meta.url).pathname;
const OUT_FILE = new URL('../src/data/tafsir.ts', import.meta.url).pathname;

const SECTION_RE = /\[سورة\s+([^(]+?)\s*\((\d+)\)\s*:\s*الآيات\s+(\d+)\s+إلى\s+(\d+)\]/;
const PAGE_REF_RE = /^\(\d+\/\d+\)\s*$/;
const VOL_HEADER_RE = /^في ظلال القرآن.*ص\s*:/;
const INDEX_ENTRY_RE = /^\s*\d+\s*[-–—]\s*سورة/;
const BOOK_END_RE = /^انتهى بحمد/;
const FOOTNOTE_SEP_RE = /^_{5,}/;
const VERSE_LINE_RE = /^الآيات من \d+/;
const JUZ_HEADER_RE = /^الجزء\s+/;

const allSections: RawSection[] = [];
let currentSection: RawSection | null = null;
let bookEnded = false;

for (let i = 1; i <= 22; i++) {
  const padded = String(i).padStart(3, '0');
  const filePath = `${SRC_DIR}/فى ظلال القرآن موافقا للمطبوع ${padded}.doc`;

  let text: string;
  try {
    text = execSync(`catdoc -d utf-8 "${filePath}"`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      console.error('catdoc not found. Install it with: apt-get install catdoc (Linux) or brew install catdoc (macOS)');
      process.exit(1);
    }
    throw e;
  }
  const lines = text.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (bookEnded) continue;
    if (!line.trim()) continue;

    // Skip non-content lines
    if (BOOK_END_RE.test(line)) { bookEnded = true; continue; }
    if (PAGE_REF_RE.test(line)) continue;
    if (VOL_HEADER_RE.test(line)) continue;
    if (INDEX_ENTRY_RE.test(line)) continue;
    if (FOOTNOTE_SEP_RE.test(line)) continue;
    if (VERSE_LINE_RE.test(line)) continue;
    if (JUZ_HEADER_RE.test(line)) continue;

    const match = line.match(SECTION_RE);
    if (match) {
      if (currentSection && currentSection.text.trim()) {
        allSections.push(currentSection);
      }
      currentSection = {
        surahId: parseInt(match[2]),
        surahName: match[1].trim(),
        startVerse: parseInt(match[3]),
        endVerse: parseInt(match[4]),
        text: '',
      };
      continue;
    }

    if (currentSection) {
      currentSection.text += line + '\n';
    }
  }
}

if (currentSection && currentSection.text.trim()) {
  allSections.push(currentSection);
}

// Deduplicate by surahId + verse range
const tafsirMap = new Map<number, { sections: { startVerse: number; endVerse: number; text: string }[] }>();

for (const section of allSections) {
  if (!tafsirMap.has(section.surahId)) {
    tafsirMap.set(section.surahId, { sections: [] });
  }
  const entry = tafsirMap.get(section.surahId)!;
  const exists = entry.sections.some(
    s => s.startVerse === section.startVerse && s.endVerse === section.endVerse
  );
  if (!exists) {
    entry.sections.push({
      startVerse: section.startVerse,
      endVerse: section.endVerse,
      text: section.text.trim(),
    });
  }
}

const sortedIds = [...tafsirMap.keys()].sort((a, b) => a - b);

let output = `// Auto-generated from doc files. Do not edit manually.\n`;
output += `// Generated at: ${new Date().toISOString()}\n`;
output += `// Sections count: ${allSections.length}, Surahs: ${sortedIds.length}\n\n`;

output += `export interface TafsirSection {\n  startVerse: number;\n  endVerse: number;\n  text: string;\n}\n\n`;

output += `export const TAFSIR_DATA: Record<number, TafsirSection[]> = {\n`;

for (const id of sortedIds) {
  const entry = tafsirMap.get(id)!;
  output += `  ${id}: [\n`;
  for (const section of entry.sections) {
    output += `    { startVerse: ${section.startVerse}, endVerse: ${section.endVerse}, text: ${JSON.stringify(section.text.trim())} },\n`;
  }
  output += `  ],\n`;
}

output += `};\n\n`;
output += `export const SURAHS_WITH_TAFSIR = new Set([${sortedIds.join(', ')}]);\n`;

writeFileSync(OUT_FILE, output, 'utf-8');
console.log(`Done. Written ${sortedIds.length} surahs (${allSections.length} sections) to ${OUT_FILE}`);
const sizeKb = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
console.log(`File size: ${sizeKb} KB`);
