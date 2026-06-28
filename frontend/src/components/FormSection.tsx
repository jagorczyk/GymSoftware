import { ReactNode } from "react";
import { panelSurfaceClassName } from "./formStyles";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection(props: FormSectionProps) {
  const { title, description, children, className = "" } = props;

  return (
    <div className={`p-6 md:p-8 ${panelSurfaceClassName} ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
