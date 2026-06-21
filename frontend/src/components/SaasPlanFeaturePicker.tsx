import {
  SAAS_PLAN_FEATURES,
  SAAS_PLAN_FEATURE_PRESETS,
  type SaasPlanFeatureId,
} from "../saasPlanFeatures";

type SaasPlanFeaturePickerProps = {
  selected: SaasPlanFeatureId[];
  onChange: (next: SaasPlanFeatureId[]) => void;
  disabled?: boolean;
};

export function SaasPlanFeaturePicker({ selected, onChange, disabled }: SaasPlanFeaturePickerProps) {
  function toggle(featureId: SaasPlanFeatureId) {
    if (disabled) return;
    if (selected.includes(featureId)) {
      onChange(selected.filter((id) => id !== featureId));
      return;
    }
    onChange([...selected, featureId]);
  }

  function applyPreset(preset: keyof typeof SAAS_PLAN_FEATURE_PRESETS) {
    if (disabled) return;
    onChange([...SAAS_PLAN_FEATURE_PRESETS[preset]]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyPreset("starter")}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          Preset: Starter
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyPreset("pro")}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          Preset: Pro
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyPreset("premium")}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 disabled:opacity-50"
        >
          Preset: Premium (wszystko)
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {SAAS_PLAN_FEATURES.map((feature) => (
          <label
            key={feature.id}
            className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected.includes(feature.id)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(feature.id)}
              onChange={() => toggle(feature.id)}
              disabled={disabled}
              className="mt-0.5 rounded border-gray-300"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900 dark:text-white">{feature.label}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{feature.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
