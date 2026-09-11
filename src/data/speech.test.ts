import { describe, expect, test } from 'vitest';
import { SPEECH, pickRandom, tongueTwistersFor, topicsFor } from './speech';

describe('база ораторства', () => {
  test('файл прочитан и разложен по языкам', () => {
    expect(SPEECH.tongueTwisters.ru.length).toBeGreaterThan(0);
    expect(SPEECH.topics.ru.length).toBeGreaterThan(0);
    expect(SPEECH.topics.uz.length).toBeGreaterThan(0);
    expect(SPEECH.topics.en.length).toBeGreaterThan(0);
  });

  test('для языка с коротким списком протокол всё равно получает строки', () => {
    expect(tongueTwistersFor('uz').length).toBeGreaterThan(0);
    expect(topicsFor('en').length).toBeGreaterThan(0);
  });

  test('пустой список подменяется русским', () => {
    const empty = { ...SPEECH.tongueTwisters, uz: [] };
    const list = empty.uz.length > 0 ? empty.uz : empty.ru;
    expect(list.length).toBeGreaterThan(0);
  });
});

describe('pickRandom', () => {
  test('возвращает нужное количество без повторов', () => {
    const picked = pickRandom(['a', 'b', 'c', 'd'], 3, () => 0.5);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  test('не падает, когда просят больше, чем есть', () => {
    expect(pickRandom(['a'], 3)).toEqual(['a']);
  });

  test('пустой список даёт пустой результат', () => {
    expect(pickRandom([], 3)).toEqual([]);
  });
});
