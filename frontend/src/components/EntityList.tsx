import { ReactNode } from "react";
import { EmptyState } from "./EmptyState";

type EntityListProps = {
  emptyMessage?: string;
  children: ReactNode;
};

export function EntityList(props: EntityListProps) {
  const { emptyMessage = "Brak danych", children } = props;

  const items = Array.isArray(children) ? children : [children];
  const visible = items.filter(Boolean);

  if (visible.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {children}
    </div>
  );
}
