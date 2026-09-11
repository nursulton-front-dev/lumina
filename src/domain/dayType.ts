import type { DayTypeCode, EnglishMode } from '../types';
import { fromISODate } from './time';

/** Правило, по которому будний день считается «английским» (шаблон odd). */
export interface DayTypeRule {
  mode: EnglishMode;
  /** Дни недели с английским, 0 — воскресенье. Учитывается при mode = 'weekdays'. */
  englishDays: readonly number[];
}

export const PARITY_RULE: DayTypeRule = { mode: 'parity', englishDays: [] };

/**
 * Тип дня по календарю: суббота и воскресенье — свои шаблоны, будни — либо
 * по чётности числа месяца (нечётное = вечер с английским), либо по дням недели,
 * если пользователь перенёс курс на конкретные дни.
 */
export function autoDayType(iso: string, rule: DayTypeRule = PARITY_RULE): DayTypeCode {
  const date = fromISODate(iso);
  const weekday = date.getDay();
  if (weekday === 6) return 'sat';
  if (weekday === 0) return 'sun';
  if (rule.mode === 'weekdays') {
    return rule.englishDays.includes(weekday) ? 'odd' : 'even';
  }
  return date.getDate() % 2 === 1 ? 'odd' : 'even';
}

/** Ручной выбор пользователя побеждает автоматику. */
export function resolveDayType(
  iso: string,
  override: DayTypeCode | null,
  rule: DayTypeRule = PARITY_RULE,
): DayTypeCode {
  return override ?? autoDayType(iso, rule);
}
