import type { Block } from '../../types';
import type { TranslationKey } from '../../i18n';
import type { RankView } from '../../state/useGamification';
import { blockTitle } from '../../domain/blockTitle';
import { Marginalia, Sheet } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';
import { rankLeftText } from '../ranks/rankText';

/** Маленький щит серии. */
function ShieldIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5v-6z"
        fill="var(--color-ochre)"
      />
      <path
        d="M8.8 12l2.2 2.2 4.4-4.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Серия и три блока минимума — единственная сводка на главном экране. */
export function MinimumStrip({
  core,
  checked,
  streak,
  done,
  shields,
}: {
  core: readonly Block[];
  checked: ReadonlySet<string>;
  streak: number;
  done: boolean;
  shields: number;
}): React.JSX.Element {
  const { t, tp } = useApp();

  return (
    <Sheet accent={done ? 'done' : 'none'} className="flex items-stretch gap-4 px-5 py-4">
      <div className="shrink-0">
        <Marginalia>{t('today.streak')}</Marginalia>
        <p className="mt-0.5 flex items-baseline gap-2">
          <span className="font-display text-[2.75rem] leading-none font-extrabold tnum text-ochre">
            {streak}
          </span>
          <span className="text-[0.8125rem] text-ink-soft">{tp('day', streak)}</span>
        </p>
        {shields > 0 ? (
          <p
            className="mt-1.5 flex items-center gap-1"
            aria-label={`${t('shield.title')}: ${shields}`}
          >
            {Array.from({ length: shields }, (_, index) => (
              <ShieldIcon key={index} />
            ))}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 border-l border-rule pl-4">
        <Marginalia>{done ? t('today.minimumDone') : t('today.minimum')}</Marginalia>
        <ul className="mt-2 flex flex-col gap-1.5">
          {core.map((block) => {
            const isDone = checked.has(block.id);
            return (
              <li key={block.id} className="flex items-center gap-2.5 text-[0.9375rem]">
                <span
                  aria-hidden="true"
                  className={[
                    'grid size-5 shrink-0 place-items-center rounded-full border-2',
                    isDone ? 'border-done bg-done text-white' : 'border-rule text-transparent',
                  ].join(' ')}
                >
                  <svg viewBox="0 0 24 24" className="size-3" aria-hidden="true">
                    <path
                      d="M5 12.5 10 17.5 19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className={isDone ? 'text-ink-faint line-through' : 'text-ink'}>
                  {blockTitle(block, t)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}

/** Ближайший разряд: одна строка с полосой, остальное живёт в «Прогрессе». */
export function ClosestRank({ rank }: { rank: RankView }): React.JSX.Element {
  const { t, tp } = useApp();
  const { status } = rank;
  const left = rankLeftText(rank, t, tp);

  return (
    <Sheet className="px-5 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <Marginalia>{t('ranks.closest')}</Marginalia>
        <span className="font-display text-[0.8125rem] tnum text-ink-faint">
          {rank.hasData ? status.value : '—'}
          {status.next ? ` → ${status.next.value}` : ''}
        </span>
      </div>
      <p className="mt-0.5 font-display text-[1rem] font-bold text-ink">
        {t(`rank.${rank.spec.id}` as TranslationKey)}
      </p>
      {left ? <p className="text-[0.875rem] leading-snug text-ink-soft">{left}</p> : null}
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full rounded-full bg-blue transition-[width] duration-300 ease-out"
          style={{ width: `${status.share * 100}%` }}
        />
      </div>
    </Sheet>
  );
}
