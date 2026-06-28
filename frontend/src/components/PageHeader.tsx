import { ReactNode } from "react";
import { panelSurfaceClassName } from "./formStyles";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PageHeader(props: PageHeaderProps) {
  const { title, subtitle, action } = props;
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-6 md:p-8 ${panelSurfaceClassName}`}
    >
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
