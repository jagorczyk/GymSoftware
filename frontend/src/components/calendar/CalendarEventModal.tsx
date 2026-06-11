import { FormEvent, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { CalendarEvent, CalendarEventPayload } from "../../api";
import {
  CALENDAR_COLOR_OPTIONS,
  parseInputDateTimeValue,
  toApiDateTime,
  toInputDateTimeValue,
} from "./calendarUtils";
import { dangerButtonClassName, inputClassName, labelClassName, primaryButtonClassName, secondaryButtonClassName } from "../formStyles";

type CalendarEventModalProps = {
  open: boolean;
  mode: "create" | "edit" | "view";
  event: CalendarEvent | null;
  initialValues: CalendarEventPayload;
  onClose: () => void;
  onSave: (payload: CalendarEventPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function CalendarEventModal(props: CalendarEventModalProps) {
  const { open, mode, event, initialValues, onClose, onSave, onDelete } = props;
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [startValue, setStartValue] = useState(toInputDateTimeValue(parseInputDateTimeValue(initialValues.startAt)));
  const [endValue, setEndValue] = useState(toInputDateTimeValue(parseInputDateTimeValue(initialValues.endAt)));
  const [color, setColor] = useState(initialValues.color ?? "blue");
  const [saving, setSaving] = useState(false);

  const readOnly = mode === "view" || (mode === "edit" && event != null && !event.canEdit);

  useEffect(() => {
    if (!open) return;
    setTitle(initialValues.title);
    setDescription(initialValues.description ?? "");
    setStartValue(toInputDateTimeValue(parseInputDateTimeValue(initialValues.startAt)));
    setEndValue(toInputDateTimeValue(parseInputDateTimeValue(initialValues.endAt)));
    setColor(initialValues.color ?? "blue");
  }, [open, initialValues]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    try {
      await onSave({
        title,
        description: description || undefined,
        startAt: toApiDateTime(parseInputDateTimeValue(startValue)),
        endAt: toApiDateTime(parseInputDateTimeValue(endValue)),
        color,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const heading =
    mode === "create" ? "Nowy wpis" : mode === "view" || readOnly ? "Podgląd wpisu" : "Edytuj wpis";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-lg text-slate-900">{heading}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {readOnly && event && (
            <p className="text-sm text-slate-500">
              Autor: {event.createdByEmail}. {event.canEdit ? "" : "Nie masz uprawnień do edycji tego wpisu."}
            </p>
          )}

          <div>
            <label className={labelClassName}>Tytuł</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClassName}
              required
              readOnly={readOnly}
            />
          </div>

          <div>
            <label className={labelClassName}>Opis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClassName} min-h-[80px]`}
              readOnly={readOnly}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Start</label>
              <input
                type="datetime-local"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                className={inputClassName}
                required
                readOnly={readOnly}
              />
            </div>
            <div>
              <label className={labelClassName}>Koniec</label>
              <input
                type="datetime-local"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
                className={inputClassName}
                required
                readOnly={readOnly}
              />
            </div>
          </div>

          {!readOnly && (
            <div>
              <label className={labelClassName}>Kolor</label>
              <div className="flex flex-wrap gap-2">
                {CALENDAR_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setColor(option.id)}
                    className={`w-8 h-8 rounded-lg border-2 ${option.className.split(" ")[0]} ${
                      color === option.id ? "ring-2 ring-offset-2 ring-primary-500" : "border-transparent"
                    }`}
                    aria-label={option.id}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
            {mode === "edit" && onDelete && event?.canEdit && (
              <button type="button" onClick={handleDelete} disabled={saving} className={dangerButtonClassName}>
                <Trash2 className="w-4 h-4" />
                Usuń
              </button>
            )}
            <button type="button" onClick={onClose} className={secondaryButtonClassName}>
              {readOnly ? "Zamknij" : "Anuluj"}
            </button>
            {!readOnly && (
              <button type="submit" disabled={saving} className={primaryButtonClassName}>
                {mode === "create" ? "Dodaj" : "Zapisz"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
