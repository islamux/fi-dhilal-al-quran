import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorageState } from './useLocalStorageState';

beforeEach(() => localStorage.clear());

describe('useLocalStorageState', () => {
  it('returns default value before hydration', () => {
    const { result } = renderHook(() => useLocalStorageState<number[]>('k', []));
    expect(result.current[0]).toEqual([]);
  });

  it('hydrates from localStorage after mount', () => {
    localStorage.setItem('k', JSON.stringify([1, 2, 3]));
    const { result } = renderHook(() => useLocalStorageState<number[]>('k', []));
    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('does not overwrite stored data with the default before hydration', () => {
    localStorage.setItem('k', JSON.stringify([1, 2, 3]));
    renderHook(() => useLocalStorageState<number[]>('k', []));
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual([1, 2, 3]);
  });

  it('persists updates to localStorage after hydration', () => {
    const { result } = renderHook(() => useLocalStorageState<number[]>('k', []));
    act(() => result.current[1]([7]));
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual([7]);
    expect(result.current[0]).toEqual([7]);
  });

  it('supports functional updates', () => {
    localStorage.setItem('k', JSON.stringify([1]));
    const { result } = renderHook(() => useLocalStorageState<number[]>('k', []));
    act(() => result.current[1](prev => [...prev, 2]));
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual([1, 2]);
  });

  it('sets hydrated flag to true after mount', () => {
    const { result } = renderHook(() => useLocalStorageState<number[]>('k', []));
    expect(result.current[2]).toBe(true);
  });
});
