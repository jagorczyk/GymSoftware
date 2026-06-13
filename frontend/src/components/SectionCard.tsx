import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  icon?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
};

export function SectionCard(props: SectionCardProps) {
  const { title, icon, headerExtra, children } = props;
  return (
    <div className="h-full rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 p-2 rounded-xl">{icon}</div>}
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
          </div>
          {headerExtra}
        </div>
      </div>
      <div className="p-6 pt-2 flex-1">
        {children}
      </div>
    </div>
  );
}
