import type { HTMLAttributes, ReactNode } from 'react';

interface SheetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Цветная полоса слева — как поля в тетради. */
  accent?: 'none' | 'ochre' | 'done' | 'terracotta' | 'ink';
}

const ACCENTS: Record<NonNullable<SheetProps['accent']>, string> = {
  none: '',
  ochre: 'border-l-[3px] border-l-ochre',
  done: 'border-l-[3px] border-l-done',
  terracotta: 'border-l-[3px] border-l-terracotta',
  ink: 'border-l-[3px] border-l-ink',
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

/** Надпись на полях: мелкая, разрядкой, моноширинная. */
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
        'font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
