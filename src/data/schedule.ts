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
}

const ODD_MORNING: BlockSeed[] = [
  { start: '06:00', end: '06:05', titleKey: 'block.wake', category: 'routine' },
  {
    start: '06:05',
    end: '06:27',
    titleKey: 'block.workout',
    category: 'sport',
    protocolId: 'workout',
  },
  { start: '06:27', end: '06:37', titleKey: 'block.shower', category: 'routine' },
];

const AFTERNOON: BlockSeed[] = [
  { start: '07:40', end: '08:30', titleKey: 'block.commuteRussian', category: 'commute' },
  { start: '08:30', end: '14:45', titleKey: 'block.school', category: 'school' },
  { start: '14:45', end: '15:35', titleKey: 'block.commuteIoi', category: 'commute' },
  { start: '15:35', end: '16:15', titleKey: 'block.lunchRest', category: 'rest' },
  {
    start: '16:15',
    end: '17:45',
    titleKey: 'block.homework',
    category: 'homework',
    focus: true,
    core: true,
  },
];

const MORNING_TAIL: BlockSeed[] = [
  { start: '07:05', end: '07:25', titleKey: 'block.breakfast', category: 'routine' },
  {
    start: '07:25',
    end: '07:30',
    titleKey: 'block.numbers',
    category: 'memory',
    protocolId: 'numbers',
    core: true,
  },
];

const ODD: BlockSeed[] = [
  ...ODD_MORNING,
  {
    start: '06:40',
    end: '07:05',
    titleKey: 'block.russianEx',
    category: 'russian',
    focus: true,
  },
  ...MORNING_TAIL,
  ...AFTERNOON,
  { start: '17:45', end: '18:15', titleKey: 'block.snack', category: 'routine' },
  { start: '18:15', end: '20:15', titleKey: 'block.englishCourse', category: 'english' },
  { start: '20:15', end: '21:00', titleKey: 'block.dinnerRest', category: 'rest' },
  { start: '21:00', end: '22:30', titleKey: 'block.ioiTheory', category: 'ioi', focus: true },
  { start: '22:30', end: '23:00', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const EVEN: BlockSeed[] = [
  ...ODD_MORNING,
  {
    start: '06:40',
    end: '07:05',
    titleKey: 'block.englishHw',
    category: 'english',
    focus: true,
  },
  ...MORNING_TAIL,
  ...AFTERNOON,
  { start: '17:45', end: '18:30', titleKey: 'block.dinnerWalk', category: 'rest' },
  { start: '18:30', end: '20:00', titleKey: 'block.ioiMain', category: 'ioi', focus: true },
  { start: '20:00', end: '20:15', titleKey: 'block.break', category: 'rest' },
  { start: '20:15', end: '21:45', titleKey: 'block.freelance', category: 'freelance', focus: true },
  { start: '21:45', end: '22:15', titleKey: 'block.russianEx', category: 'russian', focus: true },
  { start: '22:15', end: '22:45', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const SAT: BlockSeed[] = [
  { start: '07:30', end: '07:35', titleKey: 'block.wake', category: 'routine' },
  {
    start: '07:35',
    end: '08:15',
    titleKey: 'block.workoutLong',
    category: 'sport',
    protocolId: 'workout',
  },
  { start: '08:15', end: '08:40', titleKey: 'block.breakfast', category: 'routine' },
  {
    start: '08:40',
    end: '08:45',
    titleKey: 'block.numbers',
    category: 'memory',
    protocolId: 'numbers',
    core: true,
  },
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
  { start: '07:30', end: '07:35', titleKey: 'block.wake', category: 'routine' },
  {
    start: '07:35',
    end: '08:15',
    titleKey: 'block.workoutRecovery',
    category: 'sport',
    protocolId: 'workout',
  },
  { start: '08:15', end: '08:40', titleKey: 'block.breakfast', category: 'routine' },
  {
    start: '08:40',
    end: '08:45',
    titleKey: 'block.numbers',
    category: 'memory',
    protocolId: 'numbers',
    core: true,
  },
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
      blocks.push({
        id: `${dayType}-${seed.titleKey}-${seed.start.replace(':', '')}`,
        dayType,
        date: '',
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
