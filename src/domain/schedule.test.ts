import { describe, expect, test } from 'vitest';
import type { Block } from '../types';
import { dayPosition, findOverlap, isMinimumDone, validateBlock } from './schedule';

function block(partial: Partial<Block> & Pick<Block, 'id' | 'start' | 'end'>): Block {
  return {
    dayType: 'odd',
    date: '',
    weekdays: [],
    titleKey: null,
    title: partial.id,
    category: 'routine',
    protocolId: null,
    isCore: false,
    isFocus: false,
    order: partial.start,
    updatedAt: '2026-09-10T00:00:00.000Z',
    ...partial,
  };
}

const day: Block[] = [
  block({ id: 'wake', start: 360, end: 365 }),
  block({ id: 'workout', start: 365, end: 387 }),
  block({ id: 'numbers', start: 445, end: 450, isCore: true }),
  block({ id: 'homework', start: 975, end: 1065, isCore: true, isFocus: true }),
];

describe('dayPosition', () => {
  test('находит текущий блок и считает прогресс', () => {
    const position = dayPosition(day, 376);
    expect(position.current?.id).toBe('workout');
    expect(position.remaining).toBe(11);
    expect(position.progress).toBeCloseTo(0.5, 1);
    expect(position.next?.id).toBe('numbers');
  });

  test('в паузе между блоками показывает время до следующего', () => {
    const position = dayPosition(day, 400);
    expect(position.current).toBeNull();
    expect(position.next?.id).toBe('numbers');
    expect(position.untilNext).toBe(45);
  });

  test('после последнего блока следующего нет', () => {
    const position = dayPosition(day, 1300);
    expect(position.current).toBeNull();
    expect(position.next).toBeNull();
    expect(position.untilNext).toBeNull();
  });

  test('конец блока принадлежит уже следующему интервалу', () => {
    expect(dayPosition(day, 365).current?.id).toBe('workout');
  });

  test('удалённые блоки не участвуют', () => {
    const withDeleted = [...day, block({ id: 'ghost', start: 376, end: 380, deleted: true })];
    expect(dayPosition(withDeleted, 377).current?.id).toBe('workout');
  });
});

describe('findOverlap и validateBlock', () => {
  test('видит пересечение с существующим блоком', () => {
    expect(findOverlap(day, { start: 380, end: 400 })?.id).toBe('workout');
  });

  test('стык встык пересечением не считается', () => {
    expect(findOverlap(day, { start: 387, end: 400 })).toBeNull();
  });

  test('блок не пересекается сам с собой при редактировании', () => {
    expect(findOverlap(day, { id: 'workout', start: 366, end: 390 })).toBeNull();
  });

  test('конец раньше начала — ошибка диапазона', () => {
    expect(validateBlock(day, { start: 400, end: 380, name: 'Тест' })).toEqual({ kind: 'range' });
  });

  test('пустое название не проходит', () => {
    expect(validateBlock(day, { start: 400, end: 420, name: '  ' })).toEqual({ kind: 'emptyName' });
  });

  test('корректный блок проходит проверку', () => {
    expect(validateBlock(day, { start: 400, end: 420, name: 'Тест' })).toBeNull();
  });
});

describe('isMinimumDone', () => {
  test('нужны все блоки минимума', () => {
    expect(isMinimumDone(day, ['numbers'])).toBe(false);
    expect(isMinimumDone(day, ['numbers', 'homework'])).toBe(true);
  });

  test('лишние отметки не мешают', () => {
    expect(isMinimumDone(day, ['numbers', 'homework', 'wake'])).toBe(true);
  });

  test('день без блоков минимума не считается закрытым', () => {
    expect(isMinimumDone([block({ id: 'x', start: 0, end: 10 })], ['x'])).toBe(false);
  });
});
