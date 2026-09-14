/**
 * План дня для бота. Считается из тех же шаблонов, что и приложение
 * (src/data/schedule.ts), поэтому не зависит от того, открывали ли приложение.
 * Присланный из приложения план на конкретную дату (разовые правки, отметки)
 * имеет приоритет, но его отсутствие ничего не ломает.
 */
import { seedBlocks } from '../../src/data/schedule';
import { autoDayType } from '../../src/domain/dayType';
import { blocksForWeekday } from '../../src/domain/schedule';
import { fromISODate, fromMinutes, toMinutes } from '../../src/domain/time';
import { dictionaries, type TranslationKey } from '../../src/i18n';
import type { DayTypeCode, Lang } from '../../src/types';

export interface PlanBlock {
  id: string;
  /** Минуты от полуночи. */
  start: number;
  end: number;
  title: string;
  category: string;
  isCore: boolean;
  /** Напоминать о начале — галочка из приложения. */
  remind: boolean;
  done: boolean;
}

export interface DayPlan {
  date: string;
  dayType: DayTypeCode;
  lang: Lang;
  blocks: PlanBlock[];
  /** Целевой отбой «ЧЧ:ММ»: из приложения, иначе из блока «Отбой». */
  sleepTarget: string;
}

/** То, что приложение присылает на дату. Все поля, кроме date, необязательны. */
export interface DayExport {
  date: string;
  dayType?: DayTypeCode;
  lang?: Lang;
  sleepTarget?: string;
  blocks?: {
    id: string;
    start: string;
    end: string;
    title: string;
    category: string;
    isCore?: boolean;
    remind?: boolean;
    done?: boolean;
  }[];
}

const TEMPLATE = seedBlocks('2026-01-01T00:00:00.000Z');

function translate(lang: Lang, key: TranslationKey | null, fallback: string | null): string {
  if (fallback) return fallback;
  if (!key) return '';
  return dictionaries[lang][key] ?? String(key);
}

/** План из шаблона: тип дня по календарю, блоки по дню недели. */
export function templatePlan(date: string, lang: Lang, dayTypeOverride?: DayTypeCode): DayPlan {
  const dayType = dayTypeOverride ?? autoDayType(date);
  const weekday = fromISODate(date).getDay();
  const blocks = blocksForWeekday(
    TEMPLATE.filter((block) => block.dayType === dayType),
    weekday,
  )
    .sort((a, b) => a.start - b.start)
    .map((block) => ({
      id: block.id,
      start: block.start,
      end: block.end,
      title: translate(lang, block.titleKey, block.title),
      category: block.category,
      isCore: block.isCore,
      remind: false,
      done: false,
    }));
  const sleep = blocks.find((block) => block.category === 'sleep');
  return {
    date,
    dayType,
    lang,
    blocks,
    sleepTarget: sleep ? fromMinutes(sleep.start) : '23:00',
  };
}

/** План с учётом присланного из приложения: там уже локализованные названия и отметки. */
export function resolvePlan(date: string, lang: Lang, exported: DayExport | null): DayPlan {
  if (!exported || !Array.isArray(exported.blocks) || exported.blocks.length === 0) {
    const base = templatePlan(date, exported?.lang ?? lang, exported?.dayType);
    return exported?.sleepTarget ? { ...base, sleepTarget: exported.sleepTarget } : base;
  }
  const blocks: PlanBlock[] = exported.blocks
    .map((block) => ({
      id: block.id,
      start: toMinutes(block.start),
      end: toMinutes(block.end),
      title: block.title,
      category: block.category,
      isCore: block.isCore ?? false,
      remind: block.remind ?? false,
      done: block.done ?? false,
    }))
    .sort((a, b) => a.start - b.start);
  const sleep = blocks.find((block) => block.category === 'sleep');
  return {
    date,
    dayType: exported.dayType ?? autoDayType(date),
    lang: exported.lang ?? lang,
    blocks,
    sleepTarget: exported.sleepTarget ?? (sleep ? fromMinutes(sleep.start) : '23:00'),
  };
}

/** Текст закреплённого сообщения: план одним взглядом. */
export function formatPlan(plan: DayPlan): string {
  const dict = dictionaries[plan.lang];
  const weekday = fromISODate(plan.date).getDay();
  const day = plan.date.slice(8);
  const month = plan.date.slice(5, 7);
  const header = `<b>${dict[`weekday.${weekday}` as TranslationKey]}, ${day}.${month}</b> · ${dict[`daytype.${plan.dayType}` as TranslationKey]}`;
  const lines = plan.blocks.map((block) => {
    const mark = block.done ? '✓ ' : '';
    const core = block.isCore ? ` · ${dict['today.minimum']}` : '';
    return `${mark}<code>${fromMinutes(block.start)}</code> ${escapeHtml(block.title)}${core}`;
  });
  const done = plan.blocks.filter((block) => block.done).length;
  const footer = `${dict['today.done']}: ${done}/${plan.blocks.length} · ${dict['today.sleepTarget']}: ${plan.sleepTarget}`;
  return [header, '', ...lines, '', footer].join('\n');
}

export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char,
  );
}

export function sleepReminderMinute(plan: DayPlan): number {
  return toMinutes(plan.sleepTarget) - 30;
}
