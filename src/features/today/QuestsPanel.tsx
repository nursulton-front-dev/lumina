import type { TranslationKey } from '../../i18n';
import type { QuestsState } from '../../state/useQuests';
import { generateQuests } from '../../state/useQuests';
import { Button } from '../../components/ui/Button';
import { EmptyState, Marginalia, Sheet } from '../../components/ui/Sheet';
import { useApp } from '../../state/app-context';

/** Квесты недели: полоски прогресса, привязанные к настоящим цифрам. */
export function QuestsPanel({
  state,
  today,
  seasonStart,
}: {
  state: QuestsState;
  today: string;
  seasonStart: string;
}): React.JSX.Element {
  const { t } = useApp();

  return (
    <Sheet className="px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <Marginalia>{t('quests.title')}</Marginalia>
        {state.quests.length > 0 ? (
          <span className="font-display text-[0.75rem] tnum text-ink-faint">
            {state.quests.filter((item) => item.done).length}/{state.quests.length}
          </span>
        ) : null}
      </div>

      {state.quests.length === 0 ? (
        <>
          <EmptyState text={t('quests.empty')} icon="flag" />
          <Button
            variant="ghost"
            full
            className="mt-1"
            onClick={() => void generateQuests(today, seasonStart)}
          >
            {t('quests.generate')}
          </Button>
        </>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {state.quests.map(({ quest, progress, share, done }) => (
            <li key={quest.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className={`text-[0.8125rem] ${done ? 'text-ink-faint' : 'text-ink'}`}>
                  {quest.kind === 'hours'
                    ? t('quest.hours', {
                        direction: t(`category.${quest.category ?? 'ioi'}` as TranslationKey),
                      })
                    : t(`quest.${quest.kind}` as TranslationKey)}
                </span>
                <span className="shrink-0 font-display text-[0.75rem] tnum text-ink-faint">
                  <span className={done ? 'text-done' : 'text-ink'}>{progress}</span>/{quest.target}
                </span>
              </div>
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-sunken">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ease-out ${done ? 'bg-done' : 'bg-blue'}`}
                  style={{ width: `${share * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
