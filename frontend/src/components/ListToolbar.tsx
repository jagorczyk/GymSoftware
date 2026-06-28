import { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { panelSurfaceClassName, primaryButtonClassName } from "./formStyles";

type ListToolbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  addLabel?: string;
  addTo?: string;
  extra?: ReactNode;
};

export function ListToolbar(props: ListToolbarProps) {
  const {
    searchValue,
    onSearchChange,
    searchPlaceholder = "Szukaj...",
    addLabel,
    addTo,
    extra,
  } = props;

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 items-stretch sm:items-center p-4 md:p-5 ${panelSurfaceClassName}`}
    >
      {onSearchChange !== undefined && (
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-colors font-medium text-slate-900 dark:text-white"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {extra}
        {addLabel && addTo && (
          <Link
            to={addTo}
            className={`${primaryButtonClassName} whitespace-nowrap !py-3 !rounded-2xl shadow-sm hover:shadow-md`}
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            {addLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
