import { useState } from 'react';
import type { Block, Category, DayTypeCode, ProtocolId } from '../../types';
import type { TranslationKey } from '../../i18n';
import { blockTitle } from '../../domain/blockTitle';
import { validateBlock } from '../../domain/schedule';
import { formatRange, fromMinutes, toMinutes } from '../../domain/time';
import { Button } from '../../components/ui/Button';
import { Field, Select, TextInput, TimeInput, Toggle } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../state/app-context';
import { putBlock, removeBlock } from '../../db/repo';
import { newId } from '../../db/db';

const CATEGORIES: Category[] = [
  'routine',
  'sport',
  'russian',
  'english',
  'ioi',
  'freelance',
  'homework',
  'school',
  'memory',
  'reading',
  'speech',
  'commute',
  'rest',
  'free',
  'sleep',
];

const PROTOCOLS: ProtocolId[] = ['workout', 'numbers', 'speech', 'week-review'];

export function BlockEditor({
  block,
  dayType,
  siblings,
  onClose,
}: {
  /** null — создаётся новый блок. */
  block: Block | null;
  dayType: DayTypeCode;
  siblings: readonly Block[];
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useApp();
  const [name, setName] = useState(() => (block ? blockTitle(block, t) : ''));
  const [start, setStart] = useState(() => fromMinutes(block?.start ?? 8 * 60));
  const [end, setEnd] = useState(() => fromMinutes(block?.end ?? 9 * 60));
  const [category, setCategory] = useState<Category>(block?.category ?? 'routine');
  const [protocolId, setProtocolId] = useState<ProtocolId | null>(block?.protocolId ?? null);
  const [isCore, setIsCore] = useState(block?.isCore ?? false);
  const [isFocus, setIsFocus] = useState(block?.isFocus ?? false);
  const [weekdays, setWeekdays] = useState<number[]>(block?.weekdays ?? []);
  const [error, setError] = useState<string | null>(null);

  const save = async (): Promise<void> => {
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    const problem = validateBlock(siblings, {
      id: block?.id,
      start: startMinutes,
      end: endMinutes,
      name,
      weekdays,
    });

    if (problem) {
      if (problem.kind === 'range') setError(t('schedule.errorRange'));
      else if (problem.kind === 'emptyName') setError(t('schedule.errorEmptyName'));
      else
        setError(
          t('schedule.errorOverlap', {
            title: blockTitle(problem.block, t),
            time: formatRange(problem.block.start, problem.block.end),
          }),
        );
      return;
    }

    const trimmed = name.trim();
    /** Если название совпадает со встроенным переводом, оставляем ключ — блок останется переводимым. */
    const keepsKey = block?.titleKey != null && trimmed === blockTitle(block, t);

    await putBlock({
      id: block?.id ?? newId(),
      dayType,
      date: block?.date ?? '',
      weekdays,
      start: startMinutes,
      end: endMinutes,
      titleKey: keepsKey ? block.titleKey : null,
      title: keepsKey ? null : trimmed,
      category,
      protocolId,
      isCore,
      isFocus,
      order: block?.order ?? startMinutes,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const remove = async (): Promise<void> => {
    if (!block) return;
    if (!window.confirm(t('schedule.deleteConfirm'))) return;
    await removeBlock(block.id);
    onClose();
  };

  return (
    <Modal
      title={block ? t('schedule.editBlock') : t('schedule.newBlock')}
      onClose={onClose}
      footer={
        <>
          <Button variant="primary" full onClick={() => void save()}>
            {t('common.save')}
          </Button>
          <Button variant="quiet" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t('schedule.name')}>
          {(id) => (
            <TextInput
              id={id}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('schedule.start')}>
            {(id) => (
              <TimeInput id={id} value={start} onChange={(event) => setStart(event.target.value)} />
            )}
          </Field>
          <Field label={t('schedule.end')}>
            {(id) => (
              <TimeInput id={id} value={end} onChange={(event) => setEnd(event.target.value)} />
            )}
          </Field>
        </div>

        <Field label={t('schedule.category')}>
          {(id) => (
            <Select
              id={id}
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {CATEGORIES.map((code) => (
                <option key={code} value={code}>
                  {t(`category.${code}` as TranslationKey)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('schedule.protocol')}>
          {(id) => (
            <Select
              id={id}
              value={protocolId ?? ''}
              onChange={(event) =>
                setProtocolId(event.target.value === '' ? null : (event.target.value as ProtocolId))
              }
            >
              <option value="">{t('schedule.protocol.none')}</option>
              {PROTOCOLS.map((code) => (
                <option key={code} value={code}>
                  {t(`protocol.${code}` as TranslationKey)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('schedule.weekdays')} hint={t('schedule.weekdaysHint')}>
          {() => (
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const active = weekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setWeekdays((current) =>
                        current.includes(day)
                          ? current.filter((item) => item !== day)
                          : [...current, day].sort(),
                      )
                    }
                    className={[
                      'min-h-[40px] min-w-[44px] rounded-full border-2 px-2 font-display text-[0.875rem] font-bold transition-colors',
                      active
                        ? 'border-blue bg-blue text-white'
                        : 'border-rule bg-raised text-ink-soft hover:border-ink-faint',
                    ].join(' ')}
                  >
                    {t(`weekday.short.${day}` as TranslationKey)}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        <Toggle checked={isCore} onChange={setIsCore} label={t('schedule.core')} />
        <Toggle checked={isFocus} onChange={setIsFocus} label={t('schedule.focus')} />

        {error ? (
          <p className="rounded-[var(--radius-field)] bg-terracotta-wash px-3 py-2 text-[0.875rem] text-ink">
            {error}
          </p>
        ) : null}

        {block ? (
          <Button variant="danger" full onClick={() => void remove()}>
            {t('schedule.delete')}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
