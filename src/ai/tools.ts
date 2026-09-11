import { z } from 'zod';
import type { Block, ChangeRecord, DayTypeCode, Profile } from '../types';
import { db, newId, stamp } from '../db/db';
import {
  addLog,
  listBlocks,
  listBlocksForDay,
  listChecks,
  listMeasures,
  materializeDay,
  setDayOverride,
} from '../db/repo';
import { resolveDayType } from '../domain/dayType';
import { dayPosition, isMinimumDone } from '../domain/schedule';
import { computeStreak } from '../domain/streak';
import { addDays, fromMinutes, minutesOfDay, toISODate, toMinutes } from '../domain/time';
import {
  addBlockArgs,
  addEventArgs,
  applyArgs,
  deleteBlockArgs,
  editBlockArgs,
  emptyArgs,
  getProgressArgs,
  getScheduleArgs,
  logNoteArgs,
  proposeArgs,
  setDayOverrideArgs,
  type Scope,
  type ScheduleChange,
} from './schema';
import { applyChanges, buildDiff, validateProposal } from './proposal';

export interface ToolContext {
  profile: Profile;
  today: string;
}

export interface ToolResult {
  ok: boolean;
  /** Данные для модели: только факты, без разметки. */
  data: unknown;
}

/** Куда именно ложится изменение: тип дня-шаблон или конкретная дата. */
async function resolveTarget(
  scope: Scope,
  context: ToolContext,
): Promise<{ dayType: DayTypeCode; date: string; blocks: Block[] }> {
  const rule = { mode: context.profile.englishMode, englishDays: context.profile.englishDays };

  if (scope.kind === 'today' || scope.kind === 'range') {
    const date = scope.kind === 'today' ? scope.date : scope.from;
    const dayType = resolveDayType(date, null, rule);
    return { dayType, date, blocks: await listBlocksForDay(dayType, date) };
  }

  const dayType =
    scope.kind === 'dayType' ? scope.dayType : resolveDayType(context.today, null, rule);
  return { dayType, date: '', blocks: await listBlocks(dayType) };
}

/** Готовит предложение и складывает его в историю неприменённым. */
async function propose(
  changes: ScheduleChange[],
  scope: Scope,
  summary: string,
  context: ToolContext,
): Promise<ToolResult> {
  const target = await resolveTarget(scope, context);
  const result = applyChanges(target.blocks, changes, stamp());
  const problems = [...result.problems, ...validateProposal(result.blocks, context.profile)];
  const diff = buildDiff(target.blocks, result.blocks);

  if (problems.length > 0) {
    return { ok: false, data: { problems, diff } };
  }

  const record: ChangeRecord = {
    id: newId(),
    createdAt: stamp(),
    summary,
    scope: scope as unknown as Record<string, unknown>,
    dayType: target.dayType,
    date: target.date,
    before: target.blocks,
    after: result.blocks.map(({ isNew: _isNew, ...block }) => block),
    applied: false,
    undone: false,
    updatedAt: stamp(),
  };
  await db.changes.put(record);

  return { ok: true, data: { changeId: record.id, diff, summary } };
}

/**
 * Снимки записи в терминах реальных строк базы. Для правки «только сегодня»
 * шаблон сначала копируется в разовые блоки дня, и идентификаторы получают префикс даты.
 */
async function materializeRecord(
  record: ChangeRecord,
): Promise<{ before: Block[]; after: Block[] }> {
  if (record.date === '') return { before: record.before, after: record.after };

  await materializeDay(record.dayType, record.date);
  const withDate = (block: Block): Block => ({
    ...block,
    id: block.id.startsWith(`${record.date}-`) ? block.id : `${record.date}-${block.id}`,
    date: record.date,
  });

  return { before: record.before.map(withDate), after: record.after.map(withDate) };
}

/** Применяет подтверждённое изменение: только по явной команде пользователя. */
export async function applyChange(changeId: string): Promise<ToolResult> {
  const record = await db.changes.get(changeId);
  if (!record) return { ok: false, data: { error: 'not_found' } };
  if (record.applied) return { ok: true, data: { alreadyApplied: true } };

  const { before, after } = await materializeRecord(record);
  const keep = new Set(after.map((block) => block.id));

  for (const block of before) {
    if (!keep.has(block.id)) {
      await db.blocks.put({ ...block, deleted: true, updatedAt: stamp() });
    }
  }
  for (const block of after) {
    await db.blocks.put({
      ...block,
      dayType: record.dayType,
      date: record.date,
      updatedAt: stamp(),
    });
  }

  await db.changes.put({ ...record, applied: true, updatedAt: stamp() });
  return { ok: true, data: { applied: true, changeId } };
}

/** Отмена последнего применённого изменения. */
export async function undoLastChange(): Promise<ToolResult> {
  const applied = (await db.changes.toArray())
    .filter((record) => record.applied && !record.undone)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const record = applied.at(-1);
  if (!record) return { ok: false, data: { error: 'nothing_to_undo' } };

  const { before, after } = await materializeRecord(record);
  const keep = new Set(before.map((block) => block.id));

  for (const block of after) {
    if (!keep.has(block.id)) {
      await db.blocks.put({ ...block, deleted: true, updatedAt: stamp() });
    }
  }
  for (const block of before) {
    await db.blocks.put({
      ...block,
      dayType: record.dayType,
      date: record.date,
      deleted: false,
      updatedAt: stamp(),
    });
  }

  await db.changes.put({ ...record, undone: true, updatedAt: stamp() });
  return { ok: true, data: { undone: true, summary: record.summary } };
}

async function todayState(context: ToolContext): Promise<ToolResult> {
  const rule = { mode: context.profile.englishMode, englishDays: context.profile.englishDays };
  const day = await db.days.where('date').equals(context.today).first();
  const dayType = resolveDayType(context.today, day?.typeOverride ?? null, rule);
  const [blocks, checks, days, sessions] = await Promise.all([
    listBlocksForDay(dayType, context.today),
    listChecks(context.today),
    db.days.toArray(),
    db.sessions.where('date').equals(context.today).toArray(),
  ]);
  const checked = checks.map((check) => check.blockId);
  const position = dayPosition(blocks, minutesOfDay(new Date()));

  return {
    ok: true,
    data: {
      date: context.today,
      dayType,
      now: position.current
        ? {
            title: position.current.title ?? position.current.titleKey,
            remaining: position.remaining,
          }
        : null,
      next: position.next ? (position.next.title ?? position.next.titleKey) : null,
      doneBlocks: checked.length,
      totalBlocks: blocks.length,
      minimumDone: isMinimumDone(blocks, checked),
      streak: computeStreak(
        days.filter((row) => row.minDone).map((row) => row.date),
        context.today,
      ),
      pomodoro: {
        clean: sessions.filter((s) => s.kind === 'pomodoro' && !s.broken).length,
        broken: sessions.filter((s) => s.kind === 'pomodoro' && s.broken).length,
      },
      sleepTarget: context.profile.sleepTarget,
    },
  };
}

function serializeBlocks(blocks: readonly Block[]): unknown[] {
  return blocks.map((block) => ({
    id: block.id,
    start: fromMinutes(block.start),
    end: fromMinutes(block.end),
    title: block.title ?? block.titleKey,
    category: block.category,
    isCore: block.isCore,
    isFocus: block.isFocus,
    protocolId: block.protocolId,
  }));
}

export type ToolName =
  | 'get_schedule'
  | 'propose_schedule_change'
  | 'apply_schedule_change'
  | 'add_block'
  | 'edit_block'
  | 'delete_block'
  | 'set_day_override'
  | 'add_event'
  | 'get_progress'
  | 'get_today_state'
  | 'log_note';

/** Выполняет вызов инструмента с проверкой аргументов через zod. */
export async function runTool(
  name: string,
  rawArgs: unknown,
  context: ToolContext,
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'get_schedule': {
        const args = getScheduleArgs.parse(rawArgs);
        const rule = {
          mode: context.profile.englishMode,
          englishDays: context.profile.englishDays,
        };
        if (args.from) {
          const days: unknown[] = [];
          let cursor = args.from;
          const last = args.to ?? args.from;
          let guard = 0;
          while (cursor <= last && guard < 31) {
            const day = await db.days.where('date').equals(cursor).first();
            const dayType = resolveDayType(cursor, day?.typeOverride ?? null, rule);
            days.push({
              date: cursor,
              dayType,
              blocks: serializeBlocks(await listBlocksForDay(dayType, cursor)),
            });
            cursor = addDays(cursor, 1);
            guard += 1;
          }
          return { ok: true, data: { days } };
        }
        const dayType = args.dayType ?? resolveDayType(context.today, null, rule);
        return { ok: true, data: { dayType, blocks: serializeBlocks(await listBlocks(dayType)) } };
      }

      case 'propose_schedule_change': {
        const args = proposeArgs.parse(rawArgs);
        return propose(args.changes, args.scope, args.summary, context);
      }

      case 'apply_schedule_change': {
        const args = applyArgs.parse(rawArgs);
        return applyChange(args.changeId);
      }

      case 'add_block': {
        const args = addBlockArgs.parse(rawArgs);
        return propose([{ op: 'add', block: args.block }], args.scope, args.block.title, context);
      }

      case 'edit_block': {
        const args = editBlockArgs.parse(rawArgs);
        return propose(
          [{ op: 'edit', blockId: args.blockId, patch: args.patch }],
          args.scope,
          args.blockId,
          context,
        );
      }

      case 'delete_block': {
        const args = deleteBlockArgs.parse(rawArgs);
        return propose(
          [{ op: 'delete', blockId: args.blockId }],
          args.scope,
          args.blockId,
          context,
        );
      }

      case 'set_day_override': {
        const args = setDayOverrideArgs.parse(rawArgs);
        await setDayOverride(args.date, args.dayType);
        return { ok: true, data: { date: args.date, dayType: args.dayType } };
      }

      case 'add_event': {
        const args = addEventArgs.parse(rawArgs);
        // Разовое событие без пересечений добавляется сразу — это разрешённое исключение.
        const rule = {
          mode: context.profile.englishMode,
          englishDays: context.profile.englishDays,
        };
        const dayType = resolveDayType(args.date, null, rule);
        const blocks = await materializeDay(dayType, args.date);
        const draft = applyChanges(
          blocks,
          [
            {
              op: 'add',
              block: {
                title: args.title,
                start: args.start,
                end: args.end,
                category: args.priority === 'high' ? 'ioi' : 'free',
              },
            },
          ],
          stamp(),
        );
        const problems = [...draft.problems, ...validateProposal(draft.blocks, context.profile)];
        if (problems.length > 0) {
          return propose(
            [
              {
                op: 'add',
                block: { title: args.title, start: args.start, end: args.end, category: 'free' },
              },
            ],
            { kind: 'today', date: args.date },
            args.title,
            context,
          );
        }
        const added = draft.blocks.find((block) => block.title === args.title);
        if (added) {
          const { isNew: _isNew, ...row } = added;
          await db.blocks.put({ ...row, dayType, date: args.date });
        }
        return { ok: true, data: { added: args.title, date: args.date } };
      }

      case 'get_progress': {
        const args = getProgressArgs.parse(rawArgs);
        const from = addDays(context.today, -args.days);
        const rows = (await listMeasures(args.metric)).filter((row) => row.date >= from);
        return {
          ok: true,
          data: {
            metric: args.metric,
            points: rows.map((row) => ({ date: row.date, value: row.value })),
          },
        };
      }

      case 'get_today_state': {
        emptyArgs.parse(rawArgs ?? {});
        return todayState(context);
      }

      case 'log_note': {
        const args = logNoteArgs.parse(rawArgs);
        await addLog(args.date, 'note', { text: args.text });
        return { ok: true, data: { saved: true } };
      }

      default:
        return { ok: false, data: { error: `unknown_tool:${name}` } };
    }
  } catch (cause) {
    if (cause instanceof z.ZodError) {
      return { ok: false, data: { error: 'invalid_arguments', issues: cause.issues } };
    }
    return { ok: false, data: { error: cause instanceof Error ? cause.message : String(cause) } };
  }
}

/** Список неприменённых предложений — их показывает интерфейс. */
export async function pendingChanges(): Promise<ChangeRecord[]> {
  const rows = await db.changes.toArray();
  return rows
    .filter((record) => !record.applied && !record.deleted)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export { toISODate, toMinutes };
