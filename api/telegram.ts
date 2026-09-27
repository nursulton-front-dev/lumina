import type { IncomingMessage, ServerResponse } from 'http';
import { formatPlan, resolvePlan, type DayExport, type DayPlan } from '../bot/src/plan';
import { dueNow, localNow, remindersFor, type Reminder } from '../bot/src/reminders';
import { Telegram, type InlineButton } from '../bot/src/telegram';
import { dictionaries } from '../src/i18n';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8998816064:AAHuz0-IX9_ixEwnOWeEN9_1CdJQ4CS2EuU';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6804139305';
const APP_URL = process.env.APP_URL || 'https://lumina-tau-six.vercel.app';
const TZ_OFFSET_MINUTES = 300; // Tashkent UTC+5

// In-memory state storage (persists per warm serverless container instance)
const dayState: Record<string, DayExport> = {};
const pinnedState: Record<string, number> = {};
const sentReminders: Record<string, boolean> = {};

function lang(): 'ru' {
  return 'ru';
}

function planButtons(): InlineButton[][] {
  const dict = dictionaries[lang()];
  return [[{ text: dict['bot.open'], url: `${APP_URL}/#/today` }]];
}

function reminderButtons(reminder: Reminder): InlineButton[][] {
  const dict = dictionaries[lang()];
  const row: InlineButton[] = [];
  if (reminder.blockId) {
    row.push({ text: dict['bot.done'], callback_data: `done:${reminder.blockId}` });
  }
  row.push({ text: dict['bot.snooze'], callback_data: `snooze:${reminder.key}` });
  row.push({ text: dict['bot.open'], url: `${APP_URL}/#/today` });
  return [row];
}

async function loadExport(date: string): Promise<DayExport | null> {
  return dayState[date] ?? null;
}

async function loadPlan(date: string): Promise<DayPlan> {
  return resolvePlan(date, lang(), await loadExport(date));
}

async function publishPlan(telegram: Telegram, date: string): Promise<number> {
  const plan = await loadPlan(date);
  const text = formatPlan(plan);
  const key = `pinned:${date}`;
  const existing = pinnedState[key];

  if (existing) {
    try {
      await telegram.edit(existing, text, planButtons());
      return existing;
    } catch {
      // Message might have been deleted, send new one below
    }
  }

  const lastPinned = pinnedState['pinned:last'];
  if (lastPinned) {
    await telegram.unpin(lastPinned);
  }

  const messageId = await telegram.send(text, planButtons());
  await telegram.pin(messageId);
  pinnedState[key] = messageId;
  pinnedState['pinned:last'] = messageId;
  return messageId;
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });
  });
}

export default async function handler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse & { statusCode: number; setHeader: (k: string, v: string) => void; end: (d?: any) => void },
) {
  const sendJson = (statusCode: number, data: any) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
  };

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-sync-key');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.statusCode = 200;
    res.end();
    return;
  }

  const body = req.body ?? (await parseBody(req));
  const telegram = new Telegram(BOT_TOKEN, CHAT_ID);
  const dict = dictionaries[lang()];
  const { date, minute } = localNow(new Date(), TZ_OFFSET_MINUTES);

  // Sync endpoint from app
  if (req.url?.includes('/sync') && req.method === 'POST') {
    if (body && typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      dayState[body.date] = body;
      if (body.date === date) {
        await publishPlan(telegram, date);
      }
      return sendJson(200, { ok: true });
    }
    return sendJson(400, { error: 'invalid payload' });
  }

  // Cron execution / reminder check
  if (req.url?.includes('/cron') || req.url?.includes('/check')) {
    const plan = await loadPlan(date);
    const due = dueNow(remindersFor(plan), minute);
    for (const reminder of due) {
      const sentKey = `sent:${date}:${reminder.key}`;
      if (sentReminders[sentKey]) continue;
      await telegram.send(reminder.text, reminderButtons(reminder));
      sentReminders[sentKey] = true;
    }
    return sendJson(200, { ok: true, checked: due.length });
  }

  if (!body) {
    return sendJson(200, { ok: true, status: 'bot active' });
  }

  const chatId = String(body.callback_query?.message?.chat.id ?? body.message?.chat.id ?? '');
  if (chatId !== CHAT_ID) {
    return sendJson(200, { ok: true });
  }

  const text = body.message?.text ?? '';
  if (text.startsWith('/start') || text.startsWith('/plan')) {
    await publishPlan(telegram, date);
    return sendJson(200, { ok: true });
  }

  const query = body.callback_query;
  if (query?.data) {
    if (query.data.startsWith('done:')) {
      const blockId = query.data.slice(5);
      const currentPlan = await loadPlan(date);
      const exported: DayExport = dayState[date] ?? {
        date,
        dayType: currentPlan.dayType,
        lang: 'ru',
        blocks: currentPlan.blocks.map((b) => ({
          id: b.id,
          start: `${Math.floor(b.start / 60).toString().padStart(2, '0')}:${(b.start % 60).toString().padStart(2, '0')}`,
          end: `${Math.floor(b.end / 60).toString().padStart(2, '0')}:${(b.end % 60).toString().padStart(2, '0')}`,
          title: b.title,
          category: b.category,
          isCore: b.isCore,
          done: b.done,
        })),
      };

      exported.blocks = (exported.blocks ?? []).map((block) =>
        block.id === blockId ? { ...block, done: true } : block,
      );
      dayState[date] = exported;

      await telegram.answerCallback(query.id, dict['bot.marked']);
      await publishPlan(telegram, date);
      return sendJson(200, { ok: true });
    }

    if (query.data.startsWith('snooze:')) {
      await telegram.answerCallback(query.id, dict['bot.snoozed']);
      return sendJson(200, { ok: true });
    }

    await telegram.answerCallback(query.id);
    return sendJson(200, { ok: true });
  }

  return sendJson(200, { ok: true });
}
