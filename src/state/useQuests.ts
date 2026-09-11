import { useLiveQuery } from 'dexie-react-hooks';
import type { Category } from '../types';
import { proposeQuests, questShare, type Quest, type WeekStats } from '../domain/quests';
import { db, readMeta, writeMeta } from '../db/db';
import { addDays, daysBetween, startOfWeek } from '../domain/time';

function questsKey(weekStart: string): string {
  return `quests.${weekStart}`;
}

export interface QuestProgress {
  quest: Quest;
  progress: number;
  share: number;
  done: boolean;
}

export interface QuestsState {
  weekStart: string;
  quests: QuestProgress[];
}

/** Считает недельные показатели: они же служат и прогрессом квестов, и основой для новых. */
export async function weekStats(from: string, to: string, seasonStart: string): Promise<WeekStats> {
  const [logs, sessions, measures, days, checks, blocks] = await Promise.all([
    db.logs.where('date').between(from, to, true, true).toArray(),
    db.sessions.where('date').between(from, to, true, true).toArray(),
    db.measures.where('date').between(from, to, true, true).toArray(),
    db.days.where('date').between(from, to, true, true).toArray(),
    db.checks.where('date').between(from, to, true, true).toArray(),
    db.blocks.toArray(),
  ]);

  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const minutes: Partial<Record<Category, number>> = {};
  for (const check of checks) {
    if (check.deleted) continue;
    const block = blockById.get(check.blockId);
    if (!block) continue;
    minutes[block.category] = (minutes[block.category] ?? 0) + (block.end - block.start);
  }

  return {
    landings: logs.reduce(
      (sum, log) => sum + (log.kind === 'workout' ? Number(log.payload.landings ?? 0) : 0),
      0,
    ),
    cleanPomodoro: sessions.filter((s) => s.kind === 'pomodoro' && !s.broken).length,
    bestDigits: measures
      .filter((row) => row.metric === 'digits')
      .reduce((max, row) => Math.max(max, row.value), 0),
    coreDays: days.filter((day) => day.minDone).length,
    minutes,
    weeksTrained: Math.floor(Math.max(0, daysBetween(seasonStart, from)) / 7),
  };
}

function progressOf(quest: Quest, stats: WeekStats): number {
  switch (quest.kind) {
    case 'landings':
      return stats.landings;
    case 'cleanPomodoro':
      return stats.cleanPomodoro;
    case 'digits':
      return stats.bestDigits;
    case 'coreDays':
      return stats.coreDays;
    case 'hours':
      return Math.floor((stats.minutes[quest.category ?? 'ioi'] ?? 0) / 60);
  }
}

/** Квесты текущей недели вместе с прогрессом по каждому. */
export function useQuests(todayIso: string, seasonStart: string): QuestsState | null {
  return (
    useLiveQuery(async () => {
      const weekStart = startOfWeek(todayIso);
      const stored = (await readMeta<Quest[]>(questsKey(weekStart))) ?? [];
      const stats = await weekStats(weekStart, addDays(weekStart, 6), seasonStart);
      return {
        weekStart,
        quests: stored.map((quest) => {
          const progress = progressOf(quest, stats);
          return {
            quest,
            progress,
            share: questShare(quest, progress),
            done: progress >= quest.target,
          };
        }),
      };
    }, [todayIso, seasonStart]) ?? null
  );
}

/** Собирает квесты по цифрам прошлой недели и сохраняет их на текущую. */
export async function generateQuests(todayIso: string, seasonStart: string): Promise<Quest[]> {
  const weekStart = startOfWeek(todayIso);
  const previousStart = addDays(weekStart, -7);
  const stats = await weekStats(previousStart, addDays(previousStart, 6), seasonStart);
  const quests = proposeQuests(stats);
  await writeMeta(questsKey(weekStart), quests);
  return quests;
}

export async function saveQuests(weekStart: string, quests: Quest[]): Promise<void> {
  await writeMeta(questsKey(weekStart), quests);
}
