const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktywny",
  FREE: "Wolna",
  OCCUPIED: "Zajęta",
  EXPIRED: "Wygasły",
  INACTIVE: "Nieaktywny",
  FROZEN: "Zamrożony",
};

const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  FREE: "bg-slate-100 text-slate-800 border-slate-200",
  OCCUPIED: "bg-amber-100 text-amber-800 border-amber-200",
  EXPIRED: "bg-red-100 text-red-800 border-red-200",
  INACTIVE: "bg-slate-100 text-slate-800 border-slate-200",
  FROZEN: "bg-blue-100 text-blue-800 border-blue-200",
};

type StatusChipProps = {
  status: string;
  size?: "small" | "medium";
  label?: string;
};

export function StatusChip(props: StatusChipProps) {
  const { status, size = "small", label: overrideLabel } = props;
  const normalized = status.toUpperCase();
  const label = overrideLabel ?? STATUS_LABELS[normalized] ?? status;
  const colorClass = STATUS_CLASSES[normalized] ?? "bg-slate-100 text-slate-800 border-slate-200";
  
  const sizeClass = size === "small" ? "text-[10px] px-2.5 py-1" : "text-xs px-3.5 py-1.5";

  return (
    <span className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${colorClass} ${sizeClass} shadow-sm`}>
      {label}
    </span>
  );
}
