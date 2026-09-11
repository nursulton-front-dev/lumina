import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'quiet' | 'danger';
type Size = 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-ink text-paper border-ink hover:-translate-y-px hover:shadow-[3px_3px_0_0_var(--color-rule)] active:translate-y-0 active:shadow-none',
  ghost:
    'bg-transparent text-ink border-rule hover:border-ink hover:bg-[color-mix(in_oklab,var(--color-ochre-wash)_45%,transparent)] active:translate-y-px',
  quiet:
    'bg-transparent text-ink-soft border-transparent hover:text-ink hover:border-rule active:translate-y-px',
  danger:
    'bg-transparent text-terracotta border-terracotta hover:bg-terracotta-wash active:translate-y-px',
};

const SIZES: Record<Size, string> = {
  md: 'px-3.5 py-2 text-[0.9375rem]',
  lg: 'px-5 py-3.5 text-[1.0625rem]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'ghost',
  size = 'md',
  full = false,
  className = '',
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 border font-medium',
        'rounded-[2px] transition-all duration-150 ease-[var(--ease-paper)]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        full ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
