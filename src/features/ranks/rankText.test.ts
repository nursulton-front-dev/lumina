import { describe, expect, test } from 'vitest';
import { rankSpec } from '../../data/ranks';
import { rankStatus } from '../../domain/ranks';
import { translate, translatePlural } from '../../i18n';
import { rankLeftText } from './rankText';

const t = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) =>
  translate('ru', key, vars);
const tp = (base: Parameters<typeof translatePlural>[1], n: number) => translatePlural('ru', base, n);

describe('rankLeftText', () => {
  test('два подтягивания: остаётся одно до 2-го юношеского', () => {
    const spec = rankSpec('bar')!;
    const view = { spec, status: rankStatus(spec, 2), hasData: true };
    expect(rankLeftText(view, t, tp)).toBe('Осталось 1 подтягивание до 2-го юношеского разряда');
  });

  test('склонение: 3 подтягивания, 5 подтягиваний', () => {
    const spec = rankSpec('bar')!;
    expect(rankLeftText({ spec, status: rankStatus(spec, 5), hasData: true }, t, tp)).toBe(
      'Осталось 3 подтягивания до 3-го разряда',
    );
    expect(rankLeftText({ spec, status: rankStatus(spec, 0), hasData: false }, t, tp)).toBe(
      'Осталось 1 подтягивание до 3-го юношеского разряда',
    );
  });

  test('составное направление перечисляет оба остатка', () => {
    const spec = rankSpec('ioi')!;
    const view = { spec, status: rankStatus(spec, 20, 0), hasData: true };
    expect(rankLeftText(view, t, tp)).toBe('Осталось 5 задач и 1 контест до 2-го юношеского разряда');
  });

  test('для паразитов формулировка «не больше»', () => {
    const spec = rankSpec('voice')!;
    const view = { spec, status: rankStatus(spec, 30), hasData: true };
    expect(rankLeftText(view, t, tp)).toBe(
      'Нужно не больше 25 слов-паразитов для 3-го юношеского разряда',
    );
  });

  test('закрытая шкала — без фразы', () => {
    const spec = rankSpec('bar')!;
    expect(rankLeftText({ spec, status: rankStatus(spec, 40), hasData: true }, t, tp)).toBeNull();
  });
});
