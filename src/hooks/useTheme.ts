import { useState, useEffect } from 'react';

const THEME_KEY = 'thilal_theme';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) setIsDarkMode(saved === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  return { isDarkMode, toggleTheme };
}
