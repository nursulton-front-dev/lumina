import { describe, expect, test } from 'vitest';
import { isQuestDone, proposeQuests, questShare, weakestDirection, type WeekStats } from './quests';

const base: WeekStats = {
  landings: 80,
  cleanPomodoro: 8,
  bestDigits: 14,
  coreDays: 5,
  minutes: { ioi: 600, russian: 120, english: 300, freelance: 400 },
  weeksTrained: 1,
};

describe('proposeQuests', () => {
  test('предлагает от трёх до пяти задач', () => {
    const quests = proposeQuests(base);
    expect(quests.length).toBeGreaterThanOrEqual(3);
    expect(quests.length).toBeLessThanOrEqual(5);
  });

  test('приземления растут, но не выше недельного лимита', () => {
    const quests = proposeQuests({ ...base, landings: 130 });
    const landings = quests.find((quest) => quest.kind === 'landings');
    expect(landings?.target).toBeLessThanOrEqual(100);
  });

  test('после четырёх недель лимит приземлений выше', () => {
    const quests = proposeQuests({ ...base, landings: 130, weeksTrained: 5 });
    expect(quests.find((quest) => quest.kind === 'landings')?.target).toBe(140);
  });

  test('квест по часам ставится на просевшее направление', () => {
    const quests = proposeQuests(base);
    expect(quests.find((quest) => quest.kind === 'hours')?.category).toBe('russian');
  });

  test('чистых помодоро всегда просят больше, чем было', () => {
    const quests = proposeQuests(base);
    expect(quests.find((quest) => quest.kind === 'cleanPomodoro')?.target).toBe(10);
  });

  test('дни минимума не выходят за семь', () => {
    const quests = proposeQuests({ ...base, coreDays: 7 });
    expect(quests.find((quest) => quest.kind === 'coreDays')?.target).toBe(7);
  });
});

describe('weakestDirection', () => {
  test('выбирает направление с наименьшим временем', () => {
    expect(weakestDirection({ ioi: 100, russian: 50, english: 200, freelance: 300 })).toBe(
      'russian',
    );
  });

  test('нетронутое направление считается самым слабым', () => {
    expect(weakestDirection({ ioi: 100 })).toBe('russian');
  });
});

describe('прогресс квеста', () => {
  test('доля не выходит за единицу', () => {
    expect(questShare({ id: 'q', kind: 'digits', target: 10 }, 20)).toBe(1);
  });

  test('выполнение засчитывается по достижении цели', () => {
    const quest = { id: 'q', kind: 'digits' as const, target: 10 };
    expect(isQuestDone(quest, 9)).toBe(false);
    expect(isQuestDone(quest, 10)).toBe(true);
  });
});
