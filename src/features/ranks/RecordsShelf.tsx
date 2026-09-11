import type { TranslationKey } from '../../i18n';
import type { RecordItem } from '../../domain/records';
import { EmptyState, Marginalia } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';

/** Полка рекордов: короткий список того, что действительно измерено. */
export function RecordsShelf({
  records,
  shields,
}: {
  records: readonly RecordItem[];
  shields: { count: number; spent: string[] };
}): React.JSX.Element {
  const { t } = useApp();

  return (
    <section className="sheet px-5 py-4">
      <Marginalia>{t('records.title')}</Marginalia>

      {records.length === 0 ? (
        <EmptyState text={t('records.empty')} icon="chart" />
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {records.map((record) => (
            <li key={record.id} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-[0.875rem] text-ink-soft">
                {t(`record.${record.id}` as TranslationKey)}
              </span>
              <span className="shrink-0 font-display text-[1rem] tnum text-ink">
                {record.value}
                {record.date ? (
                  <span className="ml-2 text-[0.6875rem] text-ink-faint">
                    {record.date.slice(5)}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 border-t border-rule pt-2">
        <div className="flex items-baseline justify-between gap-3">
          <Marginalia>{t('shield.title')}</Marginalia>
          <span className="font-display text-[1rem] tnum text-ink">{shields.count}</span>
        </div>
        <p className="mt-1 text-[0.75rem] leading-snug text-ink-faint">{t('shield.hint')}</p>
        {shields.spent.length > 0 ? (
          <p className="mt-1 font-display text-[0.75rem] tnum text-ink-soft">
            {t('shield.used', { date: shields.spent.at(-1) ?? '' })}
          </p>
        ) : null}
      </div>
    </section>
  );
}
