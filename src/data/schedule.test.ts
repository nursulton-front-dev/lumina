import { describe, expect, test } from 'vitest';
import type { DayTypeCode } from '../types';
import { findOverlap } from '../domain/schedule';
import { seedBlocks } from './schedule';

const DAY_TYPES: DayTypeCode[] = ['odd', 'even', 'fri', 'sat', 'sun'];
const blocks = seedBlocks('2026-09-10T00:00:00.000Z');

describe('стартовое расписание', () => {
  test.each(DAY_TYPES)('в дне «%s» блоки не пересекаются', (dayType) => {
    const day = blocks.filter((block) => block.dayType === dayType);
    for (const block of day) {
      const rest = day.filter((other) => other.id !== block.id);
      expect(findOverlap(rest, block)).toBeNull();
    }
  });

  test.each(DAY_TYPES)(
    'минимум дня «%s»: числа и чтение, плюс домашка кроме пятницы',
    (dayType) => {
      const core = blocks.filter((block) => block.dayType === dayType && block.isCore);
      const expected =
        dayType === 'fri' ? ['memory', 'reading'] : ['homework', 'memory', 'reading'];
      expect(core.map((block) => block.category).sort()).toEqual(expected);
    },
  );

  test('домашка по английскому только во вторник и четверг', () => {
    const hw = blocks.filter((block) => block.titleKey === 'block.englishHw');
    expect(hw.length).toBeGreaterThan(0);
    expect(hw.every((block) => block.weekdays.join(',') === '2,4')).toBe(true);
  });

  test('тренажёр чисел длится 15 минут сразу после завтрака', () => {
    for (const block of blocks.filter((item) => item.titleKey === 'block.numbers')) {
      expect(block.end - block.start).toBe(15);
      const breakfast = blocks.find(
        (item) => item.dayType === block.dayType && item.titleKey === 'block.breakfast',
      );
      expect(breakfast?.end).toBe(block.start);
    }
  });

  test('в пятницу нет ни IOI, ни фриланса', () => {
    const friday = blocks.filter((block) => block.dayType === 'fri');
    expect(friday.some((block) => block.category === 'ioi' || block.category === 'freelance')).toBe(
      false,
    );
    expect(friday.some((block) => block.titleKey === 'block.lesson')).toBe(true);
  });

  test('у каждого блока конец позже начала', () => {
    for (const block of blocks) {
      expect(block.end).toBeGreaterThan(block.start);
    }
  });

  test('идентификаторы блоков уникальны', () => {
    const ids = new Set(blocks.map((block) => block.id));
    expect(ids.size).toBe(blocks.length);
  });
});
