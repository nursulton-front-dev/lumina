import { describe, expect, test } from 'vitest';
import { formatPlan, resolvePlan, templatePlan } from './plan';
import { dueNow, localNow, remindersFor } from './reminders';

describe('план из шаблона', () => {
  test('понедельник (чётное число) собирается из шаблона чётного дня', () => {
    const plan = templatePlan('2026-09-14', 'ru');
    expect(plan.dayType).toBe('even');
    expect(plan.blocks.some((block) => block.title === 'Забрать брата из садика')).toBe(true);
  });

  test('вторник получает практики IOI, среда — урок IOI', () => {
    const tuesday = templatePlan('2026-09-15', 'ru', 'even');
    const wednesday = templatePlan('2026-09-16', 'ru', 'odd');
    expect(tuesday.blocks.some((block) => block.title === 'IOI: задачи / практика')).toBe(true);
    expect(wednesday.blocks.some((block) => block.title === 'IOI: урок / новая тема')).toBe(true);
  });

  test('пятница — свой тип, отбой в 23:00', () => {
    const plan = templatePlan('2026-09-18', 'ru');
    expect(plan.dayType).toBe('fri');
    expect(plan.sleepTarget).toBe('23:00');
  });

  test('воскресенье: отбой 23:00, названия на узбекском', () => {
    const plan = templatePlan('2026-09-20', 'uz');
    expect(plan.sleepTarget).toBe('23:00');
    expect(plan.blocks[0]?.title).toBe("Uyg'onish");
  });
});

describe('план из приложения', () => {
  test('присланные блоки имеют приоритет, отметки сохраняются', () => {
    const plan = resolvePlan('2026-09-14', 'ru', {
      date: '2026-09-14',
      sleepTarget: '22:45',
      blocks: [
        { id: 'a', start: '09:00', end: '14:00', title: 'Олимпиада', category: 'ioi', done: true },
        {
          id: 'b',
          start: '22:15',
          end: '22:45',
          title: 'Книга',
          category: 'reading',
          isCore: true,
        },
      ],
    });
    expect(plan.blocks.map((block) => block.title)).toEqual(['Олимпиада', 'Книга']);
    expect(plan.blocks[0]?.done).toBe(true);
    expect(plan.sleepTarget).toBe('22:45');
  });

  test('пустой экспорт не ломает план — берётся шаблон', () => {
    const plan = resolvePlan('2026-09-14', 'ru', { date: '2026-09-14' });
    expect(plan.blocks.length).toBeGreaterThan(10);
  });

  test('текст закреплённого сообщения содержит заголовок и отметку', () => {
    const plan = resolvePlan('2026-09-14', 'ru', {
      date: '2026-09-14',
      blocks: [
        { id: 'a', start: '06:00', end: '06:05', title: 'Подъём', category: 'routine', done: true },
      ],
    });
    const text = formatPlan(plan);
    expect(text).toContain('<b>Понедельник, 14.09</b>');
    expect(text).toContain('✓ <code>06:00</code> Подъём');
  });
});

describe('напоминания', () => {
  test('будний день: подъём, брат, отбой минус 30', () => {
    const keys = remindersFor(templatePlan('2026-09-15', 'ru')).map(
      (item) => `${item.key}@${item.minute}`,
    );
    expect(keys).toContain('wake@360');
    expect(keys).toContain('brother@985');
    expect(keys).toContain('sleep@1350');
    expect(keys.some((key) => key.startsWith('english@'))).toBe(false);
  });

  test('понедельник, среда, пятница: выход на английский в 18:15', () => {
    for (const date of ['2026-09-14', '2026-09-16', '2026-09-18']) {
      const keys = remindersFor(templatePlan(date, 'ru')).map(
        (item) => `${item.key}@${item.minute}`,
      );
      expect(keys, date).toContain('english@1095');
    }
  });

  test('воскресенье: подъём 09:00, отбой 23:00 → напоминание в 22:30', () => {
    const list = remindersFor(templatePlan('2026-09-20', 'ru'));
    expect(list.find((item) => item.key === 'wake')?.minute).toBe(540);
    expect(list.find((item) => item.key === 'sleep')?.minute).toBe(1350);
  });

  test('галочка «напоминать» из приложения добавляет напоминание о блоке', () => {
    const plan = resolvePlan('2026-09-14', 'ru', {
      date: '2026-09-14',
      blocks: [
        {
          id: 'x',
          start: '20:15',
          end: '21:45',
          title: 'Фриланс',
          category: 'freelance',
          remind: true,
        },
      ],
    });
    const list = remindersFor(plan);
    expect(list.find((item) => item.key === 'block:x')?.minute).toBe(1215);
    expect(dueNow(list, 1215)).toHaveLength(1);
  });

  test('локальное время: UTC+5', () => {
    expect(localNow(new Date('2026-09-14T00:55:00Z'), 300)).toEqual({
      date: '2026-09-14',
      minute: 355,
    });
    expect(localNow(new Date('2026-09-13T20:30:00Z'), 300)).toEqual({
      date: '2026-09-14',
      minute: 90,
    });
  });
});
