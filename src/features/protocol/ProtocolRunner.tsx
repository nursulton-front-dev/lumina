import { useEffect, useMemo, useState } from 'react';
import type { TranslationKey } from '../../i18n';
import type { MetricId } from '../../types';
import type { ProtocolStep, ResolvedProtocol } from '../../protocols/types';
import { Button } from '../../components/ui/Button';
import { Marginalia } from '../../components/ui/Sheet';
import { Ruler } from '../../components/ui/Ruler';
import { TextInput } from '../../components/ui/Field';
import { useApp } from '../../state/app-context';
import type { Recording } from '../../lib/recorder';
import { MeasureStep } from './MeasureStep';
import { MetricChartStep } from './MetricChartStep';
import { RecordStep } from './RecordStep';
import { TwistersStep, type TempoMarks } from './TwistersStep';
import { workoutVerdict } from '../../domain/verdicts';
import { WeekStatsStep } from './WeekStatsStep';
import { QuestsStep } from './QuestsStep';
import { NumbersStep } from './NumbersStep';
import { SetsStep, type SetsProgress } from './SetsStep';
import { StepTimer } from './StepTimer';

export interface StepOutcome {
  stepId: string;
  titleKey: TranslationKey;
  skipped: boolean;
  setsDone: number;
  setsFailed: number;
  value: number | null;
  metric: MetricId | null;
}

export interface ProtocolResult {
  outcomes: StepOutcome[];
  note: string;
  minutes: number;
}

function setCount(step: ProtocolStep): number {
  if (!step.sets) return 0;
  return Array.isArray(step.sets.reps) ? step.sets.reps.length : step.sets.sets;
}

/** Полноэкранный мастер: шаг за шагом от разминки до итога. */
export function ProtocolRunner({
  protocol,
  onFinish,
  onExit,
  onReshuffle,
  today,
  seasonStart,
}: {
  protocol: ResolvedProtocol;
  onFinish: (result: ProtocolResult) => void;
  onExit: () => void;
  today: string;
  seasonStart: string;
  /** Новые скороговорки или тема для шага — данные берутся из файла пользователя. */
  onReshuffle?: (step: ProtocolStep) => string[];
}): React.JSX.Element {
  const { t } = useApp();
  const [index, setIndex] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [sets, setSets] = useState<Record<string, SetsProgress>>({});
  const [measures, setMeasures] = useState<Record<string, (number | null)[]>>({});
  const [numbers, setNumbers] = useState<{ best: number; rounds: number }>({ best: 0, rounds: 0 });
  const [timersDone, setTimersDone] = useState<Record<string, boolean>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');
  const [texts, setTexts] = useState<Record<string, string[]>>({});
  const [tempoMarks, setTempoMarks] = useState<Record<string, TempoMarks>>({});
  const [recordings, setRecordings] = useState<Record<string, Recording>>({});

  const steps = protocol.steps;
  const step = steps[index];
  const atSummary = index >= steps.length;
  const [summaryAt, setSummaryAt] = useState<number | null>(null);

  useEffect(() => {
    if (atSummary && summaryAt === null) setSummaryAt(Date.now());
  }, [atSummary, summaryAt]);

  const outcomes = useMemo<StepOutcome[]>(
    () =>
      steps.map((item) => {
        const progress = sets[item.id];
        const attempts = measures[item.id] ?? [];
        const best = attempts.reduce<number>((max, value) => Math.max(max, value ?? 0), 0);
        return {
          stepId: item.id,
          titleKey: item.titleKey,
          skipped: skipped[item.id] ?? false,
          setsDone: progress?.marks.filter((mark) => mark === 'done').length ?? 0,
          setsFailed: progress?.marks.filter((mark) => mark === 'failed').length ?? 0,
          value:
            item.kind === 'numbers'
              ? numbers.best
              : item.kind === 'measure'
                ? best || null
                : (progress?.value ?? null),
          metric: item.metric,
        };
      }),
    [steps, sets, measures, numbers, skipped],
  );

  const goNext = (): void => setIndex((current) => current + 1);

  const skip = (): void => {
    if (!step) return;
    setSkipped((current) => ({ ...current, [step.id]: true }));
    goNext();
  };

  const finish = (): void => {
    onFinish({
      outcomes,
      note: note.trim(),
      minutes: Math.max(1, Math.round((Date.now() - startedAt) / 60_000)),
    });
  };

  const exit = (): void => {
    if (window.confirm(t('protocol.exitConfirm'))) onExit();
  };

  const locked = step?.locked === true && !(timersDone[step.id] ?? false);

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-40 flex flex-col bg-paper">
      <header className="flex items-center gap-3 border-b border-rule bg-raised px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
            {t(protocol.titleKey)}
            {protocol.subtitleKey ? ` · ${t(protocol.subtitleKey)}` : ''}
          </p>
          <p className="font-display text-[0.75rem] tnum text-ink-soft">
            {atSummary
              ? t('protocol.summary')
              : t('protocol.stepOf', { current: index + 1, total: steps.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={exit}
          aria-label={t('protocol.exit')}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-ink-soft transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.4" />
          </svg>
        </button>
      </header>

      <div className="px-3 pt-2">
        <Ruler value={index / Math.max(1, steps.length)} tone="ink" />
      </div>

      <main className="flex-1 overflow-y-auto px-3 py-4">
        {atSummary ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-[clamp(1.5rem,7vw,2rem)] font-semibold text-ink">
              {t('protocol.summary')}
            </h1>
            <dl className="flex flex-col gap-1.5 font-display text-[0.875rem] tnum">
              <div className="flex justify-between border-b border-rule pb-1">
                <dt className="text-ink-faint">{t('protocol.summarySets')}</dt>
                <dd className="text-ink">
                  {outcomes.reduce((sum, item) => sum + item.setsDone, 0)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-rule pb-1">
                <dt className="text-ink-faint">{t('protocol.summaryFailed')}</dt>
                <dd className="text-ink">
                  {outcomes.reduce((sum, item) => sum + item.setsFailed, 0)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-rule pb-1">
                <dt className="text-ink-faint">{t('protocol.summaryTime')}</dt>
                <dd className="text-ink">
                  {Math.max(1, Math.round(((summaryAt ?? startedAt) - startedAt) / 60_000))}{' '}
                  {t('unit.min')}
                </dd>
              </div>
            </dl>

            {protocol.id === 'workout'
              ? (() => {
                  const verdict = workoutVerdict({
                    setsDone: outcomes.reduce((sum, item) => sum + item.setsDone, 0),
                    setsFailed: outcomes.reduce((sum, item) => sum + item.setsFailed, 0),
                    skipped: outcomes.filter((item) => item.skipped).length,
                  });
                  return verdict ? (
                    <p className="rounded-[var(--radius-field)] bg-sunken px-3 py-2 text-[0.9375rem] leading-snug text-ink-soft">
                      {t(verdict.key, verdict.vars)}
                    </p>
                  ) : null;
                })()
              : null}

            <ul className="flex flex-col gap-1 text-[0.875rem]">
              {outcomes
                .filter((item) => item.value !== null || item.skipped)
                .map((item) => (
                  <li key={item.stepId} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate text-ink-soft">{t(item.titleKey)}</span>
                    <span className="shrink-0 font-display tnum text-ink">
                      {item.skipped ? t('protocol.skipped') : item.value}
                    </span>
                  </li>
                ))}
            </ul>

            <label className="flex flex-col gap-1.5">
              <Marginalia>{t('protocol.note')}</Marginalia>
              <TextInput
                value={note}
                placeholder={t('protocol.notePlaceholder')}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
          </div>
        ) : step ? (
          <div className="flex flex-col gap-4">
            {/* В протоколе из одного шага заголовок не дублируем — он уже в шапке. */}
            {steps.length > 1 || step.titleKey !== protocol.titleKey ? (
              <h1 className="text-[clamp(1.5rem,7vw,2.125rem)] leading-tight font-semibold text-balance text-ink">
                {t(step.titleKey)}
              </h1>
            ) : null}

            {step.hintKey ? (
              <p className="rounded-[var(--radius-field)] bg-sunken px-3 py-2.5 text-[0.9375rem] leading-snug text-ink-soft">
                {t(step.hintKey)}
              </p>
            ) : null}

            {step.items.length > 0 ? (
              <ul className="flex flex-col gap-1 border-t border-rule pt-2">
                {step.items.map((item) => (
                  <li key={item.key} className="flex justify-between gap-3 text-[0.9375rem]">
                    <span className="text-ink">{t(item.key)}</span>
                    <span className="shrink-0 font-display tnum text-ink-faint">
                      {item.count}
                      {item.unit === 'sec' ? ` ${t('unit.sec')}` : ''}
                      {item.unit === 'perSide' ? ` · ${t('protocol.perSide')}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {step.kind === 'timer' ? (
              <StepTimer
                seconds={step.seconds}
                onFinished={() => setTimersDone((current) => ({ ...current, [step.id]: true }))}
              />
            ) : null}

            {step.kind === 'sets' ? (
              <SetsStep
                step={step}
                progress={
                  sets[step.id] ?? {
                    marks: Array<'pending'>(setCount(step)).fill('pending'),
                    value: null,
                  }
                }
                onChange={(next) => setSets((current) => ({ ...current, [step.id]: next }))}
              />
            ) : null}

            {step.kind === 'measure' && step.playbackOf && recordings[step.playbackOf] ? (
              <audio
                controls
                src={recordings[step.playbackOf]?.url}
                className="w-full"
                aria-label={t('speech.play')}
              />
            ) : null}

            {step.kind === 'measure' ? (
              <MeasureStep
                step={step}
                attempts={measures[step.id] ?? Array<number | null>(step.attempts).fill(null)}
                onChange={(next) => setMeasures((current) => ({ ...current, [step.id]: next }))}
              />
            ) : null}

            {step.kind === 'numbers' ? (
              <NumbersStep onProgress={(best, rounds) => setNumbers({ best, rounds })} />
            ) : null}

            {step.kind === 'twisters' ? (
              <>
                {step.seconds > 0 ? (
                  <StepTimer
                    compact
                    seconds={step.seconds}
                    onFinished={() => setTimersDone((current) => ({ ...current, [step.id]: true }))}
                  />
                ) : null}
                <TwistersStep
                  step={{ ...step, texts: texts[step.id] ?? step.texts }}
                  marks={tempoMarks[step.id] ?? {}}
                  onChange={(next) => setTempoMarks((current) => ({ ...current, [step.id]: next }))}
                  onReshuffle={() =>
                    setTexts((current) => ({
                      ...current,
                      [step.id]: onReshuffle?.(step) ?? step.texts,
                    }))
                  }
                />
              </>
            ) : null}

            {step.kind === 'record' ? (
              <>
                {step.seconds > 0 ? (
                  <StepTimer
                    compact
                    seconds={step.seconds}
                    onFinished={() => setTimersDone((current) => ({ ...current, [step.id]: true }))}
                  />
                ) : null}
                <RecordStep
                  step={{ ...step, texts: texts[step.id] ?? step.texts }}
                  recording={recordings[step.id] ?? null}
                  onRecorded={(recording) =>
                    setRecordings((current) => ({ ...current, [step.id]: recording }))
                  }
                  onReshuffle={
                    step.texts.length > 0 && onReshuffle
                      ? () => setTexts((current) => ({ ...current, [step.id]: onReshuffle(step) }))
                      : undefined
                  }
                />
              </>
            ) : null}

            {step.kind === 'chart' && step.metric ? <MetricChartStep metric={step.metric} /> : null}

            {step.kind === 'weekStats' ? (
              <WeekStatsStep today={today} seasonStart={seasonStart} />
            ) : null}

            {step.kind === 'quests' ? <QuestsStep today={today} seasonStart={seasonStart} /> : null}

            {index === 0 && protocol.notes.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {protocol.notes.map((item) => (
                  <li
                    key={item.key}
                    className={[
                      'rounded-[var(--radius-field)] px-4 py-3 text-[0.875rem] leading-snug text-ink',
                      item.tone === 'warning' ? 'bg-terracotta-wash' : 'bg-ochre-wash',
                    ].join(' ')}
                  >
                    {t(item.key, item.vars)}
                  </li>
                ))}
              </ul>
            ) : null}

            {index === 0 && protocol.safetyKeys.length > 0 ? (
              <section className="rounded-[var(--radius-field)] border-2 border-rule px-4 py-3">
                <Marginalia>{t('protocol.safety')}</Marginalia>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {protocol.safetyKeys.map((key) => (
                    <li key={key} className="text-[0.8125rem] leading-snug text-ink-soft">
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </main>

      <footer className="safe-bottom flex gap-2 border-t border-rule bg-raised px-4 py-3">
        {atSummary ? (
          <Button variant="primary" size="lg" full onClick={finish}>
            {t('protocol.save')}
          </Button>
        ) : (
          <>
            {locked ? null : (
              <Button variant="quiet" size="lg" onClick={skip}>
                {t('common.skip')}
              </Button>
            )}
            <Button variant="primary" size="lg" full disabled={locked} onClick={goNext}>
              {locked ? t('protocol.locked') : t('common.next')}
            </Button>
          </>
        )}
      </footer>
    </div>
  );
}
