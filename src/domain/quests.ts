import type { Category } from '../types';
import { landingsBudget } from './progression';

export type QuestKind = 'landings' | 'cleanPomodoro' | 'digits' | 'hours' | 'coreDays';

export interface Quest {
  id: string;
  kind: QuestKind;
  target: number;
  /** Направление для квеста на часы. */
  category?: Category;
}

export interface WeekStats {
  landings: number;
  cleanPomodoro: number;
  bestDigits: number;
  coreDays: number;
  /** Минуты по направлениям за прошлую неделю. */
  minutes: Partial<Record<Category, number>>;
  weeksTrained: number;
}

const HOUR_DIRECTIONS: Category[] = ['ioi', 'russian', 'english', 'freelance'];

/** Направление, просевшее сильнее других, — на него и ставится квест по часам. */
export function weakestDirection(minutes: Partial<Record<Category, number>>): Category {
  return HOUR_DIRECTIONS.reduce((weakest, direction) =>
    (minutes[direction] ?? 0) < (minutes[weakest] ?? 0) ? direction : weakest,
  );
}

/**
 * Квесты на неделю привязаны к цифрам прошлой недели: небольшой шаг вверх,
 * но не выше безопасного лимита приземлений.
 */
export function proposeQuests(stats: WeekStats): Quest[] {
  const budget = landingsBudget(stats.weeksTrained);
  const direction = weakestDirection(stats.minutes);
  const currentHours = Math.floor((stats.minutes[direction] ?? 0) / 60);

  return [
    {
      id: 'landings',
      kind: 'landings',
      target: Math.min(budget, Math.max(60, Math.round(stats.landings * 1.1))),
    },
    {
      id: 'cleanPomodoro',
      kind: 'cleanPomodoro',
      target: Math.max(6, stats.cleanPomodoro + 2),
    },
    {
      id: 'digits',
      kind: 'digits',
      target: Math.max(14, stats.bestDigits + 2),
    },
    {
      id: 'hours',
      kind: 'hours',
      category: direction,
      target: Math.max(4, currentHours + 1),
    },
    {
      id: 'coreDays',
      kind: 'coreDays',
      target: Math.min(7, Math.max(5, stats.coreDays + 1)),
    },
  ];
}

/** Доля выполнения квеста, 0…1. */
export function questShare(quest: Quest, progress: number): number {
  if (quest.target <= 0) return 1;
  return Math.min(1, Math.max(0, progress / quest.target));
}

export function isQuestDone(quest: Quest, progress: number): boolean {
  return progress >= quest.target;
}
