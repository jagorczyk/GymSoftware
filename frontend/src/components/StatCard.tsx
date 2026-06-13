import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
};

export function StatCard(props: StatCardProps) {
  const { label, value, icon } = props;
  return (
    <div className="p-6 h-full rounded-3xl glass-panel bg-cyber-grid-light dark:bg-cyber-grid flex items-center justify-between hover:border-primary-500/30 transition-all duration-300 relative overflow-hidden group shadow-lg">
      <div className="relative z-10">
        <p className="text-[10px] font-display font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      </div>
      {icon && (
        <div className="text-primary-500 dark:text-primary-400 p-3 bg-primary-500/10 dark:bg-primary-500/10 rounded-xl relative z-10 border border-primary-500/20 shadow-[0_0_15px_rgba(142,227,0,0.05)] transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      )}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/5 dark:bg-primary-500/5 rounded-full blur-xl pointer-events-none"></div>
    </div>
  );
}
