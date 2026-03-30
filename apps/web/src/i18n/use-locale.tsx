'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { Locale } from './config';
import { DEFAULT_LOCALE, getMessages, isRtl } from './config';
import en from './messages/en.json';

type Messages = typeof en;

interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
  isRtl: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  messages: getMessages(DEFAULT_LOCALE),
  isRtl: false,
  setLocale: () => {},
  t: (key: string) => key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    return (localStorage.getItem('ds-locale') as Locale) ?? DEFAULT_LOCALE;
  });

  const messages = getMessages(locale);
  const rtl = isRtl(locale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ds-locale', newLocale);
      document.documentElement.lang = newLocale;
      document.documentElement.dir = isRtl(newLocale) ? 'rtl' : 'ltr';
    }
  }, []);

  /** Get a nested translation by dot-separated key */
  const t = useCallback((key: string): string => {
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- traversing dynamic JSON
    let value: any = messages;
    for (const part of parts) {
      value = value?.[part];
    }
    return typeof value === 'string' ? value : key;
  }, [messages]);

  return (
    <LocaleContext.Provider value={{ locale, messages, isRtl: rtl, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
