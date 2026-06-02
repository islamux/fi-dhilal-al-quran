export interface Surah {
  id: number;
  name: string;
  arName: string;
  type: 'مكية' | 'مدنية';
  versesCount: number;
  juzNumber: number;
  startVerse: number;
  endVerse: number;
  shortOverview: string;
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

export interface TafsirResponse {
  surahId: number;
  surahName: string;
  verseRange: string;
  tafsir: string;
  coreConcept: string;
  spiritualReflection: string;
  linguisticSecrets: string[];
}

export interface SearchResult {
  surahId: number;
  surahName: string;
  text: string;
  verseNumber?: number;
  relevance: number;
}
