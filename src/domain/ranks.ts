import { GRADES, type Grade, type RankSpec } from '../data/ranks';

export interface RankStatus {
  /** Достигнутый разряд или null, если до первого ещё не дошли. */
  grade: Grade | null;
  gradeIndex: number;
  /** Следующий разряд и его нормативы. */
  next: { grade: Grade; value: number; second: number | null } | null;
  /** Доля пути до следующего разряда, 0…1. */
  share: number;
  value: number;
  second: number | null;
}

function meets(value: number, threshold: number, lowerIsBetter: boolean): boolean {
  return lowerIsBetter ? value <= threshold : value >= threshold;
}

/**
 * Разряд по текущему результату. Для составных направлений норматив считается
 * взятым, только когда выполнены оба показателя: часы и пробные тесты, задачи и контесты.
 */
export function rankStatus(
  spec: RankSpec,
  value: number,
  second: number | null = null,
): RankStatus {
  const lower = spec.lowerIsBetter ?? false;
  let index = -1;

  for (let position = 0; position < GRADES.length; position += 1) {
    const threshold = spec.thresholds[position];
    if (threshold === undefined) break;
    const secondThreshold = spec.secondThresholds?.[position] ?? null;
    const primaryOk = meets(value, threshold, lower);
    const secondOk = secondThreshold === null || (second ?? 0) >= secondThreshold;
    if (primaryOk && secondOk) index = position;
    else break;
  }

  const nextIndex = index + 1;
  const nextThreshold = spec.thresholds[nextIndex];
  const grade = index >= 0 ? (GRADES[index] ?? null) : null;

  if (nextThreshold === undefined) {
    return { grade, gradeIndex: index, next: null, share: 1, value, second };
  }

  const previousThreshold =
    index >= 0 ? (spec.thresholds[index] ?? 0) : lower ? nextThreshold * 2 : 0;
  const span = Math.abs(nextThreshold - previousThreshold) || 1;
  const passed = Math.abs(value - previousThreshold);
  const share = Math.min(1, Math.max(0, passed / span));

  return {
    grade,
    gradeIndex: index,
    next: {
      grade: GRADES[nextIndex] as Grade,
      value: nextThreshold,
      second: spec.secondThresholds?.[nextIndex] ?? null,
    },
    share,
    value,
    second,
  };
}

/**
 * Разряд, до которого осталось меньше всего — он и показывается на главном экране.
 * Направления без единого замера не участвуют: там нечего сравнивать.
 */
export function closestRank<T extends { status: RankStatus; hasData: boolean }>(
  items: readonly T[],
): T | null {
  const pending = items.filter((item) => item.hasData && item.status.next !== null);
  if (pending.length === 0) return null;
  return pending.reduce((best, item) => (item.status.share > best.status.share ? item : best));
}
