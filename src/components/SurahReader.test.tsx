import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../context/ThemeContext';
import { SurahReader } from './SurahReader';
import type { Surah } from '../types';

const push = vi.fn();
const replace = vi.fn();

let currentSearch = 'tab=overview';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    replace,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

vi.mock('../context/AppStateContext', () => ({
  useAppState: () => ({
    setMobileSidebarOpen: vi.fn(),
    toggleBookmark: vi.fn(),
    isBookmarked: vi.fn(() => false),
    toggleComplete: vi.fn(),
    completedSurahs: [],
    searchInput: '',
    setSearchInput: vi.fn(),
    results: [],
    searching: false,
    bottomRef: { current: null },
    handleSearch: vi.fn(),
    clearResults: vi.fn(),
    bookmarks: [],
    readingHistory: [],
    clearAll: vi.fn(),
    removeBookmark: vi.fn(),
  }),
}));

const surah: Surah = {
  id: 2,
  name: 'al-baqarah',
  arName: 'البقرة',
  type: 'مدنية',
  versesCount: 286,
  juzNumber: 1,
  startVerse: 1,
  endVerse: 286,
  thematicPoints: [],
};

function renderReader() {
  return render(
    <ThemeProvider>
      <SurahReader surah={surah} initialTafsirText="نص التفسير التجريبي" />
    </ThemeProvider>,
  );
}

describe('SurahReader', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    currentSearch = 'tab=overview';
  });

  it('renders the reader chrome: banner, and all four tabs', async () => {
    renderReader();
    expect(screen.getByText('البقرة')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'نظرة عامة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'استعراض الآيَات' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'بحث في الظلال' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'سجل المُدارسة' })).toBeInTheDocument();
    await screen.findByText('نص التفسير التجريبي');
  });

  it('switching to the verses tab updates the tab query param', async () => {
    const user = userEvent.setup();
    renderReader();
    await user.click(screen.getByRole('button', { name: 'استعراض الآيَات' }));
    expect(replace).toHaveBeenCalledWith('?tab=verses');
  });

  it('renders the chat tab when ?tab=chat is present', async () => {
    currentSearch = 'tab=chat';
    renderReader();
    expect(await screen.findByText('أو اختر من الاستعلامات السريعة الآتية:')).toBeInTheDocument();
  });
});
