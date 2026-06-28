import { ReactNode } from "react";
import { panelSurfaceClassName } from "./formStyles";

type SectionCardProps = {
  title: string;
  icon?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
};

export function SectionCard(props: SectionCardProps) {
  const { title, icon, headerExtra, children } = props;
  return (
    <div className={`h-full flex flex-col overflow-hidden ${panelSurfaceClassName}`}>
      <div className="p-5 md:p-6 pb-3 md:pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 p-2 rounded-xl shrink-0">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
          </div>
          {headerExtra}
        </div>
      </div>
      <div className="p-5 md:p-6 pt-4 flex-1">{children}</div>
    </div>
  );
}
