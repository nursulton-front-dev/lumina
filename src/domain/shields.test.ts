import { describe, expect, test } from 'vitest';
import { computeStreak } from './streak';
import {
  datesWithShields,
  grantMonthlyShield,
  INITIAL_SHIELDS,
  MAX_SHIELDS,
  spendShieldIfNeeded,
} from './shields';

describe('начисление щитов', () => {
  test('первый щит выдаётся в новом месяце', () => {
    const state = grantMonthlyShield(INITIAL_SHIELDS, '2026-09-10');
    expect(state.count).toBe(1);
    expect(state.grantedMonth).toBe('2026-09');
  });

  test('в том же месяце второй раз не выдаётся', () => {
    const first = grantMonthlyShield(INITIAL_SHIELDS, '2026-09-10');
    expect(grantMonthlyShield(first, '2026-09-25').count).toBe(1);
  });

  test('больше двух щитов не копится', () => {
    let state = INITIAL_SHIELDS;
    for (const month of ['2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01']) {
      state = grantMonthlyShield(state, month);
    }
    expect(state.count).toBe(MAX_SHIELDS);
  });
});

describe('расход щита', () => {
  const done = new Set(['2026-09-08', '2026-09-09']);

  test('провал вчера закрывается щитом', () => {
    const state = { count: 1, grantedMonth: '2026-09', spent: [] };
    const result = spendShieldIfNeeded(state, done, '2026-09-11');
    expect(result.covered).toBe('2026-09-10');
    expect(result.state.count).toBe(0);
  });

  test('без щитов ничего не закрывается', () => {
    const result = spendShieldIfNeeded(INITIAL_SHIELDS, done, '2026-09-11');
    expect(result.covered).toBeNull();
  });

  test('закрытый вчерашний день щита не требует', () => {
    const state = { count: 1, grantedMonth: '2026-09', spent: [] };
    const result = spendShieldIfNeeded(state, new Set(['2026-09-10']), '2026-09-11');
    expect(result.covered).toBeNull();
    expect(result.state.count).toBe(1);
  });

  test('щит не тратится, когда серии всё равно нет', () => {
    const state = { count: 1, grantedMonth: '2026-09', spent: [] };
    const result = spendShieldIfNeeded(state, new Set(), '2026-09-11');
    expect(result.covered).toBeNull();
    expect(result.state.count).toBe(1);
  });

  test('один и тот же день дважды не оплачивается', () => {
    const state = { count: 2, grantedMonth: '2026-09', spent: ['2026-09-10'] };
    const result = spendShieldIfNeeded(state, done, '2026-09-11');
    expect(result.covered).toBeNull();
    expect(result.state.count).toBe(2);
  });
});

describe('серия с щитом', () => {
  test('щит сохраняет серию через провальный день', () => {
    const done = ['2026-09-08', '2026-09-09', '2026-09-11'];
    expect(computeStreak(done, '2026-09-11')).toBe(1);
    const covered = datesWithShields(done, ['2026-09-10']);
    expect(computeStreak(covered, '2026-09-11')).toBe(4);
  });
});
