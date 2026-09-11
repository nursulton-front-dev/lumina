import { describe, expect, test } from 'vitest';
import { autoDayType, resolveDayType } from './dayType';

describe('autoDayType', () => {
  test('суббота и воскресенье определяются по дню недели', () => {
    expect(autoDayType('2026-09-12')).toBe('sat');
    expect(autoDayType('2026-09-13')).toBe('sun');
  });

  test('будни делятся по чётности числа месяца', () => {
    expect(autoDayType('2026-09-10')).toBe('even');
    expect(autoDayType('2026-09-11')).toBe('odd');
  });

  test('выходные не превращаются в будни из-за чётности', () => {
    expect(autoDayType('2026-09-05')).toBe('sat');
  });
});

describe('resolveDayType', () => {
  test('ручной выбор побеждает автоматику', () => {
    expect(resolveDayType('2026-09-12', 'odd')).toBe('odd');
  });

  test('без ручного выбора работает календарь', () => {
    expect(resolveDayType('2026-09-12', null)).toBe('sat');
  });
});

describe('перенос английского на дни недели', () => {
  const rule = { mode: 'weekdays' as const, englishDays: [1, 3, 5] };

  test('в понедельник идёт вечер с английским', () => {
    expect(autoDayType('2026-09-14', rule)).toBe('odd');
  });

  test('во вторник вечер свободный, хотя число нечётное', () => {
    expect(autoDayType('2026-09-15', rule)).toBe('even');
  });

  test('выходные остаются выходными при любом правиле', () => {
    expect(autoDayType('2026-09-19', rule)).toBe('sat');
  });
});
