import { useRef, useState } from 'react';
import type { EnglishMode, Lang, ThemeMode } from '../types';
import { LANGS, type TranslationKey } from '../i18n';
import { Button } from '../components/ui/Button';
import { Field, NumberInput, Select, TextInput, TimeInput, Toggle } from '../components/ui/Field';
import { Marginalia } from '../components/ui/Sheet';
import { useApp } from '../state/app-context';
import { exportAll, importAll, isBackup } from '../db/repo';
import { AccountSection } from '../features/account/AccountSection';
import type { SessionInfo } from '../sync/useSession';
import type { SyncApi } from '../state/useSync';

const THEMES: ThemeMode[] = ['light', 'dark', 'system'];
const EQUIPMENT = ['bar', 'bodyweight', 'towel', 'chair'] as const;
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="sheet px-4 py-3.5">
      <Marginalia>{title}</Marginalia>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Choice<T extends string | number>({
  options,
  value,
  onChange,
  labelOf,
}: {
  options: readonly T[];
  value: T | T[];
  onChange: (next: T) => void;
  labelOf: (option: T) => string;
}): React.JSX.Element {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <button
            key={String(option)}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option)}
            className={[
              'rounded-[2px] border px-3 py-1.5 text-[0.875rem] transition-all duration-150',
              isActive
                ? 'border-ink bg-ink text-paper'
                : 'border-rule text-ink-soft hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            {labelOf(option)}
          </button>
        );
      })}
    </div>
  );
}

export function ProfileScreen({
  session,
  sync,
}: {
  session: SessionInfo | null;
  sync: SyncApi;
}): React.JSX.Element {
  const { t, profile, setLang, setTheme, updateProfile } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!profile)
    return <p className="px-4 py-10 text-center text-ink-faint">{t('common.loading')}</p>;

  const download = async (): Promise<void> => {
    const backup = await exportAll();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-notebook-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File): Promise<void> => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isBackup(parsed)) throw new Error('format');
      if (!window.confirm(t('profile.importConfirm'))) return;
      await importAll(parsed);
      setMessage(t('profile.importDone'));
    } catch (error) {
      setMessage(t('profile.importFailed', { error: (error as Error).message }));
    }
  };

  const toggleEquipment = (item: string): void => {
    const next = profile.equipment.includes(item)
      ? profile.equipment.filter((entry) => entry !== item)
      : [...profile.equipment, item];
    void updateProfile({ equipment: next });
  };

  const toggleEnglishDay = (day: number): void => {
    const next = profile.englishDays.includes(day)
      ? profile.englishDays.filter((entry) => entry !== day)
      : [...profile.englishDays, day].sort();
    void updateProfile({ englishDays: next });
  };

  return (
    <div className="flex flex-col gap-3 px-3 pt-3 pb-2">
      <header className="px-1">
        <h1 className="text-[1.25rem] font-semibold text-ink">{t('profile.title')}</h1>
      </header>

      <Section title={t('profile.section.app')}>
        <Field label={t('profile.lang')}>
          {() => (
            <Choice<Lang>
              options={LANGS}
              value={profile.lang}
              onChange={(lang) => void setLang(lang)}
              labelOf={(lang) => t(`lang.${lang}` as TranslationKey)}
            />
          )}
        </Field>
        <Field label={t('profile.theme')}>
          {() => (
            <Choice<ThemeMode>
              options={THEMES}
              value={profile.theme}
              onChange={(theme) => void setTheme(theme)}
              labelOf={(theme) => t(`theme.${theme}` as TranslationKey)}
            />
          )}
        </Field>
      </Section>

      <Section title={t('profile.section.body')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('profile.height')}>
            {(id) => (
              <NumberInput
                id={id}
                value={profile.heightCm}
                onChange={(event) => void updateProfile({ heightCm: Number(event.target.value) })}
              />
            )}
          </Field>
          <Field label={t('profile.weight')}>
            {(id) => (
              <NumberInput
                id={id}
                value={profile.weightKg}
                onChange={(event) => void updateProfile({ weightKg: Number(event.target.value) })}
              />
            )}
          </Field>
          <Field label={t('profile.maxPullups')}>
            {(id) => (
              <NumberInput
                id={id}
                value={profile.maxPullups}
                onChange={(event) => void updateProfile({ maxPullups: Number(event.target.value) })}
              />
            )}
          </Field>
          <Field label={t('profile.maxPushups')}>
            {(id) => (
              <NumberInput
                id={id}
                value={profile.maxPushups}
                onChange={(event) => void updateProfile({ maxPushups: Number(event.target.value) })}
              />
            )}
          </Field>
        </div>

        <Field label={t('profile.equipment')}>
          {() => (
            <Choice<string>
              options={EQUIPMENT}
              value={profile.equipment}
              onChange={toggleEquipment}
              labelOf={(item) => t(`equipment.${item}` as TranslationKey)}
            />
          )}
        </Field>

        <Toggle
          checked={profile.hasBall}
          onChange={(next) => void updateProfile({ hasBall: next })}
          label={t('profile.hasBall')}
          hint={t('profile.hasBallHint')}
        />

        <Field label={t('profile.goals')}>
          {(id) => (
            <TextInput
              id={id}
              value={profile.goals}
              placeholder={t('profile.goalsPlaceholder')}
              onChange={(event) => void updateProfile({ goals: event.target.value })}
            />
          )}
        </Field>
      </Section>

      <Section title={t('profile.section.day')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('profile.wake')}>
            {(id) => (
              <TimeInput
                id={id}
                value={profile.wakeTime}
                onChange={(event) => void updateProfile({ wakeTime: event.target.value })}
              />
            )}
          </Field>
          <Field label={t('profile.sleepTarget')}>
            {(id) => (
              <TimeInput
                id={id}
                value={profile.sleepTarget}
                onChange={(event) => void updateProfile({ sleepTarget: event.target.value })}
              />
            )}
          </Field>
          <Field label={t('profile.schoolStart')}>
            {(id) => (
              <TimeInput
                id={id}
                value={profile.schoolStart}
                onChange={(event) => void updateProfile({ schoolStart: event.target.value })}
              />
            )}
          </Field>
          <Field label={t('profile.schoolEnd')}>
            {(id) => (
              <TimeInput
                id={id}
                value={profile.schoolEnd}
                onChange={(event) => void updateProfile({ schoolEnd: event.target.value })}
              />
            )}
          </Field>
        </div>

        <Field label={t('profile.commute')}>
          {(id) => (
            <NumberInput
              id={id}
              value={profile.commuteMinutes}
              onChange={(event) =>
                void updateProfile({ commuteMinutes: Number(event.target.value) })
              }
            />
          )}
        </Field>

        <Field label={t('profile.englishMode')}>
          {(id) => (
            <Select
              id={id}
              value={profile.englishMode}
              onChange={(event) =>
                void updateProfile({ englishMode: event.target.value as EnglishMode })
              }
            >
              <option value="parity">{t('englishMode.parity')}</option>
              <option value="weekdays">{t('englishMode.weekdays')}</option>
            </Select>
          )}
        </Field>

        {profile.englishMode === 'weekdays' ? (
          <Field label={t('profile.englishDays')}>
            {() => (
              <Choice<number>
                options={WEEKDAYS}
                value={profile.englishDays}
                onChange={toggleEnglishDay}
                labelOf={(day) => t(`weekday.short.${day}` as TranslationKey)}
              />
            )}
          </Field>
        ) : null}
      </Section>

      <Section title={t('profile.section.account')}>
        <AccountSection session={session} sync={sync} />
      </Section>

      <Section title={t('profile.section.data')}>
        <p className="text-[0.8125rem] text-ink-faint">{t('profile.exportHint')}</p>
        <div className="flex flex-col gap-2">
          <Button variant="ghost" full onClick={() => void download()}>
            {t('profile.export')}
          </Button>
          <Button variant="quiet" full onClick={() => fileRef.current?.click()}>
            {t('profile.import')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = '';
            }}
          />
        </div>
        {message ? <p className="text-[0.875rem] text-ink">{message}</p> : null}
      </Section>
    </div>
  );
}
