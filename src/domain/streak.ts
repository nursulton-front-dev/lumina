import { addDays } from './time';

/**
 * Серия по минимуму дня. Сегодняшний незакрытый день серию не рвёт —
 * он ещё идёт; отсчёт в этом случае начинается со вчера.
 */
export function computeStreak(doneDates: Iterable<string>, todayIso: string): number {
  const done = doneDates instanceof Set ? doneDates : new Set(doneDates);
  let cursor = done.has(todayIso) ? todayIso : addDays(todayIso, -1);
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Самая длинная серия за всю историю — для полки рекордов. */
export function bestStreak(doneDates: Iterable<string>): number {
  const sorted = [...new Set(doneDates)].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of sorted) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}
