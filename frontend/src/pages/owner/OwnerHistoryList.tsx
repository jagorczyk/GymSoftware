import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuditLogs, type AuditLog } from "../../api";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { ListToolbar } from "../../components/ListToolbar";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { LoadingState } from "../../components/LoadingState";
import { FormSection } from "../../components/FormSection";
import { inputClassName, labelClassName, primaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerHistoryList({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, setError } = ctx;
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    if (!selectedGymId) return;
    setLoading(true);
    try {
      const data = await getAuditLogs(auth, Number(selectedGymId), {
        action: action || undefined,
        actorEmail: actorEmail || undefined,
        from: from ? `${from}T00:00:00` : undefined,
        to: to ? `${to}T23:59:59` : undefined,
      });
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać historii");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGymId]);

  const filtered = logs.filter((log) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      log.action.toLowerCase().includes(q) ||
      (log.actorEmail ?? "").toLowerCase().includes(q) ||
      (log.payload ?? "").toLowerCase().includes(q)
    );
  });

  if (!selectedGymId) return <SelectGymPrompt />;

  return (
    <div className="space-y-4">
      <FormSection title="Filtry">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClassName}>Akcja</label>
            <input value={action} onChange={(e) => setAction(e.target.value)} className={inputClassName} placeholder="np. PASS_SOLD" />
          </div>
          <div>
            <label className={labelClassName}>E-mail pracownika</label>
            <input value={actorEmail} onChange={(e) => setActorEmail(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Od</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Do</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClassName} />
          </div>
        </div>
        <button type="button" onClick={load} disabled={loading} className={`${primaryButtonClassName} mt-4`}>
          Zastosuj filtry
        </button>
      </FormSection>

      <ListToolbar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Szukaj w wynikach..." />

      {loading ? (
        <LoadingState message="Ładowanie historii..." />
      ) : (
        <EntityList emptyMessage="Brak wpisów w historii">
          {filtered.map((log) => (
            <EntityListCard
              key={log.id}
              title={log.action}
              subtitle={`${log.actorEmail ?? "system"} • ${new Date(log.createdAt).toLocaleString("pl-PL")}`}
              onClick={() => navigate(`/owner/history/${log.id}`, { state: { log } })}
            />
          ))}
        </EntityList>
      )}
    </div>
  );
}
