import type { MetricId } from '../types';

/**
 * Внутренние разряды приложения. Это не официальные спортивные нормативы —
 * шкала правится здесь, без изменения кода.
 */
export const GRADES = [
  'youth3',
  'youth2',
  'youth1',
  'adult3',
  'adult2',
  'adult1',
  'cms',
  'ms',
] as const;

export type Grade = (typeof GRADES)[number];

export type RankId =
  | 'bar'
  | 'pushups'
  | 'abs'
  | 'longJump'
  | 'highJump'
  | 'grip'
  | 'memory'
  | 'voice'
  | 'ioi'
  | 'russian'
  | 'english';

export interface RankSpec {
  id: RankId;
  /** Норматив берётся из замеров этой метрики. */
  metric: MetricId | null;
  /** Меньше — лучше: слова-паразиты. */
  lowerIsBetter?: boolean;
  /** Пороги по разрядам, в порядке GRADES. */
  thresholds: number[];
  /** Второй норматив: контесты для IOI, пробные тесты для языков. */
  secondThresholds?: number[];
  /** Счётчик ведётся вручную (задачи, контесты, тесты), а не берётся из замеров. */
  manual?: boolean;
  /** Часы копятся из отмеченных блоков этой категории. */
  hoursFromCategory?: 'ioi' | 'russian' | 'english';
}

export const RANKS: RankSpec[] = [
  { id: 'bar', metric: 'pullups', thresholds: [1, 3, 5, 8, 12, 16, 20, 25] },
  { id: 'pushups', metric: 'pushups', thresholds: [10, 15, 20, 25, 35, 45, 60, 75] },
  { id: 'abs', metric: 'legRaises', thresholds: [2, 4, 6, 8, 12, 18, 25, 30] },
  { id: 'longJump', metric: 'longJump', thresholds: [160, 175, 190, 200, 220, 240, 255, 270] },
  { id: 'highJump', metric: 'verticalJump', thresholds: [25, 30, 35, 40, 50, 58, 65, 72] },
  { id: 'grip', metric: 'towelHang', thresholds: [8, 12, 16, 20, 35, 50, 70, 90] },
  { id: 'memory', metric: 'digits', thresholds: [5, 8, 11, 15, 25, 40, 60, 80] },
  { id: 'voice', metric: 'fillers', lowerIsBetter: true, thresholds: [25, 20, 16, 12, 8, 5, 3, 1] },
  {
    id: 'ioi',
    metric: null,
    manual: true,
    thresholds: [10, 25, 40, 50, 150, 300, 500, 800],
    secondThresholds: [0, 1, 1, 2, 6, 12, 20, 30],
  },
  {
    id: 'russian',
    metric: null,
    manual: true,
    hoursFromCategory: 'russian',
    thresholds: [10, 20, 30, 40, 100, 200, 350, 500],
    secondThresholds: [0, 1, 1, 2, 5, 10, 18, 25],
  },
  {
    id: 'english',
    metric: null,
    manual: true,
    hoursFromCategory: 'english',
    thresholds: [10, 20, 30, 40, 100, 200, 350, 500],
    secondThresholds: [0, 1, 1, 2, 5, 10, 18, 25],
  },
];

export function rankSpec(id: RankId): RankSpec | undefined {
  return RANKS.find((spec) => spec.id === id);
}
