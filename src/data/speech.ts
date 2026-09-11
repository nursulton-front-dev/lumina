import type { Lang } from '../types';
import raw from './speech-data.json';

/**
 * Скороговорки и темы приходят из speech-data.json — файл ведёт пользователь.
 * Код подстраивается под файл: списки разной длины и неполные языки допустимы.
 */
export interface SpeechData {
  tongueTwisters: Record<Lang, string[]>;
  topics: Record<Lang, string[]>;
}

function asList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function asSection(value: unknown): Record<Lang, string[]> {
  const source =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  return {
    ru: asList(source.ru),
    uz: asList(source.uz),
    en: asList(source.en),
  };
}

export const SPEECH: SpeechData = {
  tongueTwisters: asSection((raw as Record<string, unknown>).tongueTwisters),
  topics: asSection((raw as Record<string, unknown>).topics),
};

/** Если для языка список пуст, берём русский: молчать протокол не должен. */
function withFallback(section: Record<Lang, string[]>, lang: Lang): string[] {
  const list = section[lang];
  return list.length > 0 ? list : section.ru;
}

export function tongueTwistersFor(lang: Lang): string[] {
  return withFallback(SPEECH.tongueTwisters, lang);
}

export function topicsFor(lang: Lang): string[] {
  return withFallback(SPEECH.topics, lang);
}

/** Случайные элементы без повторов. Если запрошено больше, чем есть, вернётся весь список. */
export function pickRandom<T>(
  items: readonly T[],
  count: number,
  rng: () => number = Math.random,
): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    const [item] = pool.splice(Math.min(index, pool.length - 1), 1);
    if (item !== undefined) picked.push(item);
  }
  return picked;
}
