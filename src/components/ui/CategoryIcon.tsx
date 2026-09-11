import type { Category } from '../../types';
import { CATEGORY_STYLE, categoryColor } from '../../data/categories';

/** Круглая иконка категории на подложке того же цвета с прозрачностью 12 процентов. */
export function CategoryIcon({
  category,
  size = 36,
}: {
  category: Category;
  size?: number;
}): React.JSX.Element {
  const color = categoryColor(category);
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        color,
        background: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      <svg viewBox="0 0 24 24" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path
          d={CATEGORY_STYLE[category].icon}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
