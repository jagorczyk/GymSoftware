import { useDraggable, useDroppable, DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, type ReactNode } from "react";
import { CalendarEventTile } from "./CalendarEventTile";
import { CalendarToolbar } from "./CalendarToolbar";
import {
  CALENDAR_SLOT_HEIGHT_PX,
  dayKey,
  eventOverlapsDay,
  formatDayHeader,
  formatTimeLabel,
  computeEventLayoutsForDay,
  type EventDayLayout,
  getSlotCount,
  getWeekDays,
  getWeekStart,
  moveEventToSlot,
  parseSlotDropId,
  slotDropId,
  slotIndexToDate,
  defaultNewEventTimes,
  type GridCalendarEvent,
} from "./calendarUtils";

type WeekCalendarProps<T extends GridCalendarEvent> = {
  events: T[];
  weekStart: Date;
  onWeekChange: (weekStart: Date) => void;
  onSlotClick: (day: Date, slotIndex: number) => void;
  onEventClick: (event: T) => void;
  onEventMove: (event: T, startAt: string, endAt: string) => Promise<void>;
  onAddClick: () => void;
  toolbarExtra?: ReactNode;
  footer?: ReactNode;
};

function TimeSlot(props: { day: Date; slotIndex: number; onSlotClick: (day: Date, slotIndex: number) => void }) {
  const { day, slotIndex, onSlotClick } = props;
  const id = slotDropId(dayKey(day), slotIndex);
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={() => onSlotClick(day, slotIndex)}
      className={`absolute left-0 right-0 border-t border-slate-100 hover:bg-primary-50/40 transition-colors ${
        isOver ? "bg-primary-100/60" : ""
      }`}
      style={{
        top: slotIndex * CALENDAR_SLOT_HEIGHT_PX,
        height: CALENDAR_SLOT_HEIGHT_PX,
      }}
      aria-label={`Slot ${formatDayHeader(day)} ${formatTimeLabel(slotIndex)}`}
    />
  );
}

function DraggableEvent<T extends GridCalendarEvent>(props: {
  event: T;
  layout: EventDayLayout | undefined;
  onEventClick: (event: T) => void;
}) {
  const { event, layout, onEventClick } = props;
  const stylePos = layout;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event-${event.id}`,
    disabled: !event.canEdit,
  });

  if (!stylePos) return null;

  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <CalendarEventTile
      event={event}
      style={stylePos}
      onClick={() => onEventClick(event)}
      dragHandleProps={
        event.canEdit
          ? {
              ref: setNodeRef,
              style: dragStyle,
              attributes: attributes as unknown as Record<string, unknown>,
              listeners: listeners as unknown as Record<string, unknown>,
            }
          : { ref: setNodeRef, style: dragStyle }
      }
    />
  );
}

function DayColumn<T extends GridCalendarEvent>(props: {
  day: Date;
  events: T[];
  onSlotClick: (day: Date, slotIndex: number) => void;
  onEventClick: (event: T) => void;
}) {
  const { day, events, onSlotClick, onEventClick } = props;
  const slotCount = getSlotCount();
  const dayEvents = events.filter((e) => eventOverlapsDay(e, day));
  const layouts = computeEventLayoutsForDay(events, day);
  const isToday = dayKey(day) === dayKey(new Date());

  return (
    <div className="border-l border-slate-200 min-w-[100px]">
      <div
        className={`sticky top-0 z-20 px-2 py-2 text-center text-xs font-semibold border-b border-slate-200 bg-white ${
          isToday ? "text-primary-700 bg-primary-50" : "text-slate-700"
        }`}
      >
        {formatDayHeader(day)}
      </div>
      <div className="relative" style={{ height: slotCount * CALENDAR_SLOT_HEIGHT_PX }}>
        {Array.from({ length: slotCount }, (_, slotIndex) => (
          <TimeSlot key={slotIndex} day={day} slotIndex={slotIndex} onSlotClick={onSlotClick} />
        ))}
        {dayEvents.map((event) => (
          <DraggableEvent key={event.id} event={event} layout={layouts.get(event.id)} onEventClick={onEventClick} />
        ))}
      </div>
    </div>
  );
}

export function WeekCalendar<T extends GridCalendarEvent>(props: WeekCalendarProps<T>) {
  const { events, weekStart, onWeekChange, onSlotClick, onEventClick, onEventMove, onAddClick, toolbarExtra, footer } =
    props;
  const [activeEvent, setActiveEvent] = useState<T | null>(null);
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const slotCount = getSlotCount();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function handleDragEnd(event: DragEndEvent) {
    setActiveEvent(null);
    const { active, over } = event;
    if (!over) return;

    const eventId = String(active.id).replace(/^event-/, "");
    const calendarEvent = events.find((e) => String(e.id) === eventId);
    if (!calendarEvent || !calendarEvent.canEdit) return;

    const slot = parseSlotDropId(String(over.id));
    if (!slot) return;

    const day = days.find((d) => dayKey(d) === slot.day);
    if (!day) return;

    const moved = moveEventToSlot(calendarEvent, day, slot.slotIndex);
    await onEventMove(calendarEvent, moved.startAt, moved.endAt);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
        <div className="flex-1">
          <CalendarToolbar
            mode="week"
            periodStart={weekStart}
            onPrev={() => onWeekChange(getWeekStart(new Date(weekStart.getTime() - 7 * 86400000)))}
            onNext={() => onWeekChange(getWeekStart(new Date(weekStart.getTime() + 7 * 86400000)))}
            onToday={() => onWeekChange(getWeekStart(new Date()))}
            onAdd={onAddClick}
            toolbarExtra={toolbarExtra}
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const id = String(e.active.id).replace(/^event-/, "");
          setActiveEvent(events.find((ev) => String(ev.id) === id) ?? null);
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveEvent(null)}
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-[900px]">
            <div className="w-16 shrink-0 border-r border-slate-200 bg-slate-50">
              <div className="h-[41px] border-b border-slate-200" />
              <div className="relative" style={{ height: slotCount * CALENDAR_SLOT_HEIGHT_PX }}>
                {Array.from({ length: slotCount }, (_, slotIndex) =>
                  slotIndex % 2 === 0 ? (
                    <div
                      key={slotIndex}
                      className="absolute left-0 right-0 pr-2 text-[10px] text-slate-400 text-right"
                      style={{ top: slotIndex * CALENDAR_SLOT_HEIGHT_PX + 4 }}
                    >
                      {formatTimeLabel(slotIndex)}
                    </div>
                  ) : null
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-7">
              {days.map((day) => (
                <DayColumn
                  key={dayKey(day)}
                  day={day}
                  events={events}
                  onSlotClick={onSlotClick}
                  onEventClick={onEventClick}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeEvent ? (
            <div className="w-40 rounded-lg border border-primary-600 bg-primary-500 text-white px-2 py-1 shadow-lg opacity-90">
              <p className="text-xs font-semibold truncate">{activeEvent.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {footer}
    </div>
  );
}

export { defaultNewEventTimes, slotIndexToDate };
