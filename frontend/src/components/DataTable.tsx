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

  const tdClass = size === "small" ? "px-4 py-2.5" : "px-5 py-4";

  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] bg-white ${stickyHeader ? "max-h-[500px]" : ""}`}>
      <table className="w-full text-sm text-left">
        <thead className={`text-xs text-slate-500 uppercase bg-slate-50/80 backdrop-blur-sm ${stickyHeader ? "sticky top-0 z-10 shadow-sm" : ""}`}>
          <tr>
            {columns.map((col) => (
              <th key={col.id} className={`font-bold ${tdClass} text-${col.align ?? "left"}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const key = getRowKey(row);
            const selected = selectedRowKey !== undefined && selectedRowKey === key;
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`
                  ${onRowClick ? "cursor-pointer hover:bg-slate-50/80 transition-colors" : ""}
                  ${selected ? "bg-primary-50/50" : "bg-white"}
                `}
              >
                {columns.map((col) => (
                  <td key={col.id} className={`${tdClass} text-${col.align ?? "left"} text-slate-700 font-medium`}>
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
