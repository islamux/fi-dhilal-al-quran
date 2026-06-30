import { describe, it, expect } from 'vitest';
import { toArabicNumerals } from '.';

describe('toArabicNumerals', () => {
  it('converts 0 to ٠', () => {
    expect(toArabicNumerals(0)).toBe('٠');
  });

  it('converts single digit', () => {
    expect(toArabicNumerals(5)).toBe('٥');
  });

  it('converts multiple digits', () => {
    expect(toArabicNumerals(114)).toBe('١١٤');
  });

  it('converts 1 to ١', () => {
    expect(toArabicNumerals(1)).toBe('١');
  });

  it('converts 10 to ١٠', () => {
    expect(toArabicNumerals(10)).toBe('١٠');
  });
});
