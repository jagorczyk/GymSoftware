import { ReactNode } from "react";
import { EmptyState } from "./EmptyState";

export type DataTableColumn<T> = {
  id: string;
  label: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
  size?: "small" | "medium";
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | number;
  stickyHeader?: boolean;
};

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    columns,
    rows,
    getRowKey,
    emptyMessage = "Brak danych",
    size = "small",
    onRowClick,
    selectedRowKey,
    stickyHeader = true,
  } = props;

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const tdClass = size === "small" ? "px-4 py-3" : "px-5 py-4";

  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/40 shadow-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md ${stickyHeader ? "max-h-[500px]" : ""}`}>
      <table className="w-full text-sm text-left border-collapse">
        <thead className={`text-[10px] font-display font-black text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/40 dark:border-slate-800/30 ${stickyHeader ? "sticky top-0 z-10 shadow-sm" : ""}`}>
          <tr>
            {columns.map((col) => (
              <th key={col.id} className={`font-black tracking-wider ${tdClass} text-${col.align ?? "left"}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
          {rows.map((row) => {
            const key = getRowKey(row);
            const selected = selectedRowKey !== undefined && selectedRowKey === key;
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`
                  ${onRowClick ? "cursor-pointer hover:bg-slate-100/30 dark:hover:bg-slate-900/40 transition-colors" : ""}
                  ${selected ? "bg-primary-500/10 dark:bg-primary-500/5 text-slate-950 dark:text-primary-400" : ""}
                `}
              >
                {columns.map((col) => (
                  <td key={col.id} className={`${tdClass} text-${col.align ?? "left"} text-slate-700 dark:text-slate-300 font-medium`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
