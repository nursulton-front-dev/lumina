import { useEffect, useState } from 'react';
import { supabase } from './client';

export interface SessionInfo {
  userId: string;
  email: string | null;
}

/** Текущая сессия Supabase. null — гостевой режим, приложение работает локально. */
export function useSession(): { session: SessionInfo | null; ready: boolean } {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const user = data.session?.user ?? null;
      setSession(user ? { userId: user.id, email: user.email ?? null } : null);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      const user = next?.user ?? null;
      setSession(user ? { userId: user.id, email: user.email ?? null } : null);
      setReady(true);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, ready };
}
