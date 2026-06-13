import { useEffect, useState } from "react";
import { getSalesReport, type SalesReport } from "../../api";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { LoadingState } from "../../components/LoadingState";
import { FormSection } from "../../components/FormSection";
import { inputClassName, labelClassName, primaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export function OwnerSalesReport({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId } = ctx;
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!selectedGymId) return;
    setLoading(true);
    try {
      const data = await getSalesReport(auth, Number(selectedGymId), from, to);
      setReport(data);
    } catch (err) {
      ctx.setError(err instanceof Error ? err.message : "Nie udało się pobrać raportu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGymId]);

  if (!selectedGymId) return <SelectGymPrompt />;

  const maxDayTotal = Math.max(...(report?.days.map((d) => Number(d.total)) ?? [1]), 1);

  return (
    <div className="space-y-6">
      <FormSection title="Zakres raportu">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className={labelClassName}>Od</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Do</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClassName} />
          </div>
          <button type="button" onClick={load} disabled={loading} className={primaryButtonClassName}>
            Generuj raport
          </button>
        </div>
      </FormSection>

      {loading && !report ? (
        <LoadingState message="Ładowanie raportu..." />
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-colors duration-200">
              <p className="text-sm text-slate-500 dark:text-slate-400">Łączna sprzedaż</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatMoney(Number(report.total))}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-colors duration-200">
              <p className="text-sm text-slate-500 dark:text-slate-400">Liczba karnetów</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{report.passCount}</p>
            </div>
          </div>

          <FormSection title="Sprzedaż wg dnia">
            <div className="space-y-2">
              {report.days
                .filter((d) => d.count > 0)
                .map((d) => (
                  <div key={d.date} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-slate-600 dark:text-slate-350">{d.date}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-950/40 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded"
                        style={{ width: `${(Number(d.total) / maxDayTotal) * 100}%` }}
                      />
                    </div>
                    <span className="w-28 text-right font-medium dark:text-slate-200">{formatMoney(Number(d.total))}</span>
                    <span className="w-8 text-slate-500 dark:text-slate-400">{d.count}</span>
                  </div>
                ))}
              {report.days.every((d) => d.count === 0) && (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Brak sprzedaży w wybranym okresie.</p>
              )}
            </div>
          </FormSection>

          <FormSection title="Sprzedaż wg typu karnetu">
            <div className="space-y-2">
              {report.byPassType.map((row) => (
                <div key={row.passType} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 py-2">
                  <span className="font-medium text-slate-900 dark:text-white">{row.passType}</span>
                  <span className="dark:text-slate-300">
                    {formatMoney(Number(row.total))} <span className="text-slate-500 dark:text-slate-400">({row.count})</span>
                  </span>
                </div>
              ))}
              {report.byPassType.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Brak danych.</p>
              )}
            </div>
          </FormSection>
        </>
      ) : null}
    </div>
  );
}
