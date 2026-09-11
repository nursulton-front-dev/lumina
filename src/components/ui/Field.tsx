import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

const CONTROL =
  'w-full min-h-[48px] rounded-[var(--radius-field)] border-2 border-rule bg-raised px-3.5 py-2.5 text-ink transition-colors duration-150 hover:border-ink-faint focus:border-blue focus:outline-none';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-display text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint"
      >
        {label}
      </label>
      {children(id)}
      {hint ? <p className="text-[0.8125rem] leading-snug text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return <input className={[CONTROL, className].join(' ')} {...rest} />;
}

export function NumberInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <input
      type="number"
      inputMode="numeric"
      className={[CONTROL, 'font-display tnum', className].join(' ')}
      {...rest}
    />
  );
}

export function TimeInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <input type="time" className={[CONTROL, 'font-display tnum', className].join(' ')} {...rest} />
  );
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
  return (
    <select className={[CONTROL, 'appearance-none pr-8', className].join(' ')} {...rest}>
      {children}
    </select>
  );
}

/** Переключатель-флажок: рубильник на полях тетради. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[0.9375rem] text-ink">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-faint">{hint}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={[
          'relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-done' : 'bg-rule',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 size-6 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out',
            checked ? 'left-7' : 'left-1',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
