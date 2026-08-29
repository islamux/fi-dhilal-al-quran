'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { localStorageBackend } from '../utils/localStorage';

const THEME_KEY = 'dhilal_theme';

interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIsDarkMode(localStorageBackend.get<string>(THEME_KEY) !== 'light');
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorageBackend.set(THEME_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, hydrated]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
