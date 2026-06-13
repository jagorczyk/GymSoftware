import { useMemo, type ReactNode } from "react";
import { CalendarToolbar } from "./CalendarToolbar";
import {
  dayKey,
  eventOverlapsDay,
  getColorClass,
  getMonthGridDays,
  isSameMonth,
  type GridCalendarEvent,
} from "./calendarUtils";

type MonthCalendarProps<T extends GridCalendarEvent> = {
  events: T[];
  monthStart: Date;
  onMonthChange: (monthStart: Date) => void;
  onDayClick: (day: Date) => void;
  onEventClick: (event: T) => void;
  onAddClick: () => void;
  toolbarExtra?: ReactNode;
  footer?: ReactNode;
};

function formatTimeShort(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function MonthCalendar<T extends GridCalendarEvent>(props: MonthCalendarProps<T>) {
  const { events, monthStart, onMonthChange, onDayClick, onEventClick, onAddClick, toolbarExtra, footer } = props;
  const gridDays = useMemo(() => getMonthGridDays(monthStart), [monthStart]);
  const weekdays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  return (
    <div>
      <CalendarToolbar
        mode="month"
        periodStart={monthStart}
        onPrev={() => {
          const d = new Date(monthStart);
          d.setMonth(d.getMonth() - 1);
          onMonthChange(d);
        }}
        onNext={() => {
          const d = new Date(monthStart);
          d.setMonth(d.getMonth() + 1);
          onMonthChange(d);
        }}
        onToday={() => {
          const d = new Date();
          d.setDate(1);
          d.setHours(0, 0, 0, 0);
          onMonthChange(d);
        }}
        onAdd={onAddClick}
        toolbarExtra={toolbarExtra}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
            {weekdays.map((w) => (
              <div key={w} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDays.map((day) => {
              const inMonth = isSameMonth(day, monthStart);
              const dayEvents = events.filter((e) => eventOverlapsDay(e, day));
              const isToday = dayKey(day) === dayKey(new Date());

              return (
                <button
                  key={dayKey(day)}
                  type="button"
                  onClick={() => onDayClick(day)}
                  className={`min-h-[100px] border-b border-r border-slate-100 dark:border-slate-800/60 p-1.5 text-left align-top hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-colors ${
                    inMonth ? "bg-white dark:bg-slate-900" : "bg-slate-50/80 dark:bg-slate-950/20"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                      isToday ? "bg-primary-500 text-white" : inMonth ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => {
                      const colorClass = getColorClass(event.color);
                      const typeLabel = event.subtitle ?? event.title;
                      return (
                        <div
                          key={event.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              onEventClick(event);
                            }
                          }}
                          className={`w-full truncate rounded px-1 py-0.5 text-[10px] font-medium border ${colorClass}`}
                          title={`${event.title} ${formatTimeShort(event.startAt)} – ${formatTimeShort(event.endAt)}`}
                        >
                          {typeLabel}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 px-1">+{dayEvents.length - 3} więcej</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {footer}
    </div>
  );
}
