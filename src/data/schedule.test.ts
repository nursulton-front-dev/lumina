import { describe, expect, test } from 'vitest';
import type { DayTypeCode } from '../types';
import { findOverlap } from '../domain/schedule';
import { seedBlocks } from './schedule';

const DAY_TYPES: DayTypeCode[] = ['odd', 'even', 'sat', 'sun'];
const blocks = seedBlocks('2026-09-10T00:00:00.000Z');

describe('стартовое расписание', () => {
  test.each(DAY_TYPES)('в дне «%s» блоки не пересекаются', (dayType) => {
    const day = blocks.filter((block) => block.dayType === dayType);
    for (const block of day) {
      const rest = day.filter((other) => other.id !== block.id);
      expect(findOverlap(rest, block)).toBeNull();
    }
  });

  test.each(DAY_TYPES)('в дне «%s» ровно три блока минимума: числа, домашка, чтение', (dayType) => {
    const core = blocks.filter((block) => block.dayType === dayType && block.isCore);
    expect(core.map((block) => block.category).sort()).toEqual(['homework', 'memory', 'reading']);
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
