import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { hasEmployeePermission } from "../../permissions";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

export function EmployeeLockersList({ ctx }: { ctx: EmployeeContext }) {
  const { selectedGymId, overview, permissions } = ctx;
  const navigate = useNavigate();

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  const keys = overview?.activeKeys ?? [];
  const canCreateLockers = hasEmployeePermission(permissions, "CREATE_LOCKERS");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">Odświeżane co 10 s</p>
        {canCreateLockers && (
          <Link
            to="/employee/lockers/new"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj szafkę
          </Link>
        )}
      </div>
      <EntityList emptyMessage="Brak aktywnych kluczyków">
        {keys.map((k: any) => (
          <EntityListCard
            key={`${k.lockerId}-${k.guestId}`}
            title={`Szafka ${k.lockerNumber}`}
            subtitle={k.guestName}
            onClick={() => navigate(`/employee/lockers/${k.lockerId}`)}
          />
        ))}
      </EntityList>
    </div>
  );
}
