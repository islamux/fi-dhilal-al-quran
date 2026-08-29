import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import { WorkstationShell } from './WorkstationShell';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    replace,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({ id: '2' }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../context/AppStateContext', () => ({
  useAppState: () => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
    mobileSidebarOpen: false,
    setMobileSidebarOpen: vi.fn(),
    juzFilter: null,
    setJuzFilter: vi.fn(),
    typeFilter: 'all',
    setTypeFilter: vi.fn(),
    sidebarTab: 'surahs',
    setSidebarTab: vi.fn(),
    completedSurahs: [],
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function surahCard(id: number): HTMLElement {
  const el = document.getElementById(`surah-card-${id}`);
  if (!el) throw new Error(`surah-card-${id} not found`);
  return el;
}

describe('WorkstationShell', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
  });

  it('renders its children inside the shell', () => {
    renderWithProviders(<WorkstationShell><div>محتوى الاختبار</div></WorkstationShell>);
    expect(screen.getByText('محتوى الاختبار')).toBeInTheDocument();
  });

  it('resolves the selected surah from the route param', () => {
    renderWithProviders(<WorkstationShell>{null}</WorkstationShell>);
    expect(surahCard(2)).toHaveAttribute('aria-selected', 'true');
    expect(surahCard(1)).toHaveAttribute('aria-selected', 'false');
  });

  it('navigates to another surah via router.push', () => {
    renderWithProviders(<WorkstationShell>{null}</WorkstationShell>);
    fireEvent.click(surahCard(1));
    expect(push).toHaveBeenCalledWith('/surah/1');
  });

  it('does not navigate when selecting the already-selected surah', () => {
    renderWithProviders(<WorkstationShell>{null}</WorkstationShell>);
    fireEvent.click(surahCard(2));
    expect(push).not.toHaveBeenCalled();
  });
});
