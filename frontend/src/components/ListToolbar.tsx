import { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { primaryButtonClassName } from "./formStyles";

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
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] animate-in fade-in slide-in-from-top-4 duration-500">
      {onSearchChange !== undefined && (
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {extra}
        {addLabel && addTo && (
          <Link to={addTo} className={`${primaryButtonClassName} whitespace-nowrap !py-3 !rounded-2xl shadow-sm hover:shadow-md transition-all`}>
            <Plus className="w-5 h-5" />
            {addLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
