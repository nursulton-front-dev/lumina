import { describe, expect, test } from 'vitest';
import {
  addDays,
  daysBetween,
  formatClock,
  formatDuration,
  fromMinutes,
  toISODate,
  toMinutes,
} from './time';

describe('toMinutes', () => {
  test('переводит «07:05» в минуты от полуночи', () => {
    expect(toMinutes('07:05')).toBe(425);
  });

  test('возвращает 0 для мусора вместо времени', () => {
    expect(toMinutes('25:00')).toBe(0);
    expect(toMinutes('нет')).toBe(0);
  });
});

describe('fromMinutes', () => {
  test('дополняет часы и минуты нулями', () => {
    expect(fromMinutes(425)).toBe('07:05');
    expect(fromMinutes(0)).toBe('00:00');
  });

  test('заворачивает значения за пределами суток', () => {
    expect(fromMinutes(1440)).toBe('00:00');
    expect(fromMinutes(-60)).toBe('23:00');
  });
});

describe('даты', () => {
  test('addDays переходит через границу месяца', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('toISODate берёт локальную дату, а не UTC', () => {
    expect(toISODate(new Date(2026, 8, 10, 23, 30))).toBe('2026-09-10');
  });

  test('daysBetween считает разницу в днях', () => {
    expect(daysBetween('2026-09-01', '2026-09-10')).toBe(9);
  });
});

describe('форматирование длительности', () => {
  const labels = { hour: 'ч', min: 'мин' };

  test('меньше часа показывает только минуты', () => {
    expect(formatDuration(40, labels)).toBe('40 мин');
  });

  test('ровные часы показываются без минут', () => {
    expect(formatDuration(120, labels)).toBe('2 ч');
  });

  test('смешанное значение показывает и часы, и минуты', () => {
    expect(formatDuration(95, labels)).toBe('1 ч 35 мин');
  });

  test('таймер показывает часы только когда они есть', () => {
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(3725)).toBe('1:02:05');
  });
});
