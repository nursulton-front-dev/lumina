import type { Profile } from '../types';
import { db, readMeta, writeMeta } from '../db/db';
import { listBlocksForDay, listChecks, listBlocks } from '../db/repo';
import { resolveDayType } from '../domain/dayType';
import { focusStats } from '../domain/pomodoro';
import { computeStreak } from '../domain/streak';
import { addDays, fromMinutes } from '../domain/time';
import { minutesToHours, DIRECTIONS } from '../domain/week';

const HASH_KEY = 'ai.scheduleHash';
const STATS_DAYS = 14;

function hash(input: string): string {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) | 0;
  }
  return value.toString(36);
}

function compact(
  blocks: readonly {
    id: string;
    start: number;
    end: number;
    title: string | null;
    titleKey: string | null;
    category: string;
    isCore: boolean;
    isFocus: boolean;
  }[],
): string {
  return blocks
    .map(
      (block) =>
        `${block.id} ${fromMinutes(block.start)}-${fromMinutes(block.end)} ${block.title ?? block.titleKey ?? ''} [${block.category}${block.isCore ? ',min' : ''}${block.isFocus ? ',focus' : ''}]`,
    )
    .join('\n');
}

/**
 * Контекст для ассистента. Шаблоны расписания пересылаются только когда изменились —
 * иначе в каждое сообщение уезжали бы сотни строк и деньги за токены.
 */
export async function buildContext(profile: Profile, today: string): Promise<string> {
  const rule = { mode: profile.englishMode, englishDays: profile.englishDays };
  const day = await db.days.where('date').equals(today).first();
  const dayType = resolveDayType(today, day?.typeOverride ?? null, rule);

  const [blocks, checks, days, sessions, measures, checksAll, allBlocks] = await Promise.all([
    listBlocksForDay(dayType, today),
    listChecks(today),
    db.days.toArray(),
    db.sessions.where('date').between(addDays(today, -STATS_DAYS), today, true, true).toArray(),
    db.measures.where('date').between(addDays(today, -STATS_DAYS), today, true, true).toArray(),
    db.checks.where('date').between(addDays(today, -STATS_DAYS), today, true, true).toArray(),
    db.blocks.toArray(),
  ]);

  const checkedIds = new Set(checks.map((check) => check.blockId));
  const blockById = new Map(allBlocks.map((block) => [block.id, block]));

  const minutes = new Map<string, number>();
  for (const check of checksAll) {
    if (check.deleted) continue;
    const block = blockById.get(check.blockId);
    if (!block) continue;
    minutes.set(block.category, (minutes.get(block.category) ?? 0) + (block.end - block.start));
  }

  const focus = focusStats(sessions);
  const streak = computeStreak(
    days.filter((row) => row.minDone).map((row) => row.date),
    today,
  );

  const templates: string[] = [];
  for (const code of ['odd', 'even', 'sat', 'sun'] as const) {
    templates.push(`# ${code}\n${compact(await listBlocks(code))}`);
  }
  const templatesText = templates.join('\n');
  const currentHash = hash(templatesText);
  const sentHash = await readMeta<string>(HASH_KEY);
  const includeTemplates = sentHash !== currentHash;
  if (includeTemplates) await writeMeta(HASH_KEY, currentHash);

  const calendar: string[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(today, offset);
    const override = days.find((row) => row.date === date)?.typeOverride ?? null;
    calendar.push(`${date}=${resolveDayType(date, override, rule)}`);
  }

  const lines = [
    `Сегодня: ${today}, тип дня: ${dayType}, серия: ${streak}.`,
    `Календарь на неделю (дата=тип дня, суббота и воскресенье имеют свои шаблоны): ${calendar.join(', ')}.`,
    'Для правок на конкретную дату используйте scope {kind:"today", date} и идентификаторы блоков из get_schedule с from/to на эту дату — тип дня определится сам.',
    `Профиль: подъём ${profile.wakeTime}, целевой отбой ${profile.sleepTarget}, школа ${profile.schoolStart}-${profile.schoolEnd}, дорога ${profile.commuteMinutes} мин, подтягиваний ${profile.maxPullups}, отжиманий ${profile.maxPushups}, мяч: ${profile.hasBall ? 'есть' : 'нет'}.`,
    '',
    'Расписание на сегодня:',
    compact(blocks),
    '',
    `Отмечено сегодня: ${[...checkedIds].length} из ${blocks.length}.`,
    `Фокус за ${STATS_DAYS} дней: чистых ${focus.clean}, сорванных ${focus.broken}, выходов ${focus.exits}, минут ${focus.minutes}.`,
    `Часы за ${STATS_DAYS} дней: ${DIRECTIONS.map((direction) => `${direction} ${minutesToHours(minutes.get(direction) ?? 0)}`).join(', ')}.`,
    `Замеры за ${STATS_DAYS} дней: ${
      measures.length === 0
        ? 'нет'
        : measures.map((row) => `${row.metric}=${row.value} (${row.date})`).join(', ')
    }.`,
  ];

  if (includeTemplates) {
    lines.push('', 'Шаблоны расписания по типам дня (изменились с прошлого раза):', templatesText);
  } else {
    lines.push('', 'Шаблоны расписания не изменились с прошлого сообщения.');
  }

  return lines.join('\n');
}

/** Сбрасывает кеш шаблонов: следующее сообщение отправит расписание целиком. */
export async function resetContextCache(): Promise<void> {
  await writeMeta(HASH_KEY, null);
}
