import type { TranslationKey } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/app-context';
import { generateQuests, useQuests } from '../../state/useQuests';
import { addDays } from '../../domain/time';

/** Шаг разбора: собрать квесты на следующую неделю по цифрам прошедшей. */
export function QuestsStep({
  today,
  seasonStart,
}: {
  today: string;
  seasonStart: string;
}): React.JSX.Element {
  const { t } = useApp();
  // Разбор идёт в воскресенье, а квесты нужны на неделю, которая начнётся завтра.
  const nextWeekDay = addDays(today, 1);
  const state = useQuests(nextWeekDay, seasonStart);

  if (!state) return <p className="text-ink-faint">{t('common.loading')}</p>;

  return (
    <div className="flex flex-col gap-3">
      {state.quests.length === 0 ? (
        <p className="text-[0.875rem] text-ink-faint">{t('quests.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {state.quests.map(({ quest }) => (
            <li
              key={quest.id}
              className="flex items-baseline justify-between gap-3 border-b border-[color-mix(in_oklab,var(--color-rule)_50%,transparent)] pb-1"
            >
              <span className="text-[0.875rem] text-ink">
                {quest.kind === 'hours'
                  ? t('quest.hours', {
                      direction: t(`category.${quest.category ?? 'ioi'}` as TranslationKey),
                    })
                  : t(`quest.${quest.kind}` as TranslationKey)}
              </span>
              <span className="shrink-0 font-display text-[0.875rem] tnum text-ink">
                {quest.target}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" full onClick={() => void generateQuests(nextWeekDay, seasonStart)}>
        {state.quests.length === 0 ? t('quests.generate') : t('quests.regenerate')}
      </Button>
    </div>
  );
}
