import { ReactNode } from "react";
import { panelSurfaceClassName } from "./formStyles";

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
};

export function StatCard(props: StatCardProps) {
  const { label, value, icon } = props;
  return (
    <div
      className={`${panelSurfaceClassName} p-5 h-full flex items-center justify-between gap-4 transition-colors hover:border-primary-500/25`}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
          {value}
        </p>
      </div>
      {icon && (
        <div className="shrink-0 text-primary-600 dark:text-primary-400 p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/15">
          {icon}
        </div>
      )}
    </div>
  );
}
