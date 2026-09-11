import type { Block, Category } from '../types';
import { liveBlocks } from './schedule';

/** Направления, по которым считаются часы в недельном отчёте. */
export const DIRECTIONS: Category[] = [
  'ioi',
  'russian',
  'english',
  'freelance',
  'homework',
  'sport',
];

export type CategoryMinutes = Partial<Record<Category, number>>;

function add(target: CategoryMinutes, category: Category, minutes: number): void {
  target[category] = (target[category] ?? 0) + minutes;
}

export interface DayTotals {
  plan: CategoryMinutes;
  fact: CategoryMinutes;
}

/** План — все блоки дня, факт — только отмеченные выполненными. */
export function dayTotals(blocks: readonly Block[], checked: ReadonlySet<string>): DayTotals {
  const plan: CategoryMinutes = {};
  const fact: CategoryMinutes = {};
  for (const block of liveBlocks(blocks)) {
    const minutes = block.end - block.start;
    add(plan, block.category, minutes);
    if (checked.has(block.id)) add(fact, block.category, minutes);
  }
  return { plan, fact };
}

export function mergeTotals(totals: readonly CategoryMinutes[]): CategoryMinutes {
  const result: CategoryMinutes = {};
  for (const item of totals) {
    for (const [category, minutes] of Object.entries(item)) {
      add(result, category as Category, minutes ?? 0);
    }
  }
  return result;
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}
