import { useApp } from './state/app-context';
import { useState } from 'react';
import { AssistantSheet } from './features/assistant/AssistantSheet';
import { isAssistantEnabled } from './ai/flags';
import { useSession } from './sync/useSession';
import { useSync } from './state/useSync';
import { useRoute } from './state/router';
import { TabBar } from './components/TabBar';
import { LanguagePicker } from './screens/LanguagePicker';
import { TodayScreen } from './screens/TodayScreen';
import { ScheduleScreen } from './screens/ScheduleScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProtocolScreen } from './screens/ProtocolScreen';
import { FocusScreen } from './screens/FocusScreen';
import { WeekScreen } from './screens/WeekScreen';
import { ProgressScreen } from './screens/ProgressScreen';

export function App(): React.JSX.Element {
  const { status, lang, chooseLang, t } = useApp();
  const route = useRoute();
  const { session } = useSession();
  const sync = useSync(session);
  const [assistantOpen, setAssistantOpen] = useState(false);

  if (status === 'loading') {
    return <div className="min-h-dvh" aria-busy="true" />;
  }

  if (status === 'needs-language') {
    return <LanguagePicker lang={lang} onChoose={(next) => void chooseLang(next)} />;
  }

  if (route.name === 'protocol') {
    return <ProtocolScreen blockId={route.blockId} />;
  }

  if (route.name === 'focus') {
    return <FocusScreen blockId={route.blockId} />;
  }

  return (
    <div className="safe-top mx-auto min-h-dvh max-w-3xl pb-24">
      {route.name === 'today' ? <TodayScreen /> : null}
      {route.name === 'week' ? <WeekScreen /> : null}
      {route.name === 'progress' ? <ProgressScreen /> : null}
      {route.name === 'schedule' ? <ScheduleScreen /> : null}
      {route.name === 'profile' ? <ProfileScreen session={session} sync={sync} /> : null}

      {/* Ассистент доступен с любого экрана, кнопка — в зоне большого пальца.
          За флагом: без VITE_ASSISTANT_ENABLED=true ни кнопки, ни обращений к прокси. */}
      {isAssistantEnabled ? (
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          aria-label={t('assistant.open')}
          className="safe-bottom fixed right-3 bottom-[4.75rem] z-30 grid size-12 place-items-center rounded-[2px] border border-ink bg-ink text-paper shadow-[3px_3px_0_0_var(--color-rule)] transition-transform duration-150 ease-[var(--ease-paper)] hover:-translate-y-px active:translate-y-0 active:shadow-none"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path
              d="M4 5h16v10H9l-5 4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M8 10h8" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      ) : null}

      {isAssistantEnabled && assistantOpen ? (
        <AssistantSheet session={session} onClose={() => setAssistantOpen(false)} />
      ) : null}

      <TabBar active={route.name} />
    </div>
  );
}
