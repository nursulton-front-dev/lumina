import { useLiveQuery } from 'dexie-react-hooks';
import type { TranslationKey } from '../../i18n';
import { addDays, startOfWeek } from '../../domain/time';
import { minutesToHours, DIRECTIONS } from '../../domain/week';
import { weekStats } from '../../state/useQuests';
import { useApp } from '../../state/app-context';

/** Цифры прошедшей недели прямо в протоколе разбора. */
export function WeekStatsStep({
  today,
  seasonStart,
}: {
  today: string;
  seasonStart: string;
}): React.JSX.Element {
  const { t } = useApp();
  const from = startOfWeek(today);

  const stats = useLiveQuery(
    () => weekStats(from, addDays(from, 6), seasonStart),
    [from, seasonStart],
  );

  if (!stats) return <p className="text-ink-faint">{t('common.loading')}</p>;

  const lines: { label: string; value: string }[] = [
    { label: t('review.coreDays'), value: `${stats.coreDays}/7` },
    { label: t('review.clean'), value: String(stats.cleanPomodoro) },
    { label: t('review.landings'), value: String(stats.landings) },
    { label: t('review.digits'), value: String(stats.bestDigits) },
    ...DIRECTIONS.map((direction) => ({
      label: t(`category.${direction}` as TranslationKey),
      value: `${minutesToHours(stats.minutes[direction] ?? 0)} ${t('unit.hour')}`,
    })),
  ];

  return (
    <dl className="flex flex-col gap-1">
      {lines.map((line) => (
        <div
          key={line.label}
          className="flex items-baseline justify-between gap-3 border-b border-dashed border-[color-mix(in_oklab,var(--color-rule)_50%,transparent)] pb-1"
        >
          <dt className="text-[0.875rem] text-ink-soft">{line.label}</dt>
          <dd className="font-mono text-[0.875rem] tnum text-ink">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}
