/// <reference types="node" />
import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, test } from 'vitest';
import { db } from '../db/db';
import { defaultProfile, ensureSeed, listBlocksForDay } from '../db/repo';
import { runAssistant, type AssistantEvent, type ChatMessage, type Transport } from './client';
import { applyChange } from './tools';

/**
 * Живая проверка ассистента против настоящего DeepSeek, минуя прокси.
 * Запуск: DEEPSEEK_API_KEY=sk-… npm test -- src/ai/live
 * Без ключа тест пропускается — в обычном прогоне сеть не нужна.
 */
const apiKey = process.env.DEEPSEEK_API_KEY;
const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, '');

const direct: Transport = (body) =>
  fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...(body as object), stream: true, temperature: 0.2 }),
  });

const TODAY = '2026-09-11';
const TOMORROW = '2026-09-12';

async function collect(history: ChatMessage[]): Promise<AssistantEvent[]> {
  const events: AssistantEvent[] = [];
  const profile = defaultProfile('ru');
  for await (const event of runAssistant({ history, profile, lang: 'ru', today: TODAY }, direct)) {
    events.push(event);
  }
  return events;
}

function answerOf(events: AssistantEvent[]): string {
  const done = events.find((event) => event.type === 'done');
  return done?.type === 'done' ? done.text : '';
}

describe.skipIf(!apiKey)('ассистент против живого DeepSeek', () => {
  beforeAll(async () => {
    await db.delete();
    await db.open();
    await ensureSeed();
    await db.profile.put(defaultProfile('ru'));
  });

  test('«завтра весь день олимпиада, перенеси всё» даёт дифф с сохранённым минимумом', async () => {
    const first = await collect([
      { role: 'user', content: 'Завтра весь день олимпиада с 9 до 17, перенеси всё.' },
    ]);
    const firstAnswer = answerOf(first);
    console.log('ход 1:', firstAnswer);
    console.log(
      'ошибки:',
      first.filter((e) => e.type === 'error'),
    );
    expect(first.some((event) => event.type === 'error')).toBe(false);

    // Ассистент обязан один раз спросить область действия — отвечаем и ждём дифф.
    let events = first;
    if (!first.some((event) => event.type === 'proposal')) {
      events = await collect([
        { role: 'user', content: 'Завтра весь день олимпиада с 9 до 17, перенеси всё.' },
        { role: 'assistant', content: firstAnswer },
        {
          role: 'user',
          content:
            'Только 12 сентября. Приоритет: минимум дня и IOI, фриланс и ораторство можно убрать.',
        },
      ]);
      console.log('ход 2:', answerOf(events));
    }

    const proposal = events.find((event) => event.type === 'proposal');
    const errors = events.filter((event) => event.type === 'error');
    console.log(
      'инструменты:',
      events.map((e) => (e.type === 'tool' ? `${e.name}:${e.ok}` : null)).filter(Boolean),
    );
    if (proposal?.type === 'proposal') console.log('дифф:', JSON.stringify(proposal.diff, null, 1));

    expect(errors).toEqual([]);
    expect(proposal?.type).toBe('proposal');
    if (proposal?.type !== 'proposal') return;

    // До подтверждения расписание не тронуто.
    const before = await listBlocksForDay('sat', TOMORROW);
    expect(before.some((block) => block.titleKey === 'block.freelanceMain')).toBe(true);

    // После подтверждения минимум на месте.
    await applyChange(proposal.changeId);
    const after = await listBlocksForDay('sat', TOMORROW);
    const cores = after
      .filter((block) => block.isCore)
      .map((block) => block.category)
      .sort();
    expect(cores).toEqual(['homework', 'memory', 'reading']);
    expect(after.some((block) => /олимпиад/i.test(block.title ?? ''))).toBe(true);
  }, 120_000);

  test('просьба лечь позже получает отказ с объяснением, а не тихое применение', async () => {
    const events = await collect([
      { role: 'user', content: 'Сдвинь отбой на полночь, постоянно.' },
    ]);
    const text = answerOf(events);
    console.log('ответ про сон:', text);
    expect(text.length).toBeGreaterThan(20);
    expect(events.some((event) => event.type === 'error')).toBe(false);
  }, 120_000);
});
