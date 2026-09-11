import type { Lang, Profile } from '../types';
import { supabase } from '../sync/client';
import { runTool, type ToolContext } from './tools';
import { TOOL_DEFINITIONS } from './definitions';
import { systemPrompt } from './system-prompt';
import { buildContext } from './context';
import type { DiffRow } from './proposal';

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export type AssistantEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool'; name: string; ok: boolean }
  | { type: 'proposal'; changeId: string; summary: string; diff: DiffRow[] }
  | { type: 'done'; text: string }
  | { type: 'error'; message: string };

const MAX_ROUNDS = 4;

/** Кто отправляет запрос модели. В приложении — прокси Supabase; в живом тесте — DeepSeek напрямую. */
export type Transport = (body: unknown) => Promise<Response>;

function endpoint(): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${String(base).replace(/\/$/, '')}/functions/v1/ai`;
}

/** Транспорт по умолчанию: серверный прокси, ключ DeepSeek остаётся на сервере. */
export async function proxyTransport(): Promise<Transport | { error: string }> {
  if (!supabase) return { error: 'not_configured' };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { error: 'unauthorized' };
  return (body) =>
    fetch(endpoint(), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
}

interface StreamResult {
  text: string;
  toolCalls: ToolCall[];
  finish: string | null;
}

/** Разбирает поток SSE от DeepSeek: текст и вызовы инструментов приходят кусками. */
async function readStream(
  response: Response,
  onDelta: (text: string) => void,
): Promise<StreamResult> {
  const reader = response.body?.getReader();
  if (!reader) return { text: '', toolCalls: [], finish: null };

  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let finish: string | null = null;
  const calls = new Map<number, ToolCall>();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;

      let parsed: {
        choices?: {
          delta?: {
            content?: string;
            tool_calls?: {
              index: number;
              id?: string;
              function?: { name?: string; arguments?: string };
            }[];
          };
          finish_reason?: string | null;
        }[];
      };
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }

      const choice = parsed.choices?.[0];
      if (!choice) continue;
      if (choice.finish_reason) finish = choice.finish_reason;

      const delta = choice.delta?.content;
      if (delta) {
        text += delta;
        onDelta(delta);
      }

      for (const call of choice.delta?.tool_calls ?? []) {
        const existing = calls.get(call.index) ?? {
          id: call.id ?? `call_${call.index}`,
          type: 'function' as const,
          function: { name: '', arguments: '' },
        };
        if (call.id) existing.id = call.id;
        if (call.function?.name) existing.function.name = call.function.name;
        if (call.function?.arguments) existing.function.arguments += call.function.arguments;
        calls.set(call.index, existing);
      }
    }
  }

  return { text, toolCalls: [...calls.values()], finish };
}

/**
 * Один заход к ассистенту: стриминг ответа и цикл вызовов инструментов.
 * Инструменты выполняются на устройстве — источник правды локальная база.
 */
export async function* runAssistant(
  input: {
    history: ChatMessage[];
    profile: Profile;
    lang: Lang;
    today: string;
    model?: 'deepseek-chat' | 'deepseek-reasoner';
  },
  transport?: Transport,
): AsyncGenerator<AssistantEvent> {
  let send = transport;
  if (!send) {
    const resolved = await proxyTransport();
    if ('error' in resolved) {
      yield { type: 'error', message: resolved.error };
      return;
    }
    send = resolved;
  }

  const context: ToolContext = { profile: input.profile, today: input.today };
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt(input.lang) },
    { role: 'system', content: await buildContext(input.profile, input.today) },
    ...input.history,
  ];

  let answer = '';

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const queue: AssistantEvent[] = [];
    const response = await send({
      messages,
      tools: TOOL_DEFINITIONS,
      model: input.model ?? 'deepseek-chat',
    });

    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as {
        error?: string | { message?: string; type?: string };
      } | null;
      const error = detail?.error;
      // Прокси отдаёт строку-код, DeepSeek напрямую — объект с message.
      const message =
        typeof error === 'string'
          ? error
          : (error?.message ?? error?.type ?? String(response.status));
      yield { type: 'error', message };
      return;
    }

    const result = await readStream(response, (text) => queue.push({ type: 'delta', text }));
    for (const event of queue) yield event;
    answer += result.text;

    if (result.toolCalls.length === 0) break;

    messages.push({ role: 'assistant', content: result.text, tool_calls: result.toolCalls });

    for (const call of result.toolCalls) {
      let args: unknown = {};
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      } catch {
        args = {};
      }

      const toolResult = await runTool(call.function.name, args, context);
      yield { type: 'tool', name: call.function.name, ok: toolResult.ok };

      const payload = toolResult.data as {
        changeId?: string;
        summary?: string;
        diff?: DiffRow[];
      };
      if (toolResult.ok && payload.changeId && payload.diff) {
        yield {
          type: 'proposal',
          changeId: payload.changeId,
          summary: payload.summary ?? '',
          diff: payload.diff,
        };
      }

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(toolResult),
      });
    }
  }

  yield { type: 'done', text: answer };
}
