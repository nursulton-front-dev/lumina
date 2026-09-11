import { useEffect } from 'react';
import { formatClock } from '../../domain/time';
import { Button } from '../../components/ui/Button';
import { Ruler } from '../../components/ui/Ruler';
import { useCountdown } from '../../state/useCountdown';
import { useT } from '../../state/app-context';
import { playChime } from '../../lib/sound';

/** Таймер шага: крупные табличные цифры, отсчёт по абсолютному времени окончания. */
export function StepTimer({
  seconds,
  onFinished,
  compact = false,
}: {
  seconds: number;
  onFinished: () => void;
  /** Компактный вид: таймер не должен перебивать содержимое шага. */
  compact?: boolean;
}): React.JSX.Element {
  const t = useT();
  const countdown = useCountdown(seconds, () => {
    playChime();
    onFinished();
  });
  const { start } = countdown;

  useEffect(() => {
    start(seconds);
  }, [seconds, start]);

  const passed = countdown.total > 0 ? 1 - countdown.remaining / countdown.total : 0;

  return (
    <div className="flex flex-col gap-3">
      <output
        className={[
          'block font-display leading-none font-extrabold tnum text-ink',
          compact ? 'text-[clamp(1.75rem,8vw,2.25rem)]' : 'text-[clamp(3.5rem,20vw,6rem)]',
        ].join(' ')}
      >
        {formatClock(countdown.remaining)}
      </output>
      <Ruler value={passed} tone={countdown.finished ? 'done' : 'ochre'} />
      <div className="flex items-center gap-2">
        {countdown.finished ? (
          <span className="font-display text-[0.75rem] uppercase tracking-[0.14em] text-done">
            {t('protocol.timerDone')}
          </span>
        ) : countdown.running ? (
          <Button variant="quiet" onClick={countdown.pause}>
            {t('protocol.pause')}
          </Button>
        ) : (
          <Button variant="quiet" onClick={countdown.resume}>
            {t('protocol.resume')}
          </Button>
        )}
      </div>
    </div>
  );
}
