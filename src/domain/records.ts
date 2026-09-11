import type { Measure, WorkSession } from '../types';
import { bestStreak } from './streak';

export type RecordId = 'pullups' | 'digits' | 'longJump' | 'streak' | 'cleanSession';

export interface RecordItem {
  id: RecordId;
  value: number;
  date: string | null;
}

function bestMeasure(measures: readonly Measure[], metric: Measure['metric']): RecordItem | null {
  const rows = measures.filter((row) => row.metric === metric && !row.deleted);
  if (rows.length === 0) return null;
  const best = rows.reduce((max, row) => (row.value > max.value ? row : max));
  return { id: metric as RecordId, value: best.value, date: best.date };
}

/** Полка рекордов: только то, что действительно измерено. */
export function computeRecords(input: {
  measures: readonly Measure[];
  sessions: readonly WorkSession[];
  doneDates: readonly string[];
}): RecordItem[] {
  const items: RecordItem[] = [];

  for (const metric of ['pullups', 'digits', 'longJump'] as const) {
    const record = bestMeasure(input.measures, metric);
    if (record) items.push(record);
  }

  const streak = bestStreak(input.doneDates);
  if (streak > 0) items.push({ id: 'streak', value: streak, date: null });

  const clean = input.sessions.filter(
    (session) => session.kind === 'pomodoro' && !session.broken && session.exits === 0,
  );
  if (clean.length > 0) {
    const best = clean.reduce((max, session) => (session.minutes > max.minutes ? session : max));
    items.push({ id: 'cleanSession', value: best.minutes, date: best.date });
  }

  return items;
}

/** Рекорды, которые выросли с прошлого снимка: для короткого уведомления. */
export function beatenRecords(
  previous: readonly RecordItem[],
  current: readonly RecordItem[],
): { id: RecordId; from: number; to: number }[] {
  const before = new Map(previous.map((item) => [item.id, item.value]));
  const beaten: { id: RecordId; from: number; to: number }[] = [];
  for (const item of current) {
    const old = before.get(item.id);
    if (old !== undefined && item.value > old)
      beaten.push({ id: item.id, from: old, to: item.value });
  }
  return beaten;
}
