import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOwnerGuests, type OwnerGuest } from "../../api";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatusChip } from "../../components/StatusChip";
import type { OwnerContext } from "./types";

const PAGE_SIZE = 20;

export function OwnerGuestsList({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [guests, setGuests] = useState<OwnerGuest[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, selectedGymId]);

  useEffect(() => {
    if (!auth || !selectedGymId) return;
    let cancelled = false;
    setLoading(true);
    getOwnerGuests(auth, Number(selectedGymId), { q: debouncedQuery || undefined, page, size: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setGuests(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      })
      .catch(() => {
        if (!cancelled) {
          setGuests([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth, selectedGymId, debouncedQuery, page]);

  if (!selectedGymId) return <SelectGymPrompt />;

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Szukaj klienta..."
      />
      <EntityList emptyMessage={loading ? "Ładowanie..." : "Brak klientów"}>
        {guests.map((g) => (
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-sm text-slate-500">
            {totalElements} klientów · strona {page + 1} z {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium disabled:opacity-50"
            >
              Wstecz
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium disabled:opacity-50"
            >
              Dalej
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
