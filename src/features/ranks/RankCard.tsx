import { useEffect, useState } from 'react';
import type { TranslationKey } from '../../i18n';
import type { Grade } from '../../data/ranks';
import type { RankView } from '../../state/useGamification';
import { useApp } from '../../state/app-context';

/** Печать разряда: штамп с наклоном, а не глянцевая иконка. */
export function Stamp({
  grade,
  fresh = false,
}: {
  grade: Grade;
  /** Разряд только что взят — печать впечатывается. */
  fresh?: boolean;
}): React.JSX.Element {
  const { t } = useApp();
  return (
    <span
      className={[
        'inline-grid min-w-[3.25rem] -rotate-3 place-items-center border-[2px] border-double px-2 py-1',
        'border-terracotta font-mono text-[0.8125rem] tracking-[0.06em] text-terracotta',
        'opacity-90 mix-blend-multiply',
        fresh ? 'animate-[stamp_520ms_var(--ease-paper)_both]' : '',
      ].join(' ')}
      aria-label={t(`grade.${grade}` as TranslationKey)}
    >
      {t(`grade.short.${grade}` as TranslationKey)}
    </span>
  );
}

export function RankCard({
  rank,
  fresh,
  extra,
}: {
  rank: RankView;
  fresh: boolean;
  /** Ручные счётчики для составных направлений. */
  extra?: React.JSX.Element;
}): React.JSX.Element {
  const { t } = useApp();
  const { spec, status } = rank;
  const [showFresh, setShowFresh] = useState(fresh);

  useEffect(() => {
    if (!fresh) return;
    const id = window.setTimeout(() => setShowFresh(false), 1200);
    return () => window.clearTimeout(id);
  }, [fresh]);

  return (
    <li className="flex flex-col gap-2 border-b border-dashed border-[color-mix(in_oklab,var(--color-rule)_55%,transparent)] px-3 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.9375rem] text-ink">{t(`rank.${spec.id}` as TranslationKey)}</p>
          <p className="font-mono text-[0.75rem] tnum text-ink-faint">
            {rank.hasData ? status.value : '—'}
            {rank.hasData && status.second !== null ? ` / ${status.second}` : ''}
          </p>
        </div>
        {status.grade ? (
          <Stamp grade={status.grade} fresh={showFresh} />
        ) : (
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint">
            {t('ranks.none')}
          </span>
        )}
      </div>

      {status.next ? (
        <div>
          <p className="font-mono text-[0.6875rem] tnum text-ink-faint">
            {t('ranks.toNext', {
              grade: t(`grade.${status.next.grade}` as TranslationKey),
              value: status.next.value,
            })}
            {status.next.second
              ? ` ${t('ranks.toNextSecond', { second: status.next.second })}`
              : ''}
          </p>
          <div className="relative mt-1 h-2.5 border-b border-rule">
            <div
              className="absolute bottom-0 left-0 h-[3px] bg-ochre transition-[width] duration-700 ease-[var(--ease-paper)]"
              style={{ width: `${(rank.hasData ? status.share : 0) * 100}%` }}
            />
            <div className="absolute inset-0 flex justify-between">
              {Array.from({ length: 9 }, (_, index) => (
                <span
                  key={index}
                  className="w-px self-end bg-rule"
                  style={{ height: index % 4 === 0 ? '100%' : '40%' }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {extra}
    </li>
  );
}
