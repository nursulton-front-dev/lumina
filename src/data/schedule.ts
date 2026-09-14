import type { TranslationKey } from '../i18n';
import type { Block, Category, DayTypeCode, ProtocolId } from '../types';
import { toMinutes } from '../domain/time';

/** Описание блока в стартовом расписании. */
export interface BlockSeed {
  start: string;
  end: string;
  titleKey: TranslationKey;
  category: Category;
  protocolId?: ProtocolId;
  /** Входит в минимум дня. */
  core?: boolean;
  /** Доступен помодоро. */
  focus?: boolean;
  /** Только в эти дни недели (0 — воскресенье). Пусто — во все дни типа. */
  weekdays?: number[];
}

const TUE_THU = [2, 4];
const MON_WED = [1, 3];

/** Утро буднего дня: одинаковое в любой день недели. */
const WEEKDAY_MORNING: BlockSeed[] = [
  { start: '06:00', end: '06:05', titleKey: 'block.wake', category: 'routine' },
  {
    start: '06:05',
    end: '06:27',
    titleKey: 'block.workout',
    category: 'sport',
    protocolId: 'workout',
  },
  { start: '06:27', end: '06:37', titleKey: 'block.shower', category: 'routine' },
  { start: '06:37', end: '06:55', titleKey: 'block.breakfast', category: 'routine' },
  {
    start: '06:55',
    end: '07:10',
    titleKey: 'block.numbers',
    category: 'memory',
    protocolId: 'numbers',
    core: true,
  },
  { start: '07:10', end: '07:35', titleKey: 'block.russianEx', category: 'russian', focus: true },
  { start: '07:40', end: '08:30', titleKey: 'block.commuteRussian', category: 'commute' },
  { start: '08:30', end: '14:45', titleKey: 'block.school', category: 'school' },
];

/** После школы: дорога с курсом ораторства, брат из садика, разминка по английскому. */
const WEEKDAY_AFTERNOON: BlockSeed[] = [
  { start: '14:45', end: '16:00', titleKey: 'block.commuteSpeech', category: 'commute' },
  { start: '16:00', end: '16:25', titleKey: 'block.lunchRest', category: 'rest' },
  { start: '16:25', end: '16:50', titleKey: 'block.brother', category: 'routine' },
  { start: '16:50', end: '17:05', titleKey: 'block.englishWarmup', category: 'english' },
];

const ODD: BlockSeed[] = [
  ...WEEKDAY_MORNING,
  ...WEEKDAY_AFTERNOON,
  {
    start: '17:05',
    end: '18:00',
    titleKey: 'block.homework',
    category: 'homework',
    focus: true,
    core: true,
  },
  { start: '18:00', end: '18:15', titleKey: 'block.snack', category: 'routine' },
  { start: '18:15', end: '20:15', titleKey: 'block.englishCourse', category: 'english' },
  { start: '20:15', end: '21:00', titleKey: 'block.dinnerRest', category: 'rest' },
  // Понедельник и среда: IOI до 22:30. Вторник и четверг: IOI короче, затем домашка по английскому.
  {
    start: '21:00',
    end: '22:30',
    titleKey: 'block.ioiTheory',
    category: 'ioi',
    focus: true,
    weekdays: MON_WED,
  },
  {
    start: '21:00',
    end: '21:45',
    titleKey: 'block.ioiTheory',
    category: 'ioi',
    focus: true,
    weekdays: TUE_THU,
  },
  {
    start: '21:45',
    end: '22:15',
    titleKey: 'block.englishHw',
    category: 'english',
    focus: true,
    weekdays: TUE_THU,
  },
  { start: '22:30', end: '23:00', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const EVEN: BlockSeed[] = [
  ...WEEKDAY_MORNING,
  ...WEEKDAY_AFTERNOON,
  {
    start: '17:05',
    end: '18:15',
    titleKey: 'block.homework',
    category: 'homework',
    focus: true,
    core: true,
  },
  { start: '18:15', end: '18:45', titleKey: 'block.dinnerWalk', category: 'rest' },
  { start: '18:45', end: '20:00', titleKey: 'block.ioiMain', category: 'ioi', focus: true },
  { start: '20:00', end: '20:15', titleKey: 'block.break', category: 'rest' },
  { start: '20:15', end: '21:45', titleKey: 'block.freelance', category: 'freelance', focus: true },
  {
    start: '21:45',
    end: '22:15',
    titleKey: 'block.englishHw',
    category: 'english',
    focus: true,
    weekdays: TUE_THU,
  },
  { start: '22:15', end: '22:45', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

/**
 * Пятница: два занятия подряд, из дома с 07:40 до 20:20. Школьной домашки нет,
 * минимум дня — числа и чтение, чтобы серия не рвалась.
 */
const FRI: BlockSeed[] = [
  ...WEEKDAY_MORNING,
  { start: '14:45', end: '15:00', titleKey: 'block.snack', category: 'routine' },
  { start: '15:00', end: '16:00', titleKey: 'block.commuteLesson', category: 'commute' },
  { start: '16:00', end: '18:00', titleKey: 'block.lesson', category: 'school' },
  { start: '18:00', end: '18:30', titleKey: 'block.commuteEnglish', category: 'commute' },
  { start: '18:30', end: '20:00', titleKey: 'block.englishClass', category: 'english' },
  { start: '20:00', end: '20:20', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '20:20', end: '21:00', titleKey: 'block.dinnerRest', category: 'rest' },
  { start: '21:00', end: '22:15', titleKey: 'block.rest', category: 'rest' },
  { start: '22:15', end: '22:45', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const WEEKEND_MORNING = (workoutKey: TranslationKey): BlockSeed[] => [
  { start: '07:30', end: '07:35', titleKey: 'block.wake', category: 'routine' },
  { start: '07:35', end: '08:15', titleKey: workoutKey, category: 'sport', protocolId: 'workout' },
  { start: '08:15', end: '08:40', titleKey: 'block.breakfast', category: 'routine' },
  {
    start: '08:40',
    end: '08:55',
    titleKey: 'block.numbers',
    category: 'memory',
    protocolId: 'numbers',
    core: true,
  },
  { start: '09:00', end: '09:15', titleKey: 'block.englishWarmup', category: 'english' },
];

const SAT: BlockSeed[] = [
  ...WEEKEND_MORNING('block.workoutLong'),
  {
    start: '09:30',
    end: '12:30',
    titleKey: 'block.freelanceMain',
    category: 'freelance',
    focus: true,
  },
  { start: '12:30', end: '14:00', titleKey: 'block.lunchRest', category: 'rest' },
  { start: '14:00', end: '15:30', titleKey: 'block.ioi', category: 'ioi', focus: true },
  {
    start: '15:45',
    end: '16:30',
    titleKey: 'block.speech',
    category: 'speech',
    protocolId: 'speech',
  },
  {
    start: '16:45',
    end: '18:15',
    titleKey: 'block.homeworkMonday',
    category: 'homework',
    focus: true,
    core: true,
  },
  { start: '18:15', end: '21:45', titleKey: 'block.freeTime', category: 'free' },
  { start: '21:45', end: '22:15', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const SUN: BlockSeed[] = [
  ...WEEKEND_MORNING('block.workoutRecovery'),
  { start: '10:00', end: '12:30', titleKey: 'block.ioiContest', category: 'ioi', focus: true },
  { start: '12:30', end: '14:00', titleKey: 'block.lunch', category: 'rest' },
  { start: '14:00', end: '15:30', titleKey: 'block.russianMock', category: 'russian', focus: true },
  {
    start: '15:45',
    end: '16:45',
    titleKey: 'block.homeworkTails',
    category: 'homework',
    focus: true,
    core: true,
  },
  {
    start: '17:00',
    end: '17:30',
    titleKey: 'block.weekReview',
    category: 'routine',
    protocolId: 'week-review',
  },
  { start: '17:30', end: '21:30', titleKey: 'block.rest', category: 'rest' },
  { start: '21:30', end: '22:00', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '22:30', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

/** Стартовое расписание. Попадает в базу один раз и дальше правится пользователем. */
export const SCHEDULE_SEED: Record<DayTypeCode, BlockSeed[]> = {
  odd: ODD,
  even: EVEN,
  fri: FRI,
  sat: SAT,
  sun: SUN,
};

/** Разворачивает описания в записи блоков для базы. */
export function seedBlocks(now: string): Block[] {
  const blocks: Block[] = [];
  for (const dayType of Object.keys(SCHEDULE_SEED) as DayTypeCode[]) {
    const seeds = [...SCHEDULE_SEED[dayType]].sort(
      (a, b) => toMinutes(a.start) - toMinutes(b.start),
    );
    seeds.forEach((seed, index) => {
      const weekdays = seed.weekdays ?? [];
      const suffix = weekdays.length > 0 ? `-${weekdays.join('')}` : '';
      blocks.push({
        id: `${dayType}-${seed.titleKey}-${seed.start.replace(':', '')}${suffix}`,
        dayType,
        date: '',
        weekdays,
        start: toMinutes(seed.start),
        end: toMinutes(seed.end),
        titleKey: seed.titleKey,
        title: null,
        category: seed.category,
        protocolId: seed.protocolId ?? null,
        isCore: seed.core ?? false,
        isFocus: seed.focus ?? false,
        order: index,
        updatedAt: now,
      });
    });
  }
  return blocks;
}
