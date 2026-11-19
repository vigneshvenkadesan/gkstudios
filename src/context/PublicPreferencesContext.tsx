'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  PublicLocale,
  PublicTheme,
  PUBLIC_PREFERENCE_STORAGE_KEY,
} from '@/src/i18n/translations';

interface PublicPreferencesValue {
  locale: PublicLocale;
  theme: PublicTheme;
  setLocale: (locale: PublicLocale) => void;
  toggleTheme: () => void;
}

const PublicPreferencesContext = createContext<PublicPreferencesValue | null>(null);

function isPreferences(value: unknown): value is { locale?: unknown; theme?: unknown } {
  return typeof value === 'object' && value !== null;
}

function getInitialTheme(): PublicTheme {
  if (typeof document === 'undefined') return 'dark';
  if (document.documentElement.dataset.gkPublicTheme === 'light') return 'light';
  try {
    const saved = window.localStorage.getItem(PUBLIC_PREFERENCE_STORAGE_KEY);
    if (saved) {
      const preferences: unknown = JSON.parse(saved);
      if (isPreferences(preferences) && preferences.theme === 'light') return 'light';
    }
  } catch (error) {
    console.error('Unable to read the saved public theme.', error);
  }
  return 'dark';
}

export function PublicPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<PublicLocale>('en');
  const [theme, setTheme] = useState<PublicTheme>(getInitialTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PUBLIC_PREFERENCE_STORAGE_KEY);
      if (saved) {
        const preferences: unknown = JSON.parse(saved);
        if (isPreferences(preferences)) {
          if (preferences.locale === 'ta' || preferences.locale === 'en') {
            setLocale(preferences.locale);
          }
          if (preferences.theme === 'light' || preferences.theme === 'dark') {
            setTheme(preferences.theme);
          }
        }
      }
    } catch (error) {
      console.error('Unable to restore public website preferences.', error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        PUBLIC_PREFERENCE_STORAGE_KEY,
        JSON.stringify({ locale, theme })
      );
    } catch (error) {
      console.error('Unable to save public website preferences.', error);
    }
  }, [locale, ready, theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.gkPublicTheme = theme;
    return () => {
      delete root.dataset.gkPublicTheme;
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      locale,
      theme,
      setLocale,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [locale, theme]
  );

  return (
    <PublicPreferencesContext.Provider value={value}>
      <div className="public-site" data-theme={theme} lang={locale} suppressHydrationWarning>
        {children}
      </div>
    </PublicPreferencesContext.Provider>
  );
}

export function useOptionalPublicPreferences() {
  return useContext(PublicPreferencesContext);
}

export function usePublicPreferences() {
  const preferences = useOptionalPublicPreferences();
  if (!preferences) {
    throw new Error('Public preferences are only available on the public website.');
  }
  return preferences;
}
