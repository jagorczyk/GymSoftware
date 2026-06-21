import { useEffect, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { SaaSPlan } from "../api";
import { formatSaasPlanFeatureLabels, SAAS_PLAN_FEATURES } from "../saasPlanFeatures";

type RegisterPlanPickerProps = {
  plans: SaaSPlan[];
  loading: boolean;
  selectedPlanId: number | null;
  onSelect: (planId: number) => void;
  disabled?: boolean;
};

function planHasFeature(plan: SaaSPlan, featureId: string): boolean {
  if (!plan.featureFlags || plan.featureFlags.length === 0) return true;
  return plan.featureFlags.includes(featureId);
}

function planTagline(plan: SaaSPlan): string {
  if (plan.features?.trim()) {
    const firstSentence = plan.features.split(/[.!]/)[0]?.trim();
    if (firstSentence && firstSentence.length <= 72) return firstSentence;
    return plan.features.length > 72 ? `${plan.features.slice(0, 69)}…` : plan.features;
  }
  const count = formatSaasPlanFeatureLabels(plan.featureFlags).length;
  return `${count} modułów w pakiecie`;
}

export function RegisterPlanPicker({
  plans,
  loading,
  selectedPlanId,
  onSelect,
  disabled = false,
}: RegisterPlanPickerProps) {
  const [showCompare, setShowCompare] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  useEffect(() => {
    setShowAllFeatures(false);
  }, [selectedPlanId]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const featureLabels = selectedPlan ? formatSaasPlanFeatureLabels(selectedPlan.featureFlags) : [];
  const hiddenCount = Math.max(0, featureLabels.length - 6);
  const visibleFeatures = showAllFeatures ? featureLabels : featureLabels.slice(0, 6);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (plans.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Brak dostępnych planów.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Wybierz plan</h3>

      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(plan.id)}
              className={`snap-start shrink-0 min-w-[6.75rem] flex-1 text-left p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50/60 dark:bg-primary-900/25 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
              } disabled:opacity-60`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{plan.name}</span>
                {isSelected ? <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" /> : null}
              </div>
              <div className="mt-2 text-lg font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">
                {plan.price}
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400"> zł/mies.</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedPlan ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/40 p-3 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedPlan.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{planTagline(selectedPlan)}</p>
          </div>
          {featureLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {visibleFeatures.map((label) => (
                <span
                  key={label}
                  className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          {hiddenCount > 0 && !showAllFeatures ? (
            <button
              type="button"
              onClick={() => setShowAllFeatures(true)}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              + {hiddenCount} modułów więcej
            </button>
          ) : null}
          {showAllFeatures && hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllFeatures(false)}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              Pokaż mniej
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowCompare((value) => !value)}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        {showCompare ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showCompare ? "Ukryj porównanie planów" : "Porównaj wszystkie plany"}
      </button>

      {showCompare ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Moduł</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="p-2 font-semibold text-slate-700 dark:text-slate-200 text-center min-w-[3.5rem]">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAAS_PLAN_FEATURES.map((feature) => (
                <tr key={feature.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="p-2 text-slate-600 dark:text-slate-300">{feature.label}</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="p-2 text-center">
                      {planHasFeature(plan, feature.id) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function pickDefaultPlanId(plans: SaaSPlan[]): number | null {
  if (plans.length === 0) return null;
  const byName = plans.find((plan) => plan.name.toLowerCase() === "pro");
  if (byName) return byName.id;
  const sorted = [...plans].sort((a, b) => a.price - b.price);
  return sorted[Math.min(1, sorted.length - 1)]?.id ?? sorted[0].id;
}
