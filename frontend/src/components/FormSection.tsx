import { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection(props: FormSectionProps) {
  const { title, description, children } = props;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
        {description && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">{description}</p>}
      </div>
      {children}
    </div>
  );
}
