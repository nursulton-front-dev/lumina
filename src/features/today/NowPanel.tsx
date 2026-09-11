import type { DayPosition } from '../../domain/schedule';
import { blockTitle } from '../../domain/blockTitle';
import { formatDuration, formatRange } from '../../domain/time';
import { Sheet } from '../../components/ui/Sheet';
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
    <Sheet accent={current ? 'ochre' : 'none'} className="px-5 pt-4 pb-5">
      <span
        className={[
          'inline-block rounded-full px-2.5 py-1 font-display text-[0.75rem] font-extrabold tracking-[0.06em] uppercase',
          current ? 'bg-ochre text-white' : 'bg-sunken text-ink-soft',
        ].join(' ')}
      >
        {current ? t('today.now') : t('today.nothingNow')}
      </span>

      {current ? (
        <>
          <h1 className="mt-2.5 text-[clamp(1.75rem,7.5vw,2.375rem)] leading-[1.08] text-balance text-ink">
            {blockTitle(current, t)}
          </h1>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="font-display text-[0.9375rem] tnum text-ink-soft">
              {formatRange(current.start, current.end)}
            </span>
            <span className="font-display text-[clamp(1.375rem,6.5vw,1.875rem)] leading-none font-extrabold tnum text-ink">
              {formatDuration(position.remaining, labels)}
              <span className="ml-1.5 font-sans text-[0.8125rem] font-normal text-ink-faint">
                {t('today.left')}
              </span>
            </span>
          </div>
          <div className="mt-3">
            <Ruler value={position.progress} label={blockTitle(current, t)} tone="ochre" />
          </div>
          {advice ? (
            <p className="mt-2.5 text-[0.8125rem] leading-snug text-ink-soft">{advice}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-2.5 font-display text-[clamp(1.4rem,6vw,1.9rem)] leading-tight font-extrabold text-ink">
          {next ? t('today.nothingNowHint') : t('today.afterDay')}
        </p>
      )}

      {next ? (
        <p className="mt-3.5 border-t border-rule pt-3 text-[0.9375rem] text-ink-soft">
          <span className="font-display text-[0.75rem] font-extrabold tracking-[0.06em] text-ink-faint uppercase">
            {t('today.next')}
          </span>
          <span className="ml-2 font-display tnum text-ink">
            {formatRange(next.start, next.end)}
          </span>
          <span className="ml-2">{blockTitle(next, t)}</span>
          {position.untilNext !== null ? (
            <span className="ml-2 font-display text-[0.8125rem] tnum text-ink-faint">
              +{formatDuration(position.untilNext, labels)}
            </span>
          ) : null}
        </p>
      ) : null}

      {action ? <div className="mt-3.5">{action}</div> : null}
    </Sheet>
  );
}
