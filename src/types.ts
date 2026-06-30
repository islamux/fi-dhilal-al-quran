export interface Surah {
  id: number;
  name: string;
  arName: string;
  type: 'مكية' | 'مدنية';
  versesCount: number;
  juzNumber: number;
  startVerse: number;
  endVerse: number;
  thematicPoints: string[];
}

export interface Bookmark {
  id: string; // "surahId-verseIndex" or "surahId"
  surahId: number;
  verseIndex?: number;
  note?: string;
  addedAt: string;
}

export interface HistoryItem {
  id: string;
  surahId: number;
  surahName: string;
  verseIndex?: number;
  viewedAt: string;
}

export interface TafsirSection {
  startVerse: number;
  endVerse: number;
  text: string;
}
