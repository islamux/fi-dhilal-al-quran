import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../context/ThemeContext';
import { QuickSearch } from './QuickSearch';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('QuickSearch', () => {
  it('renders the hint text', () => {
    renderWithTheme(<QuickSearch onSelect={vi.fn()} />);
    expect(screen.getByText('أو اختر من الاستعلامات السريعة الآتية:')).toBeInTheDocument();
  });

  it('renders all quick search query buttons', () => {
    renderWithTheme(<QuickSearch onSelect={vi.fn()} />);
    expect(screen.getByText('التوحيد')).toBeInTheDocument();
    expect(screen.getByText('الربا')).toBeInTheDocument();
    expect(screen.getByText('الجهاد')).toBeInTheDocument();
    expect(screen.getByText('النفس')).toBeInTheDocument();
    expect(screen.getByText('الإيمان')).toBeInTheDocument();
    expect(screen.getByText('الموت')).toBeInTheDocument();
    expect(screen.getByText('السماء')).toBeInTheDocument();
    expect(screen.getByText('النار')).toBeInTheDocument();
    expect(screen.getByText('التقوى')).toBeInTheDocument();
    expect(screen.getByText('الصبر')).toBeInTheDocument();
  });

  it('calls onSelect with the query when a button is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithTheme(<QuickSearch onSelect={onSelect} />);
    await user.click(screen.getByText('التوحيد'));
    expect(onSelect).toHaveBeenCalledWith('التوحيد');
  });

  it('sets aria-label on each button', () => {
    renderWithTheme(<QuickSearch onSelect={vi.fn()} />);
    expect(screen.getByLabelText('ابحث عن: التوحيد')).toBeInTheDocument();
    expect(screen.getByLabelText('ابحث عن: الربا')).toBeInTheDocument();
  });

  it('renders 10 buttons', () => {
    renderWithTheme(<QuickSearch onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
  });
});
