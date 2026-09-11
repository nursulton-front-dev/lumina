import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { PomodoroMode } from '../domain/pomodoro';
import {
  focusStats,
  phaseMinutes,
  POMODORO_MODES,
  progress,
  remainingMs,
} from '../domain/pomodoro';
import { blockTitle } from '../domain/blockTitle';
import { formatClock, toISODate } from '../domain/time';
import { db } from '../db/db';
import { Button } from '../components/ui/Button';
import { Marginalia } from '../components/ui/Sheet';
import { Ruler } from '../components/ui/Ruler';
import { useApp } from '../state/app-context';
import { useNow } from '../state/useNow';
import { usePomodoro } from '../state/usePomodoro';
import { navigate } from '../state/router';
import { ensureNotificationPermission, notify, playChime } from '../lib/sound';
import { focusVerdict, type Verdict } from '../domain/verdicts';

const MODES: PomodoroMode[] = ['classic', 'long'];

/** Помодоро, привязанное к блоку дня: таймер, срывы и сводка за день. */
export function FocusScreen({ blockId }: { blockId: string }): React.JSX.Element {
  const { t } = useApp();
  const now = useNow(500);
  const date = toISODate(now);
  const pomodoro = usePomodoro();
  const { onPhaseEnd } = pomodoro;

  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const block = useLiveQuery(() => db.blocks.get(blockId), [blockId]);
  const sessions =
    useLiveQuery(() => db.sessions.where('date').equals(date).toArray(), [date]) ?? [];
  const stats = focusStats(sessions);

  useEffect(() => {
    onPhaseEnd((finished) => {
      playChime();
      if (finished.phase === 'work') {
        setVerdict(
          focusVerdict({
            exits: finished.exits,
            broken: finished.broken,
            minutes: phaseMinutes(finished.mode, 'work'),
          }),
        );
      }
      notify(
        t('app.name'),
        finished.phase === 'work'
          ? t('focus.notifyWork', { n: phaseMinutes(finished.mode, 'rest') })
          : t('focus.notifyRest'),
      );
    });
  }, [onPhaseEnd, t]);

  const state = pomodoro.state?.blockId === blockId ? pomodoro.state : null;
  const title = block ? blockTitle(block, t) : t('focus.blockMissing');

  const begin = async (mode: PomodoroMode): Promise<void> => {
    // Сессия стартует сразу; разрешение на уведомления запрашивается фоном,
    // чтобы диалог браузера не задерживал таймер.
    await pomodoro.start(blockId, date, mode);
    void ensureNotificationPermission();
  };

  const stop = async (): Promise<void> => {
    if (!window.confirm(t('focus.stopConfirm'))) return;
    await pomodoro.stop();
    navigate({ name: 'today' });
  };

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-40 flex flex-col bg-paper">
      <header className="flex items-center gap-3 border-b border-rule px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
            {t('focus.title')}
          </p>
          <p className="truncate text-[0.9375rem] text-ink">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate({ name: 'today' })}
          aria-label={t('common.close')}
          className="grid size-9 shrink-0 place-items-center border border-transparent text-ink-faint transition-colors hover:border-rule hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.4" />
          </svg>
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-4 pt-8">
        {state ? (
          <>
            <Marginalia>{state.phase === 'work' ? t('focus.work') : t('focus.rest')}</Marginalia>
            <output className="block font-mono text-[clamp(4rem,24vw,7rem)] leading-none tnum text-ink">
              {formatClock(remainingMs(state, now.getTime()) / 1000)}
            </output>
            <Ruler
              value={progress(state, now.getTime())}
              tone={state.phase === 'work' ? 'ochre' : 'done'}
            />

            <dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.8125rem] tnum">
              <div className="flex gap-2">
                <dt className="text-ink-faint">{t('focus.exits')}</dt>
                <dd className={state.exits > 0 ? 'text-terracotta' : 'text-ink'}>{state.exits}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-ink-faint">{t('focus.cycles')}</dt>
                <dd className="text-ink">{state.cycles}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-ink-faint">{t('focus.switchMode')}</dt>
                <dd className="text-ink">{t(`focus.mode.${state.mode}`)}</dd>
              </div>
            </dl>

            {state.broken ? (
              <p className="border-l-[3px] border-terracotta bg-terracotta-wash px-3 py-2 text-[0.875rem] text-ink">
                {t('focus.brokenNow')}
              </p>
            ) : null}

            {verdict ? (
              <p className="border-l-[3px] border-ink px-3 py-2 text-[0.875rem] leading-snug text-ink-soft">
                {t(verdict.key, verdict.vars)}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-[0.9375rem] leading-snug text-ink-soft">{t('focus.hint')}</p>
            <div className="flex flex-col gap-2">
              {MODES.map((mode) => (
                <Button key={mode} variant="ghost" size="lg" full onClick={() => void begin(mode)}>
                  {t(`focus.mode.${mode}`)}
                  <span className="ml-2 font-mono text-[0.75rem] tnum text-ink-faint">
                    {POMODORO_MODES[mode].workMinutes} {t('unit.min')}
                  </span>
                </Button>
              ))}
            </div>
          </>
        )}

        <section className="mt-auto border-t border-dashed border-rule pt-3 pb-2">
          <Marginalia>{t('focus.today')}</Marginalia>
          <dl className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.8125rem] tnum">
            <div className="flex gap-2">
              <dt className="text-ink-faint">{t('focus.clean')}</dt>
              <dd className="text-done">{stats.clean}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-faint">{t('focus.broken')}</dt>
              <dd className="text-terracotta">{stats.broken}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-faint">{t('focus.exits')}</dt>
              <dd className="text-ink">{stats.exits}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-faint">{t('focus.minutes')}</dt>
              <dd className="text-ink">{stats.minutes}</dd>
            </div>
          </dl>
        </section>
      </main>

      <footer className="safe-bottom flex gap-2 border-t border-rule px-3 py-3">
        {state ? (
          <>
            <Button
              variant="quiet"
              size="lg"
              className="shrink-0 whitespace-nowrap"
              aria-label={t('focus.switchMode')}
              onClick={() => void pomodoro.setMode(state.mode === 'classic' ? 'long' : 'classic')}
            >
              <span aria-hidden="true">⇄</span>{' '}
              {t(`focus.mode.${state.mode === 'classic' ? 'long' : 'classic'}`)}
            </Button>
            <Button variant="danger" size="lg" full onClick={() => void stop()}>
              {t('focus.stop')}
            </Button>
          </>
        ) : (
          <Button variant="quiet" size="lg" full onClick={() => navigate({ name: 'today' })}>
            {t('common.back')}
          </Button>
        )}
      </footer>
    </div>
  );
}
