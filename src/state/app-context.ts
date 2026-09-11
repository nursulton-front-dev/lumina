import { createContext, useContext } from 'react';
import type { Lang, Profile, ThemeMode } from '../types';
import type { TranslationKey, TranslationVars } from '../i18n';
import type { PluralBase } from '../i18n/types';

export type AppStatus = 'loading' | 'needs-language' | 'ready';

export interface AppContextValue {
  status: AppStatus;
  lang: Lang;
  profile: Profile | null;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  tp: (base: PluralBase, count: number) => string;
  chooseLang: (lang: Lang) => Promise<void>;
  setLang: (lang: Lang) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp вызван вне AppProvider');
  return value;
}

/** Короткий доступ к переводу там, где остальной контекст не нужен. */
export function useT(): AppContextValue['t'] {
  return useApp().t;
}
