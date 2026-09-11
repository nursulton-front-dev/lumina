import type { DayPosition } from '../../domain/schedule';
import { blockTitle } from '../../domain/blockTitle';
import { formatDuration, formatRange } from '../../domain/time';
import { Marginalia, Sheet } from '../../components/ui/Sheet';
import { Ruler } from '../../components/ui/Ruler';
import { useApp } from '../../state/app-context';

/** Главный ответ экрана: что идёт сейчас, сколько осталось, что следом. */
export function NowPanel({
  position,
  action,
  advice,
}: {
  position: DayPosition;
  action?: React.JSX.Element;
  /** Совет ассистента перед блоком. null — сказать нечего. */
  advice?: string | null;
}): React.JSX.Element {
  const { t } = useApp();
  const labels = { hour: t('unit.hour'), min: t('unit.min') };
  const { current, next } = position;

  return (
    <Sheet
      accent={current ? 'ochre' : 'ink'}
      className="px-4 pt-3.5 pb-4 shadow-[0_10px_30px_-24px_color-mix(in_oklab,var(--color-ink)_70%,transparent)]"
    >
      <Marginalia>{current ? t('today.now') : t('today.nothingNow')}</Marginalia>

      {current ? (
        <>
          <h1 className="mt-1.5 text-[clamp(1.6rem,7vw,2.25rem)] leading-[1.08] font-semibold tracking-[-0.015em] text-balance text-ink">
            {blockTitle(current, t)}
          </h1>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="font-mono text-[0.8125rem] tnum text-ink-soft">
              {formatRange(current.start, current.end)}
            </span>
            <span className="font-mono text-[clamp(1.25rem,6vw,1.75rem)] leading-none tnum text-ink">
              {formatDuration(position.remaining, labels)}
              <span className="ml-1.5 text-[0.6875rem] tracking-[0.14em] text-ink-faint uppercase">
                {t('today.left')}
              </span>
            </span>
          </div>
          <div className="mt-3">
            <Ruler value={position.progress} label={blockTitle(current, t)} />
          </div>
          {advice ? (
            <p className="mt-2.5 text-[0.8125rem] leading-snug text-ink-soft">{advice}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-1.5 text-[clamp(1.4rem,6vw,1.9rem)] leading-tight font-semibold text-ink">
          {next ? t('today.nothingNowHint') : t('today.afterDay')}
        </p>
      )}

      {next ? (
        <p className="mt-3 border-t border-dashed border-rule pt-2.5 text-[0.875rem] text-ink-soft">
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint uppercase">
            {t('today.next')}
          </span>
          <span className="ml-2 font-mono tnum">{formatRange(next.start, next.end)}</span>
          <span className="ml-2">{blockTitle(next, t)}</span>
          {position.untilNext !== null ? (
            <span className="ml-2 font-mono text-[0.75rem] tnum text-ink-faint">
              +{formatDuration(position.untilNext, labels)}
            </span>
          ) : null}
        </p>
      ) : null}

      {action ? <div className="mt-3.5">{action}</div> : null}
    </Sheet>
  );
}
