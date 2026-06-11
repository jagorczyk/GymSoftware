import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { secondaryButtonClassName, primaryButtonClassName } from "../formStyles";
import { formatMonthTitle, formatWeekTitle } from "./calendarUtils";

type CalendarToolbarProps = {
  mode?: "week" | "month";
  periodStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAdd: () => void;
  toolbarExtra?: ReactNode;
  /** @deprecated use periodStart + onPrev */
  weekStart?: Date;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
};

export function CalendarToolbar(props: CalendarToolbarProps) {
  const {
    mode = "week",
    periodStart,
    onPrev,
    onNext,
    onToday,
    onAdd,
    toolbarExtra,
    weekStart,
    onPrevWeek,
    onNextWeek,
  } = props;

  const start = periodStart ?? weekStart!;
  const goPrev = onPrev ?? onPrevWeek!;
  const goNext = onNext ?? onNextWeek!;
  const title = mode === "month" ? formatMonthTitle(start) : formatWeekTitle(start);
  const prevLabel = mode === "month" ? "Poprzedni miesiąc" : "Poprzedni tydzień";
  const nextLabel = mode === "month" ? "Następny miesiąc" : "Następny tydzień";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={goPrev} className={secondaryButtonClassName} aria-label={prevLabel}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button type="button" onClick={onToday} className={secondaryButtonClassName}>
          Dziś
        </button>
        <button type="button" onClick={goNext} className={secondaryButtonClassName} aria-label={nextLabel}>
          <ChevronRight className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-slate-900 ml-2 capitalize">{title}</h3>
        {toolbarExtra}
      </div>
      <button type="button" onClick={onAdd} className={primaryButtonClassName}>
        <Plus className="w-4 h-4" />
        Dodaj wpis
      </button>
    </div>
  );
}
