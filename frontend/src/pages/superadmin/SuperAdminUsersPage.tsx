import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../authContext";
import { deleteSaaSUser, getSaaSUsers, SaaSAdminUserDTO } from "../../api";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { RefreshCw } from "lucide-react";

type RoleTab = "OWNER" | "EMPLOYEE" | "GUEST";

const ROLE_TABS: { id: RoleTab; label: string }[] = [
  { id: "OWNER", label: "Właściciele" },
  { id: "EMPLOYEE", label: "Pracownicy" },
  { id: "GUEST", label: "Klienci" },
];

function roleBadgeClass(role: string) {
  if (role === "OWNER") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  if (role === "EMPLOYEE") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  if (role === "GUEST") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
  return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
}

export function SuperAdminUsersPage() {
  const { auth } = useAuth();
  const [users, setUsers] = useState<SaaSAdminUserDTO[]>([]);
  const [activeTab, setActiveTab] = useState<RoleTab>("OWNER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!auth) return;
    try {
      setLoading(true);
      setError(null);
      setUsers(await getSaaSUsers(auth));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas pobierania użytkowników.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [auth]);

  const filteredUsers = useMemo(
    () => users.filter((user) => user.role === activeTab),
    [users, activeTab]
  );

  const roleCounts = useMemo(() => {
    const counts: Record<RoleTab, number> = { OWNER: 0, EMPLOYEE: 0, GUEST: 0 };
    for (const user of users) {
      if (user.role === "OWNER" || user.role === "EMPLOYEE" || user.role === "GUEST") {
        counts[user.role] += 1;
      }
    }
    return counts;
  }, [users]);

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!auth) return;
    if (!confirm(`Czy na pewno chcesz usunąć konto ${userEmail} i wszystkie powiązane dane? Operacja jest nieodwracalna.`)) {
      return;
    }
    try {
      await deleteSaaSUser(auth, userId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas usuwania użytkownika.");
    }
  };

  if (loading && users.length === 0) return <LoadingState message="Ładowanie użytkowników..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Użytkownicy</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Wszyscy użytkownicy platformy według roli.</p>
        </div>
        <button
          onClick={() => void loadData()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Odśwież
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? "bg-primary-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label} ({roleCounts[tab.id]})
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Brak użytkowników w tej kategorii.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <th className="p-4">ID</th>
                  <th className="p-4">Imię i nazwisko</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rola</th>
                  <th className="p-4">Status emaila</th>
                  <th className="p-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">#{user.id}</td>
                    <td className="p-4 text-sm text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.emailVerified
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {user.emailVerified ? "Zweryfikowany" : "Oczekujący"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => void handleDeleteUser(user.id, user.email)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Usuń konto
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
