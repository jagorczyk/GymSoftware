import { FormEvent, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  dangerButtonClassName,
} from "../formStyles";

export type TrainerAvailabilityPayload = {
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  slotDurationMinutes: number;
};

type TrainerAvailabilityModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: TrainerAvailabilityPayload;
  onClose: () => void;
  onSave: (payload: TrainerAvailabilityPayload) => void;
  onDelete?: () => void;
};

function formatDatetimeLocal(isoStr: string) {
  if (!isoStr) return "";
  // datetime-local expects "YYYY-MM-DDThh:mm"
  return isoStr.substring(0, 16);
}

function parseDatetimeLocal(val: string) {
  // Pad with seconds if missing
  if (val.length === 16) return val + ":00";
  return val;
}

export function TrainerAvailabilityModal(props: TrainerAvailabilityModalProps) {
  const { open, mode, initialValues, onClose, onSave, onDelete } = props;

  const [startValue, setStartValue] = useState(formatDatetimeLocal(initialValues.startAt));
  const [endValue, setEndValue] = useState(formatDatetimeLocal(initialValues.endAt));
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(initialValues.slotDurationMinutes);

  useEffect(() => {
    if (!open) return;
    setStartValue(formatDatetimeLocal(initialValues.startAt));
    setEndValue(formatDatetimeLocal(initialValues.endAt));
    setSlotDurationMinutes(initialValues.slotDurationMinutes || 60);
  }, [open, initialValues]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      startAt: parseDatetimeLocal(startValue),
      endAt: parseDatetimeLocal(endValue),
      slotDurationMinutes,
    });
    onClose();
  }

  function handleDelete() {
    if (onDelete) {
      onDelete();
    }
    onClose();
  }

  const heading = mode === "create" ? "Nowa dostępność" : "Edytuj dostępność";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{heading}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Od</label>
              <input
                type="datetime-local"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label className={labelClassName}>Do</label>
              <input
                type="datetime-local"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClassName}>Czas trwania pojedynczego treningu</label>
            <select
              value={slotDurationMinutes}
              onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
              className={inputClassName}
              required
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Aplikacja automatycznie podzieli podany wyżej przedział godzinowy na mniejsze bloki do rezerwacji dla klientów.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
            {mode === "edit" && onDelete && (
              <button type="button" onClick={handleDelete} className={dangerButtonClassName}>
                <Trash2 className="w-4 h-4" />
                Usuń
              </button>
            )}
            <button type="button" onClick={onClose} className={secondaryButtonClassName}>
              Anuluj
            </button>
            <button type="submit" className={primaryButtonClassName}>
              {mode === "create" ? "Dodaj" : "Zapisz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
