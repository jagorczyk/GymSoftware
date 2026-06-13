import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { AuthState } from "../../auth";
import {
  createWorkScheduleEntry,
  deleteWorkScheduleEntry,
  getWorkScheduleEntries,
  updateWorkScheduleEntry,
  type WorkScheduleEntry,
  type WorkScheduleEntryPayload,
  type WorkScheduleEntryType,
} from "../../api";
import { LoadingState } from "../../components/LoadingState";
import { WeekCalendar } from "../../components/calendar/WeekCalendar";
import { MonthCalendar } from "../../components/calendar/MonthCalendar";
import {
  defaultNewEventTimes,
  getMonthRangeIso,
  getMonthStart,
  getWeekRangeIso,
  getWeekStart,
  type GridCalendarEvent,
} from "../../components/calendar/calendarUtils";
import { WorkScheduleEntryModal } from "../../components/workSchedule/WorkScheduleEntryModal";
import {
  WORK_SCHEDULE_ENTRY_TYPES,
  WORK_SCHEDULE_TYPE_LABELS,
  findWorkScheduleConflicts,
  workScheduleLegendClass,
} from "../../components/workSchedule/workScheduleUtils";
import { inputClassName, labelClassName } from "../../components/formStyles";

type EmployeeOption = { id: number; label: string };

type WorkScheduleViewProps = {
  auth: AuthState;
  gymId: number;
  employees: EmployeeOption[];
  isOwner: boolean;
  lockedEmployeeId?: number;
  onError: (message: string) => void;
  onInfo: (message: string) => void;
};

type ModalState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit" | "view";
      entry: WorkScheduleEntry | null;
      initialValues: WorkScheduleEntryPayload;
    };

type ViewMode = "week" | "month";

function toGridEvent(entry: WorkScheduleEntry): GridCalendarEvent & WorkScheduleEntry {
  const typeLabel = WORK_SCHEDULE_TYPE_LABELS[entry.entryType];
  return {
    ...entry,
    title: entry.employeeName,
    subtitle: entry.title && entry.title !== typeLabel ? `${typeLabel} · ${entry.title}` : typeLabel,
    color: entry.color,
  };
}

export function WorkScheduleView(props: WorkScheduleViewProps) {
  const { auth, gymId, employees, isOwner, lockedEmployeeId, onError, onInfo } = props;
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date()));
  const [entries, setEntries] = useState<WorkScheduleEntry[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false });

  const gridEvents = useMemo(() => entries.map(toGridEvent), [entries]);
  const conflicts = useMemo(() => findWorkScheduleConflicts(entries), [entries]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const range =
        viewMode === "week" ? getWeekRangeIso(weekStart) : getMonthRangeIso(monthStart);
      const employeeId = employeeFilter ? Number(employeeFilter) : undefined;
      const data = await getWorkScheduleEntries(auth, gymId, range.from, range.to, employeeId);
      setEntries(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się pobrać grafiku pracy");
    } finally {
      setLoading(false);
    }
  }, [auth, employeeFilter, gymId, monthStart, onError, viewMode, weekStart]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  function defaultEmployeeId(): number {
    if (lockedEmployeeId) return lockedEmployeeId;
    if (employeeFilter) return Number(employeeFilter);
    return employees[0]?.id ?? 0;
  }

  function openCreate(day: Date, slotIndex: number) {
    const defaults = defaultNewEventTimes(day, slotIndex);
    const employeeId = defaultEmployeeId();
    if (!employeeId) {
      onError("Wybierz pracownika, aby dodać wpis do grafiku");
      return;
    }
    setModal({
      open: true,
      mode: "create",
      entry: null,
      initialValues: {
        employeeId,
        entryType: "SHIFT" as WorkScheduleEntryType,
        startAt: defaults.startAt,
        endAt: defaults.endAt,
      },
    });
  }

  function openCreateOnDay(day: Date) {
    const slotIndex = 18;
    openCreate(day, slotIndex);
  }

  function openEntry(entry: WorkScheduleEntry) {
    setModal({
      open: true,
      mode: entry.canEdit ? "edit" : "view",
      entry,
      initialValues: {
        employeeId: entry.employeeId,
        entryType: entry.entryType,
        title: entry.title,
        note: entry.note ?? undefined,
        startAt: entry.startAt,
        endAt: entry.endAt,
      },
    });
  }

  async function handleSave(payload: WorkScheduleEntryPayload) {
    try {
      if (modal.open && modal.mode === "create") {
        await createWorkScheduleEntry(auth, gymId, payload);
        onInfo("Dodano wpis do grafiku pracy");
      } else if (modal.open && modal.mode === "edit" && modal.entry) {
        await updateWorkScheduleEntry(auth, gymId, modal.entry.id, payload);
        onInfo("Zaktualizowano wpis w grafiku pracy");
      }
      await loadEntries();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się zapisać wpisu grafiku");
      throw err;
    }
  }

  async function handleDelete() {
    if (!modal.open || !modal.entry) return;
    try {
      await deleteWorkScheduleEntry(auth, gymId, modal.entry.id);
      onInfo("Usunięto wpis z grafiku pracy");
      await loadEntries();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się usunąć wpisu grafiku");
      throw err;
    }
  }

  async function handleEventMove(entry: WorkScheduleEntry, startAt: string, endAt: string) {
    try {
      await updateWorkScheduleEntry(auth, gymId, entry.id, {
        employeeId: entry.employeeId,
        entryType: entry.entryType,
        title: entry.title,
        note: entry.note ?? undefined,
        startAt,
        endAt,
      });
      onInfo("Przeniesiono wpis w grafiku pracy");
      await loadEntries();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Nie udało się przenieść wpisu");
    }
  }

  const legend = (
    <div className="mt-4 flex flex-wrap gap-2">
      {WORK_SCHEDULE_ENTRY_TYPES.map((type) => (
        <span
          key={type}
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${workScheduleLegendClass(type)}`}
        >
          {WORK_SCHEDULE_TYPE_LABELS[type]}
        </span>
      ))}
    </div>
  );

  const viewModeToggle = (
    <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-sm font-medium">
      <button
        type="button"
        onClick={() => setViewMode("week")}
        className={`px-3 py-2 ${viewMode === "week" ? "bg-primary-500 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
      >
        Tydzień
      </button>
      <button
        type="button"
        onClick={() => setViewMode("month")}
        className={`px-3 py-2 ${viewMode === "month" ? "bg-primary-500 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
      >
        Miesiąc
      </button>
    </div>
  );

  const employeeFilterControl = isOwner ? (
    <div className="sm:w-56">
      <label className={labelClassName}>Pracownik</label>
      <select
        value={employeeFilter}
        onChange={(e) => setEmployeeFilter(e.target.value)}
        className={inputClassName}
      >
        <option value="">Wszyscy</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.label}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  const toolbarExtra = (
    <div className="flex flex-wrap items-end gap-3 ml-0 sm:ml-2">
      {viewModeToggle}
      {employeeFilterControl}
    </div>
  );

  const conflictsBanner =
    conflicts.length > 0 ? (
      <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-amber-900 dark:text-amber-300">Wykryto konflikty w grafiku ({conflicts.length})</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-400">
              {conflicts.slice(0, 5).map((c, i) => (
                <li key={`${c.entryA.id}-${c.entryB.id}-${i}`}>{c.message}</li>
              ))}
            </ul>
            {conflicts.length > 5 && (
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">…i {conflicts.length - 5} kolejnych</p>
            )}
          </div>
        </div>
      </div>
    ) : null;

  if (loading && entries.length === 0) {
    return <LoadingState message="Ładowanie grafiku pracy..." />;
  }

  function handleAddClick() {
    const now = new Date();
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    const minutesFromStart = (now.getHours() - 6) * 60 + now.getMinutes();
    const slotIndex = Math.max(0, Math.min(Math.floor(minutesFromStart / 30), 31));
    openCreate(day, slotIndex);
  }

  return (
    <>
      {conflictsBanner}

      {viewMode === "week" ? (
        <WeekCalendar
          events={gridEvents}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          onSlotClick={openCreate}
          onEventClick={openEntry}
          onEventMove={handleEventMove}
          toolbarExtra={toolbarExtra}
          footer={legend}
          onAddClick={handleAddClick}
        />
      ) : (
        <MonthCalendar
          events={gridEvents}
          monthStart={monthStart}
          onMonthChange={setMonthStart}
          onDayClick={openCreateOnDay}
          onEventClick={openEntry}
          toolbarExtra={toolbarExtra}
          footer={legend}
          onAddClick={handleAddClick}
        />
      )}

      <WorkScheduleEntryModal
        open={modal.open}
        mode={modal.open ? modal.mode : "create"}
        entry={modal.open ? modal.entry : null}
        initialValues={
          modal.open
            ? modal.initialValues
            : {
                employeeId: defaultEmployeeId(),
                entryType: "SHIFT",
                startAt: "",
                endAt: "",
              }
        }
        employees={employees}
        isOwner={isOwner}
        lockedEmployeeId={lockedEmployeeId}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        onDelete={modal.open && modal.mode === "edit" && modal.entry?.canEdit ? handleDelete : undefined}
      />
    </>
  );
}
