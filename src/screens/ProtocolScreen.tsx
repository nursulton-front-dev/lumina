import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  adjustmentFactors,
  getAdjustments,
  isMaxTestDue,
  listBlocksForDay,
  weeklyLandings,
} from '../db/repo';
import { daysUntilDeload, isDeloadWeek } from '../domain/progression';
import { resolveDayType } from '../domain/dayType';
import { daysBetween, fromISODate, toISODate } from '../domain/time';
import { resolveProtocol } from '../protocols/registry';
import type { ProtocolStep } from '../protocols/types';
import { pickRandom, tongueTwistersFor, topicsFor } from '../data/speech';
import { ProtocolRunner, type ProtocolResult } from '../features/protocol/ProtocolRunner';
import { saveProtocolResult } from '../features/protocol/save';
import { useApp } from '../state/app-context';
import { dayTypeRule } from '../state/useDay';
import { navigate } from '../state/router';

/** Загружает всё, что нужно протоколу: блок, контекст прогрессии, расписание дня. */
export function ProtocolScreen({ blockId }: { blockId: string }): React.JSX.Element {
  const { t, profile } = useApp();
  const date = toISODate(new Date());

  const data = useLiveQuery(async () => {
    if (!profile) return null;
    const block = (await db.blocks.get(blockId)) ?? null;
    const day = await db.days.where('date').equals(date).first();
    const dayType = resolveDayType(date, day?.typeOverride ?? null, dayTypeRule(profile));
    const [adjustments, landings, maxTestDue, blocksOfDay] = await Promise.all([
      getAdjustments(),
      weeklyLandings(date),
      isMaxTestDue('pullups', date),
      listBlocksForDay(dayType, date),
    ]);
    return { block, adjustments, landings, maxTestDue, blocksOfDay };
  }, [blockId, date, profile?.id, profile?.updatedAt]);

  if (!profile || data === undefined) {
    return <p className="px-4 py-10 text-center text-ink-faint">{t('common.loading')}</p>;
  }

  const protocolId = data?.block?.protocolId ?? null;
  const protocol = protocolId
    ? resolveProtocol(protocolId, {
        date,
        weekday: fromISODate(date).getDay(),
        profile,
        deload: isDeloadWeek(profile.seasonStart, date),
        daysUntilDeload: daysUntilDeload(profile.seasonStart, date),
        adjustments: adjustmentFactors(data?.adjustments ?? {}),
        maxTestDue: data?.maxTestDue ?? true,
        weeklyLandings: data?.landings ?? 0,
        weeksTrained: Math.floor(Math.max(0, daysBetween(profile.seasonStart, date)) / 7),
      })
    : null;

  if (!protocol || !data) {
    navigate({ name: 'today' });
    return <p className="px-4 py-10 text-center text-ink-faint">{t('common.loading')}</p>;
  }

  const finish = async (result: ProtocolResult): Promise<void> => {
    await saveProtocolResult({
      date,
      block: data.block,
      blocksOfDay: data.blocksOfDay,
      protocol,
      result,
    });
    navigate({ name: 'today' });
  };

  /** Новые скороговорки и темы берутся из того же файла данных, что и при сборке протокола. */
  const reshuffle = (step: ProtocolStep): string[] => {
    if (step.id === 'twisters') return pickRandom(tongueTwistersFor(profile.lang), 3);
    if (step.id === 'improv') return pickRandom(topicsFor(profile.lang), 1);
    return step.texts;
  };

  return (
    <ProtocolRunner
      protocol={protocol}
      onFinish={(result) => void finish(result)}
      onExit={() => navigate({ name: 'today' })}
      onReshuffle={reshuffle}
      today={date}
      seasonStart={profile.seasonStart}
    />
  );
}
