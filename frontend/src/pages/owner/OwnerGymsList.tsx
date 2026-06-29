import { Link, useNavigate } from "react-router-dom";
import { Building2, Plus, Edit } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { primaryButtonClassName, secondaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerGymsList({ ctx }: { ctx: OwnerContext }) {
  const { gyms } = ctx;
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Siłownie"
        action={
          <Link to="/owner/gyms/new" className={primaryButtonClassName}>
            <Plus className="w-5 h-5" /> Nowa siłownia
          </Link>
        }
      />

      {gyms.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12 text-slate-400" />}
          title="Brak siłowni"
          description="Nie masz jeszcze żadnej siłowni. Dodaj pierwszą."
          action={
            <Link to="/owner/gyms/new" className={`mt-4 ${secondaryButtonClassName}`}>
              <Plus className="w-5 h-5" /> Dodaj pierwszą siłownię
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gyms.map((g) => (
            <div
              key={g.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{g.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{g.address || "Brak adresu"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/owner/gyms/${g.id}`)}
                  className="p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-all"
                  title="Edytuj"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
