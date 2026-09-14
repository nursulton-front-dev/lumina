/**
 * Телеграм-бот напоминаний «Тетради фокуса». Cloudflare Worker.
 *
 * Каждую минуту (cron) считает план дня из тех же шаблонов, что и приложение,
 * и отправляет напоминания. В 05:55 обновляет закреплённое сообщение с планом.
 * Приложение может прислать план на дату (POST /sync) — тогда учитываются разовые
 * правки и отметки, но без этого бот работает точно так же.
 *
 * Бот отвечает только одному chat_id из секретов; чужие сообщения игнорируются молча.
 */
import type { Lang } from '../../src/types';
import { dictionaries } from '../../src/i18n';
import { formatPlan, resolvePlan, templatePlan, type DayExport, type DayPlan } from './plan';
import { dueNow, localNow, PLAN_MINUTE, remindersFor, type Reminder } from './reminders';
import { Telegram, type InlineButton } from './telegram';

export interface Env {
  STATE: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  SYNC_KEY: string;
  WEBHOOK_SECRET: string;
  APP_URL: string;
  BOT_LANG: string;
  TZ_OFFSET_MINUTES: string;
}

const SENT_TTL = 60 * 60 * 36;
const SNOOZE_MINUTES = 15;

function lang(env: Env): Lang {
  return env.BOT_LANG === 'uz' || env.BOT_LANG === 'en' ? env.BOT_LANG : 'ru';
}

async function loadExport(env: Env, date: string): Promise<DayExport | null> {
  return env.STATE.get<DayExport>(`day:${date}`, 'json');
}

async function loadPlan(env: Env, date: string): Promise<DayPlan> {
  return resolvePlan(date, lang(env), await loadExport(env, date));
}

function planButtons(env: Env): InlineButton[][] {
  const dict = dictionaries[lang(env)];
  return [[{ text: dict['bot.open'], url: `${env.APP_URL}/#/today` }]];
}

function reminderButtons(env: Env, reminder: Reminder): InlineButton[][] {
  const dict = dictionaries[lang(env)];
  const row: InlineButton[] = [];
  if (reminder.blockId)
    row.push({ text: dict['bot.done'], callback_data: `done:${reminder.blockId}` });
  row.push({ text: dict['bot.snooze'], callback_data: `snooze:${reminder.key}` });
  row.push({ text: dict['bot.open'], url: `${env.APP_URL}/#/today` });
  return [row];
}

/** Закреплённое сообщение: правим существующее, иначе шлём новое и закрепляем. */
async function publishPlan(env: Env, telegram: Telegram, date: string): Promise<void> {
  const plan = await loadPlan(env, date);
  const text = formatPlan(plan);
  const key = `pinned:${date}`;
  const existing = await env.STATE.get(key);

  if (existing) {
    try {
      await telegram.edit(Number(existing), text, planButtons(env));
      return;
    } catch {
      // Сообщение могли удалить — ниже отправим новое.
    }
  }

  const previous = await env.STATE.get('pinned:last');
  if (previous) await telegram.unpin(Number(previous));

  const messageId = await telegram.send(text, planButtons(env));
  await telegram.pin(messageId);
  await env.STATE.put(key, String(messageId), { expirationTtl: SENT_TTL * 2 });
  await env.STATE.put('pinned:last', String(messageId));
}

async function sendDue(env: Env, telegram: Telegram, date: string, minute: number): Promise<void> {
  const plan = await loadPlan(env, date);
  const due = dueNow(remindersFor(plan), minute);

  // Отложенные «через 15 минут» хранятся отдельно и срабатывают своей минутой.
  const snoozed = await env.STATE.list({ prefix: `snooze:${date}:` });
  for (const entry of snoozed.keys) {
    const stored = await env.STATE.get<Reminder & { at: number }>(entry.name, 'json');
    if (stored && stored.at === minute) {
      due.push({ ...stored, key: `${stored.key}#${minute}` });
      await env.STATE.delete(entry.name);
    }
  }

  for (const reminder of due) {
    const sentKey = `sent:${date}:${reminder.key}`;
    if (await env.STATE.get(sentKey)) continue;
    await telegram.send(reminder.text, reminderButtons(env, reminder));
    await env.STATE.put(sentKey, '1', { expirationTtl: SENT_TTL });
  }
}

interface CallbackUpdate {
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number } };
  };
  message?: { chat: { id: number }; text?: string };
}

async function handleTelegram(env: Env, request: Request): Promise<Response> {
  const update = (await request.json().catch(() => null)) as CallbackUpdate | null;
  if (!update) return new Response('ok');
  const telegram = new Telegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
  const dict = dictionaries[lang(env)];
  const chatId = String(update.callback_query?.message?.chat.id ?? update.message?.chat.id ?? '');
  // Чужой чат — молча «ok», без единого слова в ответ.
  if (chatId !== env.TELEGRAM_CHAT_ID) return new Response('ok');

  const { date, minute } = localNow(new Date(), Number(env.TZ_OFFSET_MINUTES) || 0);

  if (update.message?.text?.startsWith('/start') || update.message?.text?.startsWith('/plan')) {
    await publishPlan(env, telegram, date);
    return new Response('ok');
  }

  const query = update.callback_query;
  if (!query?.data) return new Response('ok');

  if (query.data.startsWith('done:')) {
    const blockId = query.data.slice(5);
    const exported = (await loadExport(env, date)) ?? exportFromTemplate(env, date);
    exported.blocks = (exported.blocks ?? []).map((block) =>
      block.id === blockId ? { ...block, done: true } : block,
    );
    await env.STATE.put(`day:${date}`, JSON.stringify(exported), { expirationTtl: SENT_TTL * 2 });
    await telegram.answerCallback(query.id, dict['bot.marked']);
    await publishPlan(env, telegram, date);
    return new Response('ok');
  }

  if (query.data.startsWith('snooze:')) {
    const key = query.data.slice(7);
    const plan = await loadPlan(env, date);
    const source = remindersFor(plan).find((item) => item.key === key.split('#')[0]);
    if (source) {
      const at = (minute + SNOOZE_MINUTES) % (24 * 60);
      await env.STATE.put(`snooze:${date}:${key}:${at}`, JSON.stringify({ ...source, at }), {
        expirationTtl: SENT_TTL,
      });
    }
    await telegram.answerCallback(query.id, dict['bot.snoozed']);
    return new Response('ok');
  }

  await telegram.answerCallback(query.id);
  return new Response('ok');
}

/** Отметка из бота без присланного плана: разворачиваем шаблон в экспорт. */
function exportFromTemplate(env: Env, date: string): DayExport {
  const plan = templatePlan(date, lang(env));
  return {
    date,
    dayType: plan.dayType,
    lang: plan.lang,
    sleepTarget: plan.sleepTarget,
    blocks: plan.blocks.map((block) => ({
      id: block.id,
      start: minutesToClock(block.start),
      end: minutesToClock(block.end),
      title: block.title,
      category: block.category,
      isCore: block.isCore,
      remind: block.remind,
      done: block.done,
    })),
  };
}

function minutesToClock(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

async function handleSync(env: Env, request: Request): Promise<Response> {
  if (request.headers.get('x-sync-key') !== env.SYNC_KEY)
    return new Response('forbidden', { status: 403 });
  const body = (await request.json().catch(() => null)) as DayExport | null;
  if (!body || typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return new Response('bad request', { status: 400 });
  }
  await env.STATE.put(`day:${body.date}`, JSON.stringify(body), { expirationTtl: SENT_TTL * 2 });

  // Если план на этот день уже закреплён — сразу обновляем его.
  const { date } = localNow(new Date(), Number(env.TZ_OFFSET_MINUTES) || 0);
  if (body.date === date && (await env.STATE.get(`pinned:${date}`))) {
    await publishPlan(env, new Telegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID), date);
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': env.APP_URL },
  });
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const { date, minute } = localNow(new Date(), Number(env.TZ_OFFSET_MINUTES) || 0);
    const telegram = new Telegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
    if (minute === PLAN_MINUTE) await publishPlan(env, telegram, date);
    await sendDue(env, telegram, date, minute);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': env.APP_URL,
          'access-control-allow-headers': 'content-type, x-sync-key',
          'access-control-allow-methods': 'POST, OPTIONS',
        },
      });
    }
    if (url.pathname === '/health') return new Response('ok');
    if (url.pathname === '/sync' && request.method === 'POST') return handleSync(env, request);
    if (url.pathname === `/telegram/${env.WEBHOOK_SECRET}` && request.method === 'POST') {
      return handleTelegram(env, request);
    }
    return new Response('not found', { status: 404 });
  },
};
