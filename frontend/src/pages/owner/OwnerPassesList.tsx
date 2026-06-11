import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatusChip } from "../../components/StatusChip";
import type { OwnerContext } from "./types";

export function OwnerPassesList({ ctx }: { ctx: OwnerContext }) {
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
    if (!q) return details.passes;
    return details.passes.filter((p: any) => {
      const client = guestNameById.get(p.guestId) ?? "";
      return client.toLowerCase().includes(q) || p.passType.toLowerCase().includes(q);
    });
  }, [details, query, guestNameById]);

  if (!details) return <SelectGymPrompt />;

  return (
    <div className="space-y-4">
      <ListToolbar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Szukaj karnetu..." />
      <EntityList emptyMessage="Brak karnetów">
        {filtered.map((p: any) => (
          <EntityListCard
            key={p.id}
            title={guestNameById.get(p.guestId) ?? `Klient ID: ${p.guestId}`}
            subtitle={p.passType}
            metadata={
              <>
                <StatusChip status={p.status} />
                <span className="text-sm font-medium text-slate-600">{p.price} zł</span>
              </>
            }
            onClick={() => navigate(`/owner/passes/${p.id}`)}
          />
        ))}
      </EntityList>
    </div>
  );
}
