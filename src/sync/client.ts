import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Синхронизация подключается, только когда заданы обе переменные окружения. */
export const isSyncConfigured = Boolean(url && anonKey);

/**
 * anon-ключ Supabase публичный по устройству: доступ к данным закрывает RLS,
 * а не секретность ключа. Ключ DeepSeek сюда не попадает никогда.
 */
export const supabase: SupabaseClient | null = isSyncConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;
