/**
 * Правила напоминаний. Время — минуты от полуночи в Asia/Tashkent.
 * Правила по умолчанию заданы явно, как их продиктовал пользователь;
 * остальные блоки напоминают о себе по галочке «напоминать» из приложения.
 */
import { fromISODate } from '../../src/domain/time';
import { dictionaries, type TranslationKey } from '../../src/i18n';
import { sleepReminderMinute, type DayPlan } from './plan';

export interface Reminder {
  /** Уникальный ключ в пределах дня: для защиты от повтора и для отложить-на-15. */
  key: string;
  minute: number;
  text: string;
  /** Блок, к которому относится напоминание: даёт кнопку «Отметил». */
  blockId: string | null;
}

const MON_WED_FRI = [1, 3, 5];

function t(plan: DayPlan, key: TranslationKey): string {
  return dictionaries[plan.lang][key];
}

/** Все напоминания дня по плану. Порядок — по времени. */
export function remindersFor(plan: DayPlan): Reminder[] {
  const weekday = fromISODate(plan.date).getDay();
  const list: Reminder[] = [];

  const wake = plan.blocks.find(
    (block) => block.category === 'routine' && block.id.includes('block.wake'),
  );
  if (wake) {
    list.push({ key: 'wake', minute: wake.start, text: t(plan, 'bot.wake'), blockId: wake.id });
  }

  const brother = plan.blocks.find((block) => block.id.includes('block.brother'));
  if (brother) {
    list.push({
      key: 'brother',
      minute: brother.start,
      text: t(plan, 'bot.brother'),
      blockId: brother.id,
    });
  }

  if (MON_WED_FRI.includes(weekday)) {
    list.push({
      key: 'english',
      minute: 18 * 60 + 15,
      text: t(plan, 'bot.english'),
      blockId: null,
    });
  }

  if (weekday === 5) {
    list.push({ key: 'lesson', minute: 15 * 60, text: t(plan, 'bot.lesson'), blockId: null });
  }

  list.push({
    key: 'sleep',
    minute: sleepReminderMinute(plan),
    text: t(plan, 'bot.sleep'),
    blockId: null,
  });

  for (const block of plan.blocks) {
    if (!block.remind) continue;
    const taken = list.some((item) => item.blockId === block.id);
    if (taken) continue;
    list.push({
      key: `block:${block.id}`,
      minute: block.start,
      text: `${t(plan, 'bot.blockStarts')} ${block.title}`,
      blockId: block.id,
    });
  }

  return list.sort((a, b) => a.minute - b.minute);
}

/** Напоминания, которые должны уйти именно в эту минуту. */
export function dueNow(reminders: readonly Reminder[], minute: number): Reminder[] {
  return reminders.filter((item) => item.minute === minute);
}

/** Минута плана дня: 05:55. */
export const PLAN_MINUTE = 5 * 60 + 55;

/** Локальное время воркера: UTC плюс смещение. */
export function localNow(now: Date, offsetMinutes: number): { date: string; minute: number } {
  const shifted = new Date(now.getTime() + offsetMinutes * 60_000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    minute: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}
