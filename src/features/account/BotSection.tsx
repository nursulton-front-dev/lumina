import { useState } from 'react';
import type { Profile } from '../../types';
import { Button } from '../../components/ui/Button';
import { Field, TextInput } from '../../components/ui/Field';
import { useApp } from '../../state/app-context';
import { buildDayExport, isBotConfigured, postDayExport } from '../../bot/exportDay';
import { db } from '../../db/db';
import { listBlocksForDay, listChecks } from '../../db/repo';
import { resolveDayType } from '../../domain/dayType';
import { toISODate } from '../../domain/time';

/** Настройки Telegram-бота: адрес воркера, ключ и ручная отправка плана. */
export function BotSection({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}): React.JSX.Element {
  const { t } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      const date = toISODate(new Date());
      const day = await db.days.where('date').equals(date).first();
      const dayType = resolveDayType(date, day?.typeOverride ?? null, {
        mode: profile.englishMode,
        englishDays: profile.englishDays,
      });
      const [blocks, checks] = await Promise.all([
        listBlocksForDay(dayType, date),
        listChecks(date),
      ]);
      await postDayExport(
        profile,
        buildDayExport(date, dayType, blocks, new Set(checks.map((c) => c.blockId)), profile, t),
      );
      setMessage(t('botSettings.sent', { date }));
    } catch (cause) {
      setMessage(
        t('botSettings.failed', { error: cause instanceof Error ? cause.message : String(cause) }),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[0.8125rem] leading-snug text-ink-faint">{t('botSettings.hint')}</p>
      <Field label={t('botSettings.url')}>
        {(id) => (
          <TextInput
            id={id}
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://lumina-bot.….workers.dev"
            value={profile.botUrl}
            onChange={(event) => onChange({ botUrl: event.target.value })}
          />
        )}
      </Field>
      <Field label={t('botSettings.key')}>
        {(id) => (
          <TextInput
            id={id}
            type="password"
            autoComplete="off"
            value={profile.botKey}
            onChange={(event) => onChange({ botKey: event.target.value })}
          />
        )}
      </Field>
      <Button
        variant="ghost"
        full
        disabled={busy || !isBotConfigured(profile)}
        onClick={() => void send()}
      >
        {t('botSettings.send')}
      </Button>
      {message ? <p className="text-[0.875rem] text-ink">{message}</p> : null}
    </div>
  );
}
