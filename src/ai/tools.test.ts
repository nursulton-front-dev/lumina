import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '../db/db';
import { defaultProfile, ensureSeed, listBlocks, listBlocksForDay } from '../db/repo';
import { applyChange, pendingChanges, runTool, undoLastChange, type ToolContext } from './tools';

const TODAY = '2026-09-15';

const context: ToolContext = {
  profile: { ...defaultProfile('ru'), sleepTarget: '23:00' },
  today: TODAY,
};

async function reset(): Promise<void> {
  await db.delete();
  await db.open();
  await db.meta.clear();
  await ensureSeed();
}

describe('инструменты расписания', () => {
  beforeEach(reset);

  test('get_schedule отдаёт блоки типа дня', async () => {
    const result = await runTool('get_schedule', { dayType: 'odd' }, context);
    const data = result.data as { blocks: unknown[] };
    expect(result.ok).toBe(true);
    expect(data.blocks.length).toBeGreaterThan(10);
  });

  test('предложение не меняет расписание до подтверждения', async () => {
    const before = await listBlocks('odd');
    const target = before.find((block) => block.titleKey === 'block.ioiTheory');

    const proposal = await runTool(
      'propose_schedule_change',
      {
        changes: [{ op: 'edit', blockId: target?.id, patch: { end: '22:00' } }],
        scope: { kind: 'dayType', dayType: 'odd' },
        summary: 'Сократить блок IOI',
      },
      context,
    );

    expect(proposal.ok).toBe(true);
    const after = await listBlocks('odd');
    expect(after.find((block) => block.id === target?.id)?.end).toBe(22 * 60 + 30);
    expect((await pendingChanges()).length).toBe(1);
  });

  test('подтверждённое изменение применяется и отменяется', async () => {
    const before = await listBlocks('odd');
    const target = before.find((block) => block.titleKey === 'block.ioiTheory');

    const proposal = await runTool(
      'propose_schedule_change',
      {
        changes: [{ op: 'edit', blockId: target?.id, patch: { end: '22:00' } }],
        scope: { kind: 'dayType', dayType: 'odd' },
        summary: 'Сократить блок IOI',
      },
      context,
    );
    const { changeId } = proposal.data as { changeId: string };

    await applyChange(changeId);
    expect((await listBlocks('odd')).find((block) => block.id === target?.id)?.end).toBe(22 * 60);

    await undoLastChange();
    expect((await listBlocks('odd')).find((block) => block.id === target?.id)?.end).toBe(
      22 * 60 + 30,
    );
  });

  test('предложение, ломающее минимум дня, отклоняется с объяснением', async () => {
    const blocks = await listBlocks('odd');
    const numbers = blocks.find((block) => block.titleKey === 'block.numbers');

    const result = await runTool(
      'propose_schedule_change',
      {
        changes: [{ op: 'delete', blockId: numbers?.id }],
        scope: { kind: 'dayType', dayType: 'odd' },
        summary: 'Убрать тренажёр чисел',
      },
      context,
    );

    expect(result.ok).toBe(false);
    const data = result.data as { problems: { kind: string }[] };
    expect(data.problems.some((problem) => problem.kind === 'minimum')).toBe(true);
    expect(await pendingChanges()).toHaveLength(0);
  });

  test('отбой позже цели сна не проходит проверку', async () => {
    const blocks = await listBlocks('odd');
    const bedtime = blocks.find((block) => block.category === 'sleep');

    const result = await runTool(
      'propose_schedule_change',
      {
        changes: [{ op: 'edit', blockId: bedtime?.id, patch: { start: '23:50', end: '23:59' } }],
        scope: { kind: 'dayType', dayType: 'odd' },
        summary: 'Лечь позже',
      },
      context,
    );

    expect(result.ok).toBe(false);
    const data = result.data as { problems: { kind: string }[] };
    expect(data.problems.some((problem) => problem.kind === 'bedtime')).toBe(true);
  });

  test('правка «только сегодня» не трогает шаблон типа дня', async () => {
    const template = await listBlocks('odd');
    // Во вторник действует вариант блока IOI для вторника и четверга.
    const target = template.find(
      (block) => block.titleKey === 'block.ioiTheory' && block.weekdays.includes(2),
    );

    const proposal = await runTool(
      'propose_schedule_change',
      {
        changes: [{ op: 'delete', blockId: target?.id }],
        scope: { kind: 'today', date: TODAY },
        summary: 'Сегодня без IOI',
      },
      context,
    );
    const { changeId } = proposal.data as { changeId: string };
    await applyChange(changeId);

    const day = await listBlocksForDay('odd', TODAY);
    expect(day.some((block) => block.titleKey === 'block.ioiTheory')).toBe(false);
    expect((await listBlocks('odd')).some((block) => block.titleKey === 'block.ioiTheory')).toBe(
      true,
    );
  });

  test('неизвестный инструмент возвращает ошибку, а не падает', async () => {
    const result = await runTool('destroy_everything', {}, context);
    expect(result.ok).toBe(false);
  });

  test('кривые аргументы отсекаются схемой', async () => {
    const result = await runTool('add_event', { date: '2026-09-12' }, context);
    expect(result.ok).toBe(false);
    expect((result.data as { error: string }).error).toBe('invalid_arguments');
  });

  test('get_today_state отдаёт состояние дня', async () => {
    const result = await runTool('get_today_state', {}, context);
    const data = result.data as { minimumDone: boolean; totalBlocks: number };
    expect(result.ok).toBe(true);
    expect(data.minimumDone).toBe(false);
    expect(data.totalBlocks).toBeGreaterThan(0);
  });

  test('log_note пишет заметку в журнал', async () => {
    await runTool('log_note', { date: TODAY, text: 'Проверка' }, context);
    const logs = await db.logs.toArray();
    expect(logs[0]?.payload.text).toBe('Проверка');
  });
});
