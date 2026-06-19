import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../context/ThemeContext';
import { SectionSelector } from './SectionSelector';
import type { Surah } from '../types';

const mockSurah: Surah = {
  id: 2,
  name: 'Al-Baqarah',
  arName: 'البقرة',
  versesCount: 286,
  type: 'مدنية',
  juzNumber: 1,
  startVerse: 1,
  endVerse: 286,
  shortOverview: '',
  thematicPoints: [],
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('SectionSelector', () => {
  it('renders the label', () => {
    renderWithTheme(
      <SectionSelector
        verseRangeValue="كاملة"
        setVerseRangeValue={vi.fn()}
        selectedSurah={mockSurah}
        fetchTafsir={vi.fn()}
      />
    );
    expect(screen.getByText('نطاق البحث بالآيات:')).toBeInTheDocument();
  });

  it('renders default range buttons for surah with >200 verses', () => {
    renderWithTheme(
      <SectionSelector
        verseRangeValue="كاملة"
        setVerseRangeValue={vi.fn()}
        selectedSurah={mockSurah}
        fetchTafsir={vi.fn()}
      />
    );
    expect(screen.getByText('كامل السورة')).toBeInTheDocument();
    expect(screen.getByText('١ - ٥٠')).toBeInTheDocument();
    expect(screen.getByText('٢٠١ - ٢٥٠')).toBeInTheDocument();
    expect(screen.getByText('٣٠١ - ٢٨٦')).toBeInTheDocument();
  });

  it('renders only default ranges for surah with <=200 verses', () => {
    const shortSurah: Surah = { ...mockSurah, versesCount: 150 };
    renderWithTheme(
      <SectionSelector
        verseRangeValue="كاملة"
        setVerseRangeValue={vi.fn()}
        selectedSurah={shortSurah}
        fetchTafsir={vi.fn()}
      />
    );
    expect(screen.getByText('كامل السورة')).toBeInTheDocument();
    expect(screen.getByText('١ - ٥٠')).toBeInTheDocument();
    expect(screen.queryByText('٢٠١ - ٢٥٠')).not.toBeInTheDocument();
    expect(screen.queryByText('٣٠١ - ٢٨٦')).not.toBeInTheDocument();
  });

  it('highlights the active range button', () => {
    renderWithTheme(
      <SectionSelector
        verseRangeValue="1-50"
        setVerseRangeValue={vi.fn()}
        selectedSurah={mockSurah}
        fetchTafsir={vi.fn()}
      />
    );
    const button = screen.getByText('١ - ٥٠');
    expect(button.className).toContain('bg-gilded-gold');
  });

  it('calls setVerseRangeValue and fetchTafsir on click', async () => {
    const user = userEvent.setup();
    const setRange = vi.fn();
    const fetchTafsir = vi.fn();
    renderWithTheme(
      <SectionSelector
        verseRangeValue="كاملة"
        setVerseRangeValue={setRange}
        selectedSurah={mockSurah}
        fetchTafsir={fetchTafsir}
      />
    );
    await user.click(screen.getByText('١ - ٥٠'));
    expect(setRange).toHaveBeenCalledWith('1-50');
    expect(fetchTafsir).toHaveBeenCalledWith(mockSurah, '1-50');
  });
});
