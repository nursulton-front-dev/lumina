import { describe, expect, test } from 'vitest';
import { dictionaries, LANGS } from './index';
import { resolveProtocol } from '../protocols/registry';
import { resolveWorkout } from '../protocols/workout';
import { seedBlocks } from '../data/schedule';
import { defaultProfile } from '../db/repo';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const LEVELS = [2, 7, 12];

function allProtocolKeys(): string[] {
  const keys = new Set<string>();
  for (const weekday of WEEKDAYS) {
    for (const maxPullups of LEVELS) {
      for (const hasBall of [false, true]) {
        const protocol = resolveWorkout({
          weekday,
          maxPullups,
          maxPushups: 25,
          hasBall,
          deload: true,
          daysUntilDeload: 1,
          adjustments: { 'ex.jumpSquats': 0.9 },
          maxTestDue: true,
          weeklyLandings: 999,
          weeksTrained: 1,
        });
        keys.add(protocol.titleKey);
        if (protocol.subtitleKey) keys.add(protocol.subtitleKey);
        for (const key of protocol.safetyKeys) keys.add(key);
        for (const note of protocol.notes) keys.add(note.key);
        for (const step of protocol.steps) {
          keys.add(step.titleKey);
          if (step.hintKey) keys.add(step.hintKey);
          for (const item of step.items) keys.add(item.key);
        }
      }
    }
  }

  const numbers = resolveProtocol('numbers', {
    date: '2026-09-10',
    weekday: 4,
    profile: defaultProfile('ru'),
    deload: false,
    daysUntilDeload: 10,
    adjustments: {},
    maxTestDue: false,
    weeklyLandings: 0,
    weeksTrained: 0,
  });
  if (numbers) {
    keys.add(numbers.titleKey);
    for (const step of numbers.steps) keys.add(step.titleKey);
  }

  return [...keys];
}

describe('покрытие переводов', () => {
  test('во всех языках одинаковый набор ключей', () => {
    const reference = Object.keys(dictionaries.ru).sort();
    for (const lang of LANGS) {
      expect(Object.keys(dictionaries[lang]).sort()).toEqual(reference);
    }
  });

  test('ни одна строка не осталась пустой', () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(dictionaries[lang])) {
        expect(value.trim(), `${lang}:${key}`).not.toBe('');
      }
    }
  });

  test('все ключи протоколов есть в каждом языке', () => {
    const keys = allProtocolKeys();
    expect(keys.length).toBeGreaterThan(40);
    for (const lang of LANGS) {
      for (const key of keys) {
        expect(
          dictionaries[lang][key as keyof (typeof dictionaries)['ru']],
          `${lang}:${key}`,
        ).toBeTruthy();
      }
    }
  });

  test('названия блоков расписания переведены на все языки', () => {
    for (const block of seedBlocks('2026-09-10T00:00:00.000Z')) {
      if (!block.titleKey) continue;
      for (const lang of LANGS) {
        expect(dictionaries[lang][block.titleKey], `${lang}:${block.titleKey}`).toBeTruthy();
      }
    }
  });

  test('русский текст не протёк в узбекский и английский словари', () => {
    const cyrillic = /[а-яё]/i;
    const allowed = new Set(['lang.ru']);
    for (const lang of ['uz', 'en'] as const) {
      for (const [key, value] of Object.entries(dictionaries[lang])) {
        if (allowed.has(key)) continue;
        expect(cyrillic.test(value), `${lang}:${key} → ${value}`).toBe(false);
      }
    }
  });
});
