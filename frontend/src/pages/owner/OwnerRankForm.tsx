import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { getOwnerRanks, createOwnerRank, updateOwnerRank } from "../../api";
import type { OwnerContext } from "./types";
import { PERMISSION_LABELS, type EmployeePermission } from "../../permissions";
import { PageHeader } from "../../components/PageHeader";

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as EmployeePermission[];

export function OwnerRankForm({ ctx, mode }: { ctx: OwnerContext; mode: "create" | "edit" }) {
  const { auth, selectedGymId, setError } = ctx;
  const navigate = useNavigate();
  const { rankId } = useParams();

  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<EmployeePermission[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && selectedGymId && rankId) {
      getOwnerRanks(auth, Number(selectedGymId))
        .then((ranks) => {
          const rank = ranks.find((r) => r.id === Number(rankId));
          if (rank) {
            setName(rank.name);
            setSelectedPermissions(rank.permissions);
          } else {
            setError("Nie znaleziono rangi");
            navigate("/owner/ranks");
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Błąd pobierania rangi");
          navigate("/owner/ranks");
        });
    }
  }, [auth, selectedGymId, rankId, mode, setError, navigate]);

  function togglePermission(p: EmployeePermission) {
    setSelectedPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGymId) return;

    if (!name.trim()) {
      setError("Nazwa rangi jest wymagana");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await createOwnerRank(auth, Number(selectedGymId), {
          name,
          permissions: selectedPermissions,
        });
      } else {
        await updateOwnerRank(auth, Number(selectedGymId), Number(rankId), {
          name,
          permissions: selectedPermissions,
        });
      }
      navigate("/owner/ranks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zapisywania rangi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={mode === "create" ? "Nowa ranga" : "Edycja rangi"}
        subtitle="Zdefiniuj nazwę oraz przypisane uprawnienia"
        action={
          <Link
            to="/owner/ranks"
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Wróć
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Nazwa rangi</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="np. Menadżer, Trener Personalny..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Uprawnienia</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_PERMISSIONS.map((p) => {
              const isSelected = selectedPermissions.includes(p);
              return (
                <label
                  key={p}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary-50 border-primary-200 text-primary-900"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                    checked={isSelected}
                    onChange={() => togglePermission(p)}
                  />
                  <span className="text-sm font-medium">{PERMISSION_LABELS[p]}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-primary-600/20"
          >
            <Save className="w-5 h-5" />
            {saving ? "Zapisywanie..." : "Zapisz rangę"}
          </button>
        </div>
      </form>
    </div>
  );
}
