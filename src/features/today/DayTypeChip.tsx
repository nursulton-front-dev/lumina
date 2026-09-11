import { useState } from 'react';
import type { DayTypeCode } from '../../types';
import type { TranslationKey } from '../../i18n';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../state/app-context';
import { setDayOverride } from '../../db/repo';

const DAY_TYPES: DayTypeCode[] = ['odd', 'even', 'fri', 'sat', 'sun'];

/** Тип дня можно переключить вручную на конкретную дату — выбор сохраняется. */
export function DayTypeChip({
  date,
  dayType,
  overridden,
}: {
  date: string;
  dayType: DayTypeCode;
  overridden: boolean;
}): React.JSX.Element {
  const t = useT();
  const [open, setOpen] = useState(false);

  const choose = async (next: DayTypeCode | null): Promise<void> => {
    await setDayOverride(date, next);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'rounded-full px-3 py-1.5 font-display text-[0.75rem] font-extrabold tracking-[0.04em] transition-colors duration-150',
          overridden ? 'bg-ochre-wash text-ochre-deep' : 'bg-sunken text-ink-soft hover:text-ink',
        ].join(' ')}
      >
        {t(`daytype.${dayType}` as TranslationKey)}
      </button>

      {open ? (
        <Modal title={t('daytype.change')} onClose={() => setOpen(false)}>
          <p className="mb-3 text-[0.8125rem] text-ink-faint">
            {overridden ? t('daytype.overridden') : t('daytype.auto')}
          </p>
          <div className="flex flex-col gap-2">
            {DAY_TYPES.map((code) => (
              <Button
                key={code}
                variant={code === dayType ? 'primary' : 'ghost'}
                full
                onClick={() => void choose(code)}
              >
                {t(`daytype.${code}` as TranslationKey)}
              </Button>
            ))}
            {overridden ? (
              <Button variant="quiet" full onClick={() => void choose(null)}>
                {t('daytype.reset')}
              </Button>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
