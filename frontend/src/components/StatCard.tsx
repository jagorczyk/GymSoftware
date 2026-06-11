import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
};

export function StatCard(props: StatCardProps) {
  const { label, value, icon } = props;
  return (
    <div className="p-6 h-full rounded-3xl border border-slate-100 bg-white flex items-center justify-between shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">{label}</p>
        <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</p>
      </div>
      {icon && (
        <div className="text-primary-600 p-3 bg-primary-50 rounded-2xl relative z-10">
          {icon}
        </div>
      )}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-50 rounded-full opacity-50 blur-xl"></div>
    </div>
  );
}
