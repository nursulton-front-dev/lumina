import type { TranslationKey } from '../i18n';
import type { MetricId, ProtocolId } from '../types';

export type StepKind =
  | 'timer'
  | 'sets'
  | 'measure'
  | 'info'
  | 'numbers'
  | 'record'
  | 'twisters'
  | 'chart'
  | 'weekStats'
  | 'quests';

export interface StepSets {
  sets: number;
  /** Повторения в подходе. Массив — лесенка вроде 1-2-3-4-5-4-3-2-1. */
  reps: number | number[];
  /** Повторения выполняются на каждую сторону. */
  perSide: boolean;
  restSeconds: number;
  /** Подход «на максимум»: число повторений заранее неизвестно. */
  toFailure: boolean;
  /** Изометрия: удержание вместо повторений. */
  holdSeconds: number | null;
}

/** Движение внутри составного шага: разминки или круга. */
export interface ProtocolItem {
  key: TranslationKey;
  count: number | null;
  unit: 'sec' | 'reps' | 'perSide' | null;
}

export interface ProtocolStep {
  id: string;
  titleKey: TranslationKey;
  /** Техническая подсказка. Лежит в словаре, работает офлайн. */
  hintKey: TranslationKey | null;
  kind: StepKind;
  /** Длительность шага в секундах. 0 — шаг без таймера. */
  seconds: number;
  /** Шаг нельзя пропустить и нельзя пролистать раньше времени (разминка). */
  locked: boolean;
  sets: StepSets | null;
  metric: MetricId | null;
  /** Сколько попыток в замере: записывается лучшая. */
  attempts: number;
  /** Составной шаг: список движений внутри. */
  items: ProtocolItem[];
  /** Приземлений за упражнение — идёт в недельный лимит прыжковой работы. */
  landings: number;
  /** Готовые строки шага: скороговорки, тема импровизации. */
  texts: string[];
  /** Шаг проигрывает запись, сделанную на другом шаге. */
  playbackOf: string | null;
}

export interface ProtocolNote {
  key: TranslationKey;
  vars?: Record<string, string | number>;
  tone: 'info' | 'warning';
}

export interface ResolvedProtocol {
  id: ProtocolId;
  titleKey: TranslationKey;
  /** Подзаголовок: например, текущий уровень подтягиваний. */
  subtitleKey: TranslationKey | null;
  steps: ProtocolStep[];
  /** Правила безопасности показываются прямо в протоколе, а не в справке. */
  safetyKeys: TranslationKey[];
  notes: ProtocolNote[];
}

export function step(
  partial: Partial<ProtocolStep> & Pick<ProtocolStep, 'id' | 'titleKey'>,
): ProtocolStep {
  return {
    hintKey: null,
    kind: 'info',
    seconds: 0,
    locked: false,
    sets: null,
    metric: null,
    attempts: 0,
    items: [],
    landings: 0,
    texts: [],
    playbackOf: null,
    ...partial,
  };
}

export function totalSeconds(protocol: ResolvedProtocol): number {
  return protocol.steps.reduce((sum, item) => {
    if (item.seconds > 0) return sum + item.seconds;
    if (!item.sets) return sum;
    const reps = Array.isArray(item.sets.reps) ? item.sets.reps.length : item.sets.sets;
    const hold = item.sets.holdSeconds ?? 30;
    return sum + reps * (hold + item.sets.restSeconds);
  }, 0);
}
