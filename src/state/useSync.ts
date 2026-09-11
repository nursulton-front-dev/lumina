import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../sync/client';
import { lastSyncAt, syncAll, type SyncReport } from '../sync/engine';
import type { SessionInfo } from '../sync/useSession';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncApi {
  status: SyncStatus;
  lastAt: string | null;
  report: SyncReport | null;
  error: string | null;
  sync: () => Promise<void>;
}

const AUTO_INTERVAL_MS = 60_000;

/**
 * Автоматическая синхронизация: при появлении сессии, возврате вкладки,
 * восстановлении сети и раз в минуту. Всё остальное время приложение работает локально.
 */
export function useSync(session: SessionInfo | null): SyncApi {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [report, setReport] = useState<SyncReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void lastSyncAt().then(setLastAt);
  }, []);

  const sync = useCallback(async () => {
    if (!supabase || !session) return;
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }
    setStatus('syncing');
    setError(null);
    try {
      const result = await syncAll(supabase, session.userId);
      setReport(result);
      setLastAt(result.at);
      setStatus('idle');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus('error');
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void sync();

    const trigger = (): void => {
      if (document.visibilityState === 'visible') void sync();
    };
    const id = window.setInterval(trigger, AUTO_INTERVAL_MS);
    document.addEventListener('visibilitychange', trigger);
    window.addEventListener('online', trigger);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', trigger);
      window.removeEventListener('online', trigger);
    };
  }, [session, sync]);

  return { status, lastAt, report, error, sync };
}
