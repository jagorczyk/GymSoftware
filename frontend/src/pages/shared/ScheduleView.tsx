import { useCallback, useEffect, useState } from "react";
import type { AuthState } from "../../auth";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  type CalendarEvent,
  type CalendarEventPayload,
} from "../../api";
import { LoadingState } from "../../components/LoadingState";
import { CalendarEventModal } from "../../components/calendar/CalendarEventModal";
import { WeekCalendar } from "../../components/calendar/WeekCalendar";
import {
  defaultNewEventTimes,
  getWeekRangeIso,
  getWeekStart,
  slotIndexToDate,
} from "../../components/calendar/calendarUtils";

type ScheduleViewProps = {
  auth: AuthState;
  gymId: number;
  onError: (message: string) => void;
  onInfo: (message: string) => void;
};

type ModalState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit" | "view";
      event: CalendarEvent | null;
      initialValues: CalendarEventPayload;
    };

export function ScheduleView(props: ScheduleViewProps) {
  const { auth, gymId, onError, onInfo } = props;
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const range = getWeekRangeIso(weekStart);
      const data = await getCalendarEvents(auth, gymId, range.from, range.to);
      setEvents(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się pobrać terminarza");
    } finally {
      setLoading(false);
    }
  }, [auth, gymId, onError, weekStart]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function openCreate(day: Date, slotIndex: number) {
    const defaults = defaultNewEventTimes(day, slotIndex);
    setModal({
      open: true,
      mode: "create",
      event: null,
      initialValues: { title: "", description: "", ...defaults, color: "blue" },
    });
  }

  function openEvent(event: CalendarEvent) {
    setModal({
      open: true,
      mode: event.canEdit ? "edit" : "view",
      event,
      initialValues: {
        title: event.title,
        description: event.description ?? undefined,
        startAt: event.startAt,
        endAt: event.endAt,
        color: event.color ?? "blue",
      },
    });
  }

  async function handleSave(payload: CalendarEventPayload) {
    try {
      if (modal.open && modal.mode === "create") {
        await createCalendarEvent(auth, gymId, payload);
        onInfo(`Dodano wpis „${payload.title}” do terminarza`);
      } else if (modal.open && modal.mode === "edit" && modal.event) {
        await updateCalendarEvent(auth, gymId, modal.event.id, payload);
        onInfo(`Zaktualizowano wpis „${payload.title}” w terminarzu`);
      }
      await loadEvents();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się zapisać wpisu");
      throw err;
    }
  }

  async function handleDelete() {
    if (!modal.open || !modal.event) return;
    try {
      await deleteCalendarEvent(auth, gymId, modal.event.id);
      onInfo(`Usunięto wpis „${modal.event.title}” z terminarza`);
      await loadEvents();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się usunąć wpisu");
      throw err;
    }
  }

  async function handleEventMove(event: CalendarEvent, startAt: string, endAt: string) {
    try {
      await updateCalendarEvent(auth, gymId, event.id, {
        title: event.title,
        description: event.description ?? undefined,
        startAt,
        endAt,
        color: event.color ?? undefined,
      });
      onInfo(`Przeniesiono wpis „${event.title}” w terminarzu`);
      await loadEvents();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się przenieść wpisu");
    }
  }

  if (loading && events.length === 0) {
    return <LoadingState message="Ładowanie terminarza..." />;
  }

  return (
    <>
      <WeekCalendar
        events={events}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        onSlotClick={openCreate}
        onEventClick={openEvent}
        onEventMove={handleEventMove}
        onAddClick={() => {
          const now = new Date();
          const day = new Date(now);
          day.setHours(0, 0, 0, 0);
          const minutesFromStart = (now.getHours() - 6) * 60 + now.getMinutes();
          const slotIndex = Math.max(0, Math.min(Math.floor(minutesFromStart / 30), 31));
          openCreate(day, slotIndex);
        }}
      />

      <CalendarEventModal
        open={modal.open}
        mode={modal.open ? modal.mode : "create"}
        event={modal.open ? modal.event : null}
        initialValues={
          modal.open
            ? modal.initialValues
            : { title: "", startAt: "", endAt: "", color: "blue" }
        }
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        onDelete={modal.open && modal.mode === "edit" && modal.event?.canEdit ? handleDelete : undefined}
      />
    </>
  );
}
