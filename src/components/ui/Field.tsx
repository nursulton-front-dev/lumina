import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

const CONTROL =
  'w-full rounded-[2px] border border-rule bg-[color-mix(in_oklab,var(--color-raised)_70%,transparent)] px-3 py-2 text-ink transition-colors duration-150 hover:border-ink-faint focus:border-ink focus:outline-none';

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
        className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint"
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
      className={[CONTROL, 'font-mono tnum', className].join(' ')}
      {...rest}
    />
  );
}

export function TimeInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <input type="time" className={[CONTROL, 'font-mono tnum', className].join(' ')} {...rest} />
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
          'relative h-6 w-11 shrink-0 rounded-[2px] border transition-colors duration-200',
          checked ? 'border-ink bg-ink' : 'border-rule bg-transparent',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-[2px] size-[18px] rounded-[1px] transition-all duration-200 ease-[var(--ease-paper)]',
            checked ? 'left-[22px] bg-paper' : 'left-[2px] bg-rule',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
