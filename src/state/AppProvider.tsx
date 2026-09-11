import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Lang, ThemeMode } from '../types';
import {
  detectLang,
  translate,
  translatePlural,
  type TranslationKey,
  type TranslationVars,
} from '../i18n';
import type { PluralBase } from '../i18n/types';
import { ensureSeed, getProfile, initProfile, saveProfile } from '../db/repo';
import { advanceSleepTarget } from '../domain/sleep';
import { toISODate } from '../domain/time';
import { AppContext, type AppContextValue, type AppStatus } from './app-context';

const FALLBACK_LANG: Lang = 'ru';

/** Ставит на <html> data-theme и lang: тема и правила переносов зависят от них. */
function applyTheme(theme: ThemeMode, lang: Lang): void {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  root.dataset.theme = resolved;
  root.lang = lang;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (meta) meta.content = resolved === 'dark' ? '#0f1b2d' : '#f6f2e8';
}

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  // Сиды пишутся отдельно от чтения: внутри useLiveQuery транзакция только на чтение.
  useEffect(() => {
    void ensureSeed();
  }, []);

  const profile = useLiveQuery(async () => (await getProfile()) ?? null, []);

  const status: AppStatus =
    profile === undefined ? 'loading' : profile === null ? 'needs-language' : 'ready';
  const lang = profile?.lang ?? detectLang() ?? FALLBACK_LANG;
  const theme = profile?.theme ?? 'system';

  useEffect(() => {
    applyTheme(theme, lang);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => applyTheme(theme, lang);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme, lang]);

  // Режим сна: цель уезжает на 15 минут раньше каждые два дня, пока не дойдёт до 23:00.
  useEffect(() => {
    if (!profile) return;
    const today = toISODate(new Date());
    const next = advanceSleepTarget(profile.sleepTarget, profile.sleepTargetShiftedOn, today);
    if (next.target === profile.sleepTarget && next.shiftedOn === profile.sleepTargetShiftedOn)
      return;
    void saveProfile({ sleepTarget: next.target, sleepTargetShiftedOn: next.shiftedOn });
  }, [profile]);

  const t = useCallback(
    (key: TranslationKey, vars?: TranslationVars) => translate(lang, key, vars),
    [lang],
  );
  const tp = useCallback(
    (base: PluralBase, count: number) => translatePlural(lang, base, count),
    [lang],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      status,
      lang,
      profile: profile ?? null,
      t,
      tp,
      chooseLang: async (next: Lang) => {
        await initProfile(next);
      },
      setLang: async (next: Lang) => {
        await saveProfile({ lang: next });
      },
      setTheme: async (next: ThemeMode) => {
        await saveProfile({ theme: next });
      },
      updateProfile: async (patch) => {
        await saveProfile(patch);
      },
    }),
    [status, lang, profile, t, tp],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
