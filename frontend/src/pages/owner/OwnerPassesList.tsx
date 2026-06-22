import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatusChip } from "../../components/StatusChip";
import type { OwnerContext } from "./types";

function guestName(pass: { guestId: number; guestFirstName?: string; guestLastName?: string }) {
  if (pass.guestFirstName) {
    return `${pass.guestFirstName} ${pass.guestLastName ?? ""}`.trim();
  }
  return `Klient ID: ${pass.guestId}`;
}

export function OwnerPassesList({ ctx }: { ctx: OwnerContext }) {
  const { details } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!details) return [];
    const q = query.trim().toLowerCase();
    if (!q) return details.passes;
    return details.passes.filter((p) => {
      const client = guestName(p);
      return client.toLowerCase().includes(q) || p.passType.toLowerCase().includes(q);
    });
  }, [details, query]);

  if (!details) return <SelectGymPrompt />;

  return (
    <div className="space-y-4">
      <ListToolbar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Szukaj karnetu..." />
      <EntityList emptyMessage="Brak karnetów">
        {filtered.map((p) => (
          <EntityListCard
            key={p.id}
            title={guestName(p)}
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
