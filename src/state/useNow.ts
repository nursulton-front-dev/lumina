import { useEffect, useState } from 'react';

/**
 * Текущее время с обновлением по таймеру и при возврате вкладки из фона.
 * Возврат важен: в фоне таймеры браузер притормаживает.
 */
export function useNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = (): void => setNow(new Date());
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [intervalMs]);

  return now;
}
