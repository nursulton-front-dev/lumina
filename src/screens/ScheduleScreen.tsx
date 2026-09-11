import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Block, DayTypeCode } from '../types';
import type { TranslationKey } from '../i18n';
import { blockTitle } from '../domain/blockTitle';
import { bookedMinutes } from '../domain/schedule';
import { formatDuration, formatRange, toISODate } from '../domain/time';
import { autoDayType } from '../domain/dayType';
import { Button } from '../components/ui/Button';
import { Marginalia } from '../components/ui/Sheet';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { categoryColor } from '../data/categories';
import { BlockEditor } from '../features/schedule/BlockEditor';
import { useApp } from '../state/app-context';
import { dayTypeRule } from '../state/useDay';
import { listBlocks, resetSchedule } from '../db/repo';

const DAY_TYPES: DayTypeCode[] = ['odd', 'even', 'fri', 'sat', 'sun'];

export function ScheduleScreen(): React.JSX.Element {
  const { t, profile } = useApp();
  const [dayType, setDayType] = useState<DayTypeCode>(() =>
    autoDayType(toISODate(new Date()), dayTypeRule(profile)),
  );
  const [editing, setEditing] = useState<Block | null | undefined>(undefined);

  const blocks = useLiveQuery(() => listBlocks(dayType), [dayType]) ?? [];

  const reset = async (): Promise<void> => {
    if (!window.confirm(t('schedule.resetConfirm'))) return;
    await resetSchedule();
  };

  return (
    <div className="flex flex-col gap-3 px-4 pt-4">
      <header className="px-1">
        <h1 className="text-[1.5rem] text-ink">{t('schedule.title')}</h1>
        <p className="mt-0.5 max-w-prose text-[0.8125rem] leading-snug text-ink-faint">
          {t('schedule.hint')}
        </p>
      </header>

      <div role="tablist" aria-label={t('schedule.title')} className="flex gap-1.5 overflow-x-auto">
        {DAY_TYPES.map((code) => {
          const isActive = code === dayType;
          return (
            <button
              key={code}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setDayType(code)}
              className={[
                'min-h-[40px] shrink-0 rounded-full px-4 py-1.5 font-display text-[0.9375rem] font-bold transition-colors duration-150',
                isActive ? 'bg-blue text-white' : 'bg-sunken text-ink-soft hover:text-ink',
              ].join(' ')}
            >
              {t(`daytype.short.${code}` as TranslationKey)}
            </button>
          );
        })}
      </div>

      <section className="sheet overflow-hidden">
        <header className="flex items-center justify-between border-b border-rule px-4 py-3">
          <Marginalia>{t('schedule.total')}</Marginalia>
          <span className="font-display text-[0.6875rem] tnum text-ink-faint">
            {formatDuration(bookedMinutes(blocks), { hour: t('unit.hour'), min: t('unit.min') })}
          </span>
        </header>
        <ul>
          {blocks.map((block) => (
            <li key={block.id}>
              <button
                type="button"
                onClick={() => setEditing(block)}
                aria-label={t('schedule.tapToEdit')}
                className="group flex w-full items-center gap-3 border-b border-rule px-4 py-3 text-left transition-colors duration-150 hover:bg-sunken"
              >
                <CategoryIcon category={block.category} size={32} />
                <time className="w-[5.25rem] shrink-0 font-display text-[0.75rem] tnum text-ink-faint">
                  {formatRange(block.start, block.end)}
                </time>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] text-ink">
                    {blockTitle(block, t)}
                  </span>
                  <span className="block truncate text-[0.8125rem] text-ink-faint">
                    <span className="font-bold" style={{ color: categoryColor(block.category) }}>
                      {t(`category.${block.category}` as TranslationKey)}
                    </span>
                    {block.isCore ? ` · ${t('today.minimum')}` : ''}
                    {block.isFocus ? ` · ${t('today.focus')}` : ''}
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
                >
                  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2 pb-2">
        <Button variant="ghost" full onClick={() => setEditing(null)}>
          {t('schedule.addBlock')}
        </Button>
        <Button variant="quiet" full onClick={() => void reset()}>
          {t('schedule.reset')}
        </Button>
      </div>

      {editing !== undefined ? (
        <BlockEditor
          block={editing}
          dayType={dayType}
          siblings={blocks}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
    </div>
  );
}
