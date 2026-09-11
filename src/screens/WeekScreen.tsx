import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { TranslationKey } from '../i18n';
import { db } from '../db/db';
import { listBlocksForDay, listChecks } from '../db/repo';
import { resolveDayType } from '../domain/dayType';
import { focusStats } from '../domain/pomodoro';
import { isMinimumDone } from '../domain/schedule';
import { addDays, fromISODate, startOfWeek, toISODate } from '../domain/time';
import {
  DIRECTIONS,
  dayTotals,
  mergeTotals,
  minutesToHours,
  type CategoryMinutes,
} from '../domain/week';
import { Button } from '../components/ui/Button';
import { Marginalia } from '../components/ui/Sheet';
import { useApp } from '../state/app-context';
import { dayTypeRule } from '../state/useDay';

interface DayCell {
  date: string;
  weekday: number;
  minimumDone: boolean;
  plan: CategoryMinutes;
  fact: CategoryMinutes;
}

export function WeekScreen(): React.JSX.Element {
  const { t, profile } = useApp();
  const [offset, setOffset] = useState(0);
  const monday = addDays(startOfWeek(toISODate(new Date())), offset * 7);
  const rule = dayTypeRule(profile);

  const week = useLiveQuery(async () => {
    const dates = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
    const cells: DayCell[] = [];
    for (const date of dates) {
      const day = await db.days.where('date').equals(date).first();
      const dayType = resolveDayType(date, day?.typeOverride ?? null, rule);
      const [blocks, checks] = await Promise.all([
        listBlocksForDay(dayType, date),
        listChecks(date),
      ]);
      const checked = new Set(checks.map((check) => check.blockId));
      const totals = dayTotals(blocks, checked);
      cells.push({
        date,
        weekday: fromISODate(date).getDay(),
        minimumDone: isMinimumDone(blocks, [...checked]),
        plan: totals.plan,
        fact: totals.fact,
      });
    }
    const sessions = await db.sessions
      .where('date')
      .between(monday, addDays(monday, 6), true, true)
      .toArray();
    return { cells, focus: focusStats(sessions) };
  }, [monday, rule.mode, rule.englishDays.join(',')]);

  if (!week) return <p className="px-4 py-10 text-center text-ink-faint">{t('common.loading')}</p>;

  const plan = mergeTotals(week.cells.map((cell) => cell.plan));
  const fact = mergeTotals(week.cells.map((cell) => cell.fact));
  const doneDays = week.cells.filter((cell) => cell.minimumDone).length;
  const range = `${monday.slice(8)}.${monday.slice(5, 7)} – ${addDays(monday, 6).slice(8)}.${addDays(monday, 6).slice(5, 7)}`;

  return (
    <div className="flex flex-col gap-3 px-3 pt-3">
      <header className="flex items-baseline justify-between gap-3 px-1">
        <h1 className="text-[1.25rem] font-semibold text-ink">{t('week.title')}</h1>
        <span className="font-mono text-[0.8125rem] tnum text-ink-faint">{range}</span>
      </header>

      <div className="flex items-center gap-1">
        <Button
          variant="quiet"
          aria-label={t('week.prev')}
          onClick={() => setOffset((current) => current - 1)}
        >
          <span aria-hidden="true">←</span>
        </Button>
        <span className="flex-1 text-center font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-faint">
          {offset === 0 ? t('week.current') : range}
        </span>
        <Button
          variant="quiet"
          aria-label={t('week.next')}
          disabled={offset >= 0}
          onClick={() => setOffset((current) => current + 1)}
        >
          <span aria-hidden="true">→</span>
        </Button>
      </div>

      <section className="sheet px-3 py-3">
        <div className="flex items-baseline justify-between">
          <Marginalia>{t('week.minimum')}</Marginalia>
          <span className="font-mono text-[0.8125rem] tnum text-ink">{doneDays}/7</span>
        </div>
        <ul className="mt-2.5 grid grid-cols-7 gap-1">
          {week.cells.map((cell) => (
            <li key={cell.date} className="flex flex-col items-center gap-1">
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint">
                {t(`weekday.short.${cell.weekday}` as TranslationKey)}
              </span>
              <span
                className={[
                  'grid aspect-square w-full place-items-center border font-mono text-[0.75rem] tnum transition-colors',
                  cell.minimumDone
                    ? 'border-done bg-done-wash text-done'
                    : 'border-rule text-ink-faint',
                ].join(' ')}
              >
                {cell.date.slice(8)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sheet px-3 py-3">
        <Marginalia>{t('week.hours')}</Marginalia>
        <ul className="mt-2.5 flex flex-col gap-2.5">
          {DIRECTIONS.map((category) => {
            const planned = plan[category] ?? 0;
            const actual = fact[category] ?? 0;
            const share = planned === 0 ? 0 : Math.min(1, actual / planned);
            return (
              <li key={category}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.875rem] text-ink">
                    {t(`category.${category}` as TranslationKey)}
                  </span>
                  <span className="font-mono text-[0.75rem] tnum text-ink-faint">
                    <span className="text-ink">{minutesToHours(actual)}</span>
                    {' / '}
                    {minutesToHours(planned)} {t('unit.hour')}
                  </span>
                </div>
                <div className="relative mt-1 h-2 border-b border-rule">
                  <div
                    className="absolute bottom-0 left-0 h-[3px] bg-ink transition-[width] duration-500 ease-[var(--ease-paper)]"
                    style={{ width: `${share * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sheet px-3 py-3">
        <Marginalia>{t('week.focusSummary')}</Marginalia>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.8125rem] tnum">
          <div className="flex gap-2">
            <dt className="text-ink-faint">{t('focus.clean')}</dt>
            <dd className="text-done">{week.focus.clean}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-faint">{t('focus.broken')}</dt>
            <dd className="text-terracotta">{week.focus.broken}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-faint">{t('focus.exits')}</dt>
            <dd className="text-ink">{week.focus.exits}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-faint">{t('focus.minutes')}</dt>
            <dd className="text-ink">{week.focus.minutes}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
