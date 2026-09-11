import { addDays } from './time';

/** Щит сгорает вместо серии, если день провален. Больше двух не копится. */
export const MAX_SHIELDS = 2;

export interface ShieldState {
  count: number;
  /** Месяц последней выдачи в формате YYYY-MM. */
  grantedMonth: string | null;
  /** Дни, закрытые щитом. */
  spent: string[];
}

export const INITIAL_SHIELDS: ShieldState = { count: 0, grantedMonth: null, spent: [] };

function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** Раз в месяц начисляется один щит. */
export function grantMonthlyShield(state: ShieldState, todayIso: string): ShieldState {
  const month = monthOf(todayIso);
  if (state.grantedMonth === month) return state;
  return {
    ...state,
    count: Math.min(MAX_SHIELDS, state.count + 1),
    grantedMonth: month,
  };
}

export interface ShieldUse {
  state: ShieldState;
  /** Дата, которую закрыл щит, либо null. */
  covered: string | null;
}

/**
 * Закрывает вчерашний провал щитом, если серия иначе оборвётся.
 * Щит тратится только когда есть что защищать: позавчера день был закрыт.
 */
export function spendShieldIfNeeded(
  state: ShieldState,
  doneDates: ReadonlySet<string>,
  todayIso: string,
): ShieldUse {
  const yesterday = addDays(todayIso, -1);
  if (state.count <= 0) return { state, covered: null };
  if (doneDates.has(yesterday) || state.spent.includes(yesterday)) return { state, covered: null };

  const dayBefore = addDays(todayIso, -2);
  const hadStreak = doneDates.has(dayBefore) || state.spent.includes(dayBefore);
  if (!hadStreak) return { state, covered: null };

  return {
    state: { ...state, count: state.count - 1, spent: [...state.spent, yesterday] },
    covered: yesterday,
  };
}

/** Дни, закрытые щитом, считаются выполненными при подсчёте серии. */
export function datesWithShields(
  doneDates: Iterable<string>,
  spent: readonly string[],
): Set<string> {
  return new Set([...doneDates, ...spent]);
}
