type PermissionCheckboxItem = {
  key: string;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onToggle?: () => void;
};

export function PermissionCheckboxGrid({ items }: { items: PermissionCheckboxItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const isSelected = item.selected;
        return (
          <label
            key={item.key}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
              item.disabled
                ? "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-default"
                : isSelected
                  ? "bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/40 text-primary-900 dark:text-primary-300 cursor-pointer"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 text-primary-600 rounded border-slate-300 dark:border-slate-700 focus:ring-primary-500 dark:bg-slate-950"
              checked={isSelected}
              disabled={item.disabled}
              onChange={item.disabled ? undefined : item.onToggle}
            />
            <span className="text-sm font-medium">{item.label}</span>
          </label>
        );
      })}
    </div>
  );
}
