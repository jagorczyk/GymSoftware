import { useEffect, useState } from "react";
import { getSalesReport, buildSalesReportCsvUrl, type SalesReport } from "../../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { LoadingState } from "../../components/LoadingState";
import { FormSection } from "../../components/FormSection";
import {
  chartTooltipStyle,
  inputClassName,
  labelClassName,
  panelSurfaceClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../../components/formStyles";
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
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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

  async function handleDownloadCsv() {
    if (!selectedGymId) return;
    try {
      const url = buildSalesReportCsvUrl(Number(selectedGymId), from, to);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } });
      if (!res.ok) throw new Error("Błąd podczas pobierania CSV");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `raport_sprzedazy_${from}_${to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      ctx.setError(err instanceof Error ? err.message : "Nie udało się pobrać CSV");
    }
  }

  if (!selectedGymId) return <SelectGymPrompt />;

  const maxDayTotal = Math.max(...(report?.days.map((d) => Number(d.total)) ?? [1]), 1);
  const tooltipStyle = chartTooltipStyle(isDark);
  const gridStroke = isDark ? "#334155" : "#e2e8f0";

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
          <button type="button" onClick={handleDownloadCsv} disabled={loading} className={secondaryButtonClassName}>
            Pobierz CSV
          </button>
        </div>
      </FormSection>

      {loading && !report ? (
        <LoadingState message="Ładowanie raportu..." />
      ) : report ? (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${report.productRevenue != null ? 'md:grid-cols-3' : ''} gap-4`}>
            <div className={`p-5 ${panelSurfaceClassName}`}>
              <p className="text-sm text-slate-600 dark:text-slate-400">Łączna sprzedaż</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatMoney(Number(report.total))}</p>
            </div>
            <div className={`p-5 ${panelSurfaceClassName}`}>
              <p className="text-sm text-slate-600 dark:text-slate-400">Liczba karnetów</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{report.passCount}</p>
            </div>
            {report.productRevenue != null && (
              <div className={`p-5 ${panelSurfaceClassName}`}>
                <p className="text-sm text-slate-600 dark:text-slate-400">Przychód z POS</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatMoney(Number(report.productRevenue))}</p>
              </div>
            )}
          </div>

          <FormSection title="Sprzedaż wg dnia">
            {report.days.some((d) => d.count > 0 || d.total > 0) ? (
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={report.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value} zł`} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={tooltipStyle}
                      formatter={(value: any) => [formatMoney(Number(value)), "Przychód"]}
                      labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-4">Brak sprzedaży w wybranym okresie.</p>
            )}
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
