import { describe, expect, test } from 'vitest';
import type { Block } from '../types';
import { dayTotals, mergeTotals, minutesToHours } from './week';

function block(id: string, category: Block['category'], start: number, end: number): Block {
  return {
    id,
    dayType: 'odd',
    date: '',
    weekdays: [],
    start,
    end,
    titleKey: null,
    title: id,
    category,
    protocolId: null,
    isCore: false,
    isFocus: false,
    order: start,
    updatedAt: '2026-09-10T00:00:00.000Z',
  };
}

const day = [
  block('ioi', 'ioi', 1260, 1350),
  block('russian', 'russian', 400, 425),
  block('homework', 'homework', 975, 1065),
];

describe('dayTotals', () => {
  test('план собирает все блоки, факт — только отмеченные', () => {
    const totals = dayTotals(day, new Set(['ioi']));
    expect(totals.plan).toEqual({ ioi: 90, russian: 25, homework: 90 });
    expect(totals.fact).toEqual({ ioi: 90 });
  });

  test('удалённые блоки не попадают ни в план, ни в факт', () => {
    const withDeleted = [...day, { ...block('ghost', 'ioi', 600, 660), deleted: true }];
    expect(dayTotals(withDeleted, new Set()).plan.ioi).toBe(90);
  });

  test('пустой день даёт пустые суммы', () => {
    expect(dayTotals([], new Set())).toEqual({ plan: {}, fact: {} });
  });
});

describe('mergeTotals', () => {
  test('складывает минуты по направлениям', () => {
    expect(mergeTotals([{ ioi: 90 }, { ioi: 60, russian: 30 }])).toEqual({ ioi: 150, russian: 30 });
  });
});

describe('minutesToHours', () => {
  test('округляет до десятых', () => {
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(95)).toBe(1.6);
  });
});
