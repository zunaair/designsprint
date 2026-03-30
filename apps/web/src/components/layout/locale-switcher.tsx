'use client';

import { useLocale } from '../../i18n/use-locale';
import { LOCALES, LOCALE_NAMES } from '../../i18n/config';
import type { Locale } from '../../i18n/config';

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  const nextLocale = LOCALES.find((l) => l !== locale) ?? 'en';

  return (
    <button
      onClick={() => setLocale(nextLocale as Locale)}
      title={`Switch to ${LOCALE_NAMES[nextLocale as Locale]}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: '#94a3b8',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '5px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <span style={{ fontSize: 14 }}>🌐</span>
      {LOCALE_NAMES[nextLocale as Locale]}
    </button>
  );
}
