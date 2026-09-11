import { useState } from 'react';
import type { TranslationKey } from '../../i18n';
import {
  bestPerfectLength,
  chunkDigits,
  generateDigits,
  INITIAL_TRAINER,
  MEMORIZE_SECONDS,
  nextTrainerState,
  ROUNDS_PER_SESSION,
  scoreAttempt,
  type AttemptScore,
  type TrainerState,
} from '../../domain/numbers';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Field';
import { Marginalia } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';
import { StepTimer } from './StepTimer';

type Phase = 'ready' | 'memorize' | 'recall' | 'result' | 'done';

const TIPS: TranslationKey[] = [
  'numbers.tip.chunk',
  'numbers.tip.image',
  'numbers.tip.story',
  'numbers.tip.rhythm',
];

interface RoundResult {
  length: number;
  perfect: boolean;
}

/** Тренажёр чисел: показ, ввод по памяти, адаптивная длина. */
export function NumbersStep({
  onProgress,
}: {
  /** Лучшая безошибочная длина за сессию — она уходит в прогресс. */
  onProgress: (best: number, rounds: number) => void;
}): React.JSX.Element {
  const { t } = useApp();
  const [trainer, setTrainer] = useState<TrainerState>(INITIAL_TRAINER);
  const [phase, setPhase] = useState<Phase>('ready');
  const [round, setRound] = useState(0);
  const [digits, setDigits] = useState('');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState<AttemptScore | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lengthChange, setLengthChange] = useState<'up' | 'down' | null>(null);

  const tip = TIPS[round % TIPS.length] ?? TIPS[0];
  const best = bestPerfectLength(results);

  const startRound = (): void => {
    setDigits(generateDigits(trainer.length));
    setAnswer('');
    setScore(null);
    setPhase('memorize');
  };

  const check = (): void => {
    const result = scoreAttempt(digits, answer);
    const nextResults = [...results, { length: digits.length, perfect: result.perfect }];
    const nextState = nextTrainerState(trainer, result.perfect);
    setScore(result);
    setResults(nextResults);
    setLengthChange(
      nextState.length > trainer.length ? 'up' : nextState.length < trainer.length ? 'down' : null,
    );
    setTrainer(nextState);
    setPhase('result');
    onProgress(bestPerfectLength(nextResults), nextResults.length);
  };

  const next = (): void => {
    const played = round + 1;
    if (played >= ROUNDS_PER_SESSION) {
      setRound(played);
      setPhase('done');
      return;
    }
    setRound(played);
    setPhase('ready');
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-baseline justify-between font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
        <span>
          {t('numbers.round', {
            n: Math.min(round + 1, ROUNDS_PER_SESSION),
            total: ROUNDS_PER_SESSION,
          })}
        </span>
        <span>
          {t('numbers.length')}: <span className="tnum text-ink">{trainer.length}</span>
        </span>
      </p>

      {phase === 'ready' ? (
        <>
          <p className="border-l-[3px] border-ochre bg-ochre-wash px-3 py-2.5 text-[0.875rem] leading-snug text-ink">
            {t(tip ?? 'numbers.tip.chunk')}
          </p>
          <Button variant="primary" size="lg" full onClick={startRound}>
            {t('numbers.show')}
          </Button>
        </>
      ) : null}

      {phase === 'memorize' ? (
        <>
          <Marginalia>{t('numbers.memorize')}</Marginalia>
          <p className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[clamp(2rem,11vw,3.25rem)] leading-tight font-medium tnum text-ink">
            {chunkDigits(digits).map((chunk, index) => (
              <span key={index}>{chunk}</span>
            ))}
          </p>
          <StepTimer compact seconds={MEMORIZE_SECONDS} onFinished={() => setPhase('recall')} />
          <Button variant="ghost" full onClick={() => setPhase('recall')}>
            {t('numbers.hideEarly')}
          </Button>
        </>
      ) : null}

      {phase === 'recall' ? (
        <>
          <Marginalia>{t('numbers.recall')}</Marginalia>
          <TextInput
            value={answer}
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            placeholder={t('numbers.answerPlaceholder')}
            className="font-mono text-[1.25rem] tnum"
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') check();
            }}
          />
          <Button variant="primary" size="lg" full onClick={check}>
            {t('numbers.check')}
          </Button>
        </>
      ) : null}

      {phase === 'result' && score ? (
        <>
          <p className="font-mono text-[clamp(1.5rem,7vw,2rem)] tnum text-ink">
            {score.perfect ? t('numbers.perfect') : t('numbers.mistakes', { n: score.mistakes })}
          </p>
          <p className="flex flex-wrap gap-x-4 font-mono text-[0.9375rem] tnum text-ink-soft">
            <span>
              {t('numbers.accuracy')}: {Math.round(score.accuracy * 100)}%
            </span>
            <span>{digits}</span>
          </p>
          {lengthChange ? (
            <p className="border-l-[3px] border-ink px-3 py-2 text-[0.875rem] text-ink">
              {lengthChange === 'up'
                ? t('numbers.harder', { n: trainer.length })
                : t('numbers.easier', { n: trainer.length })}
            </p>
          ) : null}
          <Button variant="primary" size="lg" full onClick={next}>
            {round + 1 >= ROUNDS_PER_SESSION ? t('protocol.finish') : t('numbers.nextRound')}
          </Button>
        </>
      ) : null}

      {phase === 'done' ? (
        <p className="flex items-baseline justify-between border-t border-dashed border-rule pt-3">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
            {t('numbers.bestToday')}
          </span>
          <span className="font-mono text-[2rem] leading-none tnum text-ink">{best}</span>
        </p>
      ) : null}
    </div>
  );
}
