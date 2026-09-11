import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { db, PROFILE_ID } from '../db/db';
import { defaultProfile } from '../db/repo';
import { syncAll } from './engine';

const USER = '00000000-0000-4000-8000-000000000001';

type Row = Record<string, unknown>;

/**
 * Мини-подделка Supabase: держит строки в памяти и повторяет поведение,
 * на которое опирается движок — upsert по (user_id, id) и выборка по updated_at.
 */
function fakeClient(store: Record<string, Row[]>): SupabaseClient {
  const api = {
    from(table: string) {
      store[table] ??= [];
      const rows = store[table];
      const query = {
        filters: [] as ((row: Row) => boolean)[],
        select() {
          return query;
        },
        eq(column: string, value: unknown) {
          query.filters.push((row) => row[column] === value);
          return query;
        },
        gt(column: string, value: unknown) {
          query.filters.push((row) => String(row[column]) > String(value));
          return query;
        },
        order() {
          return query;
        },
        limit() {
          const data = rows
            .filter((row) => query.filters.every((check) => check(row)))
            .sort((a, b) => String(a.updated_at).localeCompare(String(b.updated_at)));
          return Promise.resolve({ data, error: null });
        },
        maybeSingle() {
          const data = rows.find((row) => query.filters.every((check) => check(row))) ?? null;
          return Promise.resolve({ data, error: null });
        },
        upsert(payload: Row | Row[]) {
          const items = Array.isArray(payload) ? payload : [payload];
          for (const item of items) {
            const index = rows.findIndex(
              (row) => row.id === item.id && (row.user_id ?? row.id) === (item.user_id ?? item.id),
            );
            if (index >= 0) rows[index] = { ...rows[index], ...item };
            else rows.push({ ...item });
          }
          return Promise.resolve({ data: items, error: null });
        },
      };
      return query;
    },
  };
  return api as unknown as SupabaseClient;
}

async function reset(): Promise<void> {
  await db.delete();
  await db.open();
  await db.profile.put({ ...defaultProfile('ru'), updatedAt: '2026-09-01T00:00:00.000Z' });
}

describe('движок синхронизации', () => {
  beforeEach(reset);

  test('локальные изменения уходят на сервер', async () => {
    const store: Record<string, Row[]> = {};
    await db.checks.put({
      id: 'check-1',
      date: '2026-09-10',
      blockId: 'numbers',
      doneAt: '2026-09-10T07:30:00.000Z',
      updatedAt: '2026-09-10T07:30:00.000Z',
    });

    const report = await syncAll(fakeClient(store), USER);

    expect(report.pushed).toBe(1);
    expect(store.checks).toHaveLength(1);
    expect(store.checks?.[0]).toMatchObject({ id: 'check-1', user_id: USER, block_id: 'numbers' });
  });

  test('серверные изменения приезжают на устройство', async () => {
    const store: Record<string, Row[]> = {
      checks: [
        {
          user_id: USER,
          id: 'check-remote',
          date: '2026-09-10',
          block_id: 'fiction',
          done_at: '2026-09-10T22:40:00.000Z',
          deleted: false,
          updated_at: '2026-09-10T22:40:00.000Z',
        },
      ],
    };

    await syncAll(fakeClient(store), USER);

    const local = await db.checks.get('check-remote');
    expect(local?.blockId).toBe('fiction');
  });

  test('при конфликте побеждает более поздняя запись', async () => {
    const store: Record<string, Row[]> = {
      blocks: [
        {
          user_id: USER,
          id: 'odd-block.fiction-2230',
          day_type: 'odd',
          start_min: 1350,
          end_min: 1380,
          title: 'С телефона',
          category: 'reading',
          is_core: true,
          is_focus: false,
          sort_order: 0,
          deleted: false,
          updated_at: '2026-09-10T20:00:00.000Z',
        },
      ],
    };

    await db.blocks.put({
      id: 'odd-block.fiction-2230',
      dayType: 'odd',
      date: '',
      start: 1350,
      end: 1380,
      titleKey: null,
      title: 'С ноутбука',
      category: 'reading',
      protocolId: null,
      isCore: true,
      isFocus: false,
      order: 0,
      updatedAt: '2026-09-10T19:00:00.000Z',
    });

    await syncAll(fakeClient(store), USER);

    const local = await db.blocks.get('odd-block.fiction-2230');
    expect(local?.title).toBe('С телефона');
  });

  test('более свежая локальная запись не затирается серверной', async () => {
    const store: Record<string, Row[]> = {
      blocks: [
        {
          user_id: USER,
          id: 'block-x',
          day_type: 'odd',
          start_min: 600,
          end_min: 660,
          title: 'Старое',
          category: 'ioi',
          is_core: false,
          is_focus: true,
          sort_order: 0,
          deleted: false,
          updated_at: '2026-09-10T10:00:00.000Z',
        },
      ],
    };

    await db.blocks.put({
      id: 'block-x',
      dayType: 'odd',
      date: '',
      start: 600,
      end: 660,
      titleKey: null,
      title: 'Новое',
      category: 'ioi',
      protocolId: null,
      isCore: false,
      isFocus: true,
      order: 0,
      updatedAt: '2026-09-10T12:00:00.000Z',
    });

    await syncAll(fakeClient(store), USER);

    expect((await db.blocks.get('block-x'))?.title).toBe('Новое');
    expect(store.blocks?.[0]?.title).toBe('Новое');
  });

  test('снятая отметка доезжает как мягкое удаление', async () => {
    const store: Record<string, Row[]> = {
      checks: [
        {
          user_id: USER,
          id: 'check-2',
          date: '2026-09-10',
          block_id: 'homework',
          done_at: '2026-09-10T17:00:00.000Z',
          deleted: true,
          updated_at: '2026-09-10T18:00:00.000Z',
        },
      ],
    };

    await db.checks.put({
      id: 'check-2',
      date: '2026-09-10',
      blockId: 'homework',
      doneAt: '2026-09-10T17:00:00.000Z',
      updatedAt: '2026-09-10T17:00:00.000Z',
    });

    await syncAll(fakeClient(store), USER);

    expect((await db.checks.get('check-2'))?.deleted).toBe(true);
  });

  test('повторная синхронизация не отправляет то же самое дважды', async () => {
    const store: Record<string, Row[]> = {};
    await db.measures.put({
      id: 'measure-1',
      date: '2026-09-11',
      metric: 'pullups',
      value: 3,
      note: null,
      updatedAt: '2026-09-11T07:00:00.000Z',
    });

    const client = fakeClient(store);
    const first = await syncAll(client, USER);
    const second = await syncAll(client, USER);

    expect(first.pushed).toBe(1);
    expect(second.pushed).toBe(0);
    expect(store.measures).toHaveLength(1);
  });

  test('профиль уезжает на сервер и возвращается более свежим', async () => {
    const store: Record<string, Row[]> = {};
    const client = fakeClient(store);
    await syncAll(client, USER);
    expect(store.profiles?.[0]).toMatchObject({ id: USER, max_pullups: 2 });

    store.profiles = [
      { ...(store.profiles?.[0] ?? {}), max_pullups: 6, updated_at: '2026-09-20T00:00:00.000Z' },
    ];
    await syncAll(client, USER);

    expect((await db.profile.get(PROFILE_ID))?.maxPullups).toBe(6);
  });
});
