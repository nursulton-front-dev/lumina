import { daysBetween, fromMinutes, toMinutes } from './time';

/** Куда режим сна ведёт в итоге. */
export const SLEEP_FLOOR = '23:00';
/** На сколько минут цель сдвигается за один шаг. */
export const SLEEP_STEP_MINUTES = 15;
/** Как часто делается шаг. */
export const SLEEP_STEP_DAYS = 2;
/** За сколько минут до цели приходит напоминание убрать экран. */
export const SLEEP_REMINDER_MINUTES = 30;

/**
 * Время отбоя живёт в «вечерней» шкале: всё, что раньше полудня, считается
 * продолжением прошедшего вечера. Иначе 00:45 оказалось бы раньше 23:00.
 */
export function eveningMinutes(time: string): number {
  const minutes = toMinutes(time);
  return minutes < 12 * 60 ? minutes + 24 * 60 : minutes;
}

export interface SleepTarget {
  target: string;
  shiftedOn: string;
}

/**
 * Цель отбоя сдвигается на 15 минут раньше каждые два дня, пока не дойдёт до 23:00.
 * Возвращает новую цель и дату последнего сдвига.
 */
export function advanceSleepTarget(
  current: string,
  shiftedOn: string | null,
  today: string,
  floor: string = SLEEP_FLOOR,
): SleepTarget {
  const currentMinutes = eveningMinutes(current);
  const floorMinutes = eveningMinutes(floor);
  if (currentMinutes <= floorMinutes) return { target: floor, shiftedOn: shiftedOn ?? today };
  if (!shiftedOn) return { target: current, shiftedOn: today };

  const steps = Math.floor(daysBetween(shiftedOn, today) / SLEEP_STEP_DAYS);
  if (steps <= 0) return { target: current, shiftedOn };

  const shifted = Math.max(floorMinutes, currentMinutes - steps * SLEEP_STEP_MINUTES);
  return {
    target: fromMinutes(shifted),
    shiftedOn: shifted <= floorMinutes ? today : addDaysToShift(shiftedOn, steps),
  };
}

function addDaysToShift(shiftedOn: string, steps: number): string {
  const date = new Date(shiftedOn);
  date.setDate(date.getDate() + steps * SLEEP_STEP_DAYS);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Расхождение факта с планом в минутах. Положительное — лёг позже цели.
 * Время после полуночи считается продолжением вечера, а не ранним утром.
 */
export function bedtimeDrift(target: string, actual: string): number {
  return eveningMinutes(actual) - eveningMinutes(target);
}

/** Пора ли напоминать убрать экран. */
export function isSleepReminderDue(target: string, nowMinutes: number): boolean {
  const targetMinutes = eveningMinutes(target);
  const now = nowMinutes < 12 * 60 ? nowMinutes + 24 * 60 : nowMinutes;
  return now >= targetMinutes - SLEEP_REMINDER_MINUTES && now < targetMinutes;
}
