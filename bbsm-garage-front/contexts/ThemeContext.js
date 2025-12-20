import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, DEFAULT_THEME } from './themes';

const ThemeContext = createContext({
  activeTheme: DEFAULT_THEME,
  setActiveTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // localStorage'dan direkt oku (SSR için güvenli - lazy initialization)
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const saved = window.localStorage.getItem('activeTheme');
    return (saved && themes[saved]) ? saved : DEFAULT_THEME;
  });

  // Tema değişince CSS değişkenlerini uygula + localStorage'a yaz
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const theme = themes[activeTheme] || themes[DEFAULT_THEME];
    const root = document.documentElement;

    // Genel tema değişkenleri (isteğe bağlı kullanım için)
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    if (activeTheme === 'modern') {
      // Modern (light) tema - screenshot'a yakın değerler
      root.setAttribute('data-theme', 'modern');
      root.style.setProperty('--dark-bg-primary', '#f3f4f6');      // body/bg (arka fonda hafif gri)
      root.style.setProperty('--dark-bg-secondary', '#f3f4f6');    // eski class'lar için
      root.style.setProperty('--dark-bg-tertiary', '#ffffff');     // içerik zeminleri
      root.style.setProperty('--dark-card-bg', '#ffffff');         // kartlar
      root.style.setProperty('--layout-sidebar-bg', '#f3f4f6');    // sidebar
      root.style.setProperty('--layout-nav-bg', '#ffffff');        // navbar
      root.style.setProperty('--dark-text-primary', '#111827');    // ana metin
      root.style.setProperty('--dark-text-secondary', '#4b5563');  // ikincil metin
      root.style.setProperty('--dark-text-muted', '#6b7280');      // muted metin
      root.style.setProperty('--dark-border', 'rgba(15,23,42,0.08)');
      root.style.setProperty('--accent-primary', '#2563eb');       // mavi aksan
    } else {
      // Classic (mevcut dark) tema - globals.css başlangıç değerleri
      root.setAttribute('data-theme', 'classic');
      root.style.setProperty('--dark-bg-primary', '#0f172a');
      root.style.setProperty('--dark-bg-secondary', '#111827');
      root.style.setProperty('--dark-bg-tertiary', '#1f2937');
      root.style.setProperty('--dark-card-bg', '#111827');
      root.style.setProperty('--layout-sidebar-bg', '#111827');
      root.style.setProperty('--layout-nav-bg', '#111827');
      root.style.setProperty('--dark-text-primary', '#e5e7eb');
      root.style.setProperty('--dark-text-secondary', '#cbd5e1');
      root.style.setProperty('--dark-text-muted', '#94a3b8');
      root.style.setProperty('--dark-border', 'rgba(255, 255, 255, 0.07)');
      root.style.setProperty('--accent-primary', '#3b82f6');
    }

    window.localStorage.setItem('activeTheme', activeTheme);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
