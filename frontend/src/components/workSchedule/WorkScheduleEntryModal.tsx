import { FormEvent, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { WorkScheduleEntry, WorkScheduleEntryPayload, WorkScheduleEntryType } from "../../api";
import {
  WORK_SCHEDULE_ENTRY_TYPES,
  WORK_SCHEDULE_TYPE_LABELS,
  workScheduleTypeColor,
} from "./workScheduleUtils";
import {
  parseInputDateTimeValue,
  toApiDateTime,
  toInputDateTimeValue,
} from "../calendar/calendarUtils";
import {
  dangerButtonClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../formStyles";

type EmployeeOption = { id: number; label: string };

type WorkScheduleEntryModalProps = {
  open: boolean;
  mode: "create" | "edit" | "view";
  entry: WorkScheduleEntry | null;
  initialValues: WorkScheduleEntryPayload;
  employees: EmployeeOption[];
  isOwner: boolean;
  lockedEmployeeId?: number;
  onClose: () => void;
  onSave: (payload: WorkScheduleEntryPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function WorkScheduleEntryModal(props: WorkScheduleEntryModalProps) {
  const {
    open,
    mode,
    entry,
    initialValues,
    employees,
    isOwner,
    lockedEmployeeId,
    onClose,
    onSave,
    onDelete,
  } = props;

  const [employeeId, setEmployeeId] = useState(String(initialValues.employeeId));
  const [entryType, setEntryType] = useState<WorkScheduleEntryType>(initialValues.entryType);
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [note, setNote] = useState(initialValues.note ?? "");
  const [startValue, setStartValue] = useState(toInputDateTimeValue(parseInputDateTimeValue(initialValues.startAt)));
  const [endValue, setEndValue] = useState(toInputDateTimeValue(parseInputDateTimeValue(initialValues.endAt)));
  const [saving, setSaving] = useState(false);

  const readOnly = mode === "view" || (mode === "edit" && entry != null && !entry.canEdit);

  useEffect(() => {
    if (!open) return;
    setEmployeeId(String(initialValues.employeeId));
    setEntryType(initialValues.entryType);
    setTitle(initialValues.title ?? "");
    setNote(initialValues.note ?? "");
    setStartValue(toInputDateTimeValue(parseInputDateTimeValue(initialValues.startAt)));
    setEndValue(toInputDateTimeValue(parseInputDateTimeValue(initialValues.endAt)));
  }, [open, initialValues]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    try {
      await onSave({
        employeeId: lockedEmployeeId ?? Number(employeeId),
        entryType,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        startAt: toApiDateTime(parseInputDateTimeValue(startValue)),
        endAt: toApiDateTime(parseInputDateTimeValue(endValue)),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const typeColor = workScheduleTypeColor(entryType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "create" ? "Nowy wpis grafiku" : mode === "edit" ? "Edycja wpisu" : "Podgląd wpisu"}
            </h2>
            <p className="text-sm text-slate-500">{WORK_SCHEDULE_TYPE_LABELS[entryType]}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isOwner && !lockedEmployeeId && (
            <div>
              <label className={labelClassName}>Pracownik</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={readOnly}
                required
                className={inputClassName}
              >
                <option value="">-- Wybierz pracownika --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClassName}>Typ wpisu</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as WorkScheduleEntryType)}
              disabled={readOnly}
              required
              className={inputClassName}
            >
              {WORK_SCHEDULE_ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {WORK_SCHEDULE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Kolor: {typeColor}</p>
          </div>

          <div>
            <label className={labelClassName}>Tytuł (opcjonalnie)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={readOnly}
              placeholder={WORK_SCHEDULE_TYPE_LABELS[entryType]}
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>Notatka</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={readOnly}
              rows={2}
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Od</label>
              <input
                type="datetime-local"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                disabled={readOnly}
                required
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Do</label>
              <input
                type="datetime-local"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
                disabled={readOnly}
                required
                className={inputClassName}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {!readOnly && (
              <button type="submit" disabled={saving} className={primaryButtonClassName}>
                {saving ? "Zapisywanie..." : mode === "create" ? "Dodaj wpis" : "Zapisz zmiany"}
              </button>
            )}
            <button type="button" onClick={onClose} className={secondaryButtonClassName}>
              {readOnly ? "Zamknij" : "Anuluj"}
            </button>
            {mode === "edit" && entry?.canEdit && onDelete && (
              <button
                type="button"
                className={`${dangerButtonClassName} ml-auto`}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onDelete();
                    onClose();
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                Usuń
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
