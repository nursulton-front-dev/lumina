import { useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { AssistantMessage, ChangeRecord, Profile } from '../types';
import { db, newId, stamp } from '../db/db';
import { runAssistant, type ChatMessage } from '../ai/client';
import { applyChange, pendingChanges, undoLastChange } from '../ai/tools';
import type { DiffRow } from '../ai/proposal';

export interface Proposal {
  changeId: string;
  summary: string;
  diff: DiffRow[];
}

export interface AssistantApi {
  messages: AssistantMessage[];
  pending: ChangeRecord[];
  streaming: string;
  busy: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  accept: (changeId: string) => Promise<void>;
  reject: (changeId: string) => Promise<void>;
  undo: () => Promise<string | null>;
  clear: () => Promise<void>;
}

const HISTORY_LIMIT = 16;

async function saveMessage(
  role: AssistantMessage['role'],
  content: string,
  toolName: string | null = null,
): Promise<void> {
  await db.messages.put({
    id: newId(),
    role,
    content,
    toolName,
    createdAt: stamp(),
    updatedAt: stamp(),
  });
}

/** Переписка, предложения и применение изменений. История живёт в базе и синхронизируется. */
export function useAssistant(profile: Profile | null, today: string): AssistantApi {
  const [streaming, setStreaming] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messages =
    useLiveQuery(async () => {
      const rows = await db.messages.toArray();
      return rows
        .filter((row) => !row.deleted)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }, []) ?? [];

  const pending = useLiveQuery(() => pendingChanges(), []) ?? [];

  const send = useCallback(
    async (text: string) => {
      if (!profile || busy || text.trim().length === 0) return;
      setError(null);
      setBusy(true);
      setStreaming('');
      await saveMessage('user', text.trim());

      const stored = await db.messages.toArray();
      const history: ChatMessage[] = stored
        .filter((row) => !row.deleted && row.role !== 'tool')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-HISTORY_LIMIT)
        .map((row) => ({
          role: row.role === 'assistant' ? 'assistant' : 'user',
          content: row.content,
        }));

      let answer = '';
      try {
        for await (const event of runAssistant({ history, profile, lang: profile.lang, today })) {
          if (event.type === 'delta') {
            answer += event.text;
            setStreaming(answer);
          }
          if (event.type === 'tool') {
            await saveMessage('tool', event.name, event.name);
          }
          if (event.type === 'error') setError(event.message);
          if (event.type === 'done') answer = event.text || answer;
        }
        if (answer.trim().length > 0) await saveMessage('assistant', answer.trim());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setStreaming('');
        setBusy(false);
      }
    },
    [profile, busy, today],
  );

  const accept = useCallback(async (changeId: string) => {
    await applyChange(changeId);
  }, []);

  const reject = useCallback(async (changeId: string) => {
    const record = await db.changes.get(changeId);
    if (record) await db.changes.put({ ...record, deleted: true, updatedAt: stamp() });
  }, []);

  const undo = useCallback(async () => {
    const result = await undoLastChange();
    const data = result.data as { summary?: string; error?: string };
    return result.ok ? (data.summary ?? '') : null;
  }, []);

  const clear = useCallback(async () => {
    const rows = await db.messages.toArray();
    await db.messages.bulkPut(rows.map((row) => ({ ...row, deleted: true, updatedAt: stamp() })));
  }, []);

  return { messages, pending, streaming, busy, error, send, accept, reject, undo, clear };
}
