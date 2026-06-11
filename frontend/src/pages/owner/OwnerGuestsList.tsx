import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatusChip } from "../../components/StatusChip";
import type { OwnerContext } from "./types";

export function OwnerGuestsList({ ctx }: { ctx: OwnerContext }) {
  const { details } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!details) return [];
    const q = query.trim().toLowerCase();
    if (!q) return details.guests;
    return details.guests.filter(
      (g: any) =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q)
    );
  }, [details, query]);

  if (!details) return <SelectGymPrompt />;

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Szukaj klienta..."
      />
      <EntityList emptyMessage="Brak klientów">
        {filtered.map((g: any) => (
          <EntityListCard
            key={g.id}
            title={`${g.firstName} ${g.lastName}`}
            subtitle={g.email || g.phone || `ID: ${g.id}`}
            avatarUrl={g.avatarUrl}
            metadata={
              <div className="flex flex-wrap gap-2">
                <StatusChip
                  status={g.hasActivePass ? "ACTIVE" : "INACTIVE"}
                  label={g.hasActivePass ? "Aktywny karnet" : "Brak karnetu"}
                />
                <StatusChip
                  status={g.isPresent ? "ACTIVE" : "INACTIVE"}
                  label={g.isPresent ? "Na siłowni" : "Poza siłownią"}
                />
              </div>
            }
            onClick={() => navigate(`/owner/guests/${g.id}`)}
          />
        ))}
      </EntityList>
    </div>
  );
}
