import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { secondaryButtonClassName } from "./formStyles";

type DetailPageLayoutProps = {
  backTo: string;
  backLabel?: string;
  breadcrumb?: string;
  title: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
};

export function DetailPageLayout(props: DetailPageLayoutProps) {
  const {
    backTo,
    backLabel = "Wróć do listy",
    breadcrumb,
    title,
    subtitle,
    headerExtra,
    children,
  } = props;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-5">
        {breadcrumb && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm w-fit">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{breadcrumb}</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-950/20 rounded-full blur-3xl opacity-60"></div>
          
          <div className="flex flex-col md:flex-row gap-6 relative z-10 w-full">
            <Link to={backTo} className="w-12 h-12 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 dark:hover:text-primary-400 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all border border-slate-100 dark:border-slate-800 shadow-sm" title={backLabel}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
                {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>}
              </div>
              
              {headerExtra && (
                <div className="flex flex-wrap gap-3 shrink-0">
                  {headerExtra}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
