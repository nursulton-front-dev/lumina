import type { Category, MetricId } from '../types';

/**
 * Цвета и иконки категорий. Единственное место, где категория связана с цветом:
 * строки расписания, полосы недели и графики берут значение отсюда.
 */
export interface CategoryStyle {
  /** Имя CSS-переменной без префикса: --color-cat-<name>. */
  token: string;
  /** Контур иконки 24×24. */
  icon: string;
}

const NEUTRAL = 'neutral';

export const CATEGORY_STYLE: Record<Category, CategoryStyle> = {
  sport: { token: 'sport', icon: 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12' },
  russian: { token: 'russian', icon: 'M5 4h9a4 4 0 0 1 0 8H5zM5 12h10a4 4 0 0 1 0 8H5zM5 4v16' },
  english: {
    token: 'english',
    icon: 'M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16M4 12a8 8 0 0 1 16 0 8 8 0 0 1-16 0',
  },
  ioi: { token: 'ioi', icon: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16' },
  freelance: { token: 'freelance', icon: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16' },
  homework: { token: 'homework', icon: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h6' },
  reading: {
    token: 'reading',
    icon: 'M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z',
  },
  memory: {
    token: 'memory',
    icon: 'M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3 3 3 0 0 0 2 3v1a3 3 0 0 0 3 3h1V4zM15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3 3 3 0 0 1-2 3v1a3 3 0 0 1-3 3h-1V4z',
  },
  speech: {
    token: 'speech',
    icon: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6',
  },
  school: { token: NEUTRAL, icon: 'M3 9l9-4 9 4-9 4zM7 11v5c0 1 2.5 2 5 2s5-1 5-2v-5' },
  commute: {
    token: NEUTRAL,
    icon: 'M5 16V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8M5 16h14M5 16v2M19 16v2M8 12h8',
  },
  rest: {
    token: NEUTRAL,
    icon: 'M4 11h16v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM8 11V7M12 11V6M16 11V7',
  },
  routine: { token: NEUTRAL, icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2' },
  free: {
    token: NEUTRAL,
    icon: 'M12 3l2.7 5.6 6.3.9-4.5 4.3 1 6.2L12 17l-5.5 3 1-6.2L3 9.5l6.3-.9z',
  },
  sleep: { token: NEUTRAL, icon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z' },
};

export function categoryColor(category: Category): string {
  return `var(--color-cat-${CATEGORY_STYLE[category].token})`;
}

/** Направление, к которому относится метрика прогресса. */
export const METRIC_CATEGORY: Record<MetricId, Category> = {
  pullups: 'sport',
  pushups: 'sport',
  legRaises: 'sport',
  longJump: 'sport',
  verticalJump: 'sport',
  towelHang: 'sport',
  digits: 'memory',
  fillers: 'speech',
  bedtimeDrift: 'sleep',
};
