import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "./PageHeader";

export const ownerFormCardClassName =
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-200";

export const ownerFormInputClassName =
  "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white";

export const ownerFormLabelClassName = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1";

type OwnerFormLayoutProps = {
  backTo: string;
  title: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  maxWidthClassName?: string;
};

export function OwnerFormLayout({
  backTo,
  title,
  subtitle,
  headerExtra,
  children,
  maxWidthClassName = "max-w-2xl",
}: OwnerFormLayoutProps) {
  return (
    <div className={`${maxWidthClassName} mx-auto space-y-6`}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {headerExtra}
            <Link
              to={backTo}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Wróć
            </Link>
          </div>
        }
      />
      {children}
    </div>
  );
}
