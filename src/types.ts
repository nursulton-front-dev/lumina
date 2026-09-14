import type { TranslationKey } from './i18n';

export type Lang = 'ru' | 'uz' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';

/** Тип дня: нечётный будний, чётный будний, суббота, воскресенье. */
export type DayTypeCode = 'odd' | 'even' | 'fri' | 'sat' | 'sun';

/** Направление, по которому считаются часы в недельном отчёте. */
export type Category =
  | 'routine'
  | 'sport'
  | 'russian'
  | 'english'
  | 'ioi'
  | 'freelance'
  | 'homework'
  | 'school'
  | 'memory'
  | 'reading'
  | 'speech'
  | 'commute'
  | 'rest'
  | 'free'
  | 'sleep';

/** Правило, по которому будний день становится «английским». */
export type EnglishMode = 'parity' | 'weekdays';

export type ProtocolId = 'workout' | 'numbers' | 'speech' | 'week-review';

/** Блок расписания. Время — минуты от полуночи, так проще считать. */
export interface Block {
  id: string;
  dayType: DayTypeCode;
  /** Пустая строка — шаблон типа дня; дата — разовая копия дня. */
  date: string;
  /** Дни недели, в которые блок действует (0 — воскресенье). Пусто — во все дни типа. */
  weekdays: number[];
  start: number;
  end: number;
  /** Ключ перевода для встроенных блоков. */
  titleKey: TranslationKey | null;
  /** Произвольное название, если блок создан или переименован пользователем. */
  title: string | null;
  category: Category;
  protocolId: ProtocolId | null;
  /** Входит в минимум дня — по таким блокам считается серия. */
  isCore: boolean;
  /** Напоминать о начале через Telegram-бота. */
  remind?: boolean;
  /** Блок глубокой работы: доступен помодоро. */
  isFocus: boolean;
  order: number;
  updatedAt: string;
  deleted?: boolean;
}

export interface Profile {
  id: string;
  lang: Lang;
  theme: ThemeMode;
  heightCm: number;
  weightKg: number;
  wakeTime: string;
  /** Целевое время отбоя на сегодня, «ЧЧ:ММ». Сдвигается режимом сна. */
  sleepTarget: string;
  /** Дата последнего сдвига цели сна, ISO-дата. */
  sleepTargetShiftedOn: string | null;
  schoolStart: string;
  schoolEnd: string;
  commuteMinutes: number;
  /** Как определять будний тип дня: по чётности числа или по дням недели. */
  englishMode: EnglishMode;
  /** Дни недели с английским (0 — воскресенье), когда englishMode = 'weekdays'. */
  englishDays: number[];
  equipment: string[];
  hasBall: boolean;
  goals: string;
  maxPullups: number;
  maxPushups: number;
  voiceName: string | null;
  /** Telegram-бот: адрес воркера и ключ синхронизации. Живут только на устройстве. */
  botUrl: string;
  botKey: string;
  /** Начало текущего четырёхнедельного сезона, ISO-дата. */
  seasonStart: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayRecord {
  id: string;
  date: string;
  typeOverride: DayTypeCode | null;
  minDone: boolean;
  bedtimeActual: string | null;
  updatedAt: string;
  deleted?: boolean;
}

export interface Check {
  id: string;
  date: string;
  blockId: string;
  doneAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export type SessionKind = 'pomodoro' | 'protocol';

export interface WorkSession {
  id: string;
  date: string;
  blockId: string | null;
  kind: SessionKind;
  minutes: number;
  exits: number;
  broken: boolean;
  startedAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export type MetricId =
  | 'pullups'
  | 'pushups'
  | 'legRaises'
  | 'longJump'
  | 'verticalJump'
  | 'towelHang'
  | 'digits'
  | 'fillers'
  | 'bedtimeDrift';

export interface Measure {
  id: string;
  date: string;
  metric: MetricId;
  value: number;
  note: string | null;
  updatedAt: string;
  deleted?: boolean;
}

export type LogKind = 'protocol' | 'speech' | 'ioi' | 'note' | 'workout';

export type MessageRole = 'user' | 'assistant' | 'tool';

export interface AssistantMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Имя вызванного инструмента для служебных сообщений. */
  toolName: string | null;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

/** История правок расписания: нужна для «отменить последнее изменение». */
export interface ChangeRecord {
  id: string;
  createdAt: string;
  summary: string;
  /** Область действия в сериализованном виде. */
  scope: Record<string, unknown>;
  dayType: DayTypeCode;
  /** Дата, если изменение только на один день. */
  date: string;
  /** Снимки блоков до и после — для отмены. */
  before: Block[];
  after: Block[];
  applied: boolean;
  undone: boolean;
  updatedAt: string;
  deleted?: boolean;
}

export interface LogEntry {
  id: string;
  date: string;
  kind: LogKind;
  payload: Record<string, unknown>;
  updatedAt: string;
  deleted?: boolean;
}
