import { useNavigate } from "react-router-dom";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import type { OwnerContext } from "./types";

export function OwnerGymsList({ ctx }: { ctx: OwnerContext }) {
  const { gyms } = ctx;
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <ListToolbar addLabel="Dodaj siłownię" addTo="/owner/gyms/new" />
      <EntityList emptyMessage="Nie masz jeszcze żadnej siłowni. Dodaj pierwszą.">
        {gyms.map((g) => (
          <EntityListCard
            key={g.id}
            title={g.name}
            subtitle={g.address || "Brak adresu"}
            onClick={() => navigate(`/owner/gyms/${g.id}`)}
          />
        ))}
      </EntityList>
    </div>
  );
}
