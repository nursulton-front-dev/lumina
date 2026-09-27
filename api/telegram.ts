import type { IncomingMessage, ServerResponse } from 'http';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8998816064:AAHuz0-IX9_ixEwnOWeEN9_1CdJQ4CS2EuU';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6804139305';
const APP_URL = process.env.APP_URL || 'https://lumina-hazel-theta.vercel.app';
const TZ_OFFSET_MINUTES = 300; // Asia/Tashkent UTC+5

const ruDict: Record<string, string> = {
  'weekday.0': 'Воскресенье',
  'weekday.1': 'Понедельник',
  'weekday.2': 'Вторник',
  'weekday.3': 'Среда',
  'weekday.4': 'Четверг',
  'weekday.5': 'Пятница',
  'weekday.6': 'Суббота',
  'daytype.odd': 'Пн/Ср (нечётные)',
  'daytype.even': 'Вт/Чт (чётные)',
  'daytype.fri': 'Пятница (две секции)',
  'daytype.sat': 'Суббота (ораторское)',
  'daytype.sun': 'Воскресенье (Rest Day)',
  'today.done': 'Выполнено',
  'today.minimum': 'Минимум',
  'today.sleepTarget': 'Целевой отбой',
  'bot.open': 'Открыть Тетрадь',
  'bot.done': 'Отметил',
  'bot.snooze': 'Через 15 мин',
  'bot.marked': 'Отмечено!',
  'bot.snoozed': 'Отложено на 15 минут',
  'bot.wake': 'Доброе утро! Время вставать и открывать Тетрадь фокуса ☀️',
  'bot.brother': 'Время выходить за братом в садик 🎒',
  'bot.english': 'Выход на курс английского через 15 минут 🇬🇧',
  'bot.lesson': 'Выход на секцию через 15 минут 🏆',
  'bot.sleep': 'Через 30 минут целевой отбой — самое время убрать экраны 🌙',
  'bot.blockStarts': 'Начинается блок:',
  'block.wake': 'Подъём',
  'block.wakeAlarm': 'Подъём без будильника',
  'block.cardio': 'Кардио (бег / дорожка / прыжки)',
  'block.workoutStrength': 'Силовая тренировка',
  'block.shower': 'Душ, гигиена',
  'block.breakfast': 'Завтрак',
  'block.russian': 'Русский язык (ОГЭ)',
  'block.memory': 'Спец-протокол: Запоминание 20 чисел',
  'block.commuteSchool': 'Дорога в школу',
  'block.school': 'Школа',
  'block.commuteHome': 'Дорога домой',
  'block.selfStudy': 'Саморазвитие / Литература по IT',
  'block.lunchRest': 'Обед + Отдых',
  'block.lunch': 'Обед',
  'block.brother': 'Брат из садика',
  'block.homework': 'Школьная домашка',
  'block.freelance': 'Фриланс / Проекты',
  'block.englishCourse': 'Курс английского (выезд)',
  'block.english': 'Английский (самостоятельно / повтор)',
  'block.englishClass': 'Английский (занятие)',
  'block.dinner': 'Ужин',
  'block.dinnerWalk': 'Ужин + Прогулка',
  'block.ioiLesson': 'Урок IOI (теория + разбор)',
  'block.ioiProblems': 'Решение задач IOI',
  'block.fiction': 'Художественное чтение',
  'block.sleepPrep': 'Подготовка ко сну, рефлексия',
  'block.bedtime': 'Отбой',
  'block.snackRest': 'Перекус / Отдых',
  'block.sqbAi': 'SQB AI (секция)',
  'block.commute': 'Дорога',
  'block.rest': 'Перерыв / Отдых',
  'block.oratory': 'Спец-протокол: Ораторское мастерство',
  'block.freeTime': 'Свободное время',
  'block.quietTime': 'Тихий час (без гаджетов)',
  'block.sundayAdventure': 'Воскресный отдых (развлечения / семья / гулянки)',
  'block.weekReview': 'Подведение итогов недели',
};

interface BlockSeed {
  start: string;
  end: string;
  titleKey: string;
  category: string;
  core?: boolean;
  focus?: boolean;
}

const ODD: BlockSeed[] = [
  { start: '06:00', end: '06:05', titleKey: 'block.wake', category: 'routine' },
  { start: '06:05', end: '06:25', titleKey: 'block.cardio', category: 'sport' },
  { start: '06:25', end: '06:35', titleKey: 'block.shower', category: 'routine' },
  { start: '06:35', end: '06:50', titleKey: 'block.breakfast', category: 'routine' },
  { start: '06:50', end: '07:45', titleKey: 'block.russian', category: 'russian', focus: true },
  { start: '07:45', end: '08:00', titleKey: 'block.memory', category: 'memory', core: true },
  { start: '08:00', end: '08:30', titleKey: 'block.commuteSchool', category: 'commute' },
  { start: '08:30', end: '14:45', titleKey: 'block.school', category: 'school' },
  { start: '14:45', end: '15:15', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '15:15', end: '15:45', titleKey: 'block.selfStudy', category: 'reading', core: true },
  { start: '15:45', end: '16:00', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '16:00', end: '16:25', titleKey: 'block.lunchRest', category: 'rest' },
  { start: '16:25', end: '16:50', titleKey: 'block.brother', category: 'routine' },
  { start: '16:50', end: '17:45', titleKey: 'block.homework', category: 'homework', core: true },
  { start: '17:45', end: '18:10', titleKey: 'block.freelance', category: 'freelance' },
  { start: '18:15', end: '20:15', titleKey: 'block.englishCourse', category: 'english' },
  { start: '20:15', end: '20:40', titleKey: 'block.dinner', category: 'routine' },
  { start: '20:40', end: '22:05', titleKey: 'block.ioiLesson', category: 'ioi', focus: true },
  { start: '22:05', end: '22:30', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '22:30', end: '23:00', titleKey: 'block.sleepPrep', category: 'routine' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const EVEN: BlockSeed[] = [
  { start: '06:00', end: '06:05', titleKey: 'block.wake', category: 'routine' },
  { start: '06:05', end: '06:30', titleKey: 'block.workoutStrength', category: 'sport' },
  { start: '06:30', end: '06:40', titleKey: 'block.shower', category: 'routine' },
  { start: '06:40', end: '06:55', titleKey: 'block.breakfast', category: 'routine' },
  { start: '06:55', end: '07:25', titleKey: 'block.english', category: 'english', focus: true },
  { start: '07:25', end: '07:40', titleKey: 'block.memory', category: 'memory', core: true },
  { start: '07:40', end: '08:30', titleKey: 'block.commuteSchool', category: 'commute' },
  { start: '08:30', end: '14:45', titleKey: 'block.school', category: 'school' },
  { start: '14:45', end: '15:15', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '15:15', end: '15:45', titleKey: 'block.selfStudy', category: 'reading', core: true },
  { start: '15:45', end: '16:00', titleKey: 'block.commuteHome', category: 'commute' },
  { start: '16:00', end: '16:25', titleKey: 'block.lunch', category: 'rest' },
  { start: '16:25', end: '16:50', titleKey: 'block.brother', category: 'routine' },
  { start: '16:50', end: '17:45', titleKey: 'block.homework', category: 'homework', core: true },
  { start: '17:45', end: '18:10', titleKey: 'block.snackRest', category: 'rest' },
  { start: '18:10', end: '20:05', titleKey: 'block.ioiProblems', category: 'ioi', focus: true },
  { start: '20:05', end: '20:35', titleKey: 'block.dinnerWalk', category: 'rest' },
  { start: '20:35', end: '21:30', titleKey: 'block.freelance', category: 'freelance', focus: true },
  { start: '21:30', end: '21:55', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '21:55', end: '22:25', titleKey: 'block.freeTime', category: 'free' },
  { start: '22:25', end: '23:00', titleKey: 'block.sleepPrep', category: 'routine' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const FRI: BlockSeed[] = [
  { start: '06:00', end: '06:05', titleKey: 'block.wake', category: 'routine' },
  { start: '06:05', end: '06:25', titleKey: 'block.cardio', category: 'sport' },
  { start: '06:25', end: '06:35', titleKey: 'block.shower', category: 'routine' },
  { start: '06:35', end: '06:50', titleKey: 'block.breakfast', category: 'routine' },
  { start: '06:50', end: '07:45', titleKey: 'block.russian', category: 'russian', focus: true },
  { start: '07:45', end: '08:00', titleKey: 'block.memory', category: 'memory', core: true },
  { start: '08:00', end: '08:30', titleKey: 'block.commuteSchool', category: 'commute' },
  { start: '08:30', end: '14:45', titleKey: 'block.school', category: 'school' },
  { start: '14:45', end: '15:40', titleKey: 'block.homework', category: 'homework', core: true },
  { start: '15:40', end: '16:00', titleKey: 'block.snackRest', category: 'rest' },
  { start: '16:00', end: '18:00', titleKey: 'block.sqbAi', category: 'school' },
  { start: '18:00', end: '18:30', titleKey: 'block.commute', category: 'commute' },
  { start: '18:30', end: '20:00', titleKey: 'block.englishClass', category: 'english' },
  { start: '20:00', end: '20:30', titleKey: 'block.selfStudy', category: 'reading', core: true },
  { start: '20:30', end: '20:45', titleKey: 'block.dinner', category: 'routine' },
  { start: '20:45', end: '22:10', titleKey: 'block.ioiLesson', category: 'ioi', focus: true },
  { start: '22:10', end: '22:35', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '22:35', end: '23:00', titleKey: 'block.sleepPrep', category: 'routine' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const SAT: BlockSeed[] = [
  { start: '07:30', end: '07:35', titleKey: 'block.wake', category: 'routine' },
  { start: '07:35', end: '08:10', titleKey: 'block.workoutStrength', category: 'sport' },
  { start: '08:10', end: '08:30', titleKey: 'block.shower', category: 'routine' },
  { start: '08:30', end: '08:50', titleKey: 'block.breakfast', category: 'routine' },
  { start: '08:50', end: '09:05', titleKey: 'block.memory', category: 'memory', core: true },
  { start: '09:05', end: '09:35', titleKey: 'block.english', category: 'english', focus: true },
  { start: '09:35', end: '10:00', titleKey: 'block.rest', category: 'rest' },
  { start: '10:00', end: '11:55', titleKey: 'block.ioiProblems', category: 'ioi', focus: true },
  { start: '12:00', end: '13:00', titleKey: 'block.lunchRest', category: 'rest' },
  { start: '13:00', end: '14:55', titleKey: 'block.freelance', category: 'freelance', focus: true },
  { start: '14:55', end: '15:25', titleKey: 'block.rest', category: 'rest' },
  { start: '15:25', end: '16:20', titleKey: 'block.oratory', category: 'speech', focus: true },
  { start: '16:20', end: '16:35', titleKey: 'block.rest', category: 'rest' },
  { start: '16:35', end: '17:30', titleKey: 'block.homework', category: 'homework', core: true },
  { start: '17:30', end: '21:30', titleKey: 'block.freeTime', category: 'free' },
  { start: '21:30', end: '21:55', titleKey: 'block.selfStudy', category: 'reading', core: true },
  { start: '21:55', end: '22:20', titleKey: 'block.fiction', category: 'reading', core: true },
  { start: '22:20', end: '23:00', titleKey: 'block.quietTime', category: 'free' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

const SUN: BlockSeed[] = [
  { start: '09:00', end: '09:30', titleKey: 'block.wakeAlarm', category: 'routine' },
  { start: '09:30', end: '10:00', titleKey: 'block.breakfast', category: 'routine' },
  { start: '10:00', end: '10:30', titleKey: 'block.english', category: 'english', focus: true, core: true },
  { start: '10:30', end: '17:40', titleKey: 'block.sundayAdventure', category: 'free' },
  { start: '17:40', end: '18:00', titleKey: 'block.freelance', category: 'freelance', focus: true },
  { start: '18:00', end: '18:20', titleKey: 'block.weekReview', category: 'routine' },
  { start: '18:20', end: '21:00', titleKey: 'block.rest', category: 'rest' },
  { start: '21:00', end: '21:25', titleKey: 'block.selfStudy', category: 'reading', focus: true, core: true },
  { start: '21:25', end: '21:50', titleKey: 'block.fiction', category: 'reading', focus: true, core: true },
  { start: '21:50', end: '23:00', titleKey: 'block.quietTime', category: 'free' },
  { start: '23:00', end: '23:59', titleKey: 'block.bedtime', category: 'sleep' },
];

function autoDayType(iso: string): 'odd' | 'even' | 'fri' | 'sat' | 'sun' {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  const weekday = date.getDay();
  if (weekday === 5) return 'fri';
  if (weekday === 6) return 'sat';
  if (weekday === 0) return 'sun';
  return date.getDate() % 2 === 1 ? 'odd' : 'even';
}

function getSeedsForIso(iso: string): { dayType: string; seeds: BlockSeed[] } {
  const dt = autoDayType(iso);
  if (dt === 'fri') return { dayType: dt, seeds: FRI };
  if (dt === 'sat') return { dayType: dt, seeds: SAT };
  if (dt === 'sun') return { dayType: dt, seeds: SUN };
  if (dt === 'odd') return { dayType: dt, seeds: ODD };
  return { dayType: dt, seeds: EVEN };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char);
}

function localNow(now: Date, offsetMinutes: number) {
  const shifted = new Date(now.getTime() + offsetMinutes * 60_000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    minute: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

class TelegramClient {
  constructor(private token: string, private chatId: string) {}

  private async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = (await res.json()) as any;
    if (!payload.ok) throw new Error(`${method}: ${payload.description ?? res.status}`);
    return payload.result;
  }

  async send(text: string, buttons: any[][] = []): Promise<number> {
    const res = await this.call<{ message_id: number }>('sendMessage', {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
    });
    return res.message_id;
  }

  async edit(messageId: number, text: string, buttons: any[][] = []): Promise<void> {
    await this.call('editMessageText', {
      chat_id: this.chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
    });
  }

  async pin(messageId: number): Promise<void> {
    await this.call('pinChatMessage', {
      chat_id: this.chatId,
      message_id: messageId,
      disable_notification: true,
    });
  }

  async unpin(messageId: number): Promise<void> {
    await this.call('unpinChatMessage', { chat_id: this.chatId, message_id: messageId }).catch(() => undefined);
  }

  async answerCallback(callbackId: string, text?: string): Promise<void> {
    await this.call('answerCallbackQuery', { callback_query_id: callbackId, text }).catch(() => undefined);
  }
}

// In-memory state persistence per lambda container
const dayDoneBlocks: Record<string, Set<string>> = {};
let pinnedMessageId: number | null = null;

function formatDayPlanText(date: string): string {
  const { dayType, seeds } = getSeedsForIso(date);
  const [y, m, d] = date.split('-').map(Number);
  const dateObj = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  const weekday = dateObj.getDay();

  const wName = ruDict[`weekday.${weekday}`] ?? '';
  const dtName = ruDict[`daytype.${dayType}`] ?? dayType;
  const header = `<b>${wName}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}</b> · ${dtName}`;

  const doneSet = dayDoneBlocks[date] ?? new Set();

  const lines = seeds.map((s, idx) => {
    const id = `${dayType}-${s.titleKey}-${s.start.replace(':', '')}`;
    const mark = doneSet.has(id) ? '✓ ' : '';
    const title = ruDict[s.titleKey] ?? s.titleKey;
    const core = s.core ? ` · ${ruDict['today.minimum']}` : '';
    return `${mark}<code>${s.start}</code> ${escapeHtml(title)}${core}`;
  });

  const doneCount = doneSet.size;
  const footer = `${ruDict['today.done']}: ${doneCount}/${seeds.length} · ${ruDict['today.sleepTarget']}: 23:00`;
  return [header, '', ...lines, '', footer].join('\n');
}

async function publishOrUpdatePlan(telegram: TelegramClient, date: string): Promise<void> {
  const text = formatDayPlanText(date);
  const buttons = [[{ text: ruDict['bot.open'], url: `${APP_URL}/#/today` }]];

  if (pinnedMessageId) {
    try {
      await telegram.edit(pinnedMessageId, text, buttons);
      return;
    } catch {
      pinnedMessageId = null;
    }
  }

  const messageId = await telegram.send(text, buttons);
  await telegram.pin(messageId);
  pinnedMessageId = messageId;
}

async function parseReqBody(req: IncomingMessage): Promise<any> {
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

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
  };

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.statusCode = 200;
    res.end();
    return;
  }

  const body = req.body ?? (await parseReqBody(req));
  const telegram = new TelegramClient(BOT_TOKEN, CHAT_ID);
  const { date } = localNow(new Date(), TZ_OFFSET_MINUTES);

  if (!body) {
    // Health check or direct ping
    return sendJson(200, { ok: true, status: 'bot endpoint ready', date });
  }

  const chatId = String(body.callback_query?.message?.chat.id ?? body.message?.chat.id ?? '');
  if (chatId !== CHAT_ID) {
    return sendJson(200, { ok: true });
  }

  const msgText = body.message?.text ?? '';
  if (msgText.startsWith('/start') || msgText.startsWith('/plan')) {
    await publishOrUpdatePlan(telegram, date);
    return sendJson(200, { ok: true });
  }

  const query = body.callback_query;
  if (query?.data) {
    if (query.data.startsWith('done:')) {
      const blockId = query.data.slice(5);
      if (!dayDoneBlocks[date]) {
        dayDoneBlocks[date] = new Set();
      }
      dayDoneBlocks[date].add(blockId);
      await telegram.answerCallback(query.id, ruDict['bot.marked']);
      await publishOrUpdatePlan(telegram, date);
      return sendJson(200, { ok: true });
    }

    if (query.data.startsWith('snooze:')) {
      await telegram.answerCallback(query.id, ruDict['bot.snoozed']);
      return sendJson(200, { ok: true });
    }

    await telegram.answerCallback(query.id);
    return sendJson(200, { ok: true });
  }

  return sendJson(200, { ok: true });
}
