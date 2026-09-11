/** Тренажёр чисел: генерация, оценка и адаптивная длина последовательности. */

export const START_LENGTH = 12;
export const MEMORIZE_SECONDS = 45;
export const ROUNDS_PER_SESSION = 5;
export const MIN_LENGTH = 4;
export const MAX_LENGTH = 40;
const STEP = 2;
const STREAK_TO_CHANGE = 2;

export interface TrainerState {
  length: number;
  successStreak: number;
  failStreak: number;
}

export const INITIAL_TRAINER: TrainerState = {
  length: START_LENGTH,
  successStreak: 0,
  failStreak: 0,
};

/** Последовательность цифр заданной длины. rng подставляется в тестах. */
export function generateDigits(length: number, rng: () => number = Math.random): string {
  const size = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(length)));
  let digits = '';
  for (let index = 0; index < size; index += 1) {
    digits += String(Math.floor(rng() * 10));
  }
  return digits;
}

export interface AttemptScore {
  /** Сколько цифр совпало по позициям. */
  correct: number;
  /** Доля совпавших цифр, 0…1. */
  accuracy: number;
  /** Полное совпадение без единой ошибки. */
  perfect: boolean;
  mistakes: number;
}

export function scoreAttempt(target: string, answer: string): AttemptScore {
  const cleaned = answer.replace(/\D/g, '');
  let correct = 0;
  for (let index = 0; index < target.length; index += 1) {
    if (cleaned[index] === target[index]) correct += 1;
  }
  const accuracy = target.length === 0 ? 0 : correct / target.length;
  return {
    correct,
    accuracy,
    perfect: correct === target.length && cleaned.length === target.length,
    mistakes: target.length - correct,
  };
}

/**
 * Две удачные попытки подряд — плюс две цифры, две неудачные — минус две.
 * Одиночный результат длину не меняет: иначе тренажёр скачет от случайности.
 */
export function nextTrainerState(state: TrainerState, perfect: boolean): TrainerState {
  if (perfect) {
    const successStreak = state.successStreak + 1;
    if (successStreak < STREAK_TO_CHANGE) return { ...state, successStreak, failStreak: 0 };
    return {
      length: Math.min(MAX_LENGTH, state.length + STEP),
      successStreak: 0,
      failStreak: 0,
    };
  }

  const failStreak = state.failStreak + 1;
  if (failStreak < STREAK_TO_CHANGE) return { ...state, failStreak, successStreak: 0 };
  return {
    length: Math.max(MIN_LENGTH, state.length - STEP),
    successStreak: 0,
    failStreak: 0,
  };
}

/** Лучшая безошибочная длина за сессию — она и попадает в прогресс. */
export function bestPerfectLength(rounds: readonly { length: number; perfect: boolean }[]): number {
  return rounds.reduce((best, round) => (round.perfect ? Math.max(best, round.length) : best), 0);
}

/** Цифры показываются группами по три — так их и советует запоминать подсказка. */
export function chunkDigits(digits: string, size = 3): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < digits.length; index += size) {
    chunks.push(digits.slice(index, index + size));
  }
  return chunks;
}
