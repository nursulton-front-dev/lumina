import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, TextInput } from '../../components/ui/Field';
import { useApp } from '../../state/app-context';
import { isSyncConfigured, supabase } from '../../sync/client';
import { isAssistantEnabled } from '../../ai/flags';
import { resetSyncState } from '../../sync/engine';
import type { SessionInfo } from '../../sync/useSession';
import type { SyncApi } from '../../state/useSync';

/** Вход по коду из письма: в PWA это надёжнее ссылки, которая открывается в другом браузере. */
export function AccountSection({
  session,
  sync,
}: {
  session: SessionInfo | null;
  sync: SyncApi;
}): React.JSX.Element {
  const { t, lang } = useApp();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);

  // Счётчик токенов за текущий месяц: строка лежит в ai_usage и закрыта RLS.
  useEffect(() => {
    if (!isAssistantEnabled || !supabase || !session) return;
    const bucket = new Date().toISOString().slice(0, 7);
    void supabase
      .from('ai_usage')
      .select('prompt_tokens, completion_tokens')
      .eq('bucket', bucket)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const row = data as { prompt_tokens?: number; completion_tokens?: number };
        setTokens((row.prompt_tokens ?? 0) + (row.completion_tokens ?? 0));
      });
  }, [session]);

  if (!isSyncConfigured || !supabase) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[0.9375rem] text-ink">{t('account.notConfigured')}</p>
        <p className="text-[0.8125rem] leading-snug text-ink-faint">
          {t('account.notConfiguredHint')}
        </p>
      </div>
    );
  }

  const client = supabase;

  const sendCode = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setMessage(t('account.error', { error: error.message }));
      return;
    }
    setSent(true);
    setMessage(t('account.codeSent', { email: email.trim() }));
  };

  const verify = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    const { error } = await client.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) {
      setMessage(t('account.error', { error: error.message }));
      return;
    }
    setCode('');
    setSent(false);
  };

  const signOut = async (): Promise<void> => {
    await client.auth.signOut();
    await resetSyncState();
    setMessage(null);
  };

  if (session) {
    const lastAt = sync.lastAt
      ? new Date(sync.lastAt).toLocaleString(lang === 'uz' ? 'uz-Latn' : lang)
      : t('account.never');

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
            {t('account.signedInAs')}
          </span>
          <span className="min-w-0 truncate text-[0.875rem] text-ink">{session.email}</span>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
            {t('account.lastSync')}
          </span>
          <span className="font-mono text-[0.8125rem] tnum text-ink">{lastAt}</span>
        </div>

        {tokens !== null ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
              {t('assistant.tokens')}
            </span>
            <span className="font-mono text-[0.8125rem] tnum text-ink">{tokens}</span>
          </div>
        ) : null}

        {sync.report ? (
          <p className="font-mono text-[0.75rem] tnum text-ink-faint">
            {t('account.pushed', { n: sync.report.pushed })} ·{' '}
            {t('account.pulled', { n: sync.report.pulled })}
          </p>
        ) : null}

        {sync.status === 'error' && sync.error ? (
          <p className="border-l-[3px] border-terracotta bg-terracotta-wash px-3 py-2 text-[0.8125rem] text-ink">
            {t('account.error', { error: sync.error })}
          </p>
        ) : null}

        {sync.status === 'offline' ? (
          <p className="text-[0.8125rem] text-ink-faint">{t('account.offline')}</p>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            full
            disabled={sync.status === 'syncing'}
            onClick={() => void sync.sync()}
          >
            {sync.status === 'syncing' ? t('account.syncing') : t('account.sync')}
          </Button>
          <Button variant="quiet" full onClick={() => void signOut()}>
            {t('account.signOut')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.8125rem] leading-snug text-ink-faint">{t('account.guestHint')}</p>

      <Field label={t('account.email')}>
        {(id) => (
          <TextInput
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            disabled={sent}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>

      {sent ? (
        <>
          <Field label={t('account.code')}>
            {(id) => (
              <TextInput
                id={id}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="font-mono tnum"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            )}
          </Field>
          <Button
            variant="primary"
            full
            disabled={busy || code.length < 6}
            onClick={() => void verify()}
          >
            {t('account.verify')}
          </Button>
          <Button
            variant="quiet"
            full
            onClick={() => {
              setSent(false);
              setCode('');
            }}
          >
            {t('account.changeEmail')}
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          full
          disabled={busy || !email.includes('@')}
          onClick={() => void sendCode()}
        >
          {t('account.sendCode')}
        </Button>
      )}

      {message ? <p className="text-[0.8125rem] leading-snug text-ink">{message}</p> : null}
    </div>
  );
}
