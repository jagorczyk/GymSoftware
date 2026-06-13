import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PageHeader(props: PageHeaderProps) {
  const { title, subtitle, action } = props;
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-950/20 rounded-full blur-3xl opacity-60"></div>
      
      <div className="relative z-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{subtitle}</p>
        )}
      </div>
      {action && <div className="relative z-10">{action}</div>}
    </div>
  );
}
