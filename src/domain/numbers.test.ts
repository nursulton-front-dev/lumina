import { describe, expect, test } from 'vitest';
import {
  bestPerfectLength,
  chunkDigits,
  generateDigits,
  INITIAL_TRAINER,
  MAX_LENGTH,
  MIN_LENGTH,
  nextTrainerState,
  scoreAttempt,
} from './numbers';

describe('generateDigits', () => {
  test('выдаёт последовательность нужной длины из цифр', () => {
    const digits = generateDigits(12);
    expect(digits).toHaveLength(12);
    expect(digits).toMatch(/^\d+$/);
  });

  test('держится в допустимых границах длины', () => {
    expect(generateDigits(1)).toHaveLength(MIN_LENGTH);
    expect(generateDigits(500)).toHaveLength(MAX_LENGTH);
  });

  test('использует переданный генератор случайных чисел', () => {
    expect(generateDigits(5, () => 0.55)).toBe('55555');
  });
});

describe('scoreAttempt', () => {
  test('полное совпадение — безошибочная попытка', () => {
    const score = scoreAttempt('12345', '12345');
    expect(score.perfect).toBe(true);
    expect(score.accuracy).toBe(1);
    expect(score.mistakes).toBe(0);
  });

  test('считает совпадения по позициям', () => {
    const score = scoreAttempt('12345', '12945');
    expect(score.correct).toBe(4);
    expect(score.perfect).toBe(false);
    expect(score.mistakes).toBe(1);
  });

  test('пробелы и разделители в ответе не мешают', () => {
    expect(scoreAttempt('123456', '123 456').perfect).toBe(true);
  });

  test('короткий ответ не считается безошибочным', () => {
    expect(scoreAttempt('12345', '123').perfect).toBe(false);
  });
});

describe('адаптивность', () => {
  test('две удачные попытки подряд поднимают длину на две цифры', () => {
    const first = nextTrainerState(INITIAL_TRAINER, true);
    expect(first.length).toBe(12);
    expect(nextTrainerState(first, true).length).toBe(14);
  });

  test('две неудачные попытки подряд опускают длину на две цифры', () => {
    const first = nextTrainerState(INITIAL_TRAINER, false);
    expect(first.length).toBe(12);
    expect(nextTrainerState(first, false).length).toBe(10);
  });

  test('удача сбрасывает счётчик неудач', () => {
    const failed = nextTrainerState(INITIAL_TRAINER, false);
    const recovered = nextTrainerState(failed, true);
    expect(recovered.failStreak).toBe(0);
    expect(recovered.length).toBe(12);
  });

  test('длина не опускается ниже минимума', () => {
    let state = { length: MIN_LENGTH, successStreak: 0, failStreak: 0 };
    for (let i = 0; i < 6; i += 1) state = nextTrainerState(state, false);
    expect(state.length).toBe(MIN_LENGTH);
  });
});

describe('итог сессии', () => {
  test('в прогресс идёт самая длинная безошибочная попытка', () => {
    const rounds = [
      { length: 12, perfect: true },
      { length: 14, perfect: false },
      { length: 13, perfect: true },
    ];
    expect(bestPerfectLength(rounds)).toBe(13);
  });

  test('без единой безошибочной попытки результат нулевой', () => {
    expect(bestPerfectLength([{ length: 12, perfect: false }])).toBe(0);
  });
});

describe('chunkDigits', () => {
  test('режет на группы по три', () => {
    expect(chunkDigits('1234567')).toEqual(['123', '456', '7']);
  });
});
