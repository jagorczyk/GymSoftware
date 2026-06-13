import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { getClassReservations, updateAttendance, type ClassReservationView, getClasses } from "../../api";
import type { EmployeeContext } from "./types";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";

export function EmployeeClassDetail({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, setError } = ctx;
  const { classId } = useParams<{ classId: string }>();
  
  const [reservations, setReservations] = useState<ClassReservationView[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedGymId || !classId) return;
    setLoading(true);
    
    // Quick hack to get class name
    const from = new Date(); from.setFullYear(from.getFullYear() - 1);
    const to = new Date(); to.setFullYear(to.getFullYear() + 1);
    getClasses(auth, Number(selectedGymId), from.toISOString(), to.toISOString())
        .then((classes: any) => {
            const c = classes.find((x: any) => x.id === Number(classId));
            if (c) setClassName(c.name);
        }).catch(() => {});

    getClassReservations(auth, Number(selectedGymId), Number(classId))
      .then(setReservations)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Błąd pobierania listy zapisanych"))
      .finally(() => setLoading(false));
  }, [auth, selectedGymId, classId, setError]);

  async function handleAttendance(reservationId: number, status: string) {
    if (!selectedGymId || !classId) return;
    try {
      const updated = await updateAttendance(auth, Number(selectedGymId), Number(classId), reservationId, status);
      setReservations(prev => prev.map(r => r.id === reservationId ? updated : r));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd aktualizacji obecności");
    }
  }

  if (loading) return <LoadingState message="Wczytywanie listy..." />;

  const activeReservations = reservations.filter(r => r.status !== "CANCELLED");

  return (
    <div className="space-y-6">
      <Link
        to={`/employee/classes`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Wróć do zajęć
      </Link>

      <PageHeader
        title={`Lista: ${className || "Zajęcia grupowe"}`}
        subtitle={`Zapisanych osób: ${activeReservations.length}`}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
        {reservations.length === 0 ? (
          <EmptyState message="Brak rezerwacji na te zajęcia." />
        ) : (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-350">
            <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Klient</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data zapisu</th>
                <th className="px-6 py-4 text-right">Obecność</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    <Link to={`/employee/guests/${r.guestId}`} className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                      {r.guestFirstName} {r.guestLastName}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">{r.guestEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip status={r.status} />
                  </td>
                  <td className="px-6 py-4">
                    {new Date(r.reservedAt).toLocaleString("pl-PL")}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {r.status !== "CANCELLED" && (
                      <>
                        <button
                          onClick={() => handleAttendance(r.id, "ATTENDED")}
                          disabled={r.status === "ATTENDED"}
                          className={`p-2 rounded-lg transition-colors ${r.status === "ATTENDED" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 opacity-50 cursor-not-allowed" : "text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}`}
                          title="Obecny"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAttendance(r.id, "NO_SHOW")}
                          disabled={r.status === "NO_SHOW"}
                          className={`p-2 rounded-lg transition-colors ${r.status === "NO_SHOW" ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 opacity-50 cursor-not-allowed" : "text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20"}`}
                          title="Nieobecny"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
