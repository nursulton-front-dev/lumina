import { z } from 'zod';

/** Область действия изменения: без неё ассистент не имеет права ничего менять. */
export const scopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('today'), date: z.string() }),
  z.object({ kind: z.literal('range'), from: z.string(), to: z.string() }),
  z.object({
    kind: z.literal('dayType'),
    dayType: z.enum(['odd', 'even', 'sat', 'sun']),
  }),
  z.object({ kind: z.literal('always') }),
]);

export type Scope = z.infer<typeof scopeSchema>;

export const categorySchema = z.enum([
  'routine',
  'sport',
  'russian',
  'english',
  'ioi',
  'freelance',
  'homework',
  'school',
  'memory',
  'reading',
  'speech',
  'commute',
  'rest',
  'free',
  'sleep',
]);

export const blockInputSchema = z.object({
  title: z.string().min(1),
  start: z.string().regex(/^\d{1,2}:\d{2}$/),
  end: z.string().regex(/^\d{1,2}:\d{2}$/),
  category: categorySchema,
  isCore: z.boolean().optional(),
  isFocus: z.boolean().optional(),
  protocolId: z.enum(['workout', 'numbers', 'speech', 'week-review']).nullable().optional(),
});

export const changeSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('add'), block: blockInputSchema }),
  z.object({
    op: z.literal('edit'),
    blockId: z.string(),
    patch: blockInputSchema.partial(),
  }),
  z.object({ op: z.literal('delete'), blockId: z.string() }),
]);

export type ScheduleChange = z.infer<typeof changeSchema>;

export const proposeArgs = z.object({
  changes: z.array(changeSchema).min(1),
  scope: scopeSchema,
  summary: z.string().min(1),
});

export const applyArgs = z.object({ changeId: z.string().min(1) });

export const getScheduleArgs = z.object({
  dayType: z.enum(['odd', 'even', 'sat', 'sun']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const addBlockArgs = z.object({ block: blockInputSchema, scope: scopeSchema });

export const editBlockArgs = z.object({
  blockId: z.string(),
  patch: blockInputSchema.partial(),
  scope: scopeSchema,
});

export const deleteBlockArgs = z.object({ blockId: z.string(), scope: scopeSchema });

export const setDayOverrideArgs = z.object({
  date: z.string(),
  dayType: z.enum(['odd', 'even', 'sat', 'sun']).nullable(),
});

export const addEventArgs = z.object({
  date: z.string(),
  title: z.string().min(1),
  start: z.string().regex(/^\d{1,2}:\d{2}$/),
  end: z.string().regex(/^\d{1,2}:\d{2}$/),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export const getProgressArgs = z.object({
  metric: z.enum([
    'pullups',
    'pushups',
    'legRaises',
    'longJump',
    'verticalJump',
    'towelHang',
    'digits',
    'fillers',
    'bedtimeDrift',
  ]),
  days: z.number().int().positive().max(365).default(30),
});

export const logNoteArgs = z.object({ date: z.string(), text: z.string().min(1) });

export const emptyArgs = z.object({});
