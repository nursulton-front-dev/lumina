import type { Block, Profile } from '../types';
import type { ScheduleChange } from './schema';
import { findOverlap, liveBlocks } from '../domain/schedule';
import { eveningMinutes } from '../domain/sleep';
import { fromMinutes, toMinutes } from '../domain/time';

/** Блок в предложении: ещё не сохранён, но уже с идентификатором. */
export interface DraftBlock extends Block {
  /** Блок появился в предложении и в базе его пока нет. */
  isNew?: boolean;
}

export type ProblemKind = 'overlap' | 'minimum' | 'bedtime' | 'budget' | 'unknownBlock' | 'range';

export interface ProblemInfo {
  kind: ProblemKind;
  /** Подробности для сообщения: названия блоков, часы, время. */
  details: Record<string, string | number>;
}

/** Применяет изменения к копии расписания. Ничего не пишет в базу. */
export function applyChanges(
  blocks: readonly Block[],
  changes: readonly ScheduleChange[],
  now: string,
): { blocks: DraftBlock[]; problems: ProblemInfo[] } {
  const problems: ProblemInfo[] = [];
  let result: DraftBlock[] = liveBlocks(blocks).map((block) => ({ ...block }));

  for (const change of changes) {
    if (change.op === 'add') {
      const start = toMinutes(change.block.start);
      const end = toMinutes(change.block.end);
      if (end <= start) {
        problems.push({ kind: 'range', details: { title: change.block.title } });
        continue;
      }
      result.push({
        id: `ai-${now}-${result.length}`,
        dayType: result[0]?.dayType ?? 'odd',
        date: result[0]?.date ?? '',
        weekdays: [],
        start,
        end,
        titleKey: null,
        title: change.block.title,
        category: change.block.category,
        protocolId: change.block.protocolId ?? null,
        isCore: change.block.isCore ?? false,
        isFocus: change.block.isFocus ?? false,
        order: start,
        updatedAt: now,
        isNew: true,
      });
      continue;
    }

    const index = result.findIndex((block) => block.id === change.blockId);
    if (index < 0) {
      problems.push({ kind: 'unknownBlock', details: { id: change.blockId } });
      continue;
    }

    if (change.op === 'delete') {
      result = result.filter((_, position) => position !== index);
      continue;
    }

    const target = result[index] as DraftBlock;
    const start = change.patch.start ? toMinutes(change.patch.start) : target.start;
    const end = change.patch.end ? toMinutes(change.patch.end) : target.end;
    if (end <= start) {
      problems.push({ kind: 'range', details: { title: target.title ?? target.id } });
      continue;
    }
    result[index] = {
      ...target,
      start,
      end,
      title: change.patch.title ?? target.title,
      titleKey: change.patch.title ? null : target.titleKey,
      category: change.patch.category ?? target.category,
      isCore: change.patch.isCore ?? target.isCore,
      isFocus: change.patch.isFocus ?? target.isFocus,
      protocolId:
        change.patch.protocolId === undefined ? target.protocolId : change.patch.protocolId,
      updatedAt: now,
    };
  }

  return { blocks: result.sort((a, b) => a.start - b.start), problems };
}

/**
 * Проверки, которые ассистент обязан пройти до показа предложения:
 * пересечения, минимум дня, отбой и недельный бюджет часов.
 * Минимум — те блоки, что были в дне до правки: в пятницу их два, в остальные дни три.
 */
export function validateProposal(
  next: readonly DraftBlock[],
  profile: Profile,
  availableHoursPerWeek = 168,
  before: readonly Block[] = [],
): ProblemInfo[] {
  const problems: ProblemInfo[] = [];
  const MINIMUM_CATEGORIES = [
    ...new Set(
      (before.length > 0 ? before : next)
        .filter((block) => block.isCore)
        .map((block) => block.category),
    ),
  ];

  for (const block of next) {
    const rest = next.filter((other) => other.id !== block.id);
    const overlap = findOverlap(rest, block);
    if (overlap) {
      problems.push({
        kind: 'overlap',
        details: {
          a: block.title ?? block.titleKey ?? block.id,
          b: overlap.title ?? overlap.titleKey ?? overlap.id,
          time: `${fromMinutes(overlap.start)}–${fromMinutes(overlap.end)}`,
        },
      });
      break;
    }
  }

  for (const category of MINIMUM_CATEGORIES) {
    if (!next.some((block) => block.isCore && block.category === category)) {
      problems.push({ kind: 'minimum', details: { category } });
    }
  }

  const bedtime = next.find((block) => block.category === 'sleep');
  if (bedtime && eveningMinutes(fromMinutes(bedtime.start)) > eveningMinutes(profile.sleepTarget)) {
    problems.push({
      kind: 'bedtime',
      details: { planned: fromMinutes(bedtime.start), target: profile.sleepTarget },
    });
  }

  const busyMinutes = next
    .filter((block) => block.category !== 'sleep' && block.category !== 'free')
    .reduce((sum, block) => sum + (block.end - block.start), 0);
  const weekHours = Math.round(((busyMinutes * 7) / 60) * 10) / 10;
  if (weekHours > availableHoursPerWeek) {
    problems.push({
      kind: 'budget',
      details: { requested: weekHours, available: availableHoursPerWeek },
    });
  }

  return problems;
}

export interface DiffRow {
  kind: 'added' | 'removed' | 'moved' | 'renamed';
  before: string | null;
  after: string | null;
}

function label(block: Block): string {
  return `${fromMinutes(block.start)}–${fromMinutes(block.end)} ${block.title ?? block.titleKey ?? ''}`.trim();
}

/** Дифф «было — стало» по времени: то, что видит пользователь перед подтверждением. */
export function buildDiff(before: readonly Block[], after: readonly DraftBlock[]): DiffRow[] {
  const rows: DiffRow[] = [];
  const beforeById = new Map(liveBlocks(before).map((block) => [block.id, block]));
  const afterById = new Map(after.map((block) => [block.id, block]));

  for (const [id, block] of beforeById) {
    const next = afterById.get(id);
    if (!next) {
      rows.push({ kind: 'removed', before: label(block), after: null });
      continue;
    }
    if (next.start !== block.start || next.end !== block.end) {
      rows.push({ kind: 'moved', before: label(block), after: label(next) });
      continue;
    }
    if ((next.title ?? next.titleKey) !== (block.title ?? block.titleKey)) {
      rows.push({ kind: 'renamed', before: label(block), after: label(next) });
    }
  }

  for (const [id, block] of afterById) {
    if (!beforeById.has(id)) rows.push({ kind: 'added', before: null, after: label(block) });
  }

  return rows;
}
