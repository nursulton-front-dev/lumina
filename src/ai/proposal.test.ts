import { describe, expect, test } from 'vitest';
import type { Block, Profile } from '../types';
import { defaultProfile } from '../db/repo';
import { applyChanges, buildDiff, validateProposal } from './proposal';

const now = '2026-09-10T00:00:00.000Z';

function block(partial: Partial<Block> & Pick<Block, 'id' | 'start' | 'end'>): Block {
  return {
    dayType: 'odd',
    date: '',
    titleKey: null,
    title: partial.id,
    category: 'ioi',
    protocolId: null,
    isCore: false,
    isFocus: false,
    order: partial.start,
    updatedAt: now,
    ...partial,
  };
}

const day: Block[] = [
  block({ id: 'numbers', start: 445, end: 450, category: 'memory', isCore: true }),
  block({ id: 'homework', start: 975, end: 1065, category: 'homework', isCore: true }),
  block({ id: 'ioi', start: 1260, end: 1350, category: 'ioi', isFocus: true }),
  block({ id: 'fiction', start: 1350, end: 1380, category: 'reading', isCore: true }),
  block({ id: 'sleep', start: 1380, end: 1439, category: 'sleep' }),
];

const profile: Profile = { ...defaultProfile('ru'), sleepTarget: '23:00' };

describe('applyChanges', () => {
  test('добавляет блок', () => {
    const result = applyChanges(
      day,
      [
        {
          op: 'add',
          block: { title: 'Олимпиада', start: '09:00', end: '14:00', category: 'ioi' },
        },
      ],
      now,
    );
    expect(result.problems).toEqual([]);
    expect(result.blocks.some((item) => item.title === 'Олимпиада')).toBe(true);
  });

  test('двигает существующий блок', () => {
    const result = applyChanges(
      day,
      [{ op: 'edit', blockId: 'ioi', patch: { start: '19:00', end: '20:30' } }],
      now,
    );
    const moved = result.blocks.find((item) => item.id === 'ioi');
    expect(moved?.start).toBe(19 * 60);
    expect(moved?.end).toBe(20 * 60 + 30);
  });

  test('удаляет блок', () => {
    const result = applyChanges(day, [{ op: 'delete', blockId: 'ioi' }], now);
    expect(result.blocks.some((item) => item.id === 'ioi')).toBe(false);
  });

  test('сообщает о неизвестном блоке вместо тихого пропуска', () => {
    const result = applyChanges(day, [{ op: 'delete', blockId: 'нет-такого' }], now);
    expect(result.problems[0]?.kind).toBe('unknownBlock');
  });

  test('не принимает конец раньше начала', () => {
    const result = applyChanges(
      day,
      [{ op: 'edit', blockId: 'ioi', patch: { start: '21:00', end: '20:00' } }],
      now,
    );
    expect(result.problems[0]?.kind).toBe('range');
  });

  test('исходное расписание не меняется', () => {
    applyChanges(day, [{ op: 'delete', blockId: 'ioi' }], now);
    expect(day).toHaveLength(5);
  });
});

describe('validateProposal', () => {
  test('корректное предложение проходит', () => {
    const { blocks } = applyChanges(
      day,
      [{ op: 'edit', blockId: 'ioi', patch: { start: '19:00', end: '20:30' } }],
      now,
    );
    expect(validateProposal(blocks, profile)).toEqual([]);
  });

  test('видит наложение по времени', () => {
    const { blocks } = applyChanges(
      day,
      [{ op: 'add', block: { title: 'Кружок', start: '21:30', end: '22:30', category: 'ioi' } }],
      now,
    );
    expect(validateProposal(blocks, profile).some((p) => p.kind === 'overlap')).toBe(true);
  });

  test('не даёт вырезать блок минимума', () => {
    const { blocks } = applyChanges(day, [{ op: 'delete', blockId: 'numbers' }], now);
    const problems = validateProposal(blocks, profile);
    expect(problems.some((p) => p.kind === 'minimum' && p.details.category === 'memory')).toBe(
      true,
    );
  });

  test('не даёт сдвинуть отбой позже цели', () => {
    const { blocks } = applyChanges(
      day,
      [{ op: 'edit', blockId: 'sleep', patch: { start: '23:45', end: '23:59' } }],
      now,
    );
    const problems = validateProposal(blocks, profile);
    expect(problems.some((p) => p.kind === 'bedtime')).toBe(true);
  });

  test('считает превышение недельного бюджета часов', () => {
    const { blocks } = applyChanges(
      day,
      [
        {
          op: 'add',
          block: { title: 'Много', start: '00:00', end: '07:00', category: 'freelance' },
        },
      ],
      now,
    );
    const problems = validateProposal(blocks, profile, 40);
    expect(problems.some((p) => p.kind === 'budget')).toBe(true);
  });
});

describe('buildDiff', () => {
  test('показывает перенос как «было — стало»', () => {
    const { blocks } = applyChanges(
      day,
      [{ op: 'edit', blockId: 'ioi', patch: { start: '19:00', end: '20:30' } }],
      now,
    );
    const rows = buildDiff(day, blocks);
    expect(rows).toEqual([{ kind: 'moved', before: '21:00–22:30 ioi', after: '19:00–20:30 ioi' }]);
  });

  test('показывает добавленное и удалённое', () => {
    const { blocks } = applyChanges(
      day,
      [
        { op: 'delete', blockId: 'ioi' },
        { op: 'add', block: { title: 'Олимпиада', start: '09:00', end: '14:00', category: 'ioi' } },
      ],
      now,
    );
    const rows = buildDiff(day, blocks);
    expect(rows.some((row) => row.kind === 'removed')).toBe(true);
    expect(rows.some((row) => row.kind === 'added')).toBe(true);
  });

  test('без изменений дифф пустой', () => {
    const { blocks } = applyChanges(day, [], now);
    expect(buildDiff(day, blocks)).toEqual([]);
  });
});
