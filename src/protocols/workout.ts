import type { TranslationKey } from '../i18n';
import type { MetricId } from '../types';
import {
  CIRCUIT_ITEMS,
  WARMUP_ITEMS,
  WORKOUT_BY_WEEKDAY,
  THURSDAY_BY_LEVEL,
  TUESDAY_BY_LEVEL,
  type ExerciseSpec,
} from '../data/workouts';
import {
  landingsBudget,
  pullupLevel,
  scaleReps,
  scaleSets,
  workingReps,
  type PullupLevel,
} from '../domain/progression';
import {
  step,
  type ProtocolItem,
  type ProtocolNote,
  type ResolvedProtocol,
  type ProtocolStep,
} from './types';

export interface WorkoutContext {
  /** День недели: 1 — понедельник, 0 — воскресенье. */
  weekday: number;
  maxPullups: number;
  maxPushups: number;
  hasBall: boolean;
  /** Идёт разгрузочная неделя: объём минус 40 процентов. */
  deload: boolean;
  daysUntilDeload: number;
  /** Множители нагрузки по упражнениям после невыполненных подходов. */
  adjustments: Readonly<Record<string, number>>;
  /** Пятничный замер максимума делается раз в две недели. */
  maxTestDue: boolean;
  /** Сколько приземлений уже сделано на этой неделе. */
  weeklyLandings: number;
  weeksTrained: number;
}

const WARMUP_DETAILS: Record<string, ProtocolItem> = {
  'warmup.circles': { key: 'warmup.circles' as TranslationKey, count: 60, unit: 'sec' },
  'warmup.squats': { key: 'warmup.squats' as TranslationKey, count: 20, unit: 'reps' },
  'warmup.lunges': { key: 'warmup.lunges' as TranslationKey, count: 10, unit: 'perSide' },
  'warmup.bridges': { key: 'warmup.bridges' as TranslationKey, count: 15, unit: 'reps' },
  'warmup.hang': { key: 'warmup.hang' as TranslationKey, count: 30, unit: 'sec' },
  'warmup.wrists': { key: 'warmup.wrists' as TranslationKey, count: 30, unit: 'sec' },
};

const PLYO_DAYS = new Set([1, 3, 6]);

function safetyFor(weekday: number): TranslationKey[] {
  const keys: TranslationKey[] = [];
  if (weekday === 2 || weekday === 4) keys.push('safety.arm' as TranslationKey);
  if (PLYO_DAYS.has(weekday)) keys.push('safety.plyo' as TranslationKey);
  keys.push('safety.pain' as TranslationKey);
  return keys;
}

/** Повторения упражнения с учётом максимума, разгрузки и снижения после провалов. */
function resolveReps(spec: ExerciseSpec, ctx: WorkoutContext): number | number[] | null {
  const factor = spec.scalable ? (ctx.adjustments[spec.key] ?? 1) : 1;
  const deload = spec.scalable ? ctx.deload : false;

  if (spec.ladder) return spec.ladder.map((reps) => scaleReps(reps, factor, deload));

  let base = spec.reps ?? null;
  if (spec.repsRule === 'pullups-working') base = workingReps(ctx.maxPullups);
  if (spec.repsRule === 'pullups-max-minus-2') base = Math.max(1, ctx.maxPullups - 2);
  if (spec.repsRule === 'pushups-half') base = Math.max(1, Math.round(ctx.maxPushups / 2));
  if (base === null) return null;

  return scaleReps(base, factor, deload);
}

function circuitItems(ctx: WorkoutContext): ProtocolItem[] {
  const level = pullupLevel(ctx.maxPullups);
  const pullupReps = level === 'beginner' ? 8 : workingReps(ctx.maxPullups);
  const counts: Record<(typeof CIRCUIT_ITEMS)[number], number> = {
    'ex.circuit.pullups': pullupReps,
    'ex.circuit.pushups': Math.max(1, Math.round(ctx.maxPushups / 2)),
    'ex.circuit.jumpSquats': 10,
    'ex.circuit.legRaises': 8,
  };
  return CIRCUIT_ITEMS.map((key) => ({
    key: key as TranslationKey,
    count: counts[key],
    unit: 'reps' as const,
  }));
}

function exerciseStep(spec: ExerciseSpec, ctx: WorkoutContext): ProtocolStep {
  const titleKey = spec.key as TranslationKey;
  const hintKey = `${spec.key}.hint` as TranslationKey;

  if (spec.metric) {
    return step({
      id: spec.key,
      titleKey,
      hintKey,
      kind: 'measure',
      metric: spec.metric as MetricId,
      attempts: spec.attempts ?? 1,
      landings: spec.landings ?? 0,
    });
  }

  if (spec.seconds) {
    return step({ id: spec.key, titleKey, hintKey, kind: 'timer', seconds: spec.seconds });
  }

  const reps = resolveReps(spec, ctx);
  const sets = scaleSets(
    spec.sets ?? (Array.isArray(reps) ? reps.length : 1),
    spec.scalable ? ctx.deload : false,
  );

  return step({
    id: spec.key,
    titleKey,
    hintKey,
    kind: 'sets',
    landings: spec.landings ?? 0,
    items: spec.key === 'ex.circuit' ? circuitItems(ctx) : [],
    sets: {
      sets: Array.isArray(reps) ? reps.length : sets,
      reps: reps ?? 0,
      perSide: spec.perSide ?? false,
      restSeconds: spec.restSeconds ?? 60,
      toFailure: spec.toFailure ?? false,
      holdSeconds: spec.holdSeconds ?? null,
    },
  });
}

const LEVEL_KEYS: Record<PullupLevel, TranslationKey> = {
  beginner: 'workout.level.beginner' as TranslationKey,
  intermediate: 'workout.level.intermediate' as TranslationKey,
  advanced: 'workout.level.advanced' as TranslationKey,
};

/** Собирает тренировку дня: уровень, разгрузка, снижение нагрузки и лимит приземлений. */
export function resolveWorkout(ctx: WorkoutContext): ResolvedProtocol {
  const day = WORKOUT_BY_WEEKDAY[ctx.weekday] ?? WORKOUT_BY_WEEKDAY[0];
  if (!day) throw new Error('Нет программы на этот день недели');

  const level = pullupLevel(ctx.maxPullups);
  const specs =
    ctx.weekday === 2
      ? TUESDAY_BY_LEVEL[level]
      : ctx.weekday === 4
        ? THURSDAY_BY_LEVEL[level]
        : day.exercises.filter((spec) => !spec.biweekly || ctx.maxTestDue);

  const steps: ProtocolStep[] = [];

  if (day.warmupSeconds > 0) {
    steps.push(
      step({
        id: 'warmup',
        titleKey: 'workout.warmup' as TranslationKey,
        hintKey: 'workout.warmup.hint' as TranslationKey,
        kind: 'timer',
        seconds: day.warmupSeconds,
        locked: true,
        items: WARMUP_ITEMS.map((key) => WARMUP_DETAILS[key]).filter(
          (item): item is ProtocolItem => item !== undefined,
        ),
      }),
    );
  }

  for (const spec of specs) steps.push(exerciseStep(spec, ctx));

  if (ctx.hasBall && day.ballExercises) {
    for (const spec of day.ballExercises) steps.push(exerciseStep(spec, ctx));
  }

  steps.push(
    step({
      id: 'shower',
      titleKey: 'ex.shower' as TranslationKey,
      hintKey: 'ex.shower.hint' as TranslationKey,
      kind: 'info',
    }),
  );

  const notes: ProtocolNote[] = [];
  if (ctx.deload) {
    notes.push({ key: 'workout.note.deload' as TranslationKey, tone: 'warning' });
  } else if (ctx.daysUntilDeload <= 3) {
    notes.push({
      key: 'workout.note.deloadSoon' as TranslationKey,
      vars: { days: ctx.daysUntilDeload },
      tone: 'info',
    });
  }

  const reduced = specs.filter((spec) => (ctx.adjustments[spec.key] ?? 1) < 1);
  if (reduced.length > 0) {
    notes.push({
      key: 'workout.note.reduced' as TranslationKey,
      vars: { count: reduced.length },
      tone: 'info',
    });
  }

  const plannedLandings = specs.reduce((sum, spec) => sum + (spec.landings ?? 0), 0);
  const budget = landingsBudget(ctx.weeksTrained);
  if (plannedLandings > 0 && ctx.weeklyLandings + plannedLandings > budget) {
    notes.push({
      key: 'workout.note.landings' as TranslationKey,
      vars: { done: ctx.weeklyLandings, planned: plannedLandings, budget },
      tone: 'warning',
    });
  }

  return {
    id: 'workout',
    titleKey: day.titleKey as TranslationKey,
    subtitleKey: ctx.weekday === 2 || ctx.weekday === 4 ? LEVEL_KEYS[level] : null,
    steps,
    safetyKeys: safetyFor(ctx.weekday),
    notes,
  };
}
