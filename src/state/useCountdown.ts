import { useCallback, useEffect, useRef, useState } from 'react';

export interface Countdown {
  /** Секунд до конца, с округлением вверх. */
  remaining: number;
  total: number;
  running: boolean;
  finished: boolean;
  start: (seconds?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: (seconds: number) => void;
}

const TICK_MS = 250;

/**
 * Обратный отсчёт по абсолютному времени окончания, а не по тикам интервала:
 * вкладка в фоне может тормозить таймеры, а конец сессии от этого сдвигаться не должен.
 */
export function useCountdown(initialSeconds: number, onFinish?: () => void): Countdown {
  const [total, setTotal] = useState(initialSeconds);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number>(initialSeconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const finishedRef = useRef(false);
  const finishRef = useRef(onFinish);

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  // Новая длительность шага сбрасывает отсчёт: это синхронизация с внешним параметром.
  useEffect(() => {
    setTotal(initialSeconds);
    setPausedRemaining(initialSeconds * 1000);
    setDeadline(null);
    finishedRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (deadline === null) return;
    const tick = (): void => setNow(Date.now());
    const id = window.setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [deadline]);

  const remainingMs = deadline === null ? pausedRemaining : Math.max(0, deadline - now);
  const finished = remainingMs <= 0 && total > 0;

  useEffect(() => {
    if (finished && !finishedRef.current) {
      finishedRef.current = true;
      finishRef.current?.();
    }
  }, [finished]);

  const start = useCallback(
    (seconds?: number) => {
      const value = seconds ?? total;
      finishedRef.current = false;
      setTotal(value);
      setDeadline(Date.now() + value * 1000);
      setNow(Date.now());
    },
    [total],
  );

  const pause = useCallback(() => {
    setDeadline((current) => {
      if (current === null) return null;
      setPausedRemaining(Math.max(0, current - Date.now()));
      return null;
    });
  }, []);

  const resume = useCallback(() => {
    setDeadline(Date.now() + pausedRemaining);
    setNow(Date.now());
  }, [pausedRemaining]);

  const reset = useCallback((seconds: number) => {
    finishedRef.current = false;
    setTotal(seconds);
    setPausedRemaining(seconds * 1000);
    setDeadline(null);
  }, []);

  return {
    remaining: Math.ceil(remainingMs / 1000),
    total,
    running: deadline !== null,
    finished,
    start,
    pause,
    resume,
    reset,
  };
}
