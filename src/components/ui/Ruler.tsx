/** Полоса прогресса: высота 12, полностью скруглённая. */
export function Ruler({
  value,
  label,
  tone = 'blue',
}: {
  /** Заполнение 0…1. */
  value: number;
  label?: string;
  tone?: 'ochre' | 'done' | 'ink' | 'blue';
}): React.JSX.Element {
  const clamped = Math.min(1, Math.max(0, value));
  const fill = {
    ochre: 'bg-ochre',
    done: 'bg-done',
    ink: 'bg-blue',
    blue: 'bg-blue',
  }[tone];

  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-sunken"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full ${fill} transition-[width] duration-300 ease-out`}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
