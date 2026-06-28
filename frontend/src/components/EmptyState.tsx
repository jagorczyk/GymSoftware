import { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  message?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState(props: EmptyStateProps) {
  const { message, title, description, icon, action } = props;
  
  const displayTitle = title || message;
  
  return (
    <div className="py-12 flex flex-col items-center justify-center gap-3 text-center" role="status">
      <div className="text-slate-400 dark:text-slate-500 mb-2" aria-hidden="true">
        {icon ?? <Inbox className="w-12 h-12" />}
      </div>
      {displayTitle && <h3 className="text-lg font-display font-bold text-slate-800 dark:text-slate-200">{displayTitle}</h3>}
      {description && <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
