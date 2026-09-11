import { daysBetween } from './time';

/** Уровень работы на турнике выбирается по последнему замеру максимума. */
export type PullupLevel = 'beginner' | 'intermediate' | 'advanced';

export function pullupLevel(max: number): PullupLevel {
  if (max >= 10) return 'advanced';
  if (max >= 5) return 'intermediate';
  return 'beginner';
}

/** Рабочий подход считается от максимума: 60–70 процентов, но не меньше одного повторения. */
export function workingReps(max: number, share = 0.65): number {
  return Math.max(1, Math.round(max * share));
}

export const SEASON_WEEKS = 4;

/** Номер недели в четырёхнедельном сезоне: 1…4. Четвёртая — разгрузочная. */
export function seasonWeek(seasonStart: string, date: string): number {
  const days = Math.max(0, daysBetween(seasonStart, date));
  return (Math.floor(days / 7) % SEASON_WEEKS) + 1;
}

export function isDeloadWeek(seasonStart: string, date: string): boolean {
  return seasonWeek(seasonStart, date) === SEASON_WEEKS;
}

/** До разгрузочной недели осталось столько дней. Ноль — она уже идёт. */
export function daysUntilDeload(seasonStart: string, date: string): number {
  const days = Math.max(0, daysBetween(seasonStart, date));
  const dayInSeason = days % (SEASON_WEEKS * 7);
  const deloadStart = (SEASON_WEEKS - 1) * 7;
  return Math.max(0, deloadStart - dayInSeason);
}

/** Разгрузка срезает объём на 40 процентов. */
export const DELOAD_FACTOR = 0.6;

/** Первые четыре недели — не больше 100 приземлений в неделю, дальше 140. */
export function landingsBudget(weeksTrained: number): number {
  return weeksTrained < 4 ? 100 : 140;
}

export interface Adjustment {
  /** Сколько раз подряд подход отмечен как невыполненный. */
  failStreak: number;
  /** Множитель нагрузки: 1 — норма, 0.9 — после двух провалов подряд. */
  factor: number;
}

export const NEUTRAL_ADJUSTMENT: Adjustment = { failStreak: 0, factor: 1 };

const MIN_FACTOR = 0.5;

/**
 * Два невыполненных подхода подряд снижают нагрузку на 10 процентов.
 * Выполненный подход обнуляет счётчик, но не возвращает нагрузку назад сам —
 * она растёт только через новый замер максимума.
 */
export function nextAdjustment(previous: Adjustment, failed: boolean): Adjustment {
  if (!failed) return { failStreak: 0, factor: previous.factor };
  const failStreak = previous.failStreak + 1;
  if (failStreak < 2) return { failStreak, factor: previous.factor };
  return {
    failStreak: 0,
    factor: Math.max(MIN_FACTOR, Math.round(previous.factor * 0.9 * 100) / 100),
  };
}

/** Итоговое число повторений с учётом разгрузки и снижения после провалов. */
export function scaleReps(reps: number, factor: number, deload: boolean): number {
  const scaled = reps * factor * (deload ? DELOAD_FACTOR : 1);
  return Math.max(1, Math.round(scaled));
}

/** Число подходов на разгрузочной неделе тоже уменьшается. */
export function scaleSets(sets: number, deload: boolean): number {
  return deload ? Math.max(1, Math.round(sets * DELOAD_FACTOR)) : sets;
}
