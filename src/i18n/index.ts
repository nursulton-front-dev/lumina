import type { Lang } from '../types';
import { ru } from './ru';
import { uz } from './uz';
import { en } from './en';
import { exercisesRu } from './exercises.ru';
import { exercisesUz } from './exercises.uz';
import { exercisesEn } from './exercises.en';
import type { Dictionary, FullDictionary, PluralBase, TranslationKey } from './types';

export type { Dictionary, FullDictionary, PluralBase, TranslationKey };

export const LANGS: readonly Lang[] = ['ru', 'uz', 'en'] as const;

/** Интерфейс и упражнения лежат в разных файлах, но снаружи это один словарь. */
export const dictionaries: Record<Lang, FullDictionary> = {
  ru: { ...ru, ...exercisesRu },
  uz: { ...uz, ...exercisesUz },
  en: { ...en, ...exercisesEn },
};

export type TranslationVars = Record<string, string | number>;

const PLACEHOLDER = /\{(\w+)\}/g;

/** Подставляет {переменные} в строку перевода. */
export function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export function translate(lang: Lang, key: TranslationKey, vars?: TranslationVars): string {
  return interpolate(dictionaries[lang][key], vars);
}

/** Форма множественного числа по правилам языка: one / few / many. */
export function pluralForm(lang: Lang, count: number): 'one' | 'few' | 'many' {
  const rule = new Intl.PluralRules(lang === 'uz' ? 'uz-Latn' : lang).select(count);
  if (rule === 'one') return 'one';
  if (rule === 'few') return 'few';
  return 'many';
}

export function translatePlural(lang: Lang, base: PluralBase, count: number): string {
  const key = `${base}.${pluralForm(lang, count)}` as TranslationKey;
  return interpolate(dictionaries[lang][key], { n: count });
}

/** Язык по настройкам браузера, если пользователь ещё не выбирал. */
export function detectLang(): Lang | null {
  if (typeof navigator === 'undefined') return null;
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = tag.slice(0, 2).toLowerCase();
    if (code === 'ru' || code === 'uz' || code === 'en') return code;
  }
  return null;
}
