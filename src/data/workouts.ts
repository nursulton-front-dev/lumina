import type { MetricId } from '../types';

/** Как считаются повторения, если они зависят от текущего максимума. */
export type RepsRule = 'pullups-working' | 'pullups-max-minus-2' | 'pushups-half';

export interface ExerciseSpec {
  /** База ключа перевода: name = key, подсказка = `${key}.hint`. */
  key: string;
  sets?: number;
  reps?: number;
  repsRule?: RepsRule;
  /** Лесенка повторений: 1-2-3-4-5-4-3-2-1. */
  ladder?: number[];
  perSide?: boolean;
  restSeconds?: number;
  /** Изометрия: сколько секунд держать. */
  holdSeconds?: number;
  /** Подход «на максимум». */
  toFailure?: boolean;
  /** Шаг-таймер целиком, без подходов. */
  seconds?: number;
  /** Приземлений за всё упражнение — для недельного лимита прыжковой работы. */
  landings?: number;
  /** Замер: попыток и метрика, куда пишется лучший результат. */
  metric?: MetricId;
  attempts?: number;
  /** Замер максимума делается раз в две недели. */
  biweekly?: boolean;
  /** Объём этого упражнения урезается разгрузкой и снижением после провалов. */
  scalable?: boolean;
}

export interface WorkoutDaySpec {
  titleKey: string;
  /** Минут работы без разминки — как в плане. */
  workMinutes: number;
  warmupSeconds: number;
  exercises: ExerciseSpec[];
  /** Дополнительный блок, когда есть доступ к мячу и площадке. */
  ballExercises?: ExerciseSpec[];
}

/** Разминка одинаковая каждый день и не пропускается. */
export const WARMUP_ITEMS = [
  'warmup.circles',
  'warmup.squats',
  'warmup.lunges',
  'warmup.bridges',
  'warmup.hang',
  'warmup.wrists',
] as const;

const MONDAY: WorkoutDaySpec = {
  titleKey: 'workout.mon',
  workMinutes: 15,
  warmupSeconds: 240,
  exercises: [
    { key: 'ex.jumpSquats', sets: 4, reps: 6, restSeconds: 60, landings: 24, scalable: true },
    { key: 'ex.tuckJumps', sets: 3, reps: 10, restSeconds: 60, landings: 30, scalable: true },
    { key: 'ex.bulgarianSplit', sets: 3, reps: 8, perSide: true, restSeconds: 60, scalable: true },
    { key: 'ex.calfRaises', sets: 3, reps: 20, restSeconds: 45, scalable: true },
    { key: 'ex.plank', sets: 3, holdSeconds: 40, restSeconds: 45 },
  ],
};

const TUESDAY_BEGINNER: ExerciseSpec[] = [
  { key: 'ex.australianPullups', sets: 4, reps: 8, restSeconds: 60, scalable: true },
  { key: 'ex.negativePullups', sets: 4, reps: 3, holdSeconds: 5, restSeconds: 90, scalable: true },
  { key: 'ex.scapularPullups', sets: 3, reps: 8, restSeconds: 45, scalable: true },
  { key: 'ex.deadHang', sets: 3, toFailure: true, restSeconds: 60 },
  { key: 'ex.flexedHang', sets: 3, holdSeconds: 15, restSeconds: 60 },
  { key: 'ex.towelHang', sets: 3, holdSeconds: 15, restSeconds: 60 },
];

const TUESDAY_INTERMEDIATE: ExerciseSpec[] = [
  {
    key: 'ex.pullups',
    sets: 4,
    repsRule: 'pullups-max-minus-2',
    restSeconds: 90,
    scalable: true,
  },
  { key: 'ex.negativePullups', sets: 2, reps: 3, holdSeconds: 5, restSeconds: 90 },
  { key: 'ex.deadHang', sets: 3, toFailure: true, restSeconds: 60 },
  { key: 'ex.flexedHang', sets: 3, holdSeconds: 15, restSeconds: 60 },
  { key: 'ex.towelHang', sets: 3, holdSeconds: 15, restSeconds: 60 },
];

const TUESDAY_ADVANCED: ExerciseSpec[] = [
  { key: 'ex.pullups', sets: 4, repsRule: 'pullups-working', restSeconds: 90, scalable: true },
  { key: 'ex.weightedPullups', sets: 2, reps: 5, restSeconds: 120 },
  { key: 'ex.flexedHang', sets: 3, holdSeconds: 20, restSeconds: 60 },
  { key: 'ex.towelHang', sets: 3, holdSeconds: 20, restSeconds: 60 },
];

export const TUESDAY_BY_LEVEL = {
  beginner: TUESDAY_BEGINNER,
  intermediate: TUESDAY_INTERMEDIATE,
  advanced: TUESDAY_ADVANCED,
};

const WEDNESDAY: WorkoutDaySpec = {
  titleKey: 'workout.wed',
  workMinutes: 15,
  warmupSeconds: 240,
  exercises: [
    {
      key: 'ex.jumpLunges',
      sets: 3,
      reps: 8,
      perSide: true,
      restSeconds: 60,
      landings: 48,
      scalable: true,
    },
    { key: 'ex.kickSwings', sets: 3, reps: 12, perSide: true, restSeconds: 45 },
    { key: 'ex.pistolAssisted', sets: 3, reps: 5, perSide: true, restSeconds: 60, scalable: true },
    {
      key: 'ex.singleLegBridge',
      sets: 3,
      reps: 12,
      perSide: true,
      restSeconds: 45,
      scalable: true,
    },
    { key: 'ex.sidePlank', sets: 3, holdSeconds: 30, perSide: true, restSeconds: 45 },
  ],
  ballExercises: [{ key: 'ex.ballControl', seconds: 600 }],
};

const THURSDAY: WorkoutDaySpec = {
  titleKey: 'workout.thu',
  workMinutes: 15,
  warmupSeconds: 240,
  exercises: [
    { key: 'ex.pushupLadder', ladder: [1, 2, 3, 4, 5, 4, 3, 2, 1], restSeconds: 0, scalable: true },
    { key: 'ex.diamondPushups', sets: 3, reps: 8, restSeconds: 60, scalable: true },
    { key: 'ex.pausePushups', sets: 3, reps: 6, restSeconds: 60, scalable: true },
    { key: 'ex.hangingLegRaises', sets: 3, reps: 10, restSeconds: 60, scalable: true },
    { key: 'ex.bicycleCrunches', sets: 3, reps: 20, restSeconds: 45 },
    { key: 'ex.hollowHold', sets: 3, holdSeconds: 25, restSeconds: 45 },
  ],
};

const FRIDAY: WorkoutDaySpec = {
  titleKey: 'workout.fri',
  workMinutes: 15,
  warmupSeconds: 240,
  exercises: [
    { key: 'ex.longJumpTest', metric: 'longJump', attempts: 5, landings: 5 },
    { key: 'ex.verticalJumpTest', metric: 'verticalJump', attempts: 5, landings: 5 },
    { key: 'ex.pullupsTest', metric: 'pullups', attempts: 1, biweekly: true },
    { key: 'ex.pushupsTest', metric: 'pushups', attempts: 1, biweekly: true },
    { key: 'ex.stretching', seconds: 300 },
  ],
};

const SATURDAY: WorkoutDaySpec = {
  titleKey: 'workout.sat',
  workMinutes: 24,
  warmupSeconds: 480,
  exercises: [
    { key: 'ex.circuit', sets: 4, restSeconds: 90, landings: 40, scalable: true },
    { key: 'ex.towelHang', sets: 3, holdSeconds: 20, restSeconds: 60 },
    { key: 'ex.cooldown', seconds: 480 },
  ],
  ballExercises: [{ key: 'ex.ballStrikes', seconds: 1200 }],
};

const SUNDAY: WorkoutDaySpec = {
  titleKey: 'workout.sun',
  workMinutes: 25,
  warmupSeconds: 0,
  exercises: [
    { key: 'ex.mobilityHips', seconds: 180 },
    { key: 'ex.mobilityShoulders', seconds: 180 },
    { key: 'ex.hamstringStretch', seconds: 120 },
    { key: 'ex.calfStretch', seconds: 90 },
    { key: 'ex.chestStretch', seconds: 90 },
    { key: 'ex.forearmStretch', seconds: 90 },
    { key: 'ex.deadHang', seconds: 60 },
    { key: 'ex.breathing', seconds: 180 },
  ],
};

const TUESDAY: WorkoutDaySpec = {
  titleKey: 'workout.tue',
  workMinutes: 15,
  warmupSeconds: 240,
  exercises: [],
};

/** Программа по дням недели: 1 — понедельник, 0 — воскресенье. */
export const WORKOUT_BY_WEEKDAY: Record<number, WorkoutDaySpec> = {
  1: MONDAY,
  2: TUESDAY,
  3: WEDNESDAY,
  4: THURSDAY,
  5: FRIDAY,
  6: SATURDAY,
  0: SUNDAY,
};

/**
 * Упражнения, результат которых пишется в прогресс: пользователь вводит
 * фактические секунды или повторения, и они попадают на график.
 */
export const EXERCISE_METRIC: Record<string, MetricId> = {
  'ex.towelHang': 'towelHang',
  'ex.hangingLegRaises': 'legRaises',
};

/** Состав круга в субботней круговой тренировке. */
export const CIRCUIT_ITEMS = [
  'ex.circuit.pullups',
  'ex.circuit.pushups',
  'ex.circuit.jumpSquats',
  'ex.circuit.legRaises',
] as const;
