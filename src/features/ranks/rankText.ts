import type { TranslationKey, TranslationVars } from '../../i18n';
import type { PluralBase } from '../../i18n/types';
import type { RankId } from '../../data/ranks';
import type { RankView } from '../../state/useGamification';

type Translate = (key: TranslationKey, vars?: TranslationVars) => string;
type Plural = (base: PluralBase, count: number) => string;

const UNITS: Record<RankId, { primary: PluralBase; second?: PluralBase }> = {
  bar: { primary: 'count.pullup' },
  pushups: { primary: 'count.pushup' },
  abs: { primary: 'count.legRaise' },
  longJump: { primary: 'count.cm' },
  highJump: { primary: 'count.cm' },
  grip: { primary: 'count.second' },
  memory: { primary: 'count.digit' },
  voice: { primary: 'count.filler' },
  ioi: { primary: 'count.task', second: 'count.contest' },
  russian: { primary: 'count.hour', second: 'count.test' },
  english: { primary: 'count.hour', second: 'count.test' },
};

/**
 * «Осталось 1 подтягивание до 3-го юношеского разряда» — человеческая фраза
 * вместо «До «3-й юношеский»: 1». null — шкала закрыта или нет следующей ступени.
 */
export function rankLeftText(rank: RankView, t: Translate, tp: Plural): string | null {
  const { spec, status } = rank;
  const next = status.next;
  if (!next) return null;

  const units = UNITS[spec.id];
  const grade = t(`grade.gen.${next.grade}` as TranslationKey);

  if (spec.lowerIsBetter) {
    return t('ranks.leftMax', { amount: tp(units.primary, next.value), grade });
  }

  const value = rank.hasData ? status.value : 0;
  const parts: string[] = [];
  const primaryLeft = Math.max(0, next.value - value);
  if (primaryLeft > 0) parts.push(tp(units.primary, primaryLeft));

  if (units.second && next.second !== null) {
    const secondLeft = Math.max(0, next.second - (status.second ?? 0));
    if (secondLeft > 0) parts.push(tp(units.second, secondLeft));
  }

  if (parts.length === 0) return null;
  return t('ranks.left', { amount: parts.join(` ${t('ranks.and')} `), grade });
}
