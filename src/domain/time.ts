/** Работа со временем. Всё в минутах от полуночи и в локальных ISO-датах. */

export const MINUTES_IN_DAY = 24 * 60;

/** «07:05» → 425. Некорректная строка даёт 0. */
export function toMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return 0;
  return hours * 60 + minutes;
}

/** 425 → «07:05». Значения за пределами суток заворачиваются. */
export function fromMinutes(value: number): string {
  const total = ((Math.round(value) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatRange(start: number, end: number): string {
  return `${fromMinutes(start)}–${fromMinutes(end)}`;
}

/** Локальная дата в формате YYYY-MM-DD (не UTC — иначе день «съезжает»). */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function addDays(iso: string, days: number): string {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Понедельник той недели, в которую попадает дата. */
export function startOfWeek(iso: string): string {
  const date = fromISODate(iso);
  const shift = (date.getDay() + 6) % 7;
  return addDays(iso, -shift);
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Разница в днях между двумя ISO-датами (b - a). */
export function daysBetween(a: string, b: string): number {
  const start = fromISODate(a).getTime();
  const end = fromISODate(b).getTime();
  return Math.round((end - start) / 86_400_000);
}

export interface DurationLabels {
  hour: string;
  min: string;
}

/** 95 → «1 ч 35 мин», 40 → «40 мин». */
export function formatDuration(minutes: number, labels: DurationLabels): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} ${labels.min}`;
  if (rest === 0) return `${hours} ${labels.hour}`;
  return `${hours} ${labels.hour} ${rest} ${labels.min}`;
}

/** Секунды в «MM:SS» либо «H:MM:SS» — для таймеров. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(rest).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
