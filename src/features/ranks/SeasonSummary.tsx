import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { TranslationKey } from '../../i18n';
import type { Profile } from '../../types';
import type { GamificationState } from '../../state/useGamification';
import { db } from '../../db/db';
import { focusStats } from '../../domain/pomodoro';
import { seasonWeek, SEASON_WEEKS } from '../../domain/progression';
import { bestStreak } from '../../domain/streak';
import { addDays, daysBetween } from '../../domain/time';
import { DIRECTIONS, minutesToHours } from '../../domain/week';
import { Button } from '../../components/ui/Button';
import { Marginalia } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';
import { saveSeasonImage } from '../../lib/seasonImage';

/** Итоги четырёхнедельного сезона: разряды, часы, чистота фокуса, лучшая серия. */
export function SeasonSummary({
  profile,
  today,
  state,
}: {
  profile: Profile;
  today: string;
  state: GamificationState;
}): React.JSX.Element {
  const { t, lang } = useApp();
  const [busy, setBusy] = useState(false);

  const week = seasonWeek(profile.seasonStart, today);
  const seasonsPassed = Math.floor(
    Math.max(0, daysBetween(profile.seasonStart, today)) / (SEASON_WEEKS * 7),
  );
  const from = addDays(profile.seasonStart, seasonsPassed * SEASON_WEEKS * 7);
  const to = addDays(from, SEASON_WEEKS * 7 - 1);

  const season = useLiveQuery(async () => {
    const [checks, blocks, sessions, days] = await Promise.all([
      db.checks.where('date').between(from, to, true, true).toArray(),
      db.blocks.toArray(),
      db.sessions.where('date').between(from, to, true, true).toArray(),
      db.days.where('date').between(from, to, true, true).toArray(),
    ]);
    const blockById = new Map(blocks.map((block) => [block.id, block]));
    const hours = new Map<string, number>();
    for (const check of checks) {
      if (check.deleted) continue;
      const block = blockById.get(check.blockId);
      if (!block) continue;
      hours.set(block.category, (hours.get(block.category) ?? 0) + (block.end - block.start));
    }
    return {
      hours,
      focus: focusStats(sessions),
      streak: bestStreak(days.filter((day) => day.minDone).map((day) => day.date)),
    };
  }, [from, to]);

  if (!season) return <p className="px-3 text-ink-faint">{t('common.loading')}</p>;

  const purity =
    season.focus.clean + season.focus.broken === 0
      ? 0
      : Math.round((season.focus.clean / (season.focus.clean + season.focus.broken)) * 100);

  const taken = state.ranks.filter((rank) => rank.status.grade !== null);

  const lines = [
    ...DIRECTIONS.map((direction) => ({
      label: t(`category.${direction}` as TranslationKey),
      value: `${minutesToHours(season.hours.get(direction) ?? 0)} ${t('unit.hour')}`,
    })),
    { label: t('season.focus'), value: `${purity}%` },
    { label: t('season.bestStreak'), value: String(season.streak) },
  ];

  const download = async (): Promise<void> => {
    setBusy(true);
    try {
      await saveSeasonImage(
        {
          title: t('season.title'),
          period: t('season.period', { from, to }),
          lines,
          ranks: taken.map((rank) => ({
            name: t(`rank.${rank.spec.id}` as TranslationKey),
            grade: rank.status.grade ? t(`grade.short.${rank.status.grade}` as TranslationKey) : '',
          })),
          footer: `${t('app.name')} · ${lang}`,
        },
        `season-${from}.png`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="sheet px-3 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <Marginalia>{t('season.title')}</Marginalia>
        <span className="font-mono text-[0.75rem] tnum text-ink-faint">
          {t('season.week', { n: week })}
        </span>
      </div>

      <p className="mt-1 font-mono text-[0.75rem] tnum text-ink-faint">
        {t('season.period', { from, to })}
      </p>

      <dl className="mt-2.5 flex flex-col gap-1">
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

      <Button variant="ghost" full className="mt-3" disabled={busy} onClick={() => void download()}>
        {t('season.save')}
      </Button>
    </section>
  );
}
