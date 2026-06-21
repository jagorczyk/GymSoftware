import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../authContext";
import {
  createSaaSPlan,
  deleteSaaSPlan,
  getSaaSPlans,
  getSaaSSubscriptions,
  updateSaaSPlan,
  SaaSPlan,
} from "../../api";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { SaasPlanFeaturePicker } from "../../components/SaasPlanFeaturePicker";
import { formatSaasPlanFeatureLabels, SAAS_PLAN_FEATURE_PRESETS, type SaasPlanFeatureId } from "../../saasPlanFeatures";
import { RefreshCw, Plus, Trash2, Pencil } from "lucide-react";

function toFeatureIds(flags?: string[]): SaasPlanFeatureId[] {
  if (!flags || flags.length === 0) return [...SAAS_PLAN_FEATURE_PRESETS.premium];
  return flags.filter((flag): flag is SaasPlanFeatureId =>
    SAAS_PLAN_FEATURE_PRESETS.premium.includes(flag as SaasPlanFeatureId)
  );
}

export function SuperAdminPlansPage() {
  const { auth } = useAuth();
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [subscriptionCounts, setSubscriptionCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState("");
  const [active, setActive] = useState(true);
  const [selectedFeatureFlags, setSelectedFeatureFlags] = useState<SaasPlanFeatureId[]>([
    ...SAAS_PLAN_FEATURE_PRESETS.starter,
  ]);

  async function loadData() {
    if (!auth) return;
    try {
      setLoading(true);
      setError(null);
      const [plansData, subscriptions] = await Promise.all([
        getSaaSPlans(auth),
        getSaaSSubscriptions(auth),
      ]);
      setPlans(plansData);

      const counts: Record<number, number> = {};
      for (const sub of subscriptions) {
        counts[sub.saasPlanId] = (counts[sub.saasPlanId] ?? 0) + 1;
      }
      setSubscriptionCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas pobierania planów.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [auth]);

  const activePlansCount = useMemo(() => plans.filter((plan) => plan.active).length, [plans]);
  const isEditing = editingPlanId !== null;

  const resetForm = () => {
    setName("");
    setPrice("");
    setFeatures("");
    setActive(true);
    setSelectedFeatureFlags([...SAAS_PLAN_FEATURE_PRESETS.starter]);
    setShowForm(false);
    setEditingPlanId(null);
  };

  const startEdit = (plan: SaaSPlan) => {
    setEditingPlanId(plan.id);
    setShowForm(true);
    setName(plan.name);
    setPrice(String(plan.price));
    setFeatures(plan.features || "");
    setActive(plan.active);
    setSelectedFeatureFlags(toFeatureIds(plan.featureFlags));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth) return;

    const parsedPrice = Number(price.replace(",", "."));
    if (!name.trim()) {
      alert("Podaj nazwę planu.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert("Podaj poprawną cenę miesięczną.");
      return;
    }
    if (selectedFeatureFlags.length === 0) {
      alert("Wybierz co najmniej jedną funkcję planu.");
      return;
    }

    const payload = {
      name: name.trim(),
      price: parsedPrice,
      features: features.trim() || undefined,
      active,
      featureFlags: selectedFeatureFlags,
    };

    setSubmitting(true);
    try {
      if (isEditing && editingPlanId) {
        await updateSaaSPlan(auth, editingPlanId, payload);
      } else {
        await createSaaSPlan(auth, payload);
      }
      resetForm();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas zapisywania planu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plan: SaaSPlan) => {
    if (!auth) return;
    const count = subscriptionCounts[plan.id] ?? 0;
    if (count > 0) {
      alert(`Plan "${plan.name}" ma ${count} przypisanych subskrypcji i nie może zostać usunięty.`);
      return;
    }
    if (!confirm(`Czy na pewno chcesz usunąć plan "${plan.name}"?`)) return;

    try {
      await deleteSaaSPlan(auth, plan.id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas usuwania planu.");
    }
  };

  if (loading && plans.length === 0) return <LoadingState message="Ładowanie planów..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plany SaaS</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Konfiguruj ceny i dostęp do modułów ({activePlansCount} aktywnych planów).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Odśwież
          </button>
          <button
            onClick={() => {
              if (showForm && !isEditing) {
                resetForm();
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj plan
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edytuj plan" : "Nowy plan"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nazwa</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={255}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="np. Pro"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cena miesięczna (zł)</label>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="99.00"
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opis marketingowy</label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              maxLength={1000}
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder="Krótki opis widoczny przy rejestracji"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dostępne moduły</label>
            <SaasPlanFeaturePicker
              selected={selectedFeatureFlags}
              onChange={setSelectedFeatureFlags}
              disabled={submitting}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={submitting}
              className="rounded border-gray-300"
            />
            Aktywny (widoczny przy rejestracji)
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg"
            >
              {submitting ? "Zapisywanie..." : isEditing ? "Zapisz zmiany" : "Utwórz plan"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {plans.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Brak planów SaaS.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <th className="p-4">Nazwa</th>
                  <th className="p-4">Cena</th>
                  <th className="p-4">Moduły</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Subskrypcje</th>
                  <th className="p-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {plans.map((plan) => {
                  const count = subscriptionCounts[plan.id] ?? 0;
                  const moduleLabels = formatSaasPlanFeatureLabels(plan.featureFlags);
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{plan.name}</div>
                        {plan.features ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">{plan.features}</div>
                        ) : null}
                      </td>
                      <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{plan.price} zł / mies.</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                        <div className="flex flex-wrap gap-1">
                          {moduleLabels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            plan.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {plan.active ? "Aktywny" : "Nieaktywny"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{count}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => startEdit(plan)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edytuj
                        </button>
                        <button
                          onClick={() => void handleDelete(plan)}
                          disabled={count > 0}
                          title={count > 0 ? "Nie można usunąć planu z przypisanymi subskrypcjami" : "Usuń plan"}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30 dark:hover:bg-red-900/50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
