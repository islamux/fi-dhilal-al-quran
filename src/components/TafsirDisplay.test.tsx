import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import { TafsirDisplay } from './TafsirDisplay';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('TafsirDisplay', () => {
  it('renders the Tafsir al-Qutb header', () => {
    renderWithTheme(
      <TafsirDisplay tafsirText="نص التفسير" verseRangeValue="كاملة" />
    );
    expect(screen.getByText('Tafsir al-Qutb')).toBeInTheDocument();
  });

  it('renders the verse range badge with start verse', () => {
    renderWithTheme(
      <TafsirDisplay tafsirText="نص" verseRangeValue="1-50" />
    );
    expect(screen.getByText(/AYAH/)).toBeInTheDocument();
  });

  it('formats text into paragraphs via formatTafsirParagraphs', () => {
    renderWithTheme(
      <TafsirDisplay tafsirText={'فقرة أولى.\n\nفقرة ثانية'} verseRangeValue="1-50" />
    );
    expect(screen.getByText('فقرة أولى.')).toBeInTheDocument();
    expect(screen.getByText('فقرة ثانية')).toBeInTheDocument();
  });

  it('joins wrapped lines within a paragraph', () => {
    renderWithTheme(
      <TafsirDisplay tafsirText={'فقرة أولى\nمستمرة'} verseRangeValue="1-50" />
    );
    expect(screen.getByText('فقرة أولى مستمرة')).toBeInTheDocument();
  });
});
