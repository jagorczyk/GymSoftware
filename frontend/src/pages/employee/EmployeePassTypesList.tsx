import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeePassTypes } from "../../api";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { LoadingState } from "../../components/LoadingState";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import { formatPassTypeValidity } from "../../utils/passTypeLabels";
import type { EmployeeContext } from "./types";

export function EmployeePassTypesList({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, setError } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [passTypes, setPassTypes] = useState<Array<any>>([]);

  useEffect(() => {
    if (!selectedGymId) return;
    setLoading(true);
    getEmployeePassTypes(auth, Number(selectedGymId))
      .then(setPassTypes)
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się pobrać oferty karnetów"))
      .finally(() => setLoading(false));
  }, [auth, selectedGymId, setError]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return passTypes;
    return passTypes.filter((pt) => pt.name.toLowerCase().includes(q));
  }, [passTypes, query]);

  if (!selectedGymId) return <SelectGymDashboardPrompt />;
  if (loading) return <LoadingState message="Ładowanie oferty karnetów..." />;

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Szukaj oferty..."
        addLabel="Dodaj typ karnetu"
        addTo="/employee/pass-types/new"
      />
      <EntityList emptyMessage="Brak zdefiniowanych typów karnetów">
        {filtered.map((pt) => (
          <EntityListCard
            key={pt.id}
            title={pt.name}
            subtitle={`${pt.price} zł • ${formatPassTypeValidity(pt)}`}
            onClick={() => navigate(`/employee/pass-types/${pt.id}`)}
          />
        ))}
      </EntityList>
    </div>
  );
}
