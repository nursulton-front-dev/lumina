import { useEffect, useState } from 'react';
import type { Profile } from '../../types';
import { bedtimeDrift, isSleepReminderDue } from '../../domain/sleep';
import { fromMinutes, minutesOfDay } from '../../domain/time';
import { Button } from '../../components/ui/Button';
import { Marginalia, Sheet } from '../../components/ui/Sheet';
import { TimeInput } from '../../components/ui/Field';
import { useApp } from '../../state/app-context';
import { addMeasure, setBedtimeActual } from '../../db/repo';
import { readMeta, writeMeta } from '../../db/db';
import { notify } from '../../lib/sound';

/** Режим сна: цель на сегодня, напоминание за полчаса и отметка факта. */
export function SleepPanel({
  profile,
  date,
  now,
  actual,
}: {
  profile: Profile;
  date: string;
  now: Date;
  actual: string | null;
}): React.JSX.Element {
  const { t } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => fromMinutes(minutesOfDay(now)));
  const reminderDue = isSleepReminderDue(profile.sleepTarget, minutesOfDay(now));

  // Напоминание уходит один раз за вечер, а не на каждый тик таймера.
  useEffect(() => {
    if (!reminderDue) return;
    const key = `sleep.notified.${date}`;
    void (async () => {
      if (await readMeta<boolean>(key)) return;
      await writeMeta(key, true);
      notify(t('sleep.title'), t('sleep.reminder'));
    })();
  }, [reminderDue, date, t]);

  const save = async (): Promise<void> => {
    await setBedtimeActual(date, draft);
    await addMeasure(date, 'bedtimeDrift', bedtimeDrift(profile.sleepTarget, draft), null);
    setEditing(false);
  };

  const drift = actual ? bedtimeDrift(profile.sleepTarget, actual) : null;

  return (
    <Sheet accent={reminderDue ? 'terracotta' : 'none'} className="px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <Marginalia>{t('sleep.title')}</Marginalia>
        <span className="font-display text-[1.375rem] font-extrabold tnum text-ink">
          {profile.sleepTarget}
        </span>
      </div>

      {reminderDue ? (
        <p className="mt-1.5 text-[0.875rem] leading-snug text-ink">{t('sleep.reminder')}</p>
      ) : (
        <p className="mt-1 text-[0.8125rem] leading-snug text-ink-faint">{t('sleep.goal')}</p>
      )}

      {actual ? (
        <p className="mt-2 font-display text-[0.8125rem] tnum text-ink-soft">
          {t('sleep.saved', { time: actual, drift: drift ?? 0 })}
        </p>
      ) : editing ? (
        <div className="mt-2 flex items-center gap-2">
          <TimeInput
            className="max-w-[8rem]"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button variant="primary" onClick={() => void save()}>
            {t('common.save')}
          </Button>
          <Button variant="quiet" onClick={() => setEditing(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      ) : (
        <Button variant="ghost" className="mt-2.5" onClick={() => setEditing(true)}>
          {t('sleep.markBedtime')}
        </Button>
      )}
    </Sheet>
  );
}
