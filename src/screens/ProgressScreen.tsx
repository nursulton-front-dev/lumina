import { useLiveQuery } from 'dexie-react-hooks';
import type { MetricId } from '../types';
import type { TranslationKey } from '../i18n';
import { db } from '../db/db';
import { Chart, type ChartPoint } from '../components/Chart';
import { EmptyState, Marginalia } from '../components/ui/Sheet';
import { useApp } from '../state/app-context';
import { useGamification } from '../state/useGamification';
import { RanksSection } from '../features/ranks/RanksSection';
import { RecordsShelf } from '../features/ranks/RecordsShelf';
import { SeasonSummary } from '../features/ranks/SeasonSummary';
import { toISODate } from '../domain/time';

interface MetricSpec {
  id: MetricId;
  unitKey: TranslationKey;
  lowerIsBetter?: boolean;
}

const METRICS: MetricSpec[] = [
  { id: 'pullups', unitKey: 'unit.reps' },
  { id: 'pushups', unitKey: 'unit.reps' },
  { id: 'legRaises', unitKey: 'unit.reps' },
  { id: 'longJump', unitKey: 'unit.cm' },
  { id: 'verticalJump', unitKey: 'unit.cm' },
  { id: 'towelHang', unitKey: 'unit.sec' },
  { id: 'digits', unitKey: 'unit.count' },
  { id: 'fillers', unitKey: 'unit.count', lowerIsBetter: true },
  { id: 'bedtimeDrift', unitKey: 'unit.min', lowerIsBetter: true },
];

export function ProgressScreen(): React.JSX.Element {
  const { t, profile } = useApp();
  const today = toISODate(new Date());
  const game = useGamification(today);

  const series = useLiveQuery(async () => {
    const rows = await db.measures.toArray();
    const grouped = new Map<MetricId, ChartPoint[]>();
    for (const row of rows) {
      if (row.deleted) continue;
      const list = grouped.get(row.metric) ?? [];
      list.push({ date: row.date, value: row.value });
      grouped.set(row.metric, list);
    }
    for (const list of grouped.values()) list.sort((a, b) => a.date.localeCompare(b.date));
    return grouped;
  }, []);

  if (!series)
    return <p className="px-4 py-10 text-center text-ink-faint">{t('common.loading')}</p>;

  const filled = METRICS.filter((metric) => (series.get(metric.id)?.length ?? 0) > 0);

  return (
    <div className="flex flex-col gap-3 px-4 pt-4">
      <header className="px-1">
        <h1 className="text-[1.5rem] text-ink">{t('progress.title')}</h1>
      </header>

      {game ? <RanksSection state={game} /> : null}
      {game ? <RecordsShelf records={game.records} shields={game.shields} /> : null}
      {game && profile ? <SeasonSummary profile={profile} today={today} state={game} /> : null}

      {filled.length === 0 ? (
        <div className="sheet">
          <EmptyState text={t('progress.noData')} icon="chart" />
        </div>
      ) : null}

      {filled.map((metric) => {
        const points = series.get(metric.id) ?? [];
        const values = points.map((point) => point.value);
        const best = metric.lowerIsBetter ? Math.min(...values) : Math.max(...values);
        const latest = points.at(-1)?.value ?? 0;
        const unit = t(metric.unitKey);

        return (
          <section key={metric.id} className="sheet px-4 pt-4 pb-2">
            <header className="flex items-baseline justify-between gap-3">
              <h2 className="text-[0.9375rem] font-semibold text-ink">
                {t(`metric.${metric.id}` as TranslationKey)}
              </h2>
              <span className="font-display text-[0.6875rem] tnum text-ink-faint">
                {t('progress.entries')}: {points.length}
              </span>
            </header>

            <div className="mt-1 flex items-baseline gap-5">
              <p>
                <Marginalia>{t('progress.latest')}</Marginalia>
                <span className="ml-2 font-display text-[1.5rem] leading-none tnum text-ink">
                  {latest}
                </span>
                <span className="ml-1 font-display text-[0.75rem] text-ink-faint">{unit}</span>
              </p>
              <p>
                <Marginalia>{t('progress.best')}</Marginalia>
                <span className="ml-2 font-display text-[1rem] tnum text-done">{best}</span>
              </p>
            </div>

            <div className="mt-1">
              <Chart
                points={points}
                label={t(`metric.${metric.id}` as TranslationKey)}
                unit={unit}
                lowerIsBetter={metric.lowerIsBetter}
                tableLabels={{
                  table: t('progress.table'),
                  date: t('progress.date'),
                  value: t('progress.value'),
                }}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
