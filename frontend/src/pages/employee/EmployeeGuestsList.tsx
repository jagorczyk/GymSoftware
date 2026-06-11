import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { getEmployeeGuests } from "../../api";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { LoadingState } from "../../components/LoadingState";
import { StatusChip } from "../../components/StatusChip";
import { secondaryButtonClassName } from "../../components/formStyles";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

export function EmployeeGuestsList({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, setError } = ctx;
  const navigate = useNavigate();
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [guests, setGuests] = useState<Array<any>>([]);
  const [guestQuery, setGuestQuery] = useState("");

  const filteredGuests = useMemo(() => {
    const q = guestQuery.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q) ||
        String(g.id).includes(q)
    );
  }, [guestQuery, guests]);

  async function refreshGuests(searchText?: string) {
    if (!selectedGymId) return;
    setLoadingGuests(true);
    try {
      const guestList = await getEmployeeGuests(auth, Number(selectedGymId), searchText ?? guestQuery);
      setGuests(guestList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać gości");
    } finally {
      setLoadingGuests(false);
    }
  }

  useEffect(() => {
    if (selectedGymId) refreshGuests("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGymId]);

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={guestQuery}
        onSearchChange={setGuestQuery}
        searchPlaceholder="Szukaj klienta (imię, nazwisko, email, ID)"
        addLabel="Nowy klient"
        addTo="/employee/guests/new"
        extra={
          <button
            type="button"
            onClick={() => refreshGuests(guestQuery)}
            className={secondaryButtonClassName}
          >
            <RefreshCcw className="w-4 h-4" />
            Szukaj
          </button>
        }
      />
      {loadingGuests ? (
        <LoadingState message="Ładowanie klientów..." variant="skeleton" />
      ) : (
        <EntityList emptyMessage="Brak klientów. Dodaj pierwszego klienta.">
          {filteredGuests.map((g) => (
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
                  {g.hasActivePass && g.activePassEndDate && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-primary-50 text-primary-700 rounded-lg border border-primary-100">
                      Do: {g.activePassEndDate}
                    </span>
                  )}
                  <StatusChip
                    status={g.isPresent ? "ACTIVE" : "INACTIVE"}
                    label={g.isPresent ? "Na siłowni" : "Poza siłownią"}
                  />
                </div>
              }
              onClick={() => navigate(`/employee/guests/${g.id}`)}
            />
          ))}
        </EntityList>
      )}
    </div>
  );
}
