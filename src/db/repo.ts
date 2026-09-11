import type {
  Block,
  Check,
  DayRecord,
  DayTypeCode,
  Lang,
  LogEntry,
  LogKind,
  Measure,
  MetricId,
  Profile,
  WorkSession,
} from '../types';
import { seedBlocks } from '../data/schedule';
import { addDays, startOfWeek, toISODate } from '../domain/time';
import { NEUTRAL_ADJUSTMENT, type Adjustment } from '../domain/progression';
import { db, newId, PROFILE_ID, readMeta, stamp, writeMeta } from './db';

const SEED_KEY = 'schedule.seed.version';
const SEED_VERSION = 1;

/** Стартовые данные пользователя из брифа: турник, свой вес, 2 подтягивания, 25 отжиманий. */
export function defaultProfile(lang: Lang): Profile {
  return {
    id: PROFILE_ID,
    lang,
    theme: 'system',
    heightCm: 178,
    weightKg: 70,
    wakeTime: '06:00',
    sleepTarget: '23:00',
    sleepTargetShiftedOn: null,
    schoolStart: '08:30',
    schoolEnd: '14:45',
    commuteMinutes: 50,
    englishMode: 'parity',
    englishDays: [1, 3, 5],
    equipment: ['bar', 'bodyweight'],
    hasBall: false,
    goals: '',
    maxPullups: 2,
    maxPushups: 25,
    voiceName: null,
    seasonStart: toISODate(new Date()),
    createdAt: stamp(),
    updatedAt: stamp(),
  };
}

export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.get(PROFILE_ID);
}

export async function saveProfile(patch: Partial<Profile>): Promise<void> {
  const current = await getProfile();
  if (!current) return;
  await db.profile.put({ ...current, ...patch, id: PROFILE_ID, updatedAt: stamp() });
}

/** Первый запуск: профиль на выбранном языке и стартовое расписание в базе. */
export async function initProfile(lang: Lang): Promise<Profile> {
  const profile = defaultProfile(lang);
  await db.profile.put(profile);
  await ensureSeed();
  return profile;
}

export async function ensureSeed(): Promise<void> {
  const version = await readMeta<number>(SEED_KEY);
  if (version === SEED_VERSION) return;
  const count = await db.blocks.count();
  if (count === 0) {
    await db.blocks.bulkPut(seedBlocks(stamp()));
  }
  await writeMeta(SEED_KEY, SEED_VERSION);
}

/** Полная замена расписания стартовым — по явной команде из настроек. */
export async function resetSchedule(): Promise<void> {
  await db.blocks.clear();
  await db.blocks.bulkPut(seedBlocks(stamp()));
}

/** Шаблон типа дня: блоки без привязки к конкретной дате. */
export async function listBlocks(dayType: DayTypeCode): Promise<Block[]> {
  const blocks = await db.blocks.where('dayType').equals(dayType).toArray();
  return blocks
    .filter((block) => !block.deleted && block.date === '')
    .sort((a, b) => a.start - b.start);
}

/**
 * Расписание конкретного дня: если для даты есть разовые блоки, показываем их,
 * иначе — шаблон типа дня.
 */
export async function listBlocksForDay(dayType: DayTypeCode, date: string): Promise<Block[]> {
  const dated = await db.blocks.where('date').equals(date).toArray();
  const live = dated.filter((block) => !block.deleted);
  if (live.length > 0) return live.sort((a, b) => a.start - b.start);
  return listBlocks(dayType);
}

/** Копирует шаблон дня в разовые блоки: правки на «только сегодня» не трогают шаблон. */
export async function materializeDay(dayType: DayTypeCode, date: string): Promise<Block[]> {
  const existing = await db.blocks.where('date').equals(date).toArray();
  if (existing.some((block) => !block.deleted)) {
    return existing.filter((block) => !block.deleted).sort((a, b) => a.start - b.start);
  }
  const template = await listBlocks(dayType);
  const copies = template.map((block) => ({
    ...block,
    id: `${date}-${block.id}`,
    date,
    updatedAt: stamp(),
  }));
  await db.blocks.bulkPut(copies);
  return copies;
}

export async function putBlock(block: Block): Promise<void> {
  await db.blocks.put({ ...block, updatedAt: stamp() });
}

/** Мягкое удаление: строка остаётся, чтобы удаление доехало до других устройств. */
export async function removeBlock(id: string): Promise<void> {
  const block = await db.blocks.get(id);
  if (!block) return;
  await db.blocks.put({ ...block, deleted: true, updatedAt: stamp() });
}

export async function getDay(date: string): Promise<DayRecord | undefined> {
  return db.days.where('date').equals(date).first();
}

async function upsertDay(date: string, patch: Partial<DayRecord>): Promise<DayRecord> {
  const existing = await getDay(date);
  const next: DayRecord = {
    id: existing?.id ?? newId(),
    date,
    typeOverride: existing?.typeOverride ?? null,
    minDone: existing?.minDone ?? false,
    bedtimeActual: existing?.bedtimeActual ?? null,
    ...patch,
    updatedAt: stamp(),
  };
  await db.days.put(next);
  return next;
}

export async function setDayOverride(
  date: string,
  typeOverride: DayTypeCode | null,
): Promise<void> {
  await upsertDay(date, { typeOverride });
}

export async function setMinDone(date: string, minDone: boolean): Promise<void> {
  await upsertDay(date, { minDone });
}

export async function setBedtimeActual(date: string, bedtimeActual: string | null): Promise<void> {
  await upsertDay(date, { bedtimeActual });
}

export async function listChecks(date: string): Promise<Check[]> {
  const rows = await db.checks.where('date').equals(date).toArray();
  return rows.filter((check) => !check.deleted);
}

/** Отметка блока. Возвращает новое состояние: отмечен или нет. */
export async function toggleCheck(date: string, blockId: string): Promise<boolean> {
  const existing = await db.checks.where('[date+blockId]').equals([date, blockId]).first();
  if (existing && !existing.deleted) {
    // Мягкое удаление: строка остаётся, чтобы снятие отметки доехало до других устройств.
    await db.checks.put({ ...existing, deleted: true, updatedAt: stamp() });
    return false;
  }
  await db.checks.put({
    id: existing?.id ?? newId(),
    date,
    blockId,
    doneAt: stamp(),
    deleted: false,
    updatedAt: stamp(),
  });
  return true;
}

export async function addSession(session: Omit<WorkSession, 'id' | 'updatedAt'>): Promise<void> {
  await db.sessions.put({ ...session, id: newId(), updatedAt: stamp() });
}

export async function addMeasure(
  date: string,
  metric: MetricId,
  value: number,
  note: string | null = null,
): Promise<void> {
  await db.measures.put({ id: newId(), date, metric, value, note, updatedAt: stamp() });
}

export async function listMeasures(metric: MetricId): Promise<Measure[]> {
  const rows = await db.measures.where('metric').equals(metric).toArray();
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/** Последний по дате замер метрики. */
export async function lastMeasure(metric: MetricId): Promise<Measure | undefined> {
  const rows = await listMeasures(metric);
  return rows.at(-1);
}

export async function addLog(
  date: string,
  kind: LogKind,
  payload: Record<string, unknown>,
): Promise<void> {
  await db.logs.put({ id: newId(), date, kind, payload, updatedAt: stamp() });
}

export interface Backup {
  format: 'focus-notebook';
  version: number;
  exportedAt: string;
  profile: Profile | null;
  blocks: Block[];
  days: DayRecord[];
  checks: Check[];
  sessions: WorkSession[];
  measures: Measure[];
  logs: LogEntry[];
}

export async function exportAll(): Promise<Backup> {
  const [profile, blocks, days, checks, sessions, measures, logs] = await Promise.all([
    getProfile(),
    db.blocks.toArray(),
    db.days.toArray(),
    db.checks.toArray(),
    db.sessions.toArray(),
    db.measures.toArray(),
    db.logs.toArray(),
  ]);
  return {
    format: 'focus-notebook',
    version: 1,
    exportedAt: stamp(),
    profile: profile ?? null,
    blocks,
    days,
    checks,
    sessions,
    measures,
    logs,
  };
}

/** Проверка формата резервной копии до того, как что-то будет стёрто. */
export function isBackup(value: unknown): value is Backup {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Backup>;
  return (
    candidate.format === 'focus-notebook' &&
    Array.isArray(candidate.blocks) &&
    Array.isArray(candidate.days) &&
    Array.isArray(candidate.checks) &&
    Array.isArray(candidate.measures) &&
    Array.isArray(candidate.logs)
  );
}

export async function importAll(backup: Backup): Promise<void> {
  await db.transaction(
    'rw',
    [db.profile, db.blocks, db.days, db.checks, db.sessions, db.measures, db.logs],
    async () => {
      await Promise.all([
        db.blocks.clear(),
        db.days.clear(),
        db.checks.clear(),
        db.sessions.clear(),
        db.measures.clear(),
        db.logs.clear(),
      ]);
      if (backup.profile) await db.profile.put({ ...backup.profile, id: PROFILE_ID });
      await db.blocks.bulkPut(backup.blocks);
      await db.days.bulkPut(backup.days);
      await db.checks.bulkPut(backup.checks);
      await db.sessions.bulkPut(backup.sessions ?? []);
      await db.measures.bulkPut(backup.measures);
      await db.logs.bulkPut(backup.logs);
    },
  );
}

const ADJUSTMENTS_KEY = 'progression.adjustments';

export type AdjustmentMap = Record<string, Adjustment>;

export async function getAdjustments(): Promise<AdjustmentMap> {
  return (await readMeta<AdjustmentMap>(ADJUSTMENTS_KEY)) ?? {};
}

export async function saveAdjustment(exerciseKey: string, adjustment: Adjustment): Promise<void> {
  const current = await getAdjustments();
  await writeMeta(ADJUSTMENTS_KEY, { ...current, [exerciseKey]: adjustment });
}

export function adjustmentFor(map: AdjustmentMap, exerciseKey: string): Adjustment {
  return map[exerciseKey] ?? NEUTRAL_ADJUSTMENT;
}

/** Множители нагрузки по упражнениям — то, что нужно резолверу тренировки. */
export function adjustmentFactors(map: AdjustmentMap): Record<string, number> {
  return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, value.factor]));
}

export async function listLogsBetween(from: string, to: string): Promise<LogEntry[]> {
  return db.logs.where('date').between(from, to, true, true).toArray();
}

/** Сколько приземлений уже набрано на текущей неделе — для лимита прыжковой работы. */
export async function weeklyLandings(date: string): Promise<number> {
  const logs = await listLogsBetween(startOfWeek(date), date);
  return logs.reduce((sum, log) => {
    const landings = log.kind === 'workout' ? Number(log.payload.landings ?? 0) : 0;
    return sum + (Number.isFinite(landings) ? landings : 0);
  }, 0);
}

/** Замер максимума делается раз в две недели. */
export async function isMaxTestDue(metric: MetricId, date: string): Promise<boolean> {
  const last = await lastMeasure(metric);
  if (!last) return true;
  return last.date <= addDays(date, -14);
}
