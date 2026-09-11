import { useEffect, useRef, useState } from 'react';
import type { ProtocolStep } from '../../protocols/types';
import { formatClock } from '../../domain/time';
import { Button } from '../../components/ui/Button';
import { Marginalia } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';
import { isRecordingSupported, VoiceRecorder, type Recording } from '../../lib/recorder';

/** Шаг с записью голоса: тема, таймер, запись и прослушивание. */
export function RecordStep({
  step,
  recording,
  onRecorded,
  onReshuffle,
}: {
  step: ProtocolStep;
  recording: Recording | null;
  onRecorded: (recording: Recording) => void;
  onReshuffle?: () => void;
}): React.JSX.Element {
  const { t } = useApp();
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supported = isRecordingSupported();

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    const recorder = recorderRef.current;
    return () => recorder?.cancel();
  }, []);

  const start = async (): Promise<void> => {
    setError(null);
    const recorder = new VoiceRecorder();
    recorderRef.current = recorder;
    try {
      await recorder.start();
      setElapsed(0);
      setActive(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const stop = async (): Promise<void> => {
    const result = await recorderRef.current?.stop();
    setActive(false);
    if (result) onRecorded(result);
  };

  return (
    <div className="flex flex-col gap-3">
      {step.texts.length > 0 ? (
        <div className="border-l-[3px] border-ochre bg-ochre-wash px-3 py-2.5">
          <Marginalia>{t('speech.topic')}</Marginalia>
          <p className="mt-1 text-[1.0625rem] leading-snug text-ink">{step.texts[0]}</p>
        </div>
      ) : null}

      {supported ? (
        <>
          <div className="flex items-center gap-3">
            {active ? (
              <Button variant="danger" size="lg" onClick={() => void stop()}>
                {t('speech.recordStop')}
              </Button>
            ) : (
              <Button variant="ghost" size="lg" onClick={() => void start()}>
                {t('speech.record')}
              </Button>
            )}
            {active ? (
              <span className="flex items-center gap-2 font-mono text-[1.25rem] tnum text-ink">
                <span
                  className="size-2.5 animate-pulse rounded-full bg-terracotta"
                  aria-hidden="true"
                />
                {formatClock(elapsed)}
              </span>
            ) : null}
          </div>

          {recording ? (
            <audio controls src={recording.url} className="w-full" aria-label={t('speech.play')} />
          ) : (
            <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-faint">
              {t('speech.noRecording')}
            </p>
          )}
        </>
      ) : (
        <p className="text-[0.875rem] text-ink-faint">{t('speech.micDenied', { error: '—' })}</p>
      )}

      {error ? (
        <p className="border-l-[3px] border-terracotta bg-terracotta-wash px-3 py-2 text-[0.875rem] text-ink">
          {t('speech.micDenied', { error })}
        </p>
      ) : null}

      {onReshuffle ? (
        <Button variant="quiet" full onClick={onReshuffle}>
          {t('speech.newTopic')}
        </Button>
      ) : null}
    </div>
  );
}
