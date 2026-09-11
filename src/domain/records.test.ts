import { describe, expect, test } from 'vitest';
import type { Measure, WorkSession } from '../types';
import { beatenRecords, computeRecords } from './records';

function measure(metric: Measure['metric'], value: number, date: string): Measure {
  return { id: `${metric}-${date}`, date, metric, value, note: null, updatedAt: date };
}

function session(minutes: number, broken: boolean, exits: number): WorkSession {
  return {
    id: `s-${minutes}-${exits}`,
    date: '2026-09-10',
    blockId: null,
    kind: 'pomodoro',
    minutes,
    exits,
    broken,
    startedAt: '2026-09-10T18:00:00.000Z',
    updatedAt: '2026-09-10T18:00:00.000Z',
  };
}

describe('computeRecords', () => {
  test('берёт лучший замер по каждой метрике', () => {
    const records = computeRecords({
      measures: [measure('pullups', 3, '2026-09-01'), measure('pullups', 5, '2026-09-15')],
      sessions: [],
      doneDates: [],
    });
    expect(records).toContainEqual({ id: 'pullups', value: 5, date: '2026-09-15' });
  });

  test('сорванные сессии в рекорд чистого фокуса не идут', () => {
    const records = computeRecords({
      measures: [],
      sessions: [session(50, true, 4), session(25, false, 0)],
      doneDates: [],
    });
    expect(records).toContainEqual({ id: 'cleanSession', value: 25, date: '2026-09-10' });
  });

  test('без данных полка пустая', () => {
    expect(computeRecords({ measures: [], sessions: [], doneDates: [] })).toEqual([]);
  });

  test('лучшая серия попадает на полку', () => {
    const records = computeRecords({
      measures: [],
      sessions: [],
      doneDates: ['2026-09-01', '2026-09-02', '2026-09-03'],
    });
    expect(records).toContainEqual({ id: 'streak', value: 3, date: null });
  });
});

describe('beatenRecords', () => {
  test('видит побитый рекорд и прошлое значение', () => {
    const before = [{ id: 'pullups' as const, value: 3, date: '2026-09-01' }];
    const after = [{ id: 'pullups' as const, value: 5, date: '2026-09-15' }];
    expect(beatenRecords(before, after)).toEqual([{ id: 'pullups', from: 3, to: 5 }]);
  });

  test('первый в истории замер рекордом не объявляется', () => {
    const after = [{ id: 'digits' as const, value: 12, date: '2026-09-15' }];
    expect(beatenRecords([], after)).toEqual([]);
  });

  test('неизменившийся результат не считается', () => {
    const same = [{ id: 'digits' as const, value: 12, date: '2026-09-15' }];
    expect(beatenRecords(same, same)).toEqual([]);
  });
});
