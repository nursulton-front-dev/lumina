import type { TranslationKey } from '../../i18n';
import type { QuestsState } from '../../state/useQuests';
import { generateQuests } from '../../state/useQuests';
import { Button } from '../../components/ui/Button';
import { Marginalia, Sheet } from '../../components/ui/Sheet';
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
    <Sheet className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <Marginalia>{t('quests.title')}</Marginalia>
        {state.quests.length > 0 ? (
          <span className="font-mono text-[0.75rem] tnum text-ink-faint">
            {state.quests.filter((item) => item.done).length}/{state.quests.length}
          </span>
        ) : null}
      </div>

      {state.quests.length === 0 ? (
        <>
          <p className="mt-1 text-[0.8125rem] text-ink-faint">{t('quests.empty')}</p>
          <Button
            variant="ghost"
            full
            className="mt-2.5"
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
                <span className="shrink-0 font-mono text-[0.75rem] tnum text-ink-faint">
                  <span className={done ? 'text-done' : 'text-ink'}>{progress}</span>/{quest.target}
                </span>
              </div>
              <div className="relative mt-1 h-1.5 border-b border-rule">
                <div
                  className={`absolute bottom-0 left-0 h-[3px] transition-[width] duration-700 ease-[var(--ease-paper)] ${done ? 'bg-done' : 'bg-ink'}`}
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
