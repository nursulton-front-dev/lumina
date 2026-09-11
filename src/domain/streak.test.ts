import { describe, expect, test } from 'vitest';
import { bestStreak, computeStreak } from './streak';

describe('computeStreak', () => {
  test('считает подряд идущие дни, включая сегодня', () => {
    const done = ['2026-09-08', '2026-09-09', '2026-09-10'];
    expect(computeStreak(done, '2026-09-10')).toBe(3);
  });

  test('незакрытый сегодняшний день серию не рвёт', () => {
    const done = ['2026-09-08', '2026-09-09'];
    expect(computeStreak(done, '2026-09-10')).toBe(2);
  });

  test('пропущенный вчерашний день обнуляет серию', () => {
    const done = ['2026-09-07', '2026-09-08'];
    expect(computeStreak(done, '2026-09-10')).toBe(0);
  });

  test('пустая история даёт ноль', () => {
    expect(computeStreak([], '2026-09-10')).toBe(0);
  });
});

describe('bestStreak', () => {
  test('находит самый длинный отрезок в истории', () => {
    const done = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-10', '2026-08-11'];
    expect(bestStreak(done)).toBe(3);
  });

  test('одиночный день — серия из одного', () => {
    expect(bestStreak(['2026-08-01'])).toBe(1);
  });
});
