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

  test.each(DAY_TYPES)('минимум дня «%s» настроен верно', (dayType) => {
    const core = blocks.filter((block) => block.dayType === dayType && block.isCore);
    if (dayType === 'sun') {
      expect(core.map((block) => block.category).sort()).toEqual(['english', 'reading', 'reading']);
    } else {
      expect(core.map((block) => block.category).sort()).toEqual([
        'homework',
        'memory',
        'reading',
        'reading',
      ]);
    }
  });

  test('IOI распределён согласно схеме: 3 урока + 3 практики + 1 день отдыха', () => {
    const ioiOdd = blocks.filter((b) => b.dayType === 'odd' && b.category === 'ioi');
    expect(ioiOdd[0]?.titleKey).toBe('block.ioiLesson');
    expect(ioiOdd[0]?.pomodoros).toBe(3);

    const ioiEven = blocks.filter((b) => b.dayType === 'even' && b.category === 'ioi');
    expect(ioiEven[0]?.titleKey).toBe('block.ioiProblems');
    expect(ioiEven[0]?.pomodoros).toBe(4);

    const ioiFri = blocks.filter((b) => b.dayType === 'fri' && b.category === 'ioi');
    expect(ioiFri[0]?.titleKey).toBe('block.ioiLesson');
    expect(ioiFri[0]?.pomodoros).toBe(3);

    const ioiSat = blocks.filter((b) => b.dayType === 'sat' && b.category === 'ioi');
    expect(ioiSat[0]?.titleKey).toBe('block.ioiProblems');
    expect(ioiSat[0]?.pomodoros).toBe(4);

    const ioiSun = blocks.filter((b) => b.dayType === 'sun' && b.category === 'ioi');
    expect(ioiSun.length).toBe(0);
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
