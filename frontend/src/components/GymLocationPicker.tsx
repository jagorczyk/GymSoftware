import { CheckCircle2, MapPin } from "lucide-react";
import { formatGymAddressLine } from "../utils/gymLabel";

export type GymLocationOption = {
  id: number;
  name: string;
  address?: string;
  city?: string;
};

type GymLocationPickerProps = {
  locations: GymLocationOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function GymLocationPicker({ locations, selectedId, onSelect, disabled }: GymLocationPickerProps) {
  if (locations.length === 0) return null;

  if (locations.length === 1) {
    const gym = locations[0];
    const addressLine = formatGymAddressLine(gym);
    return (
      <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            Lokalizacja
          </p>
          <p className="font-bold text-slate-900 dark:text-white">{gym.name}</p>
          {addressLine ? <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{addressLine}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">
        Wybierz lokalizację
      </label>
      <div className="grid grid-cols-1 gap-3">
        {locations.map((loc) => {
          const isSelected = selectedId === String(loc.id);
          const addressLine = formatGymAddressLine(loc);
          return (
            <button
              key={loc.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(String(loc.id))}
              className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 disabled:opacity-60 ${
                isSelected
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-md"
                  : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isSelected
                    ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 dark:text-white">{loc.name}</p>
                {addressLine ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{addressLine}</p>
                ) : null}
              </div>
              {isSelected ? <CheckCircle2 className="w-6 h-6 text-primary-500 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
