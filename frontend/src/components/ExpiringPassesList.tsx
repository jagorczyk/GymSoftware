import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import type { ExpiringPassItem } from "../utils/dashboardStats";

type ExpiringPassesListProps = {
  items: ExpiringPassItem[];
  guestLinkPrefix: string;
  emptyMessage?: string;
};

function formatEndDate(endDate: string) {
  const d = new Date(endDate.includes("T") ? endDate : `${endDate}T12:00:00`);
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function ExpiringPassesList(props: ExpiringPassesListProps) {
  const { items, guestLinkPrefix, emptyMessage = "Brak karnetów wygasających w ciągu 7 dni." } = props;

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-2">{emptyMessage}</p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.guestId}>
          <Link
            to={`${guestLinkPrefix}/${item.guestId}`}
            className="flex items-center justify-between gap-3 py-3 px-1 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">
                {item.firstName} {item.lastName}
              </p>
              <p className="text-sm text-slate-500">Koniec: {formatEndDate(item.endDate)}</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              {item.daysRemaining === 0 ? "dziś" : `${item.daysRemaining} d.`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
