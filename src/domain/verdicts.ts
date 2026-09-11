import type { TranslationKey } from '../i18n';

/**
 * Короткие выводы ассистента по ходу дня. Считаются из цифр на устройстве:
 * работают офлайн и не тратят ни одного запроса к API.
 * Если сказать нечего — возвращается null, и приложение молчит.
 */
export interface Verdict {
  key: TranslationKey;
  vars?: Record<string, string | number>;
}

export interface FocusInput {
  exits: number;
  broken: boolean;
  minutes: number;
}

/** Вывод по чистоте фокуса. Чистая сессия комментария не требует. */
export function focusVerdict(session: FocusInput): Verdict | null {
  if (session.broken) {
    return { key: 'verdict.focusBroken' as TranslationKey, vars: { exits: session.exits } };
  }
  if (session.exits >= 3) {
    return { key: 'verdict.focusNoisy' as TranslationKey, vars: { exits: session.exits } };
  }
  return null;
}

export interface WorkoutInput {
  setsDone: number;
  setsFailed: number;
  skipped: number;
}

/** Вывод по тренировке: что изменится в следующий раз. */
export function workoutVerdict(input: WorkoutInput): Verdict | null {
  if (input.setsFailed >= 2) {
    return { key: 'verdict.workoutDown' as TranslationKey, vars: { failed: input.setsFailed } };
  }
  if (input.setsFailed === 1) {
    return { key: 'verdict.workoutOneFail' as TranslationKey };
  }
  if (input.skipped >= 2) {
    return { key: 'verdict.workoutSkipped' as TranslationKey, vars: { skipped: input.skipped } };
  }
  if (input.setsDone > 0) {
    return { key: 'verdict.workoutClean' as TranslationKey, vars: { sets: input.setsDone } };
  }
  return null;
}

export interface DayInput {
  minimumDone: boolean;
  coreLeft: number;
  doneBlocks: number;
  totalBlocks: number;
  minutesToBedtime: number;
}

/** Одна строка по дню. Появляется вечером, а не с утра. */
export function dayVerdict(input: DayInput): Verdict | null {
  if (input.minutesToBedtime > 180) return null;
  if (!input.minimumDone) {
    return { key: 'verdict.dayMinimumLeft' as TranslationKey, vars: { left: input.coreLeft } };
  }
  if (input.doneBlocks < input.totalBlocks / 2) {
    return {
      key: 'verdict.dayThin' as TranslationKey,
      vars: { done: input.doneBlocks, total: input.totalBlocks },
    };
  }
  return { key: 'verdict.dayClosed' as TranslationKey, vars: { done: input.doneBlocks } };
}

export interface BlockInput {
  isFocus: boolean;
  isCore: boolean;
  category: string;
  /** Сорванных сессий фокуса сегодня. */
  brokenToday: number;
  /** Минут до конца блока. */
  remaining: number;
}

/** Как подойти к текущему блоку с учётом того, что уже произошло сегодня. */
export function blockAdvice(input: BlockInput): Verdict | null {
  if (input.isFocus && input.brokenToday >= 1) {
    return {
      key: 'verdict.blockBrokenBefore' as TranslationKey,
      vars: { broken: input.brokenToday },
    };
  }
  if (input.isFocus && input.remaining >= 50) {
    return { key: 'verdict.blockLongFocus' as TranslationKey, vars: { minutes: input.remaining } };
  }
  if (input.isCore && input.remaining <= 10) {
    return { key: 'verdict.blockCoreShort' as TranslationKey, vars: { minutes: input.remaining } };
  }
  return null;
}
