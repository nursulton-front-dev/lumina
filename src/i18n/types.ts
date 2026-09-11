import type { ru } from './ru';
import type { exercisesRu } from './exercises.ru';

/** Ключи основного словаря интерфейса. */
export type CoreKey = keyof typeof ru;

/** Ключи словаря упражнений и подсказок. */
export type ExerciseKey = keyof typeof exercisesRu;

/** Все допустимые ключи перевода. Русские словари задают список. */
export type TranslationKey = CoreKey | ExerciseKey;

/** Словарь интерфейса обязан покрывать все ключи — иначе сборка падает. */
export type Dictionary = Record<CoreKey, string>;

export type ExerciseDictionary = Record<ExerciseKey, string>;

export type FullDictionary = Record<TranslationKey, string>;

/** Ключи, у которых есть формы множественного числа: base.one / base.few / base.many */
export type PluralBase =
  | 'day'
  | 'count.pullup'
  | 'count.pushup'
  | 'count.legRaise'
  | 'count.cm'
  | 'count.second'
  | 'count.digit'
  | 'count.filler'
  | 'count.task'
  | 'count.contest'
  | 'count.hour'
  | 'count.test';
