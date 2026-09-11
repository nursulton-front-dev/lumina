import { describe, expect, test } from 'vitest';
import {
  daysUntilDeload,
  isDeloadWeek,
  landingsBudget,
  nextAdjustment,
  NEUTRAL_ADJUSTMENT,
  pullupLevel,
  scaleReps,
  scaleSets,
  seasonWeek,
  workingReps,
} from './progression';

describe('pullupLevel', () => {
  test('два подтягивания — стартовый уровень', () => {
    expect(pullupLevel(2)).toBe('beginner');
  });

  test('граница пяти повторений переключает уровень', () => {
    expect(pullupLevel(4)).toBe('beginner');
    expect(pullupLevel(5)).toBe('intermediate');
  });

  test('десять и больше — продвинутый уровень', () => {
    expect(pullupLevel(9)).toBe('intermediate');
    expect(pullupLevel(10)).toBe('advanced');
  });
});

describe('workingReps', () => {
  test('берёт 65 процентов от максимума', () => {
    expect(workingReps(20)).toBe(13);
  });

  test('никогда не опускается ниже одного повторения', () => {
    expect(workingReps(1)).toBe(1);
    expect(workingReps(0)).toBe(1);
  });
});

describe('сезон и разгрузка', () => {
  const start = '2026-09-07';

  test('первая неделя сезона', () => {
    expect(seasonWeek(start, '2026-09-10')).toBe(1);
  });

  test('четвёртая неделя — разгрузочная', () => {
    expect(seasonWeek(start, '2026-09-28')).toBe(4);
    expect(isDeloadWeek(start, '2026-09-28')).toBe(true);
  });

  test('после четвёртой недели цикл начинается заново', () => {
    expect(seasonWeek(start, '2026-10-05')).toBe(1);
  });

  test('приложение предупреждает заранее', () => {
    expect(daysUntilDeload(start, '2026-09-25')).toBe(3);
    expect(daysUntilDeload(start, '2026-09-28')).toBe(0);
  });
});

describe('лимит приземлений', () => {
  test('первые четыре недели — сто приземлений', () => {
    expect(landingsBudget(0)).toBe(100);
    expect(landingsBudget(3)).toBe(100);
  });

  test('дальше лимит поднимается до ста сорока', () => {
    expect(landingsBudget(4)).toBe(140);
  });
});

describe('снижение нагрузки после провалов', () => {
  test('один провал ещё ничего не меняет', () => {
    expect(nextAdjustment(NEUTRAL_ADJUSTMENT, true)).toEqual({ failStreak: 1, factor: 1 });
  });

  test('два провала подряд снижают нагрузку на десять процентов', () => {
    const first = nextAdjustment(NEUTRAL_ADJUSTMENT, true);
    expect(nextAdjustment(first, true)).toEqual({ failStreak: 0, factor: 0.9 });
  });

  test('выполненный подход обнуляет счётчик провалов', () => {
    const first = nextAdjustment(NEUTRAL_ADJUSTMENT, true);
    expect(nextAdjustment(first, false)).toEqual({ failStreak: 0, factor: 1 });
  });

  test('нагрузка не падает ниже половины', () => {
    let adjustment = { failStreak: 0, factor: 0.55 };
    for (let i = 0; i < 10; i += 1) adjustment = nextAdjustment(adjustment, true);
    expect(adjustment.factor).toBeGreaterThanOrEqual(0.5);
  });
});

describe('пересчёт объёма', () => {
  test('разгрузочная неделя срезает повторения на сорок процентов', () => {
    expect(scaleReps(10, 1, true)).toBe(6);
  });

  test('снижение и разгрузка складываются', () => {
    expect(scaleReps(10, 0.9, true)).toBe(5);
  });

  test('подходы на разгрузке тоже уменьшаются', () => {
    expect(scaleSets(4, true)).toBe(2);
    expect(scaleSets(4, false)).toBe(4);
  });
});
