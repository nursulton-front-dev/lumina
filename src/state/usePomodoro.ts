import { useCallback, useEffect, useState } from 'react';
import {
  isFinished,
  markAway,
  markBack,
  phaseMinutes,
  startSession,
  switchPhase,
  type PomodoroMode,
  type PomodoroState,
} from '../domain/pomodoro';
import { readMeta, writeMeta } from '../db/db';
import { addSession } from '../db/repo';

const ACTIVE_KEY = 'pomodoro.active';

async function persist(state: PomodoroState | null): Promise<void> {
  await writeMeta(ACTIVE_KEY, state);
}

/** Закрытая рабочая фаза попадает в журнал сессий. */
async function recordWorkPhase(state: PomodoroState): Promise<void> {
  await addSession({
    date: state.date,
    blockId: state.blockId,
    kind: 'pomodoro',
    minutes: phaseMinutes(state.mode, 'work'),
    exits: state.exits,
    broken: state.broken,
    startedAt: new Date(state.startedAt).toISOString(),
  });
}

/**
 * Догоняет пропущенные фазы: если приложение было закрыто, время всё равно шло.
 * Возвращает новое состояние и число закрытых рабочих фаз.
 */
async function reconcile(state: PomodoroState, now: number): Promise<PomodoroState> {
  let current = state;
  let guard = 0;
  while (isFinished(current, now) && guard < 48) {
    if (current.phase === 'work') await recordWorkPhase(current);
    current = switchPhase(current, current.endsAt);
    guard += 1;
  }
  return current;
}

export interface PomodoroApi {
  state: PomodoroState | null;
  loading: boolean;
  start: (blockId: string | null, date: string, mode: PomodoroMode) => Promise<void>;
  stop: () => Promise<void>;
  setMode: (mode: PomodoroMode) => Promise<void>;
  onPhaseEnd: (handler: (phase: PomodoroState) => void) => void;
}

/**
 * Активная сессия помодоро. Живёт в IndexedDB, поэтому переживает перезагрузку
 * страницы и закрытие вкладки: конец фазы задан абсолютным временем.
 */
export function usePomodoro(): PomodoroApi {
  const [state, setState] = useState<PomodoroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [phaseHandler, setPhaseHandler] = useState<((phase: PomodoroState) => void) | null>(null);

  const apply = useCallback(async (next: PomodoroState | null) => {
    setState(next);
    await persist(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await readMeta<PomodoroState | null>(ACTIVE_KEY);
      if (cancelled) return;
      if (!stored) {
        setState(null);
        setLoading(false);
        return;
      }
      const next = await reconcile(stored, Date.now());
      if (cancelled) return;
      setState(next);
      await persist(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Уход вкладки в фон во время работы — фиксируемый выход.
  useEffect(() => {
    if (!state) return;
    const onVisibility = (): void => {
      setState((current) => {
        if (!current) return current;
        const next =
          document.visibilityState === 'hidden'
            ? markAway(current, Date.now())
            : markBack(current, Date.now());
        void persist(next);
        return next;
      });
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [state]);

  // Переход между фазами: рабочая фаза уходит в журнал, дальше идёт отдых.
  useEffect(() => {
    if (!state) return;
    const check = (): void => {
      setState((current) => {
        if (!current || !isFinished(current, Date.now())) return current;
        void (async () => {
          if (current.phase === 'work') await recordWorkPhase(current);
          const next = switchPhase(current, current.endsAt);
          await persist(next);
          setState(next);
          phaseHandler?.(current);
        })();
        return current;
      });
    };
    const id = window.setInterval(check, 500);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [state, phaseHandler]);

  const start = useCallback(
    async (blockId: string | null, date: string, mode: PomodoroMode) => {
      await apply(startSession({ blockId, date, mode, now: Date.now() }));
    },
    [apply],
  );

  const stop = useCallback(async () => {
    await apply(null);
  }, [apply]);

  const setMode = useCallback(async (mode: PomodoroMode) => {
    setState((current) => {
      if (!current) return current;
      const next: PomodoroState = {
        ...current,
        mode,
        startedAt: Date.now(),
        endsAt: Date.now() + phaseMinutes(mode, current.phase) * 60_000,
      };
      void persist(next);
      return next;
    });
  }, []);

  const onPhaseEnd = useCallback((handler: (phase: PomodoroState) => void) => {
    setPhaseHandler(() => handler);
  }, []);

  return { state, loading, start, stop, setMode, onPhaseEnd };
}
