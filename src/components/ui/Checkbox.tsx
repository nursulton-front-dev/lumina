/** Круглый чекбокс 28px: при отметке заливается зелёным с галочкой и коротко пружинит. */
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
        'grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150',
        checked
          ? 'border-done bg-done text-white'
          : 'border-rule bg-raised text-transparent hover:border-ink-faint',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
    >
      <svg
        viewBox="0 0 24 24"
        className={['size-4', checked ? 'animate-[check-pop_200ms_ease-out_both]' : ''].join(' ')}
        aria-hidden="true"
      >
        <path
          d="M5 12.5 L10 17.5 L19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
