import { describe, expect, test } from 'vitest';
import { advanceSleepTarget, bedtimeDrift, isSleepReminderDue } from './sleep';

describe('advanceSleepTarget', () => {
  test('за два дня цель уезжает на пятнадцать минут раньше', () => {
    expect(advanceSleepTarget('01:00', '2026-09-08', '2026-09-10')).toEqual({
      target: '00:45',
      shiftedOn: '2026-09-10',
    });
  });

  test('через день цель не двигается', () => {
    expect(advanceSleepTarget('01:00', '2026-09-09', '2026-09-10').target).toBe('01:00');
  });

  test('несколько пропущенных шагов догоняются разом', () => {
    expect(advanceSleepTarget('01:00', '2026-09-04', '2026-09-10').target).toBe('00:15');
  });

  test('цель не уходит раньше 23:00', () => {
    expect(advanceSleepTarget('23:10', '2026-09-01', '2026-09-30').target).toBe('23:00');
  });

  test('достигнутая цель остаётся на месте', () => {
    expect(advanceSleepTarget('23:00', '2026-09-01', '2026-09-30').target).toBe('23:00');
  });

  test('первый запуск только фиксирует дату отсчёта', () => {
    expect(advanceSleepTarget('01:00', null, '2026-09-10')).toEqual({
      target: '01:00',
      shiftedOn: '2026-09-10',
    });
  });
});

describe('bedtimeDrift', () => {
  test('отбой позже цели даёт положительное расхождение', () => {
    expect(bedtimeDrift('23:00', '23:40')).toBe(40);
  });

  test('отбой раньше цели даёт отрицательное', () => {
    expect(bedtimeDrift('23:00', '22:30')).toBe(-30);
  });

  test('время после полуночи считается продолжением вечера', () => {
    expect(bedtimeDrift('23:00', '00:30')).toBe(90);
  });
});

describe('isSleepReminderDue', () => {
  test('за полчаса до цели напоминание срабатывает', () => {
    expect(isSleepReminderDue('23:00', 22 * 60 + 35)).toBe(true);
  });

  test('раньше времени не срабатывает', () => {
    expect(isSleepReminderDue('23:00', 22 * 60)).toBe(false);
  });

  test('после наступления цели уже поздно напоминать', () => {
    expect(isSleepReminderDue('23:00', 23 * 60 + 5)).toBe(false);
  });
});
