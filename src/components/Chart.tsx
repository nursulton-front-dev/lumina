import { useState } from 'react';

export interface ChartPoint {
  date: string;
  value: number;
}

const WIDTH = 320;
const HEIGHT = 120;
const PADDING = { top: 12, right: 10, bottom: 18, left: 10 };

/**
 * График одного ряда: чернильная линия на бумаге, без легенды (ряд один — его
 * называет заголовок). Значения продублированы таблицей для скринридера.
 */
export function Chart({
  points,
  label,
  unit,
  lowerIsBetter = false,
  tableLabels,
  color = 'var(--color-blue)',
}: {
  points: readonly ChartPoint[];
  label: string;
  unit: string;
  /** Для паразитов и расхождения сна лучший результат — наименьший. */
  lowerIsBetter?: boolean;
  tableLabels: { table: string; date: string; value: string };
  /** Цвет линии — цвет направления метрики. */
  color?: string;
}): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null);

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (index: number): number =>
    PADDING.left +
    (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const y = (value: number): number =>
    PADDING.top + innerHeight - ((value - min) / span) * innerHeight;

  const path = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  const active = hover === null ? points.length - 1 : hover;
  const activePoint = points[active];

  const onMove = (event: React.PointerEvent<SVGSVGElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * WIDTH - PADDING.left) / innerWidth;
    const nearest = Math.round(index * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, nearest)));
  };

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-[120px] w-full touch-none"
        role="img"
        aria-label={label}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* Сетка держится в тени: три линии, толщиной в волос. */}
        {[0, 0.5, 1].map((share) => (
          <line
            key={share}
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top + innerHeight * share}
            y2={PADDING.top + innerHeight * share}
            stroke="var(--color-rule)"
            strokeWidth="0.5"
            strokeDasharray={share === 1 ? undefined : '3 4'}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <polyline
          points={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point, index) => (
          <circle
            key={point.date + index}
            cx={x(index)}
            cy={y(point.value)}
            r={index === active ? 4.5 : 2.5}
            fill={index === active ? 'var(--color-ochre)' : 'var(--color-raised)'}
            stroke={index === active ? 'var(--color-ochre)' : color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {activePoint ? (
          <text
            x={Math.min(WIDTH - PADDING.right, Math.max(PADDING.left + 14, x(active)))}
            y={Math.max(10, y(activePoint.value) - 9)}
            textAnchor="middle"
            className="font-display"
            fontSize="11"
            fill="var(--color-ink)"
          >
            {activePoint.value}
          </text>
        ) : null}
      </svg>

      <figcaption className="flex justify-between font-display text-[0.6875rem] tnum text-ink-faint">
        <span>{points[0]?.date.slice(5)}</span>
        <span>
          {activePoint ? `${activePoint.date.slice(5)} · ${activePoint.value} ${unit}` : ''}
        </span>
        <span>{points.at(-1)?.date.slice(5)}</span>
      </figcaption>

      {/* Тот же ряд текстом: график не должен быть единственным носителем данных. */}
      <table className="sr-only">
        <caption>{`${label} — ${tableLabels.table}`}</caption>
        <thead>
          <tr>
            <th scope="col">{tableLabels.date}</th>
            <th scope="col">{`${tableLabels.value}, ${unit}`}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => (
            <tr key={point.date + index}>
              <td>{point.date}</td>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="sr-only">
        {lowerIsBetter ? min : max} {unit}
      </p>
    </figure>
  );
}
