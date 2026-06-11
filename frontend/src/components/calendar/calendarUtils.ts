export type GridCalendarEvent = {
  id: number;
  title: string;
  subtitle?: string;
  startAt: string;
  endAt: string;
  color?: string | null;
  canEdit: boolean;
};

export const CALENDAR_START_HOUR = 6;
export const CALENDAR_END_HOUR = 22;
export const CALENDAR_SLOT_MINUTES = 30;
export const CALENDAR_SLOT_HEIGHT_PX = 28;

export const CALENDAR_COLOR_OPTIONS = [
  { id: "blue", className: "bg-primary-500 border-primary-600 text-white" },
  { id: "slate", className: "bg-slate-500 border-slate-600 text-white" },
  { id: "emerald", className: "bg-emerald-500 border-emerald-600 text-white" },
  { id: "amber", className: "bg-amber-500 border-amber-600 text-white" },
  { id: "violet", className: "bg-violet-500 border-violet-600 text-white" },
  { id: "red", className: "bg-red-500 border-red-600 text-white" },
] as const;

export function getSlotCount() {
  return ((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60) / CALENDAR_SLOT_MINUTES;
}

export function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatWeekTitle(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const fmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" });
  return `${fmt.format(weekStart)} – ${fmt.format(weekEnd)}`;
}

export function formatDayHeader(date: Date) {
  const weekday = new Intl.DateTimeFormat("pl-PL", { weekday: "short" }).format(date);
  return `${weekday} ${date.getDate()}`;
}

export function formatTimeLabel(slotIndex: number) {
  const totalMinutes = CALENDAR_START_HOUR * 60 + slotIndex * CALENDAR_SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatEventTimeRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const fmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function slotDropId(day: string, slotIndex: number) {
  return `slot-${day}-${slotIndex}`;
}

export function parseSlotDropId(id: string) {
  const match = id.match(/^slot-(\d{4}-\d{2}-\d{2})-(\d+)$/);
  if (!match) return null;
  return { day: match[1], slotIndex: Number(match[2]) };
}

export function slotIndexToDate(day: Date, slotIndex: number) {
  const result = new Date(day);
  const totalMinutes = CALENDAR_START_HOUR * 60 + slotIndex * CALENDAR_SLOT_MINUTES;
  result.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return result;
}

export function toApiDateTime(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

export function toInputDateTimeValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function parseInputDateTimeValue(value: string) {
  return new Date(value);
}

export function getMonthStart(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function formatMonthTitle(monthStart: Date) {
  return new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(monthStart);
}

export function getMonthRangeIso(monthStart: Date) {
  const from = new Date(monthStart);
  from.setHours(0, 0, 0, 0);
  const to = addMonths(monthStart, 1);
  to.setHours(0, 0, 0, 0);
  return { from: toApiDateTime(from), to: toApiDateTime(to) };
}

/** Dni siatki miesiąca (pon.–niedz.), z sąsiednich miesięcy dopełniające tydzień. */
export function getMonthGridDays(monthStart: Date) {
  const first = getMonthStart(monthStart);
  const start = new Date(first);
  const weekday = start.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + diff);

  const days: Date[] = [];
  const cursor = new Date(start);
  while (days.length < 42) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function isSameMonth(day: Date, monthStart: Date) {
  return day.getMonth() === monthStart.getMonth() && day.getFullYear() === monthStart.getFullYear();
}

export function getWeekRangeIso(weekStart: Date) {
  const from = new Date(weekStart);
  from.setHours(0, 0, 0, 0);
  const to = addDays(weekStart, 7);
  to.setHours(0, 0, 0, 0);
  return { from: toApiDateTime(from), to: toApiDateTime(to) };
}

export function eventOverlapsDay(event: GridCalendarEvent, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = addDays(dayStart, 1);
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  return start < dayEnd && end > dayStart;
}

export type EventDayLayout = {
  top: string;
  height: string;
  left: string;
  width: string;
};

function getEventTimeRangeForDay(event: GridCalendarEvent, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(CALENDAR_START_HOUR, 0, 0, 0);
  const gridStart = dayStart.getTime();
  const gridEnd = gridStart + (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60 * 60 * 1000;

  const start = Math.max(new Date(event.startAt).getTime(), gridStart);
  const end = Math.min(new Date(event.endAt).getTime(), gridEnd);
  if (end <= start) return null;

  return { start, end, gridStart };
}

function eventsOverlapOnDay(a: GridCalendarEvent, b: GridCalendarEvent, day: Date) {
  const rangeA = getEventTimeRangeForDay(a, day);
  const rangeB = getEventTimeRangeForDay(b, day);
  if (!rangeA || !rangeB) return false;
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

/** Układa nakładające się wpisy obok siebie (węższa szerokość, ta sama wysokość). */
export function computeEventLayoutsForDay(events: GridCalendarEvent[], day: Date): Map<number, EventDayLayout> {
  const result = new Map<number, EventDayLayout>();
  const dayEvents = events.filter((e) => eventOverlapsDay(e, day));
  if (dayEvents.length === 0) return result;

  const totalMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
  const ranges = dayEvents
    .map((event) => ({ event, range: getEventTimeRangeForDay(event, day) }))
    .filter((x): x is { event: GridCalendarEvent; range: NonNullable<ReturnType<typeof getEventTimeRangeForDay>> } => x.range !== null);

  ranges.sort((a, b) => {
    const startDiff = a.range.start - b.range.start;
    if (startDiff !== 0) return startDiff;
    return b.range.end - b.range.start - (a.range.end - a.range.start);
  });

  const columnEnds: number[] = [];
  const columnById = new Map<number, number>();

  for (const { event, range } of ranges) {
    let column = 0;
    while (column < columnEnds.length && columnEnds[column] > range.start) {
      column++;
    }
    if (column === columnEnds.length) {
      columnEnds.push(range.end);
    } else {
      columnEnds[column] = range.end;
    }
    columnById.set(event.id, column);
  }

  for (const { event, range } of ranges) {
    const column = columnById.get(event.id)!;
    const overlapping = ranges.filter(
      ({ event: other }) => other.id !== event.id && eventsOverlapOnDay(event, other, day)
    );
    const columnsInGroup = new Set<number>([column]);
    for (const { event: other } of overlapping) {
      columnsInGroup.add(columnById.get(other.id)!);
    }
    const totalColumns = Math.max(...columnsInGroup) + 1;
    const widthPct = 100 / totalColumns;
    const leftPct = column * widthPct;

    const topMinutes = (range.start - range.gridStart) / 60000;
    const heightMinutes = (range.end - range.start) / 60000;

    result.set(event.id, {
      top: `${(topMinutes / totalMinutes) * 100}%`,
      height: `${(heightMinutes / totalMinutes) * 100}%`,
      left: `calc(${leftPct}% + 2px)`,
      width: `calc(${widthPct}% - 4px)`,
    });
  }

  return result;
}

export function getEventStyleForDay(event: GridCalendarEvent, day: Date): EventDayLayout | null {
  return computeEventLayoutsForDay([event], day).get(event.id) ?? null;
}

export function getColorClass(color: string | null | undefined) {
  return CALENDAR_COLOR_OPTIONS.find((c) => c.id === color)?.className ?? CALENDAR_COLOR_OPTIONS[0].className;
}

export function moveEventToSlot(event: GridCalendarEvent, day: Date, slotIndex: number) {
  const newStart = slotIndexToDate(day, slotIndex);
  const durationMs = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
  const newEnd = new Date(newStart.getTime() + durationMs);
  return { startAt: toApiDateTime(newStart), endAt: toApiDateTime(newEnd) };
}

export function defaultNewEventTimes(day: Date, slotIndex: number) {
  const start = slotIndexToDate(day, slotIndex);
  const end = new Date(start.getTime() + CALENDAR_SLOT_MINUTES * 2 * 60000);
  return { startAt: toApiDateTime(start), endAt: toApiDateTime(end) };
}
