import type { SupabaseClient } from '@supabase/supabase-js';
import { db, PROFILE_ID, readMeta, writeMeta } from '../db/db';
import { getProfile } from '../db/repo';
import {
  blocksSync,
  changesSync,
  checksSync,
  daysSync,
  logsSync,
  measuresSync,
  messagesSync,
  profileFromRemote,
  profileToRemote,
  sessionsSync,
  type RemoteRow,
  type SyncedRecord,
  type TableSync,
} from './mapping';

const EPOCH = new Date(0).toISOString();
const PAGE = 500;

export interface SyncReport {
  pushed: number;
  pulled: number;
  at: string;
}

function pulledKey(remote: string): string {
  return `sync.pulled.${remote}`;
}

function pushedKey(remote: string): string {
  return `sync.pushed.${remote}`;
}

/** Отправляет локальные изменения. Конфликты решает база: побеждает более поздняя запись. */
async function pushTable<T extends SyncedRecord>(
  client: SupabaseClient,
  userId: string,
  spec: TableSync<T>,
): Promise<number> {
  const since = (await readMeta<string>(pushedKey(spec.remote))) ?? EPOCH;
  const rows = await spec.table.filter((row) => row.updatedAt > since).toArray();
  if (rows.length === 0) return 0;

  let watermark = since;
  for (let index = 0; index < rows.length; index += PAGE) {
    const chunk = rows.slice(index, index + PAGE);
    const payload = chunk.map((row) => spec.toRemote(row, userId));
    const { error } = await client.from(spec.remote).upsert(payload, { onConflict: 'user_id,id' });
    if (error) throw new Error(`${spec.remote}: ${error.message}`);
    for (const row of chunk) if (row.updatedAt > watermark) watermark = row.updatedAt;
  }

  await writeMeta(pushedKey(spec.remote), watermark);
  return rows.length;
}

/** Забирает всё, что изменилось на сервере после прошлой синхронизации. */
async function pullTable<T extends SyncedRecord>(
  client: SupabaseClient,
  spec: TableSync<T>,
): Promise<number> {
  const since = (await readMeta<string>(pulledKey(spec.remote))) ?? EPOCH;
  let cursor = since;
  let total = 0;

  for (;;) {
    const { data, error } = await client
      .from(spec.remote)
      .select('*')
      .gt('updated_at', cursor)
      .order('updated_at', { ascending: true })
      .limit(PAGE);
    if (error) throw new Error(`${spec.remote}: ${error.message}`);
    const rows = (data ?? []) as RemoteRow[];
    if (rows.length === 0) break;

    for (const raw of rows) {
      const remote = spec.fromRemote(raw);
      const local = await spec.table.where('id').equals(remote.id).first();
      // Побеждает более поздняя запись — по updated_at, а не по порядку прихода.
      if (!local || remote.updatedAt > local.updatedAt) {
        await spec.table.put(remote);
      }
      if (remote.updatedAt > cursor) cursor = remote.updatedAt;
      total += 1;
    }

    if (rows.length < PAGE) break;
  }

  if (cursor !== since) await writeMeta(pulledKey(spec.remote), cursor);
  return total;
}

/** Обёртка, чтобы список таблиц с разными типами строк оставался типобезопасным. */
interface TableRunner {
  remote: string;
  push: (client: SupabaseClient, userId: string) => Promise<number>;
  pull: (client: SupabaseClient) => Promise<number>;
}

function runner<T extends SyncedRecord>(spec: TableSync<T>): TableRunner {
  return {
    remote: spec.remote,
    push: (client, userId) => pushTable(client, userId, spec),
    pull: (client) => pullTable(client, spec),
  };
}

const TABLES: TableRunner[] = [
  runner(blocksSync),
  runner(daysSync),
  runner(checksSync),
  runner(sessionsSync),
  runner(measuresSync),
  runner(logsSync),
  runner(messagesSync),
  runner(changesSync),
];

async function syncProfile(client: SupabaseClient, userId: string): Promise<void> {
  const local = await getProfile();
  if (!local) return;

  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new Error(`profiles: ${error.message}`);

  const remote = data as RemoteRow | null;
  const remoteUpdated = remote ? new Date(String(remote.updated_at)).toISOString() : EPOCH;

  if (remote && remoteUpdated > local.updatedAt) {
    await db.profile.put({ ...profileFromRemote(remote, local), id: PROFILE_ID });
    return;
  }

  const { error: upsertError } = await client
    .from('profiles')
    .upsert(profileToRemote(local, userId), { onConflict: 'id' });
  if (upsertError) throw new Error(`profiles: ${upsertError.message}`);
}

/** Полный цикл: сначала забираем чужое, потом отдаём своё. */
export async function syncAll(client: SupabaseClient, userId: string): Promise<SyncReport> {
  let pushed = 0;
  let pulled = 0;

  await syncProfile(client, userId);

  // Сначала забираем чужое, потом отдаём своё: иначе более старая локальная
  // запись успела бы затереть на сервере более свежую.
  for (const spec of TABLES) pulled += await spec.pull(client);
  for (const spec of TABLES) pushed += await spec.push(client, userId);

  const at = new Date().toISOString();
  await writeMeta('sync.lastAt', at);
  return { pushed, pulled, at };
}

export async function lastSyncAt(): Promise<string | null> {
  return (await readMeta<string>('sync.lastAt')) ?? null;
}

/** После выхода из аккаунта метки сбрасываются: следующий вход синхронизирует всё заново. */
export async function resetSyncState(): Promise<void> {
  for (const spec of TABLES) {
    await db.meta.delete(pulledKey(spec.remote));
    await db.meta.delete(pushedKey(spec.remote));
  }
  await db.meta.delete('sync.lastAt');
}
