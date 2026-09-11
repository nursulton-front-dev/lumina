// Серверный прокси к DeepSeek. Ключ живёт только здесь, в секретах Supabase,
// и никогда не попадает в браузер и в репозиторий.
//
// Деплой: supabase functions deploy ai
// Секрет:  supabase secrets set DEEPSEEK_API_KEY=...

import { createClient } from 'jsr:@supabase/supabase-js@2';

const DEEPSEEK_URL = `${(Deno.env.get('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com').replace(/\/$/, '')}/chat/completions`;
const DEFAULT_MODEL = Deno.env.get('DEEPSEEK_MODEL') ?? 'deepseek-chat';
const ALLOWED_MODELS = new Set(['deepseek-chat', 'deepseek-reasoner']);
/** Лимит запросов в час на пользователя. */
const HOURLY_LIMIT = 40;
/** Верхняя граница длины контекста: защита и от расходов, и от случайной выгрузки всей базы. */
const MAX_MESSAGES = 40;
const MAX_CHARS = 60_000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

function buckets(now: Date): { hour: string; month: string } {
  const iso = now.toISOString();
  return { hour: iso.slice(0, 13), month: iso.slice(0, 7) };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!apiKey || !supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: 'not_configured' }, 500);
  }

  const authorization = request.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);

  // Сессия проверяется настоящим запросом к Supabase, а не разбором токена на месте.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);
  const userId = userData.user.id;

  let payload: {
    messages?: unknown;
    tools?: unknown;
    model?: string;
    temperature?: number;
  };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (messages.length === 0) return json({ error: 'empty_messages' }, 400);
  if (messages.length > MAX_MESSAGES) return json({ error: 'too_many_messages' }, 413);
  if (JSON.stringify(messages).length > MAX_CHARS) return json({ error: 'context_too_large' }, 413);

  const model = ALLOWED_MODELS.has(payload.model ?? '') ? payload.model : DEFAULT_MODEL;

  const admin = createClient(supabaseUrl, serviceKey);
  const { hour, month } = buckets(new Date());
  const { data: usage, error: usageError } = await admin.rpc('bump_ai_usage', {
    target_user: userId,
    hour_bucket: hour,
    month_bucket: month,
    prompt: 0,
    completion: 0,
  });
  if (usageError) return json({ error: 'usage_failed' }, 500);
  if (typeof usage === 'number' && usage > HOURLY_LIMIT) {
    return json({ error: 'rate_limited', limit: HOURLY_LIMIT }, 429);
  }

  const upstream = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      tools: payload.tools ?? undefined,
      tool_choice: payload.tools ? 'auto' : undefined,
      temperature: payload.temperature ?? 0.3,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return json({ error: 'upstream', status: upstream.status, detail: text.slice(0, 500) }, 502);
  }

  // Поток идёт к клиенту как есть; попутно считаем токены из служебного чанка usage.
  const decoder = new TextDecoder();
  let prompt = 0;
  let completion = 0;

  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const match =
          /"usage":\s*\{[^}]*"prompt_tokens":\s*(\d+)[^}]*"completion_tokens":\s*(\d+)/.exec(text);
        if (match) {
          prompt = Number(match[1]) || 0;
          completion = Number(match[2]) || 0;
        }
        controller.enqueue(chunk);
      },
      async flush() {
        if (prompt + completion > 0) {
          await admin.rpc('add_ai_tokens', {
            target_user: userId,
            hour_bucket: hour,
            month_bucket: month,
            prompt,
            completion,
          });
        }
      },
    }),
  );

  return new Response(stream, {
    headers: { ...CORS, 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
  });
});
