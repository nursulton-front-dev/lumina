import { useEffect, useState } from 'react';
import type { RankId } from '../../data/ranks';
import type { Counters, GamificationState } from '../../state/useGamification';
import { addCounter } from '../../state/useGamification';
import { readMeta, writeMeta } from '../../db/db';
import { Button } from '../../components/ui/Button';
import { Marginalia } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';
import { RankCard } from './RankCard';

const KNOWN_KEY = 'ranks.known';

/** Ручные счётчики: задачи и контесты IOI, пробные тесты по языкам. */
const MANUAL: Partial<
  Record<
    RankId,
    { labelKey: 'ranks.tasks' | 'ranks.contests' | 'ranks.tests'; key: keyof Counters }[]
  >
> = {
  ioi: [
    { labelKey: 'ranks.tasks', key: 'ioiTasks' },
    { labelKey: 'ranks.contests', key: 'ioiContests' },
  ],
  russian: [{ labelKey: 'ranks.tests', key: 'russianTests' }],
  english: [{ labelKey: 'ranks.tests', key: 'englishTests' }],
};

export function RanksSection({ state }: { state: GamificationState }): React.JSX.Element {
  const { t } = useApp();
  const [known, setKnown] = useState<Record<string, number> | null>(null);

  // Печать ставится один раз: приложение помнит, какой разряд уже был показан.
  useEffect(() => {
    void (async () => {
      const stored = (await readMeta<Record<string, number>>(KNOWN_KEY)) ?? {};
      setKnown(stored);
      const next: Record<string, number> = { ...stored };
      let changed = false;
      for (const rank of state.ranks) {
        if ((next[rank.spec.id] ?? -1) !== rank.status.gradeIndex) {
          next[rank.spec.id] = rank.status.gradeIndex;
          changed = true;
        }
      }
      if (changed) await writeMeta(KNOWN_KEY, next);
    })();
  }, [state.ranks]);

  return (
    <section className="sheet overflow-hidden">
      <header className="flex items-baseline justify-between gap-3 border-b border-rule px-3 py-2">
        <Marginalia>{t('ranks.title')}</Marginalia>
      </header>

      <ul>
        {state.ranks.map((rank) => {
          const previous = known?.[rank.spec.id];
          const fresh =
            known !== null && previous !== undefined && rank.status.gradeIndex > previous;
          const manual = MANUAL[rank.spec.id];

          return (
            <RankCard
              key={rank.spec.id}
              rank={rank}
              fresh={fresh}
              extra={
                manual ? (
                  <div className="flex flex-wrap gap-2">
                    {manual.map((counter) => (
                      <span key={counter.key} className="flex items-center gap-1.5">
                        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint">
                          {t(counter.labelKey)}
                        </span>
                        <span className="font-mono text-[0.875rem] tnum text-ink">
                          {state.counters[counter.key]}
                        </span>
                        <Button
                          variant="ghost"
                          aria-label={t(counter.labelKey)}
                          onClick={() => void addCounter(counter.key, 1)}
                        >
                          +1
                        </Button>
                        <Button
                          variant="quiet"
                          aria-label={t(counter.labelKey)}
                          onClick={() => void addCounter(counter.key, -1)}
                        >
                          −1
                        </Button>
                      </span>
                    ))}
                  </div>
                ) : undefined
              }
            />
          );
        })}
      </ul>

      <p className="border-t border-dashed border-rule px-3 py-2 text-[0.75rem] leading-snug text-ink-faint">
        {t('ranks.disclaimer')}
      </p>
    </section>
  );
}
