import { describe, expect, test } from 'vitest';
import {
  BREAK_THRESHOLD_MS,
  focusStats,
  isFinished,
  markAway,
  markBack,
  progress,
  remainingMs,
  startSession,
  switchPhase,
} from './pomodoro';

const NOW = new Date('2026-09-10T18:00:00Z').getTime();

function session(mode: 'classic' | 'long' = 'classic') {
  return startSession({ blockId: 'ioi', date: '2026-09-10', mode, now: NOW });
}

describe('запуск и отсчёт', () => {
  test('классический режим даёт 25 минут работы', () => {
    expect(remainingMs(session(), NOW)).toBe(25 * 60_000);
  });

  test('длинный режим даёт 50 минут работы', () => {
    expect(remainingMs(session('long'), NOW)).toBe(50 * 60_000);
  });

  test('отсчёт идёт по абсолютному времени, а не по тикам', () => {
    const state = session();
    expect(remainingMs(state, NOW + 10 * 60_000)).toBe(15 * 60_000);
    expect(isFinished(state, NOW + 25 * 60_000)).toBe(true);
  });

  test('перезагрузка посреди сессии не сдвигает конец', () => {
    const restored = { ...session() };
    expect(remainingMs(restored, NOW + 24 * 60_000)).toBe(60_000);
  });

  test('прогресс не выходит за границы', () => {
    const state = session();
    expect(progress(state, NOW)).toBe(0);
    expect(progress(state, NOW + 999 * 60_000)).toBe(1);
  });
});

describe('выходы и срывы', () => {
  test('короткий уход считается выходом, но сессию не рвёт', () => {
    const away = markAway(session(), NOW + 60_000);
    const back = markBack(away, NOW + 60_000 + 10_000);
    expect(back.exits).toBe(1);
    expect(back.broken).toBe(false);
  });

  test('уход дольше двадцати секунд помечает сессию сорванной', () => {
    const away = markAway(session(), NOW + 60_000);
    const back = markBack(away, NOW + 60_000 + BREAK_THRESHOLD_MS + 1);
    expect(back.exits).toBe(1);
    expect(back.broken).toBe(true);
  });

  test('уход во время отдыха не считается', () => {
    const rest = switchPhase(session(), NOW + 25 * 60_000);
    const away = markAway(rest, NOW + 26 * 60_000);
    expect(away.awaySince).toBeNull();
    expect(markBack(away, NOW + 27 * 60_000).exits).toBe(0);
  });

  test('повторный уход без возврата не удваивает счётчик', () => {
    const first = markAway(session(), NOW + 10_000);
    const second = markAway(first, NOW + 20_000);
    expect(second.awaySince).toBe(NOW + 10_000);
  });
});

describe('смена фаз', () => {
  test('после работы идёт отдых, цикл засчитан', () => {
    const rest = switchPhase(session(), NOW + 25 * 60_000);
    expect(rest.phase).toBe('rest');
    expect(rest.cycles).toBe(1);
    expect(remainingMs(rest, NOW + 25 * 60_000)).toBe(5 * 60_000);
  });

  test('новая рабочая фаза начинает счёт выходов заново', () => {
    const broken = markBack(markAway(session(), NOW), NOW + 60_000);
    const rest = switchPhase(broken, NOW + 25 * 60_000);
    const work = switchPhase(rest, NOW + 30 * 60_000);
    expect(work.exits).toBe(0);
    expect(work.broken).toBe(false);
    expect(work.cycles).toBe(1);
  });
});

describe('сводка за день', () => {
  test('чистые и сорванные сессии считаются отдельно', () => {
    const stats = focusStats([
      { kind: 'pomodoro', broken: false, exits: 0, minutes: 25 },
      { kind: 'pomodoro', broken: true, exits: 3, minutes: 25 },
      { kind: 'protocol', broken: false, exits: 0, minutes: 22 },
    ]);
    expect(stats).toEqual({ clean: 1, broken: 1, exits: 3, minutes: 50 });
  });
});
