/** Помодоро с отслеживанием срывов. Всё время — абсолютные метки, а не тики. */

export type PomodoroMode = 'classic' | 'long';
export type PomodoroPhase = 'work' | 'rest';

export interface ModeSpec {
  workMinutes: number;
  restMinutes: number;
}

export const POMODORO_MODES: Record<PomodoroMode, ModeSpec> = {
  classic: { workMinutes: 25, restMinutes: 5 },
  long: { workMinutes: 50, restMinutes: 10 },
};

/** Уход дольше двадцати секунд помечает сессию как сорванную. */
export const BREAK_THRESHOLD_MS = 20_000;

export interface PomodoroState {
  blockId: string | null;
  date: string;
  mode: PomodoroMode;
  phase: PomodoroPhase;
  /** Абсолютное время начала текущей фазы. */
  startedAt: number;
  /** Абсолютное время конца текущей фазы. */
  endsAt: number;
  exits: number;
  broken: boolean;
  /** Момент ухода в фон; null — вкладка активна. */
  awaySince: number | null;
  /** Сколько рабочих фаз уже закрыто в этой сессии. */
  cycles: number;
}

export function phaseMinutes(mode: PomodoroMode, phase: PomodoroPhase): number {
  const spec = POMODORO_MODES[mode];
  return phase === 'work' ? spec.workMinutes : spec.restMinutes;
}

export function startSession(options: {
  blockId: string | null;
  date: string;
  mode: PomodoroMode;
  now: number;
}): PomodoroState {
  const { blockId, date, mode, now } = options;
  return {
    blockId,
    date,
    mode,
    phase: 'work',
    startedAt: now,
    endsAt: now + phaseMinutes(mode, 'work') * 60_000,
    exits: 0,
    broken: false,
    awaySince: null,
    cycles: 0,
  };
}

export function remainingMs(state: PomodoroState, now: number): number {
  return Math.max(0, state.endsAt - now);
}

export function isFinished(state: PomodoroState, now: number): boolean {
  return now >= state.endsAt;
}

export function progress(state: PomodoroState, now: number): number {
  const total = state.endsAt - state.startedAt;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - state.startedAt) / total));
}

/** Вкладка ушла в фон. Само по себе это ещё не срыв — считаем длительность. */
export function markAway(state: PomodoroState, now: number): PomodoroState {
  if (state.phase !== 'work' || state.awaySince !== null) return state;
  return { ...state, awaySince: now };
}

/** Вкладка вернулась: фиксируем выход и решаем, сорвана ли сессия. */
export function markBack(state: PomodoroState, now: number): PomodoroState {
  if (state.awaySince === null) return state;
  const away = now - state.awaySince;
  return {
    ...state,
    awaySince: null,
    exits: state.exits + 1,
    broken: state.broken || away > BREAK_THRESHOLD_MS,
  };
}

/** Переход между работой и отдыхом. Рабочая фаза закрывает цикл. */
export function switchPhase(state: PomodoroState, now: number): PomodoroState {
  const phase: PomodoroPhase = state.phase === 'work' ? 'rest' : 'work';
  return {
    ...state,
    phase,
    startedAt: now,
    endsAt: now + phaseMinutes(state.mode, phase) * 60_000,
    cycles: state.phase === 'work' ? state.cycles + 1 : state.cycles,
    exits: phase === 'work' ? 0 : state.exits,
    broken: phase === 'work' ? false : state.broken,
    awaySince: null,
  };
}

export interface FocusStats {
  clean: number;
  broken: number;
  exits: number;
  minutes: number;
}

/** Сводка по дню: чистые сессии, сорванные и общее число выходов. */
export function focusStats(
  sessions: readonly { kind: string; broken: boolean; exits: number; minutes: number }[],
): FocusStats {
  return sessions
    .filter((session) => session.kind === 'pomodoro')
    .reduce<FocusStats>(
      (stats, session) => ({
        clean: stats.clean + (session.broken ? 0 : 1),
        broken: stats.broken + (session.broken ? 1 : 0),
        exits: stats.exits + session.exits,
        minutes: stats.minutes + session.minutes,
      }),
      { clean: 0, broken: 0, exits: 0, minutes: 0 },
    );
}
