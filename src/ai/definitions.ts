/** Описания инструментов для DeepSeek. Совпадают со схемами в schema.ts. */

const scope = {
  type: 'object',
  description: 'Область действия изменения. Обязательна для любой правки расписания.',
  oneOf: [
    {
      properties: { kind: { const: 'today' }, date: { type: 'string' } },
      required: ['kind', 'date'],
    },
    {
      properties: {
        kind: { const: 'range' },
        from: { type: 'string' },
        to: { type: 'string' },
      },
      required: ['kind', 'from', 'to'],
    },
    {
      properties: {
        kind: { const: 'dayType' },
        dayType: { enum: ['odd', 'even', 'fri', 'sat', 'sun'] },
      },
      required: ['kind', 'dayType'],
    },
    { properties: { kind: { const: 'always' } }, required: ['kind'] },
  ],
} as const;

const blockInput = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    start: { type: 'string', description: 'ЧЧ:ММ' },
    end: { type: 'string', description: 'ЧЧ:ММ' },
    category: {
      enum: [
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
      ],
    },
    isCore: { type: 'boolean' },
    isFocus: { type: 'boolean' },
  },
  required: ['title', 'start', 'end', 'category'],
} as const;

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_schedule',
      description:
        'Читает расписание. Для конкретных дат передайте from и to (ЧЧ не нужны, формат YYYY-MM-DD): тип дня и идентификаторы блоков определятся сами, включая субботу и воскресенье. dayType — только для правки шаблона.',
      parameters: {
        type: 'object',
        properties: {
          dayType: { enum: ['odd', 'even', 'fri', 'sat', 'sun'] },
          from: { type: 'string' },
          to: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_schedule_change',
      description:
        'Готовит изменения расписания и возвращает дифф. НЕ применяет их: применение только после подтверждения пользователя.',
      parameters: {
        type: 'object',
        properties: {
          changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                op: { enum: ['add', 'edit', 'delete'] },
                blockId: { type: 'string' },
                block: blockInput,
                patch: { type: 'object' },
              },
              required: ['op'],
            },
          },
          scope,
          summary: { type: 'string', description: 'Одна строка о сути изменения.' },
        },
        required: ['changes', 'scope', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_schedule_change',
      description: 'Применяет подтверждённое изменение по его идентификатору.',
      parameters: {
        type: 'object',
        properties: { changeId: { type: 'string' } },
        required: ['changeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_block',
      description: 'Готовит добавление одного блока. Требует область действия.',
      parameters: {
        type: 'object',
        properties: { block: blockInput, scope },
        required: ['block', 'scope'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_block',
      description: 'Готовит правку блока по идентификатору.',
      parameters: {
        type: 'object',
        properties: { blockId: { type: 'string' }, patch: { type: 'object' }, scope },
        required: ['blockId', 'patch', 'scope'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_block',
      description: 'Готовит удаление блока.',
      parameters: {
        type: 'object',
        properties: { blockId: { type: 'string' }, scope },
        required: ['blockId', 'scope'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_day_override',
      description: 'Меняет тип конкретного дня. null возвращает автоматический выбор.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          dayType: { enum: ['odd', 'even', 'fri', 'sat', 'sun', null] },
        },
        required: ['date', 'dayType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_event',
      description:
        'Добавляет разовое дело на дату. Если пересечений нет, применяется сразу; иначе возвращает дифф на подтверждение.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          title: { type: 'string' },
          start: { type: 'string' },
          end: { type: 'string' },
          priority: { enum: ['low', 'normal', 'high'] },
        },
        required: ['date', 'title', 'start', 'end'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_progress',
      description: 'Читает замеры метрики за последние дни.',
      parameters: {
        type: 'object',
        properties: {
          metric: {
            enum: [
              'pullups',
              'pushups',
              'legRaises',
              'longJump',
              'verticalJump',
              'towelHang',
              'digits',
              'fillers',
              'bedtimeDrift',
            ],
          },
          days: { type: 'number' },
        },
        required: ['metric'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_today_state',
      description: 'Что уже сделано сегодня, серия, сессии фокуса, цель отбоя.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_note',
      description: 'Записывает заметку в журнал за дату.',
      parameters: {
        type: 'object',
        properties: { date: { type: 'string' }, text: { type: 'string' } },
        required: ['date', 'text'],
      },
    },
  },
] as const;
