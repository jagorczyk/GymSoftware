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
    <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
      <div className="text-slate-300 mb-2">
        {icon ?? <Inbox className="w-12 h-12" />}
      </div>
      {displayTitle && <h3 className="text-lg font-bold text-slate-800">{displayTitle}</h3>}
      {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
