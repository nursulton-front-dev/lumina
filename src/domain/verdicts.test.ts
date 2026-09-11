import { describe, expect, test } from 'vitest';
import { blockAdvice, dayVerdict, focusVerdict, workoutVerdict } from './verdicts';

describe('вывод по фокусу', () => {
  test('чистая сессия комментария не требует', () => {
    expect(focusVerdict({ exits: 0, broken: false, minutes: 25 })).toBeNull();
  });

  test('сорванная сессия комментируется с числом выходов', () => {
    expect(focusVerdict({ exits: 4, broken: true, minutes: 25 })).toEqual({
      key: 'verdict.focusBroken',
      vars: { exits: 4 },
    });
  });

  test('много коротких выходов тоже стоят строки', () => {
    expect(focusVerdict({ exits: 3, broken: false, minutes: 25 })?.key).toBe('verdict.focusNoisy');
  });
});

describe('вывод по тренировке', () => {
  test('два проваленных подхода означают снижение нагрузки', () => {
    expect(workoutVerdict({ setsDone: 8, setsFailed: 2, skipped: 0 })?.key).toBe(
      'verdict.workoutDown',
    );
  });

  test('чистая тренировка получает короткое подтверждение', () => {
    expect(workoutVerdict({ setsDone: 12, setsFailed: 0, skipped: 0 })).toEqual({
      key: 'verdict.workoutClean',
      vars: { sets: 12 },
    });
  });

  test('пустая тренировка комментария не получает', () => {
    expect(workoutVerdict({ setsDone: 0, setsFailed: 0, skipped: 0 })).toBeNull();
  });
});

describe('вывод по дню', () => {
  test('утром приложение молчит', () => {
    expect(
      dayVerdict({
        minimumDone: false,
        coreLeft: 3,
        doneBlocks: 0,
        totalBlocks: 18,
        minutesToBedtime: 600,
      }),
    ).toBeNull();
  });

  test('вечером напоминает про незакрытый минимум', () => {
    expect(
      dayVerdict({
        minimumDone: false,
        coreLeft: 2,
        doneBlocks: 9,
        totalBlocks: 18,
        minutesToBedtime: 60,
      }),
    ).toEqual({ key: 'verdict.dayMinimumLeft', vars: { left: 2 } });
  });

  test('закрытый день получает сухое подтверждение', () => {
    expect(
      dayVerdict({
        minimumDone: true,
        coreLeft: 0,
        doneBlocks: 15,
        totalBlocks: 18,
        minutesToBedtime: 30,
      })?.key,
    ).toBe('verdict.dayClosed');
  });
});

describe('совет перед блоком', () => {
  test('после срыва предупреждает о телефоне', () => {
    expect(
      blockAdvice({ isFocus: true, isCore: false, category: 'ioi', brokenToday: 2, remaining: 90 })
        ?.key,
    ).toBe('verdict.blockBrokenBefore');
  });

  test('обычный блок обходится без совета', () => {
    expect(
      blockAdvice({
        isFocus: false,
        isCore: false,
        category: 'rest',
        brokenToday: 0,
        remaining: 40,
      }),
    ).toBeNull();
  });
});
