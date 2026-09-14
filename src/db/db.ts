import Dexie, { type EntityTable } from 'dexie';
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

/** Произвольные пары ключ-значение: версия сидов, состояние таймера, флаги. */
export interface MetaRow {
  key: string;
  value: unknown;
}

export class FocusDb extends Dexie {
  blocks!: EntityTable<Block, 'id'>;
  days!: EntityTable<DayRecord, 'id'>;
  checks!: EntityTable<Check, 'id'>;
  sessions!: EntityTable<WorkSession, 'id'>;
  measures!: EntityTable<Measure, 'id'>;
  logs!: EntityTable<LogEntry, 'id'>;
  profile!: EntityTable<Profile, 'id'>;
  messages!: EntityTable<AssistantMessage, 'id'>;
  changes!: EntityTable<ChangeRecord, 'id'>;
  meta!: EntityTable<MetaRow, 'key'>;

  constructor() {
    super('focus-notebook');
    this.version(1).stores({
      blocks: 'id, dayType, start, updatedAt',
      days: 'id, &date, updatedAt',
      checks: 'id, date, blockId, [date+blockId], updatedAt',
      sessions: 'id, date, blockId, updatedAt',
      measures: 'id, date, metric, [metric+date], updatedAt',
      logs: 'id, date, kind, updatedAt',
      profile: 'id',
      meta: 'key',
    });

    // Версия 2: разовые копии дня у блоков, история правок и переписка с ассистентом.
    this.version(2)
      .stores({
        blocks: 'id, dayType, date, [dayType+date], start, updatedAt',
        messages: 'id, createdAt, updatedAt',
        changes: 'id, createdAt, updatedAt',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('blocks')
          .toCollection()
          .modify((block: Block) => {
            block.date ??= '';
          });
      });

    // Версия 3: блок может действовать только в выбранные дни недели.
    this.version(3).upgrade(async (transaction) => {
      await transaction
        .table('blocks')
        .toCollection()
        .modify((block: Block) => {
          block.weekdays ??= [];
        });
    });
  }
}

export const db = new FocusDb();

export const PROFILE_ID = 'me';

export function newId(): string {
  return crypto.randomUUID();
}

export function stamp(): string {
  return new Date().toISOString();
}

export async function readMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key);
  return row?.value as T | undefined;
}

export async function writeMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}
