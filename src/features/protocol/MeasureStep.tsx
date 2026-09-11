import type { ProtocolStep } from '../../protocols/types';
import { NumberInput } from '../../components/ui/Field';
import { useApp } from '../../state/app-context';

/** Замер: несколько попыток, в прогресс уходит лучшая. */
export function MeasureStep({
  step,
  attempts,
  onChange,
}: {
  step: ProtocolStep;
  attempts: (number | null)[];
  onChange: (next: (number | null)[]) => void;
}): React.JSX.Element {
  const { t } = useApp();
  const best = attempts.reduce<number>((max, value) => Math.max(max, value ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {attempts.map((value, index) => (
          <li key={index} className="flex items-center gap-3">
            <span className="w-[6.5rem] shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint">
              {t('protocol.measureAttempt', { n: index + 1 })}
            </span>
            <NumberInput
              className="max-w-[8rem]"
              value={value ?? ''}
              min={0}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                onChange(
                  attempts.map((current, position) =>
                    position === index
                      ? event.target.value === '' || !Number.isFinite(parsed)
                        ? null
                        : parsed
                      : current,
                  ),
                );
              }}
            />
          </li>
        ))}
      </ul>

      <p className="flex items-baseline justify-between border-t border-dashed border-rule pt-2">
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
          {t('protocol.measureBest')}
        </span>
        <span className="font-mono text-[1.5rem] tnum text-ink">
          {best > 0 ? best : '—'}
          {step.metric === 'longJump' || step.metric === 'verticalJump' ? (
            <span className="ml-1 text-[0.75rem] text-ink-faint">{t('unit.cm')}</span>
          ) : null}
        </span>
      </p>
    </div>
  );
}
