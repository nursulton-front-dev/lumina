import type { HTMLAttributes, ReactNode } from 'react';

interface SheetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Цветная полоса слева внутри карточки: текущий блок, выполнено, срыв. */
  accent?: 'none' | 'ochre' | 'done' | 'terracotta' | 'ink' | 'blue';
}

const ACCENTS: Record<NonNullable<SheetProps['accent']>, string> = {
  none: '',
  ochre: 'border-ochre/60',
  done: 'border-done/50',
  terracotta: 'border-terracotta/50',
  ink: '',
  blue: 'border-blue/50',
};

export function Sheet({
  children,
  accent = 'none',
  className = '',
  ...rest
}: SheetProps): React.JSX.Element {
  return (
    <div className={['sheet', ACCENTS[accent], className].join(' ')} {...rest}>
      {children}
    </div>
  );
}

/** Подпись раздела: мелкая, жирная, вторичным цветом. */
export function Marginalia({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={[
        'font-display text-[0.75rem] font-extrabold tracking-[0.08em] text-ink-faint uppercase',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/** Пустое состояние: короткая тёплая фраза и простая иконка вместо пустой карточки. */
export function EmptyState({
  text,
  icon = 'sprout',
}: {
  text: string;
  icon?: 'sprout' | 'flag' | 'clipboard' | 'chart';
}): React.JSX.Element {
  const paths: Record<NonNullable<typeof icon>, string> = {
    sprout: 'M12 21v-8m0 0c0-4 3-6 7-6-0 4-3 6-7 6zm0 0c0-4-3-6-7-6 0 4 3 6 7 6z',
    flag: 'M6 21V4m0 0h11l-2 4 2 4H6',
    clipboard: 'M9 4h6v3H9zM7 6H5v15h14V6h-2M9 12h6M9 16h4',
    chart: 'M4 20h16M6 16l4-5 4 3 5-7',
  };
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-blue-wash text-blue">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
          <path
            d={paths[icon]}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="max-w-[28ch] text-[0.9375rem] leading-snug text-ink-soft">{text}</p>
    </div>
  );
}
