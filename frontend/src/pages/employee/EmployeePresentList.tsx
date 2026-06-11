import { useNavigate } from "react-router-dom";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

export function EmployeePresentList({ ctx }: { ctx: EmployeeContext }) {
  const { selectedGymId, overview } = ctx;
  const navigate = useNavigate();

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  const present = overview?.presentGuests ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Odświeżane co 10 s</p>
      <EntityList emptyMessage="Brak klientów na siłowni">
        {present.map((g: any) => (
          <EntityListCard
            key={g.guestId}
            title={`${g.firstName} ${g.lastName}`}
            subtitle={g.email || "Brak email"}
            onClick={() => navigate(`/employee/present/${g.guestId}`)}
          />
        ))}
      </EntityList>
    </div>
  );
}
