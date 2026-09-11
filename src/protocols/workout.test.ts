import { describe, expect, test } from 'vitest';
import { resolveWorkout, type WorkoutContext } from './workout';

function context(patch: Partial<WorkoutContext> = {}): WorkoutContext {
  return {
    weekday: 1,
    maxPullups: 2,
    maxPushups: 25,
    hasBall: false,
    deload: false,
    daysUntilDeload: 10,
    adjustments: {},
    maxTestDue: false,
    weeklyLandings: 0,
    weeksTrained: 0,
    ...patch,
  };
}

describe('структура тренировки', () => {
  test('разминка идёт первым шагом и не пропускается', () => {
    const [first] = resolveWorkout(context()).steps;
    expect(first?.id).toBe('warmup');
    expect(first?.locked).toBe(true);
    expect(first?.seconds).toBe(240);
    expect(first?.items).toHaveLength(6);
  });

  test('протокол заканчивается душем', () => {
    const steps = resolveWorkout(context()).steps;
    expect(steps.at(-1)?.id).toBe('shower');
  });

  test('в воскресенье силовой работы нет, разминка отдельная не нужна', () => {
    const protocol = resolveWorkout(context({ weekday: 0 }));
    expect(protocol.steps[0]?.id).toBe('ex.mobilityHips');
    expect(protocol.steps.every((step) => step.sets === null)).toBe(true);
  });

  test('у каждого шага с подходами задан отдых', () => {
    const protocol = resolveWorkout(context({ weekday: 4 }));
    for (const step of protocol.steps) {
      if (step.sets) expect(step.sets.restSeconds).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('уровень подтягиваний', () => {
  test('со стартовыми двумя подтягиваниями идут австралийские и негативы', () => {
    const protocol = resolveWorkout(context({ weekday: 2 }));
    const ids = protocol.steps.map((step) => step.id);
    expect(ids).toContain('ex.australianPullups');
    expect(ids).toContain('ex.negativePullups');
    expect(ids).not.toContain('ex.pullups');
    expect(protocol.subtitleKey).toBe('workout.level.beginner');
  });

  test('на среднем уровне работа идёт от максимума минус два', () => {
    const protocol = resolveWorkout(context({ weekday: 2, maxPullups: 7 }));
    const pullups = protocol.steps.find((step) => step.id === 'ex.pullups');
    expect(pullups?.sets?.reps).toBe(5);
    expect(protocol.subtitleKey).toBe('workout.level.intermediate');
  });

  test('на продвинутом уровне добавляется вес', () => {
    const protocol = resolveWorkout(context({ weekday: 2, maxPullups: 12 }));
    const ids = protocol.steps.map((step) => step.id);
    expect(ids).toContain('ex.weightedPullups');
    expect(protocol.steps.find((step) => step.id === 'ex.pullups')?.sets?.reps).toBe(8);
  });
});

describe('разгрузка и снижение нагрузки', () => {
  test('разгрузочная неделя срезает подходы и повторения', () => {
    const normal = resolveWorkout(context());
    const deload = resolveWorkout(context({ deload: true }));
    const normalSquats = normal.steps.find((step) => step.id === 'ex.jumpSquats')?.sets;
    const deloadSquats = deload.steps.find((step) => step.id === 'ex.jumpSquats')?.sets;
    expect(normalSquats?.sets).toBe(4);
    expect(deloadSquats?.sets).toBe(2);
    expect(deloadSquats?.reps).toBe(4);
    expect(deload.notes.some((note) => note.key === 'workout.note.deload')).toBe(true);
  });

  test('о разгрузке предупреждают заранее', () => {
    const protocol = resolveWorkout(context({ daysUntilDeload: 2 }));
    expect(protocol.notes.some((note) => note.key === 'workout.note.deloadSoon')).toBe(true);
  });

  test('снижение после провалов уменьшает повторения и попадает в примечания', () => {
    const protocol = resolveWorkout(context({ adjustments: { 'ex.jumpSquats': 0.9 } }));
    expect(protocol.steps.find((step) => step.id === 'ex.jumpSquats')?.sets?.reps).toBe(5);
    expect(protocol.notes.some((note) => note.key === 'workout.note.reduced')).toBe(true);
  });

  test('превышение лимита приземлений вызывает предупреждение', () => {
    const protocol = resolveWorkout(context({ weeklyLandings: 90 }));
    expect(protocol.notes.some((note) => note.key === 'workout.note.landings')).toBe(true);
  });
});

describe('пятница и мяч', () => {
  test('замеры максимума появляются только когда подошёл срок', () => {
    const skipped = resolveWorkout(context({ weekday: 5, maxTestDue: false }));
    const due = resolveWorkout(context({ weekday: 5, maxTestDue: true }));
    expect(skipped.steps.map((step) => step.id)).not.toContain('ex.pullupsTest');
    expect(due.steps.map((step) => step.id)).toContain('ex.pullupsTest');
  });

  test('прыжковые замеры идут каждую пятницу', () => {
    const protocol = resolveWorkout(context({ weekday: 5 }));
    const ids = protocol.steps.map((step) => step.id);
    expect(ids).toContain('ex.longJumpTest');
    expect(protocol.steps.find((step) => step.id === 'ex.longJumpTest')?.attempts).toBe(5);
  });

  test('без мяча удары не появляются, с мячом появляются', () => {
    const without = resolveWorkout(context({ weekday: 6 }));
    const withBall = resolveWorkout(context({ weekday: 6, hasBall: true }));
    expect(without.steps.map((step) => step.id)).not.toContain('ex.ballStrikes');
    expect(withBall.steps.map((step) => step.id)).toContain('ex.ballStrikes');
  });

  test('среда с мячом получает дополнительный блок', () => {
    const withBall = resolveWorkout(context({ weekday: 3, hasBall: true }));
    expect(withBall.steps.map((step) => step.id)).toContain('ex.ballControl');
  });
});

describe('безопасность', () => {
  test('во вторник показывается правило про армрестлинг', () => {
    expect(resolveWorkout(context({ weekday: 2 })).safetyKeys).toContain('safety.arm');
  });

  test('в прыжковые дни показывается правило про приземление', () => {
    expect(resolveWorkout(context({ weekday: 1 })).safetyKeys).toContain('safety.plyo');
  });

  test('правило про острую боль есть всегда', () => {
    for (const weekday of [0, 1, 2, 3, 4, 5, 6]) {
      expect(resolveWorkout(context({ weekday })).safetyKeys).toContain('safety.pain');
    }
  });
});
