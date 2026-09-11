import type { Block } from '../../types';
import type { TranslationKey } from '../../i18n';
import type { RankView } from '../../state/useGamification';
import { blockTitle } from '../../domain/blockTitle';
import { Marginalia, Sheet } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';

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
    <Sheet accent={done ? 'done' : 'none'} className="flex items-stretch gap-4 px-4 py-3">
      <div className="shrink-0">
        <Marginalia>{t('today.streak')}</Marginalia>
        <p className="font-mono text-[2rem] leading-none tnum text-ink">{streak}</p>
        <p className="text-[0.75rem] text-ink-faint">{tp('day', streak)}</p>
        {shields > 0 ? (
          <p className="mt-1 font-mono text-[0.6875rem] tnum text-ink-faint">
            {t('shield.title')}: {shields}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 border-l border-dashed border-rule pl-4">
        <Marginalia>{done ? t('today.minimumDone') : t('today.minimum')}</Marginalia>
        <ul className="mt-1.5 flex flex-col gap-1">
          {core.map((block) => {
            const isDone = checked.has(block.id);
            return (
              <li key={block.id} className="flex items-center gap-2 text-[0.8125rem]">
                <span
                  aria-hidden="true"
                  className={[
                    'grid size-4 shrink-0 place-items-center rounded-[1px] border text-[0.625rem]',
                    isDone ? 'border-done bg-done-wash text-done' : 'border-rule text-transparent',
                  ].join(' ')}
                >
                  ✓
                </span>
                <span className={isDone ? 'text-ink-faint line-through' : 'text-ink-soft'}>
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

/** Ближайший разряд: одна строка с линейкой, остальное живёт в «Прогрессе». */
export function ClosestRank({ rank }: { rank: RankView }): React.JSX.Element {
  const { t } = useApp();
  const { status } = rank;

  return (
    <Sheet className="px-4 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <Marginalia>{t('ranks.closest')}</Marginalia>
        <span className="font-mono text-[0.75rem] tnum text-ink-faint">
          {rank.hasData ? status.value : '—'}
          {status.next ? ` → ${status.next.value}` : ''}
        </span>
      </div>
      <p className="mt-0.5 text-[0.875rem] text-ink">
        {t(`rank.${rank.spec.id}` as TranslationKey)}
        {status.next ? (
          <span className="ml-2 text-ink-faint">
            {t(`grade.${status.next.grade}` as TranslationKey)}
          </span>
        ) : null}
      </p>
      <div className="relative mt-1.5 h-1.5 border-b border-rule">
        <div
          className="absolute bottom-0 left-0 h-[3px] bg-ochre transition-[width] duration-700 ease-[var(--ease-paper)]"
          style={{ width: `${status.share * 100}%` }}
        />
      </div>
    </Sheet>
  );
}
