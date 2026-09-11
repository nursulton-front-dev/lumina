import type { TranslationKey } from '../i18n';
import type { Profile, ProtocolId } from '../types';
import { step, type ResolvedProtocol } from './types';
import { resolveWorkout } from './workout';
import { MEMORIZE_SECONDS } from '../domain/numbers';
import { pickRandom, tongueTwistersFor, topicsFor } from '../data/speech';

export interface ProtocolContext {
  date: string;
  /** День недели: 1 — понедельник, 0 — воскресенье. */
  weekday: number;
  profile: Profile;
  deload: boolean;
  daysUntilDeload: number;
  adjustments: Readonly<Record<string, number>>;
  maxTestDue: boolean;
  weeklyLandings: number;
  weeksTrained: number;
}

function numbersProtocol(): ResolvedProtocol {
  return {
    id: 'numbers',
    titleKey: 'numbers.title' as TranslationKey,
    subtitleKey: null,
    steps: [
      step({
        id: 'numbers',
        titleKey: 'numbers.title' as TranslationKey,
        hintKey: null,
        kind: 'numbers',
        seconds: MEMORIZE_SECONDS,
      }),
    ],
    safetyKeys: [],
    notes: [],
  };
}

/** Ораторство по субботам: дыхание, артикуляция, скороговорки, запись и разбор. */
function speechProtocol(lang: Profile['lang']): ResolvedProtocol {
  return {
    id: 'speech',
    titleKey: 'block.speech' as TranslationKey,
    subtitleKey: null,
    steps: [
      step({
        id: 'breathing',
        titleKey: 'speech.breathing' as TranslationKey,
        hintKey: 'speech.breathing.hint' as TranslationKey,
        kind: 'timer',
        seconds: 180,
      }),
      step({
        id: 'articulation',
        titleKey: 'speech.articulation' as TranslationKey,
        hintKey: 'speech.articulation.hint' as TranslationKey,
        kind: 'timer',
        seconds: 180,
      }),
      step({
        id: 'twisters',
        titleKey: 'speech.twisters' as TranslationKey,
        hintKey: 'speech.twisters.hint' as TranslationKey,
        kind: 'twisters',
        seconds: 300,
        texts: pickRandom(tongueTwistersFor(lang), 3),
      }),
      step({
        id: 'count',
        titleKey: 'speech.count' as TranslationKey,
        hintKey: 'speech.count.hint' as TranslationKey,
        kind: 'timer',
        seconds: 120,
      }),
      step({
        id: 'reading',
        titleKey: 'speech.reading' as TranslationKey,
        hintKey: 'speech.reading.hint' as TranslationKey,
        kind: 'record',
        seconds: 300,
      }),
      step({
        id: 'improv',
        titleKey: 'speech.improv' as TranslationKey,
        hintKey: 'speech.improv.hint' as TranslationKey,
        kind: 'record',
        seconds: 120,
        texts: pickRandom(topicsFor(lang), 1),
      }),
      step({
        id: 'fillers',
        titleKey: 'speech.fillers' as TranslationKey,
        hintKey: 'speech.fillers.hint' as TranslationKey,
        kind: 'measure',
        metric: 'fillers',
        attempts: 1,
        playbackOf: 'improv',
        seconds: 420,
      }),
      step({
        id: 'review',
        titleKey: 'speech.review' as TranslationKey,
        hintKey: 'speech.review.hint' as TranslationKey,
        kind: 'chart',
        metric: 'fillers',
      }),
    ],
    safetyKeys: [],
    notes: [],
  };
}

/** Воскресный разбор недели: цифры, провалы, квесты на следующую неделю. */
function weekReviewProtocol(): ResolvedProtocol {
  return {
    id: 'week-review',
    titleKey: 'block.weekReview' as TranslationKey,
    subtitleKey: null,
    steps: [
      step({
        id: 'review.numbers',
        titleKey: 'review.numbers' as TranslationKey,
        hintKey: 'review.numbers.hint' as TranslationKey,
        kind: 'weekStats',
      }),
      step({
        id: 'review.failures',
        titleKey: 'review.failures' as TranslationKey,
        hintKey: 'review.failures.hint' as TranslationKey,
        kind: 'timer',
        seconds: 300,
      }),
      step({
        id: 'review.quests',
        titleKey: 'review.quests' as TranslationKey,
        hintKey: 'review.quests.hint' as TranslationKey,
        kind: 'quests',
      }),
    ],
    safetyKeys: [],
    notes: [],
  };
}

/** Протокол блока. null — для блока протокола нет, кнопку «начать» показывать не нужно. */
export function resolveProtocol(id: ProtocolId, ctx: ProtocolContext): ResolvedProtocol | null {
  if (id === 'workout') {
    return resolveWorkout({
      weekday: ctx.weekday,
      maxPullups: ctx.profile.maxPullups,
      maxPushups: ctx.profile.maxPushups,
      hasBall: ctx.profile.hasBall,
      deload: ctx.deload,
      daysUntilDeload: ctx.daysUntilDeload,
      adjustments: ctx.adjustments,
      maxTestDue: ctx.maxTestDue,
      weeklyLandings: ctx.weeklyLandings,
      weeksTrained: ctx.weeksTrained,
    });
  }
  if (id === 'numbers') return numbersProtocol();
  if (id === 'speech') return speechProtocol(ctx.profile.lang);
  if (id === 'week-review') return weekReviewProtocol();
  return null;
}
