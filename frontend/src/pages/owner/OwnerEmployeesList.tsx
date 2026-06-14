import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { PERMISSION_LABELS, optionalPermissionsFromList, type EmployeePermission } from "../../permissions";
import type { OwnerContext } from "./types";

export function OwnerEmployeesList({ ctx }: { ctx: OwnerContext }) {
  const { details } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!details) return [];
    const q = query.trim().toLowerCase();
    if (!q) return details.employees;
    return details.employees.filter((e: any) => {
      const fullName = `${e.firstName ?? ""} ${e.lastName ?? ""}`.toLowerCase();
      return e.email.toLowerCase().includes(q) || fullName.includes(q);
    });
  }, [details, query]);

  if (!details) return <SelectGymPrompt />;

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Szukaj pracownika po imieniu, nazwisku lub emailu..."
        addLabel="Dodaj pracownika"
        addTo="/owner/employees/new"
      />
      <EntityList emptyMessage="Brak pracowników">
        {filtered.map((e: any) => {
          const extras = optionalPermissionsFromList(e.permissions as EmployeePermission[]);
          const extraLabels = extras.map((p) => PERMISSION_LABELS[p]).join(", ");
          const fullName = [e.firstName, e.lastName].filter(Boolean).join(" ");
          return (
            <EntityListCard
              key={e.id}
              title={fullName || e.email}
              subtitle={
                fullName
                  ? `${e.email}${extraLabels ? ` • ${extraLabels}` : ""}`
                  : extraLabels
                    ? `ID: ${e.id} • Dodatkowo: ${extraLabels}`
                    : `ID: ${e.id} • Tylko uprawnienia podstawowe`
              }
              avatarUrl={e.avatarUrl}
              onClick={() => navigate(`/owner/employees/${e.id}`)}
            />
          );
        })}
      </EntityList>
    </div>
  );
}
