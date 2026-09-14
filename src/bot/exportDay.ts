import type { Block, Profile } from '../types';
import type { TranslationKey } from '../i18n';
import { blockTitle } from '../domain/blockTitle';
import { fromMinutes } from '../domain/time';

/** Формат, который принимает /sync у бота. Дублирует DayExport в bot/src/plan.ts. */
export interface DayExportPayload {
  date: string;
  dayType: string;
  lang: string;
  sleepTarget: string;
  blocks: {
    id: string;
    start: string;
    end: string;
    title: string;
    category: string;
    isCore: boolean;
    remind: boolean;
    done: boolean;
  }[];
}

export function buildDayExport(
  date: string,
  dayType: string,
  blocks: readonly Block[],
  checked: ReadonlySet<string>,
  profile: Profile,
  t: (key: TranslationKey) => string,
): DayExportPayload {
  return {
    date,
    dayType,
    lang: profile.lang,
    sleepTarget: profile.sleepTarget,
    blocks: blocks.map((block) => ({
      id: block.id,
      start: fromMinutes(block.start),
      end: fromMinutes(block.end),
      title: blockTitle(block, t),
      category: block.category,
      isCore: block.isCore,
      remind: block.remind ?? false,
      done: checked.has(block.id),
    })),
  };
}

export function isBotConfigured(profile: Profile | null): boolean {
  return Boolean(profile && profile.botUrl.trim() && profile.botKey.trim());
}

/** Отправка плана боту. Ошибка сети не критична: бот считает план сам. */
export async function postDayExport(profile: Profile, payload: DayExportPayload): Promise<void> {
  const base = profile.botUrl.trim().replace(/\/$/, '');
  const response = await fetch(`${base}/sync`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-sync-key': profile.botKey.trim() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(String(response.status));
}
