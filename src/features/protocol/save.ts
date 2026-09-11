import type { Block, MetricId, Profile } from '../../types';
import type { ResolvedProtocol } from '../../protocols/types';
import { EXERCISE_METRIC } from '../../data/workouts';
import { nextAdjustment } from '../../domain/progression';
import {
  addLog,
  addMeasure,
  addSession,
  adjustmentFor,
  getAdjustments,
  listChecks,
  saveAdjustment,
  saveProfile,
  toggleCheck,
} from '../../db/repo';
import { isMinimumDone } from '../../domain/schedule';
import { setMinDone } from '../../db/repo';
import type { ProtocolResult } from './ProtocolRunner';

/**
 * Итог протокола: сессия, журнал, замеры, пересчёт нагрузки и отметка блока.
 * Всё пишется локально; синхронизация подхватит записи отдельно.
 */
export async function saveProtocolResult(options: {
  date: string;
  block: Block | null;
  blocksOfDay: readonly Block[];
  protocol: ResolvedProtocol;
  result: ProtocolResult;
}): Promise<void> {
  const { date, block, blocksOfDay, protocol, result } = options;

  const landings = protocol.steps.reduce((sum, step) => {
    const outcome = result.outcomes.find((item) => item.stepId === step.id);
    return outcome && !outcome.skipped ? sum + step.landings : sum;
  }, 0);

  await addSession({
    date,
    blockId: block?.id ?? null,
    kind: 'protocol',
    minutes: result.minutes,
    exits: 0,
    broken: false,
    startedAt: new Date(Date.now() - result.minutes * 60_000).toISOString(),
  });

  await addLog(date, protocol.id === 'workout' ? 'workout' : 'protocol', {
    protocolId: protocol.id,
    note: result.note,
    landings,
    outcomes: result.outcomes.map((item) => ({
      stepId: item.stepId,
      skipped: item.skipped,
      setsDone: item.setsDone,
      setsFailed: item.setsFailed,
      value: item.value,
    })),
  });

  const profilePatch: Partial<Profile> = {};

  for (const outcome of result.outcomes) {
    if (outcome.skipped || outcome.value === null || outcome.value <= 0) continue;

    const metric: MetricId | null = outcome.metric ?? EXERCISE_METRIC[outcome.stepId] ?? null;
    if (metric) {
      await addMeasure(date, metric, outcome.value, result.note || null);
      if (metric === 'pullups') profilePatch.maxPullups = outcome.value;
      if (metric === 'pushups') profilePatch.maxPushups = outcome.value;
    }
  }

  const numbersOutcome = result.outcomes.find((item) => item.stepId === 'numbers');
  if (numbersOutcome && !numbersOutcome.skipped && (numbersOutcome.value ?? 0) > 0) {
    await addMeasure(date, 'digits', numbersOutcome.value ?? 0, null);
  }

  if (Object.keys(profilePatch).length > 0) await saveProfile(profilePatch);

  // Два невыполненных подхода подряд снижают нагрузку — состояние живёт между тренировками.
  const adjustments = await getAdjustments();
  for (const outcome of result.outcomes) {
    if (outcome.setsDone === 0 && outcome.setsFailed === 0) continue;
    const previous = adjustmentFor(adjustments, outcome.stepId);
    await saveAdjustment(outcome.stepId, nextAdjustment(previous, outcome.setsFailed > 0));
  }

  if (block) {
    const checks = await listChecks(date);
    if (!checks.some((check) => check.blockId === block.id)) {
      await toggleCheck(date, block.id);
      const updated = await listChecks(date);
      await setMinDone(
        date,
        isMinimumDone(
          blocksOfDay,
          updated.map((check) => check.blockId),
        ),
      );
    }
  }
}
