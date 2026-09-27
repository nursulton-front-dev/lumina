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
  /** Количество помодоро (25 мин работы + 5 мин перерыва). */
  pomodoros?: number;
  /** Необязательный блок (optional). */
  optional?: boolean;
  /** Только в эти дни недели (0 — воскресенье). Пусто — во все дни типа. */
  weekdays?: number[];
}

/** Понедельник и Среда — нечётные будние */
const ODD: BlockSeed[] = [
  { start: '06:00', end: '06:05', titleKey: 'block.wake', category: 'routine' },
  { start: '06:05', end: '06:25', titleKey: 'block.cardio', category: 'sport' },
  { start: '06:25', end: '06:35', titleKey: 'block.shower', category: 'routine' },
  { start: '06:35', end: '06:50', titleKey: 'block.breakfast', category: 'routine' },
  { start: '06:50', end: '07:45', titleKey: 'block.russian', category: 'russian', focus: true, pomodoros: 2 },
  { start: '07:45', end: '08:00', titleKey: 'block.memory', category: 'memory', core: true, protocolId: 'numbers' },
  { start: '08:00', end: '08:30', titleKey: 'block.commuteSchool', category: 'commute' },
  { start: '08:30', end: '14:45', titleKey: 'block.school', category: 'school' },
  { start: '14:45', end: '15:15', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '15:15', end: '15:45', titleKey: 'block.selfStudy', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '15:45', end: '16:00', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '16:00', end: '16:25', titleKey: 'block.lunchRest', category: 'rest' },
  { start: '16:25', end: '16:50', titleKey: 'block.brother', category: 'routine' },
  { start: '16:50', end: '17:45', titleKey: 'block.homework', category: 'homework', focus: true, pomodoros: 2, core: true },
  { start: '17:45', end: '18:10', titleKey: 'block.freelance', category: 'freelance', focus: true, pomodoros: 1 },
  { start: '18:15', end: '20:15', titleKey: 'block.englishCourse', category: 'english' },
  { start: '20:15', end: '20:40', titleKey: 'block.dinner', category: 'routine' },
  { start: '20:40', end: '22:05', titleKey: 'block.ioiLesson', category: 'ioi', focus: true, pomodoros: 3 },
  { start: '22:05', end: '22:30', titleKey: 'block.fiction', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '22:30', end: '23:00', titleKey: 'block.sleepPrep', category: 'routine' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

/** Вторник и Четверг — чётные будние */
const EVEN: BlockSeed[] = [
  { start: '06:00', end: '06:05', titleKey: 'block.wake', category: 'routine' },
  { start: '06:05', end: '06:30', titleKey: 'block.workoutStrength', category: 'sport' },
  { start: '06:30', end: '06:40', titleKey: 'block.shower', category: 'routine' },
  { start: '06:40', end: '06:55', titleKey: 'block.breakfast', category: 'routine' },
  { start: '06:55', end: '07:25', titleKey: 'block.english', category: 'english', focus: true, pomodoros: 1 },
  { start: '07:25', end: '07:40', titleKey: 'block.memory', category: 'memory', core: true, protocolId: 'numbers' },
  { start: '07:40', end: '08:30', titleKey: 'block.commuteSchool', category: 'commute' },
  { start: '08:30', end: '14:45', titleKey: 'block.school', category: 'school' },
  { start: '14:45', end: '15:15', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '15:15', end: '15:45', titleKey: 'block.selfStudy', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '15:45', end: '16:00', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '16:00', end: '16:25', titleKey: 'block.lunch', category: 'rest' },
  { start: '16:25', end: '16:50', titleKey: 'block.brother', category: 'routine' },
  { start: '16:50', end: '17:45', titleKey: 'block.homework', category: 'homework', focus: true, pomodoros: 2, core: true },
  { start: '17:45', end: '18:10', titleKey: 'block.snackRest', category: 'rest' },
  { start: '18:10', end: '20:05', titleKey: 'block.ioiProblems', category: 'ioi', focus: true, pomodoros: 4 },
  { start: '20:05', end: '20:35', titleKey: 'block.dinnerWalk', category: 'rest' },
  { start: '20:35', end: '21:30', titleKey: 'block.freelance', category: 'freelance', focus: true, pomodoros: 2 },
  { start: '21:30', end: '21:55', titleKey: 'block.fiction', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '21:55', end: '22:25', titleKey: 'block.freeTime', category: 'free' },
  { start: '22:25', end: '23:00', titleKey: 'block.sleepPrep', category: 'routine' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

/** Пятница */
const FRI: BlockSeed[] = [
  { start: '06:00', end: '06:05', titleKey: 'block.wake', category: 'routine' },
  { start: '06:05', end: '06:25', titleKey: 'block.cardio', category: 'sport' },
  { start: '06:25', end: '06:35', titleKey: 'block.shower', category: 'routine' },
  { start: '06:35', end: '06:50', titleKey: 'block.breakfast', category: 'routine' },
  { start: '06:50', end: '07:45', titleKey: 'block.russian', category: 'russian', focus: true, pomodoros: 2 },
  { start: '07:45', end: '08:00', titleKey: 'block.memory', category: 'memory', core: true, protocolId: 'numbers' },
  { start: '08:00', end: '08:30', titleKey: 'block.commuteSchool', category: 'commute' },
  { start: '08:30', end: '14:45', titleKey: 'block.school', category: 'school' },
  { start: '14:45', end: '15:40', titleKey: 'block.homework', category: 'homework', focus: true, pomodoros: 2, core: true },
  { start: '15:40', end: '16:00', titleKey: 'block.snackRest', category: 'rest' },
  { start: '16:00', end: '18:00', titleKey: 'block.sqbAi', category: 'school' },
  { start: '18:00', end: '18:30', titleKey: 'block.commute', category: 'commute' },
  { start: '18:30', end: '20:00', titleKey: 'block.englishClass', category: 'english' },
  { start: '20:00', end: '20:30', titleKey: 'block.selfStudy', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '20:30', end: '20:45', titleKey: 'block.dinner', category: 'routine' },
  { start: '20:45', end: '22:10', titleKey: 'block.ioiLesson', category: 'ioi', focus: true, pomodoros: 3 },
  { start: '22:10', end: '22:35', titleKey: 'block.fiction', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '22:35', end: '23:00', titleKey: 'block.sleepPrep', category: 'routine' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

/** Суббота */
const SAT: BlockSeed[] = [
  { start: '07:30', end: '07:35', titleKey: 'block.wake', category: 'routine' },
  { start: '07:35', end: '08:10', titleKey: 'block.workoutStrength', category: 'sport' },
  { start: '08:10', end: '08:30', titleKey: 'block.shower', category: 'routine' },
  { start: '08:30', end: '08:50', titleKey: 'block.breakfast', category: 'routine' },
  { start: '08:50', end: '09:05', titleKey: 'block.memory', category: 'memory', core: true, protocolId: 'numbers' },
  { start: '09:05', end: '09:35', titleKey: 'block.english', category: 'english', focus: true, pomodoros: 1 },
  { start: '09:35', end: '10:00', titleKey: 'block.rest', category: 'rest' },
  { start: '10:00', end: '11:55', titleKey: 'block.ioiProblems', category: 'ioi', focus: true, pomodoros: 4 },
  { start: '12:00', end: '13:00', titleKey: 'block.lunchRest', category: 'rest' },
  { start: '13:00', end: '14:55', titleKey: 'block.freelance', category: 'freelance', focus: true, pomodoros: 4 },
  { start: '14:55', end: '15:25', titleKey: 'block.rest', category: 'rest' },
  { start: '15:25', end: '16:20', titleKey: 'block.oratory', category: 'speech', focus: true, pomodoros: 2, protocolId: 'speech' },
  { start: '16:20', end: '16:35', titleKey: 'block.rest', category: 'rest' },
  { start: '16:35', end: '17:30', titleKey: 'block.homework', category: 'homework', focus: true, pomodoros: 2, core: true },
  { start: '17:30', end: '21:30', titleKey: 'block.freeTime', category: 'free' },
  { start: '21:30', end: '21:55', titleKey: 'block.selfStudy', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '21:55', end: '22:20', titleKey: 'block.fiction', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '22:20', end: '23:00', titleKey: 'block.quietTime', category: 'free' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

/** Воскресенье — REST DAY */
const SUN: BlockSeed[] = [
  { start: '09:00', end: '09:30', titleKey: 'block.wakeAlarm', category: 'routine' },
  { start: '09:30', end: '10:00', titleKey: 'block.breakfast', category: 'routine' },
  { start: '10:00', end: '10:30', titleKey: 'block.english', category: 'english', focus: true, pomodoros: 1, core: true },
  { start: '10:30', end: '17:40', titleKey: 'block.sundayAdventure', category: 'free' },
  { start: '17:40', end: '18:00', titleKey: 'block.freelance', category: 'freelance', focus: true, pomodoros: 1, optional: true },
  { start: '18:00', end: '18:20', titleKey: 'block.weekReview', category: 'routine', protocolId: 'week-review' },
  { start: '18:20', end: '21:00', titleKey: 'block.rest', category: 'rest' },
  { start: '21:00', end: '21:25', titleKey: 'block.selfStudy', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '21:25', end: '21:50', titleKey: 'block.fiction', category: 'reading', focus: true, pomodoros: 1, core: true },
  { start: '21:50', end: '23:00', titleKey: 'block.quietTime', category: 'free' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
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
        pomodoros: seed.pomodoros ?? 0,
        optional: seed.optional ?? false,
        order: index,
        updatedAt: now,
      });
    });
  }
  return blocks;
}
