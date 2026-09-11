import { describe, expect, test } from 'vitest';
import { RANKS, rankSpec } from '../data/ranks';
import { closestRank, rankStatus } from './ranks';

const bar = rankSpec('bar');
const voice = rankSpec('voice');
const ioi = rankSpec('ioi');

describe('разряды по замеру', () => {
  test('до первого норматива разряда нет', () => {
    const status = rankStatus(bar!, 0);
    expect(status.grade).toBeNull();
    expect(status.next?.grade).toBe('youth3');
  });

  test('стартовые два подтягивания дают третий юношеский', () => {
    const status = rankStatus(bar!, 2);
    expect(status.grade).toBe('youth3');
    expect(status.next?.value).toBe(3);
  });

  test('результат выше высшего норматива закрывает шкалу', () => {
    const status = rankStatus(bar!, 30);
    expect(status.grade).toBe('ms');
    expect(status.next).toBeNull();
    expect(status.share).toBe(1);
  });

  test('доля пути до следующего разряда считается между порогами', () => {
    const status = rankStatus(bar!, 4);
    expect(status.grade).toBe('youth2');
    expect(status.next?.value).toBe(5);
    expect(status.share).toBeCloseTo(0.5, 1);
  });
});

describe('разряды, где меньше — лучше', () => {
  test('двадцать пять паразитов — третий юношеский', () => {
    expect(rankStatus(voice!, 25).grade).toBe('youth3');
  });

  test('меньше паразитов — выше разряд', () => {
    expect(rankStatus(voice!, 8).grade).toBe('adult2');
  });

  test('слишком много паразитов — разряда ещё нет', () => {
    expect(rankStatus(voice!, 40).grade).toBeNull();
  });
});

describe('составные направления', () => {
  test('нужны оба показателя: задачи и контесты', () => {
    expect(rankStatus(ioi!, 30, 0).grade).toBe('youth3');
    expect(rankStatus(ioi!, 30, 1).grade).toBe('youth2');
  });

  test('одних задач без контестов недостаточно для второго разряда', () => {
    expect(rankStatus(ioi!, 400, 0).grade).toBe('youth3');
  });
});

describe('ближайший разряд', () => {
  test('направление без замеров не считается ближайшим', () => {
    const items = [
      { id: 'empty', hasData: false, status: rankStatus(bar!, 0) },
      { id: 'real', hasData: true, status: rankStatus(bar!, 2) },
    ];
    expect(closestRank(items)?.id).toBe('real');
  });

  test('выбирается направление с наибольшей готовностью', () => {
    const items = [
      { id: 'a', hasData: true, status: rankStatus(bar!, 1) },
      { id: 'b', hasData: true, status: rankStatus(bar!, 4) },
    ];
    expect(closestRank(items)?.id).toBe('b');
  });

  test('когда всё закрыто, ближайшего нет', () => {
    expect(closestRank([{ hasData: true, status: rankStatus(bar!, 40) }])).toBeNull();
  });
});

describe('таблица нормативов', () => {
  test('у каждого направления восемь порогов', () => {
    for (const spec of RANKS) {
      expect(spec.thresholds, spec.id).toHaveLength(8);
      if (spec.secondThresholds) expect(spec.secondThresholds, spec.id).toHaveLength(8);
    }
  });

  test('пороги идут по возрастанию сложности', () => {
    for (const spec of RANKS) {
      for (let index = 1; index < spec.thresholds.length; index += 1) {
        const previous = spec.thresholds[index - 1] as number;
        const current = spec.thresholds[index] as number;
        if (spec.lowerIsBetter) expect(current, spec.id).toBeLessThan(previous);
        else expect(current, spec.id).toBeGreaterThan(previous);
      }
    }
  });
});
