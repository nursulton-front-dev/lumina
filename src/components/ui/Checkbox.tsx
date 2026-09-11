/** Чернильная галочка в квадрате: клетка тетради, а не системный чекбокс. */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={[
        'grid size-9 shrink-0 place-items-center rounded-[2px] border transition-colors duration-150',
        checked
          ? 'border-done bg-done-wash text-done'
          : 'border-rule text-transparent hover:border-ink hover:bg-[color-mix(in_oklab,var(--color-ochre-wash)_40%,transparent)]',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          d="M4 13.5 L9.5 19 L20 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="square"
          transform="rotate(-4 12 12)"
        />
      </svg>
    </button>
  );
}
