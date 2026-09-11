import { useState } from 'react';
import type { ProtocolStep } from '../../protocols/types';
import { formatClock } from '../../domain/time';
import { Button } from '../../components/ui/Button';
import { NumberInput } from '../../components/ui/Field';
import { useCountdown } from '../../state/useCountdown';
import { useApp } from '../../state/app-context';
import { playChime } from '../../lib/sound';

export type SetMark = 'pending' | 'done' | 'failed';

export interface SetsProgress {
  marks: SetMark[];
  /** Фактический результат: секунды виса или повторения в подходе «на максимум». */
  value: number | null;
}

function repsFor(step: ProtocolStep, index: number): number | null {
  if (!step.sets) return null;
  const { reps } = step.sets;
  if (Array.isArray(reps)) return reps[index] ?? null;
  return reps > 0 ? reps : null;
}

/** Подходы с отметкой «сделано / не вышло» и автоматическим отдыхом между ними. */
export function SetsStep({
  step,
  progress,
  onChange,
}: {
  step: ProtocolStep;
  progress: SetsProgress;
  onChange: (next: SetsProgress) => void;
}): React.JSX.Element {
  const { t } = useApp();
  const spec = step.sets;
  const rest = useCountdown(spec?.restSeconds ?? 0, playChime);
  const [valueDraft, setValueDraft] = useState(progress.value ?? '');

  if (!spec) return <></>;

  const mark = (index: number, value: SetMark): void => {
    const marks = progress.marks.map((current, position) => (position === index ? value : current));
    onChange({ ...progress, marks });
    if (spec.restSeconds > 0 && index < marks.length - 1) rest.start(spec.restSeconds);
  };

  const showValueInput = spec.toFailure || spec.holdSeconds !== null;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {progress.marks.map((state, index) => {
          const reps = repsFor(step, index);
          return (
            <li
              key={index}
              className={[
                'flex flex-col gap-2 border px-3 py-2.5 transition-colors duration-150',
                'sm:flex-row sm:items-center sm:gap-3',
                state === 'done'
                  ? 'border-done bg-done-wash'
                  : state === 'failed'
                    ? 'border-terracotta bg-terracotta-wash'
                    : 'border-rule',
              ].join(' ')}
            >
              <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2 sm:justify-start sm:gap-3">
                <span className="shrink-0 font-display text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint">
                  {t('protocol.set', { n: index + 1 })}
                </span>
                <span className="truncate font-display text-[0.9375rem] tnum text-ink">
                  {spec.toFailure
                    ? t('protocol.toFailure')
                    : spec.holdSeconds !== null
                      ? t('protocol.hold', { n: spec.holdSeconds })
                      : `${reps ?? 0} ${t('protocol.repsShort')}`}
                  {spec.perSide ? (
                    <span className="ml-1.5 text-[0.75rem] text-ink-faint">
                      {t('protocol.perSide')}
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="flex shrink-0 gap-1.5">
                <Button
                  className="flex-1 sm:flex-none"
                  variant={state === 'done' ? 'primary' : 'ghost'}
                  onClick={() => mark(index, 'done')}
                  aria-pressed={state === 'done'}
                >
                  {t('protocol.setDone')}
                </Button>
                <Button
                  className="flex-1 sm:flex-none"
                  variant={state === 'failed' ? 'danger' : 'quiet'}
                  onClick={() => mark(index, 'failed')}
                  aria-pressed={state === 'failed'}
                >
                  {t('protocol.setFailed')}
                </Button>
              </span>
            </li>
          );
        })}
      </ul>

      {rest.running || (rest.total > 0 && !rest.finished && rest.remaining < rest.total) ? (
        <p className="flex items-baseline gap-2 rounded-[var(--radius-field)] bg-ochre-wash px-3 py-2">
          <span className="font-display text-[0.6875rem] uppercase tracking-[0.14em] text-ink-soft">
            {t('protocol.rest', { n: spec.restSeconds })}
          </span>
          <span className="font-display text-[1.25rem] tnum text-ink">
            {formatClock(rest.remaining)}
          </span>
        </p>
      ) : null}

      {showValueInput ? (
        <label className="flex items-center gap-3">
          <span className="font-display text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
            {t('protocol.measureBest')}
          </span>
          <NumberInput
            className="max-w-[7rem]"
            value={valueDraft}
            min={0}
            onChange={(event) => {
              setValueDraft(event.target.value);
              const parsed = Number(event.target.value);
              onChange({
                ...progress,
                value: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
              });
            }}
          />
        </label>
      ) : null}
    </div>
  );
}
