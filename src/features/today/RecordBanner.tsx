import { useEffect, useState } from 'react';
import type { TranslationKey } from '../../i18n';
import { beatenRecords, type RecordItem } from '../../domain/records';
import { readMeta, writeMeta } from '../../db/db';
import { useApp } from '../../state/app-context';

const SNAPSHOT_KEY = 'records.snapshot';

/** Короткое уведомление о побитом рекорде — с прошлым значением, чтобы разница была видна. */
export function RecordBanner({
  records,
}: {
  records: readonly RecordItem[];
}): React.JSX.Element | null {
  const { t } = useApp();
  const [beaten, setBeaten] = useState<{ id: string; from: number; to: number }[]>([]);

  useEffect(() => {
    if (records.length === 0) return;
    void (async () => {
      const previous = (await readMeta<RecordItem[]>(SNAPSHOT_KEY)) ?? [];
      const changes = beatenRecords(previous, records);
      if (changes.length > 0) setBeaten(changes);
      await writeMeta(SNAPSHOT_KEY, records);
    })();
  }, [records]);

  if (beaten.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1">
      {beaten.map((item) => (
        <li
          key={item.id}
          className="flex items-baseline justify-between gap-3 border-l-[3px] border-done bg-done-wash px-3 py-2"
        >
          <span className="text-[0.875rem] text-ink">
            {t(`record.${item.id}` as TranslationKey)}
          </span>
          <span className="shrink-0 font-mono text-[0.8125rem] tnum text-ink">
            {t('records.beaten', { from: item.from, to: item.to })}
          </span>
        </li>
      ))}
    </ul>
  );
}
