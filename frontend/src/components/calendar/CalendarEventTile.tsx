import type { CSSProperties } from "react";
import type { GridCalendarEvent } from "./calendarUtils";
import { formatEventTimeRange, getColorClass } from "./calendarUtils";

type CalendarEventTileProps = {
  event: GridCalendarEvent;
  style: { top: string; height: string; left: string; width: string };
  onClick: () => void;
  dragHandleProps?: {
    ref: (node: HTMLElement | null) => void;
    style?: CSSProperties;
    attributes?: Record<string, unknown>;
    listeners?: Record<string, unknown>;
  };
};

export function CalendarEventTile(props: CalendarEventTileProps) {
  const { event, style, onClick, dragHandleProps } = props;
  const colorClass = getColorClass(event.color);

  return (
    <div
      ref={dragHandleProps?.ref}
      style={{ ...style, ...dragHandleProps?.style }}
      {...(dragHandleProps?.attributes ?? {})}
      {...(dragHandleProps?.listeners ?? {})}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        absolute rounded-lg border px-1.5 py-1 text-left shadow-sm overflow-hidden z-10 min-w-0
        ${colorClass}
        ${event.canEdit ? "cursor-grab active:cursor-grabbing hover:brightness-105" : "opacity-80 cursor-pointer"}
      `}
      title={event.canEdit ? event.title : `${event.title} (tylko podgląd)`}
    >
      <p className="text-xs font-semibold truncate">{event.title}</p>
      {event.subtitle && <p className="text-[10px] opacity-90 truncate">{event.subtitle}</p>}
      <p className="text-[10px] opacity-90 truncate">{formatEventTimeRange(event.startAt, event.endAt)}</p>
    </div>
  );
}
