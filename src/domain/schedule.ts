import type { Block } from '../types';
import { MINUTES_IN_DAY } from './time';

export interface DayPosition {
  /** Блок, который идёт прямо сейчас. */
  current: Block | null;
  /** Ближайший блок после текущего момента. */
  next: Block | null;
  /** Доля пройденного времени текущего блока, 0…1. */
  progress: number;
  /** Минут до конца текущего блока. */
  remaining: number;
  /** Минут до начала следующего блока, когда сейчас пусто. */
  untilNext: number | null;
}

export function sortBlocks(blocks: readonly Block[]): Block[] {
  return [...blocks].sort((a, b) => a.start - b.start || a.order - b.order);
}

export function liveBlocks(blocks: readonly Block[]): Block[] {
  return sortBlocks(blocks.filter((block) => !block.deleted));
}

/** Что идёт сейчас, что следом и сколько осталось. Чистая функция от минут суток. */
export function dayPosition(blocks: readonly Block[], nowMinutes: number): DayPosition {
  const ordered = liveBlocks(blocks);
  const current = ordered.find((b) => nowMinutes >= b.start && nowMinutes < b.end) ?? null;
  const next = ordered.find((b) => b.start > nowMinutes) ?? null;

  if (current) {
    const length = Math.max(1, current.end - current.start);
    const passed = nowMinutes - current.start;
    return {
      current,
      next,
      progress: Math.min(1, Math.max(0, passed / length)),
      remaining: current.end - nowMinutes,
      untilNext: null,
    };
  }

  return {
    current: null,
    next,
    progress: 0,
    remaining: 0,
    untilNext: next ? next.start - nowMinutes : null,
  };
}

export interface OverlapCandidate {
  id?: string;
  start: number;
  end: number;
  weekdays?: readonly number[];
}

/** Блоки, ограниченные разными днями недели, в один день не встречаются. */
export function weekdaysIntersect(a: readonly number[] = [], b: readonly number[] = []): boolean {
  if (a.length === 0 || b.length === 0) return true;
  return a.some((day) => b.includes(day));
}

/** Блоки шаблона, действующие в конкретный день недели. */
export function blocksForWeekday(blocks: readonly Block[], weekday: number): Block[] {
  return blocks.filter((block) => block.weekdays.length === 0 || block.weekdays.includes(weekday));
}

/** Первый блок, с которым пересекается кандидат, либо null. */
export function findOverlap(blocks: readonly Block[], candidate: OverlapCandidate): Block | null {
  return (
    liveBlocks(blocks).find(
      (block) =>
        block.id !== candidate.id &&
        weekdaysIntersect(block.weekdays, candidate.weekdays) &&
        candidate.start < block.end &&
        block.start < candidate.end,
    ) ?? null
  );
}

export type BlockProblem =
  { kind: 'range' } | { kind: 'emptyName' } | { kind: 'overlap'; block: Block };

/** Проверки перед сохранением блока: диапазон, название, пересечения. */
export function validateBlock(
  blocks: readonly Block[],
  candidate: OverlapCandidate & { name: string },
): BlockProblem | null {
  if (candidate.end <= candidate.start || candidate.end > MINUTES_IN_DAY) return { kind: 'range' };
  if (candidate.name.trim().length === 0) return { kind: 'emptyName' };
  const overlap = findOverlap(blocks, candidate);
  return overlap ? { kind: 'overlap', block: overlap } : null;
}

export function bookedMinutes(blocks: readonly Block[]): number {
  return liveBlocks(blocks).reduce((sum, block) => sum + (block.end - block.start), 0);
}

export function coreBlocks(blocks: readonly Block[]): Block[] {
  return liveBlocks(blocks).filter((block) => block.isCore);
}

/** Минимум дня закрыт, когда отмечены все блоки с пометкой «минимум». */
export function isMinimumDone(
  blocks: readonly Block[],
  checkedBlockIds: readonly string[],
): boolean {
  const core = coreBlocks(blocks);
  if (core.length === 0) return false;
  const checked = new Set(checkedBlockIds);
  return core.every((block) => checked.has(block.id));
}
