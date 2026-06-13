import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  KeyRound,
  Users,
  Search,
  UserCheck,
  X,
  UserX,
  ExternalLink,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";
import { EntityListCard } from "../../components/EntityListCard";
import { EntityList } from "../../components/EntityList";
import { hasEmployeePermission } from "../../permissions";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";
import { assignLocker, returnLocker } from "../../api";
import { useToast } from "../../components/Toast";

type Locker = {
  id: number;
  lockerNumber: string;
  status: "AVAILABLE" | "OCCUPIED";
  guestId: number | null;
};

type ActiveKey = {
  lockerId: number;
  lockerNumber: string;
  guestId: number;
  guestName: string;
  assignedAt: string;
};

type PresentGuest = {
  guestId: number;
  firstName: string;
  lastName: string;
  email: string;
};

export function EmployeeLockersList({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, overview, permissions, refreshOverview } = ctx;
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [assigningGuestId, setAssigningGuestId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  const keys: ActiveKey[] = overview?.activeKeys ?? [];
  const presentGuests: PresentGuest[] = overview?.presentGuests ?? [];
  const allLockers: Locker[] = overview?.allLockers ?? [];
  const canCreateLockers = hasEmployeePermission(permissions, "CREATE_LOCKERS");
  const canManageLockers = hasEmployeePermission(permissions, "MANAGE_LOCKERS");

  // Filter lockers by search query
  const filteredLockers = allLockers.filter((l) =>
    l.lockerNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter active keys by search query
  const filteredKeys = keys.filter(
    (k) =>
      k.lockerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.guestName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Guests present in gym who do NOT have a locker assigned
  const guestsWithLockers = new Set(keys.map((k) => k.guestId));
  const eligibleGuests = presentGuests.filter((g) => !guestsWithLockers.has(g.guestId));

  // Find assignment detail for selected occupied locker
  const activeAssignment = selectedLocker
    ? keys.find((k) => k.lockerId === selectedLocker.id)
    : null;

  async function handleAssignLocker() {
    if (!assigningGuestId || !selectedLocker) return;
    setLoading(true);
    try {
      await assignLocker(auth, Number(selectedGymId), {
        lockerId: selectedLocker.id,
        guestId: Number(assigningGuestId),
      });
      showSuccess(`Pomyślnie przypisano szafkę ${selectedLocker.lockerNumber}`);
      setSelectedLocker(null);
      setAssigningGuestId("");
      refreshOverview();
    } catch (err: any) {
      showError(err.message || "Błąd podczas przypisywania szafki");
    } finally {
      setLoading(false);
    }
  }

  async function handleReturnLocker(guestId: number, lockerNumber: string) {
    if (!confirm(`Czy na pewno chcesz zwolnić szafkę ${lockerNumber}?`)) return;
    setLoading(true);
    try {
      await returnLocker(auth, Number(selectedGymId), guestId);
      showSuccess(`Zwolniono szafkę ${lockerNumber}`);
      setSelectedLocker(null);
      refreshOverview();
    } catch (err: any) {
      showError(err.message || "Błąd podczas zwalniania szafki");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("grid")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "grid"
                ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md shadow-slate-900/10 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Mapa szafek
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "list"
                ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md shadow-slate-900/10 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <List className="w-4 h-4" />
            Lista kluczyków
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Szukaj szafki lub klienta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 dark:focus:border-slate-700"
            />
          </div>

          <button
            onClick={refreshOverview}
            title="Odśwież"
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canCreateLockers && (
            <Link
              to="/employee/lockers/new"
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Dodaj szafkę
            </Link>
          )}
        </div>
      </div>

      {activeTab === "grid" ? (
        /* LOCKER GRID VIEW */
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Wizualizacja szafek</h3>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 block"></span>
                <span>Wolna ({allLockers.filter((l) => l.status === "AVAILABLE").length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 block"></span>
                <span>Zajęta ({allLockers.filter((l) => l.status === "OCCUPIED").length})</span>
              </div>
            </div>
          </div>

          {filteredLockers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
              Brak szafek pasujących do kryteriów wyszukiwania.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {filteredLockers.map((locker) => {
                const isOccupied = locker.status === "OCCUPIED";
                const assoc = keys.find((k) => k.lockerId === locker.id);
                return (
                  <button
                    key={locker.id}
                    onClick={() => setSelectedLocker(locker)}
                    className={`group relative p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 cursor-pointer ${
                      isOccupied
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/65 text-indigo-950 dark:text-indigo-200"
                        : "bg-emerald-50/30 dark:bg-emerald-950/15 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/35 border-emerald-200/50 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                        Szafka
                      </span>
                      {isOccupied ? (
                        <KeyRound className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      )}
                    </div>
                    <div className="text-2xl font-black tracking-tight">{locker.lockerNumber}</div>
                    {isOccupied && assoc && (
                      <div className="mt-2 text-xs font-semibold text-indigo-700/80 dark:text-indigo-400/80 truncate">
                        {assoc.guestName}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* LOCKER LIST VIEW */
        <EntityList emptyMessage="Brak aktywnych kluczyków">
          {filteredKeys.map((k) => (
            <EntityListCard
              key={`${k.lockerId}-${k.guestId}`}
              title={`Szafka ${k.lockerNumber}`}
              subtitle={k.guestName}
              onClick={() =>
                setSelectedLocker(
                  allLockers.find((l) => l.id === k.lockerId) || {
                    id: k.lockerId,
                    lockerNumber: k.lockerNumber,
                    status: "OCCUPIED",
                    guestId: k.guestId,
                  }
                )
              }
            />
          ))}
        </EntityList>
      )}

      {/* MODAL FOR ASSIGNING OR RETURNING LOCKER KEY */}
      {selectedLocker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform scale-100 transition-all">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white">
                    Szafka {selectedLocker.lockerNumber}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Zarządzanie kluczykiem</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedLocker(null);
                  setAssigningGuestId("");
                }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedLocker.status === "OCCUPIED" ? (
                /* Details for Occupied Locker */
                <div className="space-y-6">
                  <div className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                      <Users className="w-4 h-4" />
                      <span>Aktualny Lokator</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-lg">
                        {activeAssignment?.guestName || "Ładowanie..."}
                      </h4>
                      {activeAssignment?.assignedAt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                          Pobrany: {new Date(activeAssignment.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {canManageLockers && activeAssignment && (
                      <button
                        onClick={() =>
                          handleReturnLocker(activeAssignment.guestId, selectedLocker.lockerNumber)
                        }
                        disabled={loading}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/10 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <UserX className="w-5 h-5" />
                        Odbierz kluczyk (Zwolnij szafkę)
                      </button>
                    )}

                    <Link
                      to={`/employee/guests/${selectedLocker.guestId}`}
                      className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Pokaż profil gościa
                    </Link>
                  </div>
                </div>
              ) : (
                /* Form to Assign Vacant Locker */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Wybierz klienta na sali
                    </label>
                    {eligibleGuests.length === 0 ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-sm font-medium leading-relaxed">
                        Brak dostępnych gości na sali, którzy nie mają przypisanej szafki. Upewnij
                        się, że gość jest zameldowany w systemie.
                      </div>
                    ) : (
                      <select
                        value={assigningGuestId}
                        onChange={(e) => setAssigningGuestId(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 dark:focus:border-slate-700"
                      >
                        <option value="">-- Wybierz gościa --</option>
                        {eligibleGuests.map((g) => (
                          <option key={g.guestId} value={g.guestId}>
                            {g.firstName} {g.lastName} ({g.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleAssignLocker}
                      disabled={!assigningGuestId || loading}
                      className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <UserCheck className="w-5 h-5" />
                      Przypisz kluczyk
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
