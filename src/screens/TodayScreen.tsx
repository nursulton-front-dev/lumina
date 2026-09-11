import type { TranslationKey } from '../i18n';
import { coreBlocks } from '../domain/schedule';
import { fromISODate, minutesOfDay, toISODate } from '../domain/time';
import { Button } from '../components/ui/Button';
import { EmptyState, Marginalia } from '../components/ui/Sheet';
import { BlockRow, type RowState } from '../features/today/BlockRow';
import { DayTypeChip } from '../features/today/DayTypeChip';
import { ClosestRank, MinimumStrip } from '../features/today/MinimumStrip';
import { QuestsPanel } from '../features/today/QuestsPanel';
import { RecordBanner } from '../features/today/RecordBanner';
import { NowPanel } from '../features/today/NowPanel';
import { SleepPanel } from '../features/today/SleepPanel';
import { navigate } from '../state/router';
import { useApp } from '../state/app-context';
import { useNow } from '../state/useNow';
import { toggleBlockCheck, useDay } from '../state/useDay';
import { useGamification } from '../state/useGamification';
import { useQuests } from '../state/useQuests';
import { closestRank } from '../domain/ranks';
import { blockAdvice, dayVerdict } from '../domain/verdicts';
import { focusStats } from '../domain/pomodoro';
import { eveningMinutes } from '../domain/sleep';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

function rowState(start: number, end: number, now: number): RowState {
  if (now >= end) return 'past';
  if (now >= start) return 'current';
  return 'future';
}

export function TodayScreen(): React.JSX.Element {
  const { t, profile } = useApp();
  const now = useNow();
  const date = toISODate(now);
  const nowMinutes = minutesOfDay(now);
  const day = useDay(date, nowMinutes, profile);
  const game = useGamification(date);
  const quests = useQuests(date, profile?.seasonStart ?? date);
  const sessions =
    useLiveQuery(() => db.sessions.where('date').equals(date).toArray(), [date]) ?? [];

  if (!day) {
    return <p className="px-4 py-10 text-center text-ink-faint">{t('common.loading')}</p>;
  }

  const currentBlock = day.position.current;
  const nearest = game ? closestRank(game.ranks) : null;
  const focus = focusStats(sessions);
  const advice = currentBlock
    ? blockAdvice({
        isFocus: currentBlock.isFocus,
        isCore: currentBlock.isCore,
        category: currentBlock.category,
        brokenToday: focus.broken,
        remaining: day.position.remaining,
      })
    : null;
  const coreLeft = coreBlocks(day.blocks).filter((block) => !day.checked.has(block.id)).length;
  const evening = dayVerdict({
    minimumDone: day.minimumDone,
    coreLeft,
    doneBlocks: day.checked.size,
    totalBlocks: day.blocks.length,
    minutesToBedtime: eveningMinutes(profile?.sleepTarget ?? '23:00') - nowMinutes,
  });
  const weekday = fromISODate(date).getDay();
  const dayNumber = String(fromISODate(date).getDate()).padStart(2, '0');
  const monthNumber = String(fromISODate(date).getMonth() + 1).padStart(2, '0');

  return (
    <div className="flex flex-col gap-3 px-4 pt-4">
      <header className="flex items-baseline justify-between gap-3 px-1">
        <h1 className="flex items-baseline gap-2">
          <span className="text-[1.375rem] text-ink">
            {t(`weekday.${weekday}` as TranslationKey)}
          </span>
          <span className="font-display text-[0.9375rem] tnum text-ink-faint">
            {dayNumber}.{monthNumber}
          </span>
        </h1>
        <DayTypeChip date={date} dayType={day.dayType} overridden={day.overridden} />
      </header>

      <NowPanel
        position={day.position}
        advice={advice ? t(advice.key, advice.vars) : null}
        action={
          currentBlock?.protocolId ? (
            <Button
              variant="primary"
              size="lg"
              full
              onClick={() => navigate({ name: 'protocol', blockId: currentBlock.id })}
            >
              {t('today.start')}
            </Button>
          ) : currentBlock?.isFocus ? (
            <Button
              variant="primary"
              size="lg"
              full
              onClick={() => navigate({ name: 'focus', blockId: currentBlock.id })}
            >
              {t('today.focus')}
            </Button>
          ) : undefined
        }
      />

      {profile ? (
        <SleepPanel profile={profile} date={date} now={now} actual={day.bedtimeActual} />
      ) : null}

      <MinimumStrip
        core={coreBlocks(day.blocks)}
        checked={day.checked}
        streak={game?.streak ?? day.streak}
        done={day.minimumDone}
        shields={game?.shields.count ?? 0}
      />

      {evening ? (
        <p className="px-1 font-display text-[0.8125rem] leading-snug tnum text-ink-soft">
          {t(evening.key, evening.vars)}
        </p>
      ) : null}

      {game ? <RecordBanner records={game.records} /> : null}

      {nearest ? <ClosestRank rank={nearest} /> : null}

      {quests && profile ? (
        <QuestsPanel state={quests} today={date} seasonStart={profile.seasonStart} />
      ) : null}

      <section aria-label={t('today.plan')} className="sheet mt-1 overflow-hidden">
        <header className="flex items-center justify-between border-b border-rule px-4 py-3">
          <Marginalia>{t('today.plan')}</Marginalia>
          <span className="font-display text-[0.8125rem] tnum text-ink-faint">
            {day.checked.size}/{day.blocks.length}
          </span>
        </header>

        {day.blocks.length === 0 ? (
          <EmptyState text={t('today.emptyDay')} icon="clipboard" />
        ) : (
          <div className="relative">
            <ul>
              {day.blocks.map((block) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  state={rowState(block.start, block.end, nowMinutes)}
                  checked={day.checked.has(block.id)}
                  onToggle={() => void toggleBlockCheck(date, block.id, day.blocks)}
                  action={
                    block.protocolId ? (
                      <Button
                        variant="ghost"
                        onClick={() => navigate({ name: 'protocol', blockId: block.id })}
                      >
                        {t('today.start')}
                      </Button>
                    ) : block.isFocus ? (
                      <Button
                        variant="ghost"
                        onClick={() => navigate({ name: 'focus', blockId: block.id })}
                      >
                        {t('today.focus')}
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
