import type { EntityTable } from 'dexie';
import type {
  AssistantMessage,
  Block,
  ChangeRecord,
  Check,
  DayRecord,
  LogEntry,
  Measure,
  Profile,
  WorkSession,
} from '../types';
import { db } from '../db/db';

/** Строка, пришедшая из Postgres. Значения проверяются в конвертерах. */
export type RemoteRow = Record<string, unknown>;

export interface SyncedRecord {
  id: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface TableSync<T extends SyncedRecord> {
  /** Имя таблицы в Postgres. */
  remote: string;
  table: EntityTable<T, 'id'>;
  toRemote: (row: T, userId: string) => RemoteRow;
  fromRemote: (row: RemoteRow) => T;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function int(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown): boolean {
  return value === true;
}

/** Postgres возвращает время со смещением — приводим к одному виду. */
function iso(value: unknown): string {
  if (typeof value !== 'string') return new Date(0).toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

export const blocksSync: TableSync<Block> = {
  remote: 'blocks',
  table: db.blocks,
  toRemote: (row, userId) => ({
    user_id: userId,
    id: row.id,
    day_type: row.dayType,
    date: row.date,
    weekdays: row.weekdays,
    start_min: row.start,
    end_min: row.end,
    title_key: row.titleKey,
    title: row.title,
    category: row.category,
    protocol_id: row.protocolId,
    is_core: row.isCore,
    is_focus: row.isFocus,
    sort_order: row.order,
    deleted: row.deleted ?? false,
    updated_at: row.updatedAt,
  }),
  fromRemote: (row) => ({
    id: text(row.id),
    dayType: text(row.day_type, 'odd') as Block['dayType'],
    date: text(row.date),
    weekdays: Array.isArray(row.weekdays) ? row.weekdays.map((day) => int(day)) : [],
    start: int(row.start_min),
    end: int(row.end_min),
    titleKey: nullableText(row.title_key) as Block['titleKey'],
    title: nullableText(row.title),
    category: text(row.category, 'routine') as Block['category'],
    protocolId: nullableText(row.protocol_id) as Block['protocolId'],
    isCore: bool(row.is_core),
    isFocus: bool(row.is_focus),
    order: int(row.sort_order),
    deleted: bool(row.deleted),
    updatedAt: iso(row.updated_at),
  }),
};

export const daysSync: TableSync<DayRecord> = {
  remote: 'days',
  table: db.days,
  toRemote: (row, userId) => ({
    user_id: userId,
    id: row.id,
    date: row.date,
    type_override: row.typeOverride,
    min_done: row.minDone,
    bedtime_actual: row.bedtimeActual,
    deleted: row.deleted ?? false,
    updated_at: row.updatedAt,
  }),
  fromRemote: (row) => ({
    id: text(row.id),
    date: text(row.date),
    typeOverride: nullableText(row.type_override) as DayRecord['typeOverride'],
    minDone: bool(row.min_done),
    bedtimeActual: nullableText(row.bedtime_actual),
    deleted: bool(row.deleted),
    updatedAt: iso(row.updated_at),
  }),
};

export const checksSync: TableSync<Check> = {
  remote: 'checks',
  table: db.checks,
  toRemote: (row, userId) => ({
    user_id: userId,
    id: row.id,
    date: row.date,
    block_id: row.blockId,
    done_at: row.doneAt,
    deleted: row.deleted ?? false,
    updated_at: row.updatedAt,
  }),
  fromRemote: (row) => ({
    id: text(row.id),
    date: text(row.date),
    blockId: text(row.block_id),
    doneAt: iso(row.done_at),
    deleted: bool(row.deleted),
    updatedAt: iso(row.updated_at),
  }),
};

export const sessionsSync: TableSync<WorkSession> = {
  remote: 'sessions',
  table: db.sessions,
  toRemote: (row, userId) => ({
    user_id: userId,
    id: row.id,
    date: row.date,
    block_id: row.blockId,
    kind: row.kind,
    minutes: row.minutes,
    exits: row.exits,
    broken: row.broken,
    started_at: row.startedAt,
    deleted: row.deleted ?? false,
    updated_at: row.updatedAt,
  }),
  fromRemote: (row) => ({
    id: text(row.id),
    date: text(row.date),
    blockId: nullableText(row.block_id),
    kind: text(row.kind, 'pomodoro') as WorkSession['kind'],
    minutes: int(row.minutes),
    exits: int(row.exits),
    broken: bool(row.broken),
    startedAt: iso(row.started_at),
    deleted: bool(row.deleted),
    updatedAt: iso(row.updated_at),
  }),
};

export const measuresSync: TableSync<Measure> = {
  remote: 'measures',
  table: db.measures,
  toRemote: (row, userId) => ({
    user_id: userId,
    id: row.id,
    date: row.date,
    metric: row.metric,
    value: row.value,
    note: row.note,
    deleted: row.deleted ?? false,
    updated_at: row.updatedAt,
  }),
  fromRemote: (row) => ({
    id: text(row.id),
    date: text(row.date),
    metric: text(row.metric, 'pullups') as Measure['metric'],
    value: int(row.value),
    note: nullableText(row.note),
    deleted: bool(row.deleted),
    updatedAt: iso(row.updated_at),
  }),
};

export const logsSync: TableSync<LogEntry> = {
  remote: 'logs',
  table: db.logs,
  toRemote: (row, userId) => ({
    user_id: userId,
    id: row.id,
    date: row.date,
    kind: row.kind,
    payload: row.payload,
    deleted: row.deleted ?? false,
    updated_at: row.updatedAt,
  }),
  fromRemote: (row) => ({
    id: text(row.id),
    date: text(row.date),
    kind: text(row.kind, 'note') as LogEntry['kind'],
    payload:
      typeof row.payload === 'object' && row.payload !== null
        ? (row.payload as Record<string, unknown>)
        : {},
    deleted: bool(row.deleted),
    updatedAt: iso(row.updated_at),
  }),
};

export const messagesSync: TableSync<AssistantMessage> = {
  remote: 'messages',
  table: db.messages,
  toRemote: (row, userId) => ({
    user_id: userId,
    id: row.id,
    role: row.role,
    content: row.content,
    tool_name: row.toolName,
    created_at: row.createdAt,
    deleted: row.deleted ?? false,
    updated_at: row.updatedAt,
  }),
  fromRemote: (row) => ({
    id: text(row.id),
    role: text(row.role, 'user') as AssistantMessage['role'],
    content: text(row.content),
    toolName: nullableText(row.tool_name),
    createdAt: iso(row.created_at),
    deleted: bool(row.deleted),
    updatedAt: iso(row.updated_at),
  }),
};

export const changesSync: TableSync<ChangeRecord> = {
  remote: 'changes',
  table: db.changes,
  toRemote: (row, userId) => ({
    user_id: userId,
    id: row.id,
    created_at: row.createdAt,
    summary: row.summary,
    scope: row.scope,
    day_type: row.dayType,
    date: row.date,
    before_blocks: row.before,
    after_blocks: row.after,
    applied: row.applied,
    undone: row.undone,
    deleted: row.deleted ?? false,
    updated_at: row.updatedAt,
  }),
  fromRemote: (row) => ({
    id: text(row.id),
    createdAt: iso(row.created_at),
    summary: text(row.summary),
    scope:
      typeof row.scope === 'object' && row.scope !== null
        ? (row.scope as Record<string, unknown>)
        : {},
    dayType: text(row.day_type, 'odd') as ChangeRecord['dayType'],
    date: text(row.date),
    before: Array.isArray(row.before_blocks) ? (row.before_blocks as Block[]) : [],
    after: Array.isArray(row.after_blocks) ? (row.after_blocks as Block[]) : [],
    applied: bool(row.applied),
    undone: bool(row.undone),
    deleted: bool(row.deleted),
    updatedAt: iso(row.updated_at),
  }),
};

export function profileToRemote(profile: Profile, userId: string): RemoteRow {
  return {
    id: userId,
    lang: profile.lang,
    theme: profile.theme,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    wake_time: profile.wakeTime,
    sleep_target: profile.sleepTarget,
    sleep_target_shifted_on: profile.sleepTargetShiftedOn,
    school_start: profile.schoolStart,
    school_end: profile.schoolEnd,
    commute_minutes: profile.commuteMinutes,
    english_mode: profile.englishMode,
    english_days: profile.englishDays,
    equipment: profile.equipment,
    has_ball: profile.hasBall,
    goals: profile.goals,
    max_pullups: profile.maxPullups,
    max_pushups: profile.maxPushups,
    voice_name: profile.voiceName,
    season_start: profile.seasonStart,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

export function profileFromRemote(row: RemoteRow, local: Profile): Profile {
  return {
    ...local,
    lang: text(row.lang, local.lang) as Profile['lang'],
    theme: text(row.theme, local.theme) as Profile['theme'],
    heightCm: int(row.height_cm, local.heightCm),
    weightKg: int(row.weight_kg, local.weightKg),
    wakeTime: text(row.wake_time, local.wakeTime),
    sleepTarget: text(row.sleep_target, local.sleepTarget),
    sleepTargetShiftedOn: nullableText(row.sleep_target_shifted_on),
    schoolStart: text(row.school_start, local.schoolStart),
    schoolEnd: text(row.school_end, local.schoolEnd),
    commuteMinutes: int(row.commute_minutes, local.commuteMinutes),
    englishMode: text(row.english_mode, local.englishMode) as Profile['englishMode'],
    englishDays: Array.isArray(row.english_days)
      ? row.english_days.map((day) => int(day))
      : local.englishDays,
    equipment: Array.isArray(row.equipment)
      ? row.equipment.map((item) => text(item))
      : local.equipment,
    hasBall: bool(row.has_ball),
    goals: text(row.goals, local.goals),
    maxPullups: int(row.max_pullups, local.maxPullups),
    maxPushups: int(row.max_pushups, local.maxPushups),
    voiceName: nullableText(row.voice_name),
    seasonStart: text(row.season_start, local.seasonStart),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}
