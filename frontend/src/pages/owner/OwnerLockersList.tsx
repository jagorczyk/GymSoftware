import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatusChip } from "../../components/StatusChip";
import type { OwnerContext } from "./types";

export function OwnerLockersList({ ctx }: { ctx: OwnerContext }) {
  const { details } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const guestNameById = useMemo(() => {
    const map = new Map<number, string>();
    if (details) {
      for (const g of details.guests) map.set(g.id, `${g.firstName} ${g.lastName}`);
    }
    return map;
  }, [details]);

  const filtered = useMemo(() => {
    if (!details) return [];
    const q = query.trim().toLowerCase();
    if (!q) return details.lockers;
    return details.lockers.filter((l: any) => {
      const client = l.guestId ? guestNameById.get(l.guestId) ?? "" : "";
      return l.lockerNumber.toLowerCase().includes(q) || client.toLowerCase().includes(q);
    });
  }, [details, query, guestNameById]);

  if (!details) return <SelectGymPrompt />;

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Szukaj szafki..."
        addLabel="Dodaj szafkę"
        addTo="/owner/lockers/new"
      />
      <EntityList emptyMessage="Brak szafek">
        {filtered.map((l: any) => (
          <EntityListCard
            key={l.id}
            title={`Szafka ${l.lockerNumber}`}
            subtitle={l.guestId ? guestNameById.get(l.guestId) ?? `Klient ID: ${l.guestId}` : "Wolna"}
            metadata={<StatusChip status={l.status} />}
            onClick={() => navigate(`/owner/lockers/${l.id}`)}
          />
        ))}
      </EntityList>
    </div>
  );
}
