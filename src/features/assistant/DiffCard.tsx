import type { TranslationKey } from '../../i18n';
import type { ChangeRecord } from '../../types';
import { buildDiff } from '../../ai/proposal';
import { Button } from '../../components/ui/Button';
import { Marginalia } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';

/** Дифф «было — стало» с подтверждением: без него расписание не меняется. */
export function DiffCard({
  change,
  onApply,
  onReject,
}: {
  change: ChangeRecord;
  onApply: () => void;
  onReject: () => void;
}): React.JSX.Element {
  const { t } = useApp();
  const rows = buildDiff(change.before, change.after);

  return (
    <section className="border border-ink bg-[color-mix(in_oklab,var(--color-raised)_75%,transparent)] px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <Marginalia>{t('assistant.proposal')}</Marginalia>
        <span className="font-display text-[0.6875rem] tnum text-ink-faint">
          {change.date !== '' ? change.date : change.dayType}
        </span>
      </div>

      <p className="mt-1 text-[0.9375rem] text-ink">{change.summary}</p>

      <ul className="mt-2 flex flex-col gap-1">
        {rows.map((row, index) => (
          <li key={index} className="font-display text-[0.75rem] leading-snug tnum">
            <span
              className={[
                'mr-2 uppercase tracking-[0.1em]',
                row.kind === 'removed'
                  ? 'text-terracotta'
                  : row.kind === 'added'
                    ? 'text-done'
                    : 'text-ochre',
              ].join(' ')}
            >
              {t(`assistant.diff.${row.kind}` as TranslationKey)}
            </span>
            {row.before ? <span className="text-ink-faint line-through">{row.before}</span> : null}
            {row.before && row.after ? <span className="mx-1 text-ink-faint">→</span> : null}
            {row.after ? <span className="text-ink">{row.after}</span> : null}
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex gap-2">
        <Button variant="primary" full onClick={onApply}>
          {t('assistant.apply')}
        </Button>
        <Button variant="quiet" onClick={onReject}>
          {t('assistant.reject')}
        </Button>
      </div>
    </section>
  );
}
