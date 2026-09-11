import { useLiveQuery } from 'dexie-react-hooks';
import type { MetricId } from '../../types';
import type { TranslationKey } from '../../i18n';
import { db } from '../../db/db';
import { Chart } from '../../components/Chart';
import { categoryColor, METRIC_CATEGORY } from '../../data/categories';
import { useApp } from '../../state/app-context';

/** Шаг-разбор: показывает динамику метрики прямо в протоколе, без выхода на другой экран. */
export function MetricChartStep({ metric }: { metric: MetricId }): React.JSX.Element {
  const { t } = useApp();

  const points = useLiveQuery(async () => {
    const rows = await db.measures.where('metric').equals(metric).toArray();
    return rows
      .filter((row) => !row.deleted)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({ date: row.date, value: row.value }));
  }, [metric]);

  if (!points) return <p className="text-ink-faint">{t('common.loading')}</p>;
  if (points.length === 0) {
    return <p className="text-[0.875rem] text-ink-faint">{t('progress.noData')}</p>;
  }

  return (
    <Chart
      points={points}
      label={t(`metric.${metric}` as TranslationKey)}
      unit={t('unit.count')}
      lowerIsBetter
      color={categoryColor(METRIC_CATEGORY[metric])}
      tableLabels={{
        table: t('progress.table'),
        date: t('progress.date'),
        value: t('progress.value'),
      }}
    />
  );
}
