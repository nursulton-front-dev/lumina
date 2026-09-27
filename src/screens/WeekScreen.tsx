import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { TranslationKey } from '../i18n';
import type { Block, DayTypeCode } from '../types';
import { db } from '../db/db';
import { listBlocksForDay, listChecks, toggleCheck } from '../db/repo';
import { resolveDayType } from '../domain/dayType';
import { focusStats } from '../domain/pomodoro';
import { isMinimumDone } from '../domain/schedule';
import { addDays, formatRange, fromISODate, startOfWeek, toISODate } from '../domain/time';
import {
  DIRECTIONS,
  dayTotals,
  mergeTotals,
  minutesToHours,
  type CategoryMinutes,
} from '../domain/week';
import { Button } from '../components/ui/Button';
import { Marginalia } from '../components/ui/Sheet';
import { categoryColor } from '../data/categories';
import { useApp } from '../state/app-context';
import { dayTypeRule } from '../state/useDay';

interface DayCell {
  date: string;
  weekday: number;
  dayType: DayTypeCode;
  minimumDone: boolean;
  started: boolean;
  blocks: Block[];
  checkedBlockIds: Set<string>;
  plan: CategoryMinutes;
  fact: CategoryMinutes;
  mainMissionKey: TranslationKey;
  gamesUnlocked: boolean;
  totalPomodoros: number;
  donePomodoros: number;
}

function dayMissionKey(dayType: DayTypeCode): TranslationKey {
  switch (dayType) {
    case 'odd':
      return 'mission.odd';
    case 'even':
      return 'mission.even';
    case 'fri':
      return 'mission.fri';
    case 'sat':
      return 'mission.sat';
    case 'sun':
      return 'mission.sun';
  }
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
      const checkedBlockIds = new Set(checks.map((check) => check.blockId));
      const totals = dayTotals(blocks, checkedBlockIds);
      const weekday = fromISODate(date).getDay();

      const hasHw = blocks.some((b) => b.category === 'homework');
      const hwDone = !hasHw || blocks.some((b) => b.category === 'homework' && checkedBlockIds.has(b.id));
      const hasIoi = blocks.some((b) => b.category === 'ioi');
      const ioiDone = !hasIoi || blocks.some((b) => b.category === 'ioi' && checkedBlockIds.has(b.id));
      const gamesUnlocked = dayType === 'sun' || (hwDone && ioiDone);

      let totalPomodoros = 0;
      let donePomodoros = 0;
      for (const b of blocks) {
        const count = b.pomodoros ?? 0;
        totalPomodoros += count;
        if (checkedBlockIds.has(b.id)) {
          donePomodoros += count;
        }
      }

      cells.push({
        date,
        weekday,
        dayType,
        minimumDone: isMinimumDone(blocks, [...checkedBlockIds]),
        started: checkedBlockIds.size > 0,
        blocks,
        checkedBlockIds,
        plan: totals.plan,
        fact: totals.fact,
        mainMissionKey: dayMissionKey(dayType),
        gamesUnlocked,
        totalPomodoros,
        donePomodoros,
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

  // Расчёт недельного прогресса по ключевым целям
  let ioiLessonDone = 0;
  let ioiProblemsDone = 0;
  let russianDays = 0;
  let englishDays = 0;
  let homeworkDays = 0;
  let selfStudyDays = 0;
  let fictionDays = 0;
  let memoryDays = 0;
  let freelancePomodoros = 0;
  let oratoryDone = 0;

  for (const cell of week.cells) {
    const { blocks, checkedBlockIds } = cell;
    if (blocks.some((b) => b.titleKey === 'block.ioiLesson' && checkedBlockIds.has(b.id))) ioiLessonDone++;
    if (blocks.some((b) => b.titleKey === 'block.ioiProblems' && checkedBlockIds.has(b.id))) ioiProblemsDone++;
    if (blocks.some((b) => b.category === 'russian' && checkedBlockIds.has(b.id))) russianDays++;
    if (blocks.some((b) => b.category === 'english' && checkedBlockIds.has(b.id))) englishDays++;
    if (blocks.some((b) => b.category === 'homework' && checkedBlockIds.has(b.id))) homeworkDays++;
    if (blocks.some((b) => b.titleKey === 'block.selfStudy' && checkedBlockIds.has(b.id))) selfStudyDays++;
    if (blocks.some((b) => b.titleKey === 'block.fiction' && checkedBlockIds.has(b.id))) fictionDays++;
    if (blocks.some((b) => b.category === 'memory' && checkedBlockIds.has(b.id))) memoryDays++;
    if (blocks.some((b) => b.titleKey === 'block.oratory' && checkedBlockIds.has(b.id))) oratoryDone++;

    for (const b of blocks) {
      if (b.category === 'freelance' && checkedBlockIds.has(b.id)) {
        freelancePomodoros += b.pomodoros ?? 0;
      }
    }
  }

  const totalPoints = 3 + 3 + 3 + 7 + 5 + 7 + 7 + 5 + 11 + 1;
  const earnedPoints =
    Math.min(3, ioiLessonDone) +
    Math.min(3, ioiProblemsDone) +
    Math.min(3, russianDays) +
    Math.min(7, englishDays) +
    Math.min(5, homeworkDays) +
    Math.min(7, selfStudyDays) +
    Math.min(7, fictionDays) +
    Math.min(5, memoryDays) +
    Math.min(11, freelancePomodoros) +
    Math.min(1, oratoryDone);

  const overallProgress = Math.round((earnedPoints / totalPoints) * 100);

  const handleToggleBlock = async (date: string, blockId: string) => {
    await toggleCheck(date, blockId);
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-12 pt-4">
      <header className="flex items-baseline justify-between gap-3 px-1">
        <h1 className="text-[1.5rem] text-ink">{t('week.title')}</h1>
        <span className="font-display text-[0.8125rem] tnum text-ink-faint">{range}</span>
      </header>

      {/* Навигация по неделям */}
      <div className="flex items-center gap-1">
        <Button
          variant="quiet"
          aria-label={t('week.prev')}
          onClick={() => setOffset((current) => current - 1)}
        >
          <span aria-hidden="true">←</span>
        </Button>
        <span className="flex-1 text-center font-display text-[0.75rem] uppercase tracking-[0.12em] text-ink-faint">
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

      {/* Карточка Недельного Прогресса */}
      <section className="sheet px-5 py-4">
        <div className="flex items-baseline justify-between">
          <Marginalia>{t('week.progressTitle')}</Marginalia>
          <span className="font-display text-[1.125rem] font-medium tnum text-done">
            {overallProgress}%
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-done transition-[width] duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2 font-display text-[0.75rem] tnum sm:grid-cols-3">
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetIoiLesson')}</span>
            <span className="text-ink">{ioiLessonDone}/3</span>
          </div>
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetIoiProblems')}</span>
            <span className="text-ink">{ioiProblemsDone}/3</span>
          </div>
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetRussian')}</span>
            <span className="text-ink">{russianDays}/3</span>
          </div>
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetEnglish')}</span>
            <span className="text-ink">{englishDays}/7</span>
          </div>
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetHomework')}</span>
            <span className="text-ink">{homeworkDays}/5</span>
          </div>
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetSelfStudy')}</span>
            <span className="text-ink">{selfStudyDays}/7</span>
          </div>
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetFiction')}</span>
            <span className="text-ink">{fictionDays}/7</span>
          </div>
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetMemory')}</span>
            <span className="text-ink">{memoryDays}/5</span>
          </div>
          <div className="flex justify-between rounded-lg bg-raised px-2.5 py-1.5">
            <span className="text-ink-faint">{t('week.targetFreelance')}</span>
            <span className="text-ink">{freelancePomodoros}/11</span>
          </div>
        </div>
      </section>

      {/* Минимум недели (Календарь серии) */}
      <section className="sheet px-5 py-4">
        <div className="flex items-baseline justify-between">
          <Marginalia>{t('week.minimum')}</Marginalia>
          <span className="font-display text-[0.8125rem] tnum text-ink">{doneDays}/7</span>
        </div>
        <ul className="mt-2.5 grid grid-cols-7 gap-1">
          {week.cells.map((cell) => (
            <li key={cell.date} className="flex flex-col items-center gap-1">
              <span className="font-display text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint">
                {t(`weekday.short.${cell.weekday}` as TranslationKey)}
              </span>
              <span
                className={[
                  'grid aspect-square w-full place-items-center rounded-full font-display text-[0.8125rem] tnum transition-colors',
                  cell.minimumDone
                    ? 'bg-done text-white'
                    : cell.started
                      ? 'border-[3px] border-ochre bg-raised text-ink'
                      : 'bg-sunken text-ink-faint',
                ].join(' ')}
              >
                {cell.date.slice(8)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Список карточек по дням недели */}
      <div className="flex flex-col gap-4">
        {week.cells.map((cell) => {
          const isSunday = cell.weekday === 0;
          return (
            <section
              key={cell.date}
              className={[
                'sheet px-4 py-3.5 transition-shadow',
                isSunday ? 'border-2 border-ochre/40 bg-ochre/5' : '',
              ].join(' ')}
            >
              {/* Шапка карточки дня */}
              <div className="flex flex-col gap-1.5 border-b border-sunken pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-[1.0625rem] font-medium text-ink">
                      {t(`weekday.${cell.weekday}` as TranslationKey)}, {cell.date.slice(8)}.{cell.date.slice(5, 7)}
                    </h2>
                    {isSunday ? (
                      <span className="rounded-md bg-ochre/20 px-2 py-0.5 font-display text-[0.6875rem] uppercase tracking-[0.08em] text-ochre">
                        {t('week.restDayTag')}
                      </span>
                    ) : (
                      <span className="font-display text-[0.75rem] text-ink-faint">
                        • {t(`daytype.short.${cell.dayType}` as TranslationKey)}
                      </span>
                    )}
                  </div>
                  {cell.totalPomodoros > 0 && (
                    <span className="font-display text-[0.75rem] tnum text-ink-faint">
                      🍅 {cell.donePomodoros}/{cell.totalPomodoros}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <span className="flex items-center gap-1 text-[0.8125rem] text-ochre">
                    <span>⭐</span>
                    <span className="font-medium">{t(cell.mainMissionKey)}</span>
                  </span>

                  <span
                    className={[
                      'rounded-full px-2.5 py-0.5 font-display text-[0.6875rem]',
                      cell.gamesUnlocked
                        ? 'bg-done/15 text-done'
                        : 'bg-terracotta/15 text-terracotta',
                    ].join(' ')}
                  >
                    {cell.gamesUnlocked ? t('games.unlocked') : t('games.locked')}
                  </span>
                </div>
              </div>

              {/* Список блоков дня */}
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {cell.blocks.map((block) => {
                  const isChecked = cell.checkedBlockIds.has(block.id);
                  const title = block.title ?? (block.titleKey ? t(block.titleKey) : '');
                  const color = categoryColor(block.category);

                  return (
                    <li
                      key={block.id}
                      onClick={() => handleToggleBlock(cell.date, block.id)}
                      className={[
                        'flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-raised/80',
                        block.optional ? 'border border-dashed border-ink-faint/30 opacity-75' : '',
                        isChecked ? 'bg-raised/40 opacity-60 line-through' : 'bg-raised/20',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Чекбокс */}
                        <span
                          className={[
                            'grid size-4 shrink-0 place-items-center rounded border transition-colors',
                            isChecked ? 'border-done bg-done text-white' : 'border-ink-faint/40 bg-surface',
                          ].join(' ')}
                        >
                          {isChecked && <span className="text-[0.625rem] leading-none">✓</span>}
                        </span>

                        {/* Время */}
                        <span className="shrink-0 font-display text-[0.75rem] tnum text-ink-faint">
                          {formatRange(block.start, block.end)}
                        </span>

                        {/* Категория цветная точка */}
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: color }}
                          aria-hidden="true"
                        />

                        {/* Название блока */}
                        <span className="truncate text-[0.875rem] text-ink">
                          {title}
                        </span>
                      </div>

                      {/* Правые бэджи: Pomodoro, Core, Optional */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        {block.isCore && (
                          <span
                            title={t('today.minimum')}
                            className="text-[0.75rem]"
                            aria-label={t('today.minimum')}
                          >
                            🔥
                          </span>
                        )}
                        {(block.pomodoros ?? 0) > 0 && (
                          <span className="rounded bg-sunken px-1.5 py-0.5 font-display text-[0.6875rem] tnum text-ink-faint">
                            🍅 {block.pomodoros}
                          </span>
                        )}
                        {block.optional && (
                          <span className="rounded bg-sunken/60 px-1.5 py-0.5 font-display text-[0.625rem] uppercase tracking-[0.05em] text-ink-faint">
                            {t('block.optional')}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Часы по направлениям */}
      <section className="sheet px-5 py-4">
        <Marginalia>{t('week.hours')}</Marginalia>
        <ul className="mt-2.5 flex flex-col gap-2.5">
          {DIRECTIONS.map((category) => {
            const planned = plan[category] ?? 0;
            const actual = fact[category] ?? 0;
            const share = planned === 0 ? 0 : Math.min(1, actual / planned);
            return (
              <li key={category}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-[0.9375rem] text-ink">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
                      style={{ background: categoryColor(category) }}
                    />
                    {t(`category.${category}` as TranslationKey)}
                  </span>
                  <span className="font-display text-[0.75rem] tnum text-ink-faint">
                    <span className="text-ink">{minutesToHours(actual)}</span>
                    {' / '}
                    {minutesToHours(planned)} {t('unit.hour')}
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-sunken">
                  <div
                    className="h-full rounded-full transition-[width] duration-300 ease-out"
                    style={{ width: `${share * 100}%`, background: categoryColor(category) }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Статистика фокуса за неделю */}
      <section className="sheet px-5 py-4">
        <Marginalia>{t('week.focusSummary')}</Marginalia>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-display text-[0.8125rem] tnum">
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
