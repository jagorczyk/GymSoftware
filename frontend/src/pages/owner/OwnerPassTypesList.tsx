import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import type { OwnerContext } from "./types";

export function OwnerPassTypesList({ ctx }: { ctx: OwnerContext }) {
  const { details } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const passTypes = details?.passTypes ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return passTypes;
    return passTypes.filter((pt: any) => pt.name.toLowerCase().includes(q));
  }, [passTypes, query]);

  if (!details) return <SelectGymPrompt />;

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Szukaj oferty..."
        addLabel="Dodaj typ karnetu"
        addTo="/owner/pass-types/new"
      />
      <EntityList emptyMessage="Brak zdefiniowanych typów karnetów">
        {filtered.map((pt: any) => (
          <EntityListCard
            key={pt.id}
            title={pt.name}
            subtitle={`${pt.price} zł • ${pt.durationDays} dni`}
            onClick={() => navigate(`/owner/pass-types/${pt.id}`)}
          />
        ))}
      </EntityList>
    </div>
  );
}
