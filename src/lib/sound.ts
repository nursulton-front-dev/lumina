/** Короткий сигнал без звукового файла: два тона через Web Audio. */
export function playChime(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const context = new Ctor();
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    gain.connect(context.destination);

    for (const [frequency, offset] of [
      [660, 0],
      [880, 0.18],
    ] as const) {
      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now + offset);
      oscillator.connect(gain);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.35);
    }

    window.setTimeout(() => void context.close(), 1200);
  } catch {
    // Звук — не критичная часть: если браузер не дал контекст, молча продолжаем.
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function notify(title: string, body: string): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
  } catch {
    // На iOS уведомления доступны только установленному приложению — тихо пропускаем.
  }
}
