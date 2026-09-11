import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Field';
import { useApp } from '../../state/app-context';
import { useAssistant } from '../../state/useAssistant';
import { isSyncConfigured } from '../../sync/client';
import type { SessionInfo } from '../../sync/useSession';
import { toISODate } from '../../domain/time';
import { DiffCard } from './DiffCard';

const QUICK: {
  key: 'assistant.quick.today' | 'assistant.quick.week' | 'assistant.quick.failed';
}[] = [
  { key: 'assistant.quick.today' },
  { key: 'assistant.quick.week' },
  { key: 'assistant.quick.failed' },
];

/** Ассистент: переписка, быстрые команды и подтверждение изменений расписания. */
export function AssistantSheet({
  session,
  onClose,
}: {
  session: SessionInfo | null;
  onClose: () => void;
}): React.JSX.Element {
  const { t, profile } = useApp();
  const today = toISODate(new Date());
  const assistant = useAssistant(profile, today);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [assistant.messages.length, assistant.streaming]);

  const submit = async (text: string): Promise<void> => {
    setDraft('');
    setNotice(null);
    await assistant.send(text);
  };

  const undo = async (): Promise<void> => {
    const summary = await assistant.undo();
    setNotice(summary === null ? t('assistant.nothingToUndo') : t('assistant.undone'));
  };

  const blocked = !isSyncConfigured ? 'notConfigured' : !session ? 'signInRequired' : null;

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-paper">
      <header className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <p className="font-display text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
          {t('assistant.title')}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void undo()}
            aria-label={t('assistant.undo')}
            title={t('assistant.undo')}
            className="grid size-9 place-items-center border border-transparent text-ink-faint transition-colors hover:border-rule hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                d="M9 7H5V3M5.2 7.2a8 8 0 1 1-1.2 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid size-9 place-items-center border border-transparent text-ink-faint transition-colors hover:border-rule hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.4" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-3">
        {blocked ? (
          <p className="rounded-[var(--radius-field)] bg-ochre-wash px-3 py-2.5 text-[0.875rem] leading-snug text-ink">
            {blocked === 'notConfigured'
              ? t('assistant.notConfigured')
              : t('assistant.signInRequired')}
          </p>
        ) : null}

        {assistant.messages.length === 0 && !blocked ? (
          <p className="text-[0.875rem] text-ink-faint">{t('assistant.empty')}</p>
        ) : null}

        <ul className="flex flex-col gap-2.5">
          {assistant.messages.map((message) => (
            <li
              key={message.id}
              className={
                message.role === 'user'
                  ? 'ml-8 rounded-[var(--radius-field)] bg-ochre-wash px-3 py-2 text-[0.9375rem] text-ink'
                  : message.role === 'tool'
                    ? 'font-display text-[0.6875rem] uppercase tracking-[0.12em] text-ink-faint'
                    : 'mr-4 rounded-[var(--radius-field)] bg-sunken px-3 py-2 text-[0.9375rem] leading-snug whitespace-pre-wrap text-ink'
              }
            >
              {message.role === 'tool'
                ? t('assistant.toolCall', { name: message.toolName ?? '' })
                : message.content}
            </li>
          ))}
        </ul>

        {assistant.streaming ? (
          <p className="mt-2.5 mr-4 rounded-[var(--radius-field)] bg-sunken px-3 py-2 text-[0.9375rem] leading-snug whitespace-pre-wrap text-ink">
            {assistant.streaming}
          </p>
        ) : null}

        {assistant.busy && !assistant.streaming ? (
          <p className="mt-2 font-display text-[0.75rem] text-ink-faint">
            {t('assistant.thinking')}
          </p>
        ) : null}

        {assistant.pending.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            {assistant.pending.map((change) => (
              <DiffCard
                key={change.id}
                change={change}
                onApply={() =>
                  void assistant.accept(change.id).then(() => setNotice(t('assistant.applied')))
                }
                onReject={() => void assistant.reject(change.id)}
              />
            ))}
          </div>
        ) : null}

        {assistant.error ? (
          <p className="mt-2 rounded-[var(--radius-field)] bg-terracotta-wash px-3 py-2 text-[0.875rem] text-ink">
            {assistant.error === 'rate_limited'
              ? t('assistant.rateLimited')
              : t('assistant.error', { error: assistant.error })}
          </p>
        ) : null}

        {notice ? <p className="mt-2 text-[0.8125rem] text-ink-soft">{notice}</p> : null}

        <div ref={endRef} />
      </main>

      <footer className="safe-bottom border-t border-rule px-3 py-2.5">
        <div className="mb-2 flex gap-1.5 overflow-x-auto">
          {QUICK.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              className="shrink-0"
              disabled={assistant.busy || blocked !== null}
              onClick={() => void submit(t(item.key))}
            >
              {t(item.key)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <TextInput
            value={draft}
            placeholder={t('assistant.placeholder')}
            disabled={blocked !== null}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) void submit(draft);
            }}
          />
          <Button
            variant="primary"
            disabled={assistant.busy || draft.trim().length === 0 || blocked !== null}
            onClick={() => void submit(draft)}
          >
            {t('assistant.send')}
          </Button>
        </div>
      </footer>
    </div>
  );
}
