import React, { createContext, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';

export type Locale = 'en' | 'fr';

type Messages = Record<string, string>;

interface I18nContextType {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  messages: Record<Locale, Messages>;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, messages }) => {
  const [locale, setLocaleState] = usePersistentState<Locale>('locale', 'en', {
    storage: 'local',
    namespace: 'app:',
    validate: (x: any): x is Locale => x === 'en' || x === 'fr',
    deserialize: (raw) => {
      if (!raw) return null;
      // Accept raw strings as we previously stored plain values
      if (raw === 'en' || raw === 'fr') return raw as Locale;
      try {
        const parsed = JSON.parse(raw);
        return (parsed === 'en' || parsed === 'fr') ? (parsed as Locale) : null;
      } catch {
        return null;
      }
    },
  });

  const setLocale = (next: Locale) => setLocaleState(next);

  const t = useMemo(() => {
    const current = messages[locale] || {};
    return (key: string, fallback?: string) => current[key] ?? fallback ?? key;
  }, [locale, messages]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};