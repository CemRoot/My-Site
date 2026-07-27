/**
 * Minimal EN/TR i18n for the editorial redesign.
 *
 * The design prototype toggled language by swapping `innerHTML` from `data-tr`
 * attributes — an XSS surface and unreactable. Here the language lives in
 * React state; components declare copy as `{ en, tr }` pairs and resolve them
 * through `t()`. No i18n library: two locales, one page of copy.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'tr';

/** A translatable pair. Sections keep copy colocated with markup. */
export interface Tr {
  en: string;
  tr: string;
}

interface I18nValue {
  lang: Lang;
  /** Resolve a pair against the active language. */
  t: (pair: Tr) => string;
  toggle: () => void;
}

const STORAGE_KEY = 'site-lang';

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  t: (pair) => pair.en,
  toggle: () => {},
});

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readStoredLang);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'en' ? 'tr' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode / quota — language simply won't persist.
      }
      return next;
    });
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, t: (pair) => pair[lang], toggle }),
    [lang, toggle],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
