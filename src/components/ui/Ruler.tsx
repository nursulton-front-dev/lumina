/** Линейка прогресса с делениями — вместо круглого прогресс-бара. */
export function Ruler({
  value,
  label,
  tone = 'ochre',
}: {
  /** Заполнение 0…1. */
  value: number;
  label?: string;
  tone?: 'ochre' | 'done' | 'ink';
}): React.JSX.Element {
  const clamped = Math.min(1, Math.max(0, value));
  const fill = {
    ochre: 'bg-ochre',
    done: 'bg-done',
    ink: 'bg-ink',
  }[tone];

  return (
    <div className="w-full">
      <div
        className="relative h-3 w-full border-b border-rule"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped * 100)}
        aria-label={label}
      >
        <div
          className={`absolute bottom-0 left-0 h-[3px] ${fill} transition-[width] duration-500 ease-[var(--ease-paper)]`}
          style={{ width: `${clamped * 100}%` }}
        />
        <div className="absolute inset-0 flex justify-between">
          {Array.from({ length: 11 }, (_, index) => (
            <span
              key={index}
              className="w-px bg-rule"
              style={{ height: index % 5 === 0 ? '100%' : '45%', alignSelf: 'flex-end' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
