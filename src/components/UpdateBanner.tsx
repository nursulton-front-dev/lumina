import { Button } from './ui/Button';
import { useT } from '../state/app-context';

/** Плашка «доступна новая версия»: обновление только по кнопке, чтобы не рвать таймер. */
export function UpdateBanner({
  onUpdate,
  onDismiss,
}: {
  onUpdate: () => void;
  onDismiss: () => void;
}): React.JSX.Element {
  const t = useT();
  return (
    <div
      role="status"
      className="safe-top fixed inset-x-3 top-3 z-[60] flex items-center gap-3 rounded-[var(--radius-card)] border border-rule bg-raised px-4 py-3 shadow-[var(--shadow-card)]"
    >
      <p className="min-w-0 flex-1 text-[0.9375rem] leading-snug text-ink">
        {t('update.available')}
      </p>
      <Button variant="primary" onClick={onUpdate}>
        {t('update.reload')}
      </Button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('common.close')}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-ink-soft"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.4" />
        </svg>
      </button>
    </div>
  );
}
