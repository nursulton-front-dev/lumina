import type { ProtocolStep } from '../../protocols/types';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/app-context';

const TEMPOS = ['slow', 'normal', 'fast'] as const;

export type TempoMarks = Record<string, string[]>;

/** Три скороговорки, каждая в трёх темпах: отметка ставится по мере прохода. */
export function TwistersStep({
  step,
  marks,
  onChange,
  onReshuffle,
}: {
  step: ProtocolStep;
  marks: TempoMarks;
  onChange: (next: TempoMarks) => void;
  onReshuffle: () => void;
}): React.JSX.Element {
  const { t } = useApp();

  const toggle = (text: string, tempo: string): void => {
    const current = marks[text] ?? [];
    const next = current.includes(tempo)
      ? current.filter((item) => item !== tempo)
      : [...current, tempo];
    onChange({ ...marks, [text]: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {step.texts.map((text) => (
          <li key={text} className="border border-rule px-3 py-2.5">
            <p className="text-[1rem] leading-snug text-ink">{text}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TEMPOS.map((tempo) => {
                const done = (marks[text] ?? []).includes(tempo);
                return (
                  <Button
                    key={tempo}
                    variant={done ? 'primary' : 'ghost'}
                    aria-pressed={done}
                    onClick={() => toggle(text, tempo)}
                  >
                    {t(`speech.tempo.${tempo}`)}
                  </Button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <Button variant="quiet" full onClick={onReshuffle}>
        {t('speech.newTwisters')}
      </Button>
    </div>
  );
}
