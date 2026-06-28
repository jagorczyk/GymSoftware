import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { focusRingClassName, panelSurfaceClassName } from "./formStyles";

type EntityListCardProps = {
  title: string;
  subtitle?: string;
  metadata?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  avatarUrl?: string | null;
};

export function EntityListCard(props: EntityListCardProps) {
  const {
    title,
    subtitle,
    metadata,
    onClick,
    selected = false,
    disabled = false,
    showChevron = true,
    avatarUrl,
  } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-2xl border p-5 transition-colors ${focusRingClassName} ${
        disabled
          ? "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-70 cursor-not-allowed"
          : selected
            ? "bg-primary-50 dark:bg-primary-950/20 border-primary-300 dark:border-primary-800 ring-1 ring-primary-100 dark:ring-primary-950/30"
            : `${panelSurfaceClassName} hover:border-primary-500/25`
      }`}
    >
      <div className="flex flex-col h-full justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          {avatarUrl ? (
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
              <img
                src={avatarUrl.startsWith("http") ? avatarUrl : `${avatarUrl}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="text-lg font-display font-bold text-slate-500 dark:text-slate-400">
                {title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {showChevron && !disabled && (
            <div
              className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 truncate tracking-tight">
            {title}
          </p>
          {subtitle && (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 truncate">{subtitle}</p>
          )}
          {metadata && <div className="mt-3">{metadata}</div>}
        </div>
      </div>
    </button>
  );
}
