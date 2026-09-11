import { useLiveQuery } from 'dexie-react-hooks';
import type { Block, DayTypeCode, Profile } from '../types';
import { db } from '../db/db';
import { listBlocksForDay, listChecks, setMinDone, toggleCheck } from '../db/repo';
import { resolveDayType, type DayTypeRule } from '../domain/dayType';
import { dayPosition, isMinimumDone, type DayPosition } from '../domain/schedule';
import { computeStreak } from '../domain/streak';

export interface DayState {
  date: string;
  dayType: DayTypeCode;
  /** Тип дня выбран вручную, а не вычислен по календарю. */
  overridden: boolean;
  blocks: Block[];
  checked: ReadonlySet<string>;
  position: DayPosition;
  minimumDone: boolean;
  streak: number;
  /** Отмеченное фактическое время отбоя. */
  bedtimeActual: string | null;
}

export function dayTypeRule(profile: Profile | null): DayTypeRule {
  return {
    mode: profile?.englishMode ?? 'parity',
    englishDays: profile?.englishDays ?? [],
  };
}

/** Полное состояние дня: расписание, отметки, положение во времени, серия. */
export function useDay(date: string, nowMinutes: number, profile: Profile | null): DayState | null {
  const rule = dayTypeRule(profile);

  const state = useLiveQuery(async () => {
    const day = await db.days.where('date').equals(date).first();
    const dayType = resolveDayType(date, day?.typeOverride ?? null, rule);
    const [blocks, checks, doneDays] = await Promise.all([
      listBlocksForDay(dayType, date),
      listChecks(date),
      db.days.filter((row) => row.minDone).toArray(),
    ]);
    const checked = new Set(checks.map((check) => check.blockId));
    return {
      date,
      dayType,
      overridden: day?.typeOverride != null,
      bedtimeActual: day?.bedtimeActual ?? null,
      blocks,
      checked,
      minimumDone: isMinimumDone(blocks, [...checked]),
      streak: computeStreak(
        doneDays.map((row) => row.date),
        date,
      ),
    };
  }, [date, rule.mode, rule.englishDays.join(',')]);

  if (!state) return null;

  return { ...state, position: dayPosition(state.blocks, nowMinutes) };
}

/**
 * Переключает отметку блока и сразу пересчитывает флаг минимума дня:
 * серия должна опираться на актуальное состояние, а не на пересчёт при открытии.
 */
export async function toggleBlockCheck(
  date: string,
  blockId: string,
  blocks: readonly Block[],
): Promise<void> {
  await toggleCheck(date, blockId);
  const checks = await listChecks(date);
  await setMinDone(
    date,
    isMinimumDone(
      blocks,
      checks.map((check) => check.blockId),
    ),
  );
}
