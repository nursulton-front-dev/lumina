import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export interface ServiceWorkerState {
  /** Новая версия установлена и ждёт: пора показать плашку. */
  needRefresh: boolean;
  /** Активирует новую версию и перезагружает страницу. */
  update: () => Promise<void>;
  dismiss: () => void;
}

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Регистрация service worker с плашкой обновления. Проверка новой версии —
 * при регистрации, при возврате вкладки и раз в час.
 */
export function useServiceWorker(): ServiceWorkerState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updater, setUpdater] = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onRegisteredSW: (_url, registration) => {
        if (!registration) return;
        const check = (): void => {
          if (document.visibilityState === 'visible') void registration.update();
        };
        window.setInterval(check, CHECK_INTERVAL_MS);
        document.addEventListener('visibilitychange', check);
      },
    });
    setUpdater(() => updateSW);
  }, []);

  return {
    needRefresh,
    update: async () => {
      if (updater) await updater(true);
      else window.location.reload();
    },
    dismiss: () => setNeedRefresh(false),
  };
}
