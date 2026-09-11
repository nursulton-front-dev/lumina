import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Category } from '../types';
import { RANKS, type RankId, type RankSpec } from '../data/ranks';
import { rankStatus, type RankStatus } from '../domain/ranks';
import { computeRecords, type RecordItem } from '../domain/records';
import {
  datesWithShields,
  grantMonthlyShield,
  spendShieldIfNeeded,
  INITIAL_SHIELDS,
  type ShieldState,
} from '../domain/shields';
import { computeStreak } from '../domain/streak';
import { db, readMeta, writeMeta } from '../db/db';

const COUNTERS_KEY = 'gamification.counters';
const SHIELDS_KEY = 'gamification.shields';

/** Счётчики, которые пользователь ведёт сам: задачи, контесты, пробные тесты. */
export interface Counters {
  ioiTasks: number;
  ioiContests: number;
  russianTests: number;
  englishTests: number;
}

const EMPTY_COUNTERS: Counters = {
  ioiTasks: 0,
  ioiContests: 0,
  russianTests: 0,
  englishTests: 0,
};

export interface RankView {
  spec: RankSpec;
  status: RankStatus;
  /** Есть ли хоть один замер: без него разряд не с чем сравнивать. */
  hasData: boolean;
}

export interface GamificationState {
  ranks: RankView[];
  records: RecordItem[];
  shields: ShieldState;
  /** Состояние щитов изменилось и требует записи. */
  shieldsChanged: boolean;
  counters: Counters;
  streak: number;
  hours: Partial<Record<Category, number>>;
}

export async function getCounters(): Promise<Counters> {
  return { ...EMPTY_COUNTERS, ...((await readMeta<Partial<Counters>>(COUNTERS_KEY)) ?? {}) };
}

export async function addCounter(key: keyof Counters, delta: number): Promise<void> {
  const current = await getCounters();
  await writeMeta(COUNTERS_KEY, { ...current, [key]: Math.max(0, current[key] + delta) });
}

function valueFor(
  spec: RankSpec,
  input: {
    measures: Map<string, number>;
    counters: Counters;
    hours: Partial<Record<Category, number>>;
  },
): { value: number; second: number | null; hasData: boolean } {
  if (spec.id === 'ioi') {
    return {
      value: input.counters.ioiTasks,
      second: input.counters.ioiContests,
      hasData: input.counters.ioiTasks > 0,
    };
  }
  if (spec.id === 'russian' || spec.id === 'english') {
    const minutes = input.hours[spec.id] ?? 0;
    return {
      value: Math.floor(minutes / 60),
      second: spec.id === 'russian' ? input.counters.russianTests : input.counters.englishTests,
      hasData: minutes > 0,
    };
  }
  if (!spec.metric) return { value: 0, second: null, hasData: false };
  const measured = input.measures.get(spec.metric);
  if (measured === undefined) {
    return {
      value: spec.lowerIsBetter ? Number.MAX_SAFE_INTEGER : 0,
      second: null,
      hasData: false,
    };
  }
  return { value: measured, second: null, hasData: true };
}

/** Разряды, рекорды, щиты и серия — всё считается из уже собранных данных. */
export function useGamification(todayIso: string): GamificationState | null {
  const state =
    useLiveQuery(async () => {
      const [measures, sessions, days, checks, blocks, counters] = await Promise.all([
        db.measures.toArray(),
        db.sessions.toArray(),
        db.days.toArray(),
        db.checks.toArray(),
        db.blocks.toArray(),
        getCounters(),
      ]);

      // Лучшее значение по каждой метрике: для паразитов лучшее — наименьшее.
      const best = new Map<string, number>();
      for (const row of measures) {
        if (row.deleted) continue;
        const lower = row.metric === 'fillers' || row.metric === 'bedtimeDrift';
        const current = best.get(row.metric);
        if (current === undefined) best.set(row.metric, row.value);
        else
          best.set(row.metric, lower ? Math.min(current, row.value) : Math.max(current, row.value));
      }

      // Часы по направлениям — из отмеченных блоков за всю историю.
      const blockById = new Map(blocks.map((block) => [block.id, block]));
      const hours: Partial<Record<Category, number>> = {};
      for (const check of checks) {
        if (check.deleted) continue;
        const block = blockById.get(check.blockId);
        if (!block) continue;
        hours[block.category] = (hours[block.category] ?? 0) + (block.end - block.start);
      }

      const doneDates = days.filter((day) => day.minDone).map((day) => day.date);

      // Внутри live-запроса писать нельзя: транзакция только на чтение.
      // Считаем новое состояние щитов здесь, а сохраняем его отдельным эффектом.
      const storedShields = (await readMeta<ShieldState>(SHIELDS_KEY)) ?? INITIAL_SHIELDS;
      const granted = grantMonthlyShield(storedShields, todayIso);
      const used = spendShieldIfNeeded(granted, new Set(doneDates), todayIso);
      const shieldsChanged = used.state !== storedShields;

      const covered = datesWithShields(doneDates, used.state.spent);

      return {
        ranks: RANKS.map((spec) => {
          const { value, second, hasData } = valueFor(spec, { measures: best, counters, hours });
          return { spec, status: rankStatus(spec, value, second), hasData };
        }),
        records: computeRecords({ measures, sessions, doneDates }),
        shields: used.state,
        shieldsChanged,
        counters,
        streak: computeStreak(covered, todayIso),
        hours,
      };
    }, [todayIso]) ?? null;

  // Начисленный или потраченный щит сохраняется вне read-only транзакции.
  useEffect(() => {
    if (!state?.shieldsChanged) return;
    void writeMeta(SHIELDS_KEY, state.shields);
  }, [state?.shieldsChanged, state?.shields]);

  return state;
}

export type { RankId };
