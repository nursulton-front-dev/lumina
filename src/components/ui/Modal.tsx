import { useEffect, type ReactNode } from 'react';

/** Лист поверх страницы: на телефоне выезжает снизу, на широком экране — по центру. */
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}): React.JSX.Element {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,var(--color-ink)_38%,transparent)] sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="sheet safe-bottom max-h-[88dvh] w-full max-w-lg overflow-y-auto bg-paper shadow-[0_-8px_40px_-12px_color-mix(in_oklab,var(--color-ink)_40%,transparent)]"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-rule bg-paper px-4 py-3">
          <h2 className="text-[1.0625rem] font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={title}
            className="grid size-8 place-items-center rounded-[2px] border border-transparent text-ink-faint transition-colors hover:border-rule hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.4" />
            </svg>
          </button>
        </header>
        <div className="px-4 py-4">{children}</div>
        {footer ? (
          <footer className="sticky bottom-0 flex gap-2 border-t border-rule bg-paper px-4 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
