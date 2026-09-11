import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'quiet' | 'danger' | 'blue';
type Size = 'md' | 'lg';

/**
 * Кнопка «с толщиной»: сплошная заливка и полоса 4px более тёмного оттенка снизу.
 * При нажатии полоса исчезает, а кнопка опускается — ощущение вдавливания.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-done text-white shadow-[0_4px_0_0_var(--color-done-deep)] hover:brightness-105 active:translate-y-[4px] active:shadow-none',
  blue: 'bg-blue text-white shadow-[0_4px_0_0_var(--color-blue-deep)] hover:brightness-105 active:translate-y-[4px] active:shadow-none',
  ghost:
    'bg-raised text-ink border-2 border-rule shadow-[0_4px_0_0_var(--color-rule)] hover:border-ink-faint active:translate-y-[4px] active:shadow-none',
  quiet: 'bg-transparent text-ink-soft hover:bg-sunken hover:text-ink active:translate-y-px',
  danger:
    'bg-terracotta text-white shadow-[0_4px_0_0_var(--color-terracotta-deep)] hover:brightness-105 active:translate-y-[4px] active:shadow-none',
};

const SIZES: Record<Size, string> = {
  md: 'min-h-[44px] px-4 py-2 text-[0.9375rem]',
  lg: 'min-h-[52px] px-5 py-3 text-[1.0625rem]',
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
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-display font-bold',
        'transition-[transform,box-shadow,filter,background-color] duration-150 ease-out select-none',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0',
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
