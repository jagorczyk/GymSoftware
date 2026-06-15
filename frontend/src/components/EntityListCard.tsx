import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

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
      className={`w-full text-left rounded-3xl border shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 transition-all duration-300 group ${
        disabled
          ? "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-70 cursor-not-allowed"
          : selected
            ? "bg-primary-50 dark:bg-primary-950/20 border-primary-300 dark:border-primary-800 shadow-md ring-1 ring-primary-100 dark:ring-primary-950/30"
            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
      }`}
    >
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-50 dark:bg-primary-950/10 rounded-full opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500"></div>
      
      <div className="flex flex-col h-full justify-between gap-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          {avatarUrl ? (
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
              <img src={avatarUrl.startsWith("http") ? avatarUrl : `${avatarUrl}`} alt={title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/40 group-hover:border-primary-100 dark:group-hover:border-primary-800 transition-colors">
              <span className="text-xl font-black text-slate-400 dark:text-slate-500 group-hover:text-primary-500">
                {title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {showChevron && !disabled && (
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-950/40 transition-colors shrink-0">
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
            </div>
          )}
        </div>
        
        <div className="min-w-0 flex-1 mt-2">
          <p className="font-extrabold text-xl text-slate-900 dark:text-slate-100 truncate tracking-tight">{title}</p>
          {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">{subtitle}</p>}
          {metadata && <div className="mt-3">{metadata}</div>}
        </div>
      </div>
    </button>
  );
}
