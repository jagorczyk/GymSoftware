import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { focusRingClassName, panelSurfaceClassName } from "./formStyles";

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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3">
        {breadcrumb && (
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 w-fit">{breadcrumb}</p>
        )}
        <div className={`p-6 md:p-8 ${panelSurfaceClassName}`}>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
            <Link
              to={backTo}
              aria-label={backLabel}
              className={`w-11 h-11 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 dark:hover:text-primary-400 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors border border-slate-100 dark:border-slate-800 ${focusRingClassName}`}
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>

            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1.5">{subtitle}</p>
                )}
              </div>

              {headerExtra && <div className="flex flex-wrap gap-3 shrink-0">{headerExtra}</div>}
            </div>
          </div>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
