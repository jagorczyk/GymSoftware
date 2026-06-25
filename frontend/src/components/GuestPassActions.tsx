import { FormEvent, useState } from "react";
import type { AuthState } from "../auth";
import { cancelPass, renewPass, freezePassEmployee, unfreezePassEmployee, type PassView } from "../api";
import { FormSection } from "./FormSection";
import { inputClassName, labelClassName, primaryButtonClassName, dangerButtonClassName } from "./formStyles";
import { StatusChip } from "./StatusChip";
import { formatPassRemaining } from "../utils/passTypeLabels";

export function GuestPassActions(props: {
  auth: AuthState;
  gymId: number;
  pass: PassView;
  onUpdated: () => void;
  setError: (msg: string) => void;
  setInfo: (msg: string) => void;
}) {
  const { auth, gymId, pass, onUpdated, setError, setInfo } = props;
  const [endDate, setEndDate] = useState(pass.endDate);
  const [price, setPrice] = useState(String(pass.price));
  
  const [isFreezing, setIsFreezing] = useState(false);
  const [freezeStart, setFreezeStart] = useState("");
  const [freezeEnd, setFreezeEnd] = useState("");

  async function onRenew(event: FormEvent) {
    event.preventDefault();
    try {
      await renewPass(auth, gymId, pass.id, { endDate, price: Number(price) });
      setInfo(`Przedłużono karnet „${pass.passType}”`);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się przedłużyć karnetu");
    }
  }

  async function onCancel() {
    if (!confirm("Anulować ten karnet?")) return;
    try {
      await cancelPass(auth, gymId, pass.id);
      setInfo(`Anulowano karnet „${pass.passType}”`);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się anulować karnetu");
    }
  }

  async function onFreeze(event: FormEvent) {
    event.preventDefault();
    if (!freezeStart || !freezeEnd) return;
    try {
      await freezePassEmployee(auth, gymId, pass.id, { startDate: freezeStart, endDate: freezeEnd });
      setInfo(`Zamrożono karnet „${pass.passType}”`);
      setIsFreezing(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zamrozić karnetu");
    }
  }

  async function onUnfreeze() {
    if (!confirm("Czy na pewno chcesz odmrozić ten karnet?")) return;
    try {
      await unfreezePassEmployee(auth, gymId, pass.id);
      setInfo(`Odmrożono karnet „${pass.passType}”`);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się odmrozić karnetu");
    }
  }

  if (pass.status === "CANCELLED") {
    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-slate-900">{pass.passType}</span>
          <StatusChip status="CANCELLED" />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {pass.startDate} — {pass.endDate} • {pass.price} zł
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-900">{pass.passType}</span>
        <StatusChip status={pass.status} />
      </div>
      <p className="text-sm text-slate-500">
        {pass.startDate} — {pass.endDate} • {pass.price} zł
        {formatPassRemaining(pass) ? ` • ${formatPassRemaining(pass)}` : ""}
      </p>
      {(pass.status === "ACTIVE" || pass.status === "EXPIRED") && (
        <form onSubmit={onRenew} className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className={labelClassName}>Nowa data końca</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClassName} required />
          </div>
          <div>
            <label className={labelClassName}>Cena (zł)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClassName} required />
          </div>
          <button type="submit" className={`${primaryButtonClassName} col-span-2`}>
            Przedłuż karnet
          </button>
        </form>
      )}

      {pass.status === "ACTIVE" && pass.maxEntries == null && !isFreezing && (
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsFreezing(true)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded font-medium text-sm hover:bg-slate-200 transition-colors">
            Zamroź
          </button>
          <button type="button" onClick={onCancel} className="flex-1 bg-red-50 text-red-600 py-2 rounded font-medium text-sm hover:bg-red-100 transition-colors">
            Anuluj
          </button>
        </div>
      )}

      {pass.status === "ACTIVE" && pass.maxEntries != null && (
        <button type="button" onClick={onCancel} className="w-full bg-red-50 text-red-600 py-2 rounded font-medium text-sm hover:bg-red-100 transition-colors">
          Anuluj
        </button>
      )}

      {pass.status === "ACTIVE" && pass.maxEntries == null && isFreezing && (
        <form onSubmit={onFreeze} className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className={labelClassName}>Od</label>
            <input type="date" value={freezeStart} onChange={(e) => setFreezeStart(e.target.value)} className={inputClassName} required />
          </div>
          <div>
            <label className={labelClassName}>Do</label>
            <input type="date" value={freezeEnd} onChange={(e) => setFreezeEnd(e.target.value)} className={inputClassName} required />
          </div>
          <button type="submit" className="col-span-1 bg-blue-600 text-white py-2 rounded font-medium text-sm hover:bg-blue-700 transition-colors">
            Zatwierdź zamrożenie
          </button>
          <button type="button" onClick={() => setIsFreezing(false)} className="col-span-1 bg-slate-100 text-slate-700 py-2 rounded font-medium text-sm hover:bg-slate-200 transition-colors">
            Anuluj
          </button>
        </form>
      )}

      {pass.status === "FROZEN" && (
        <button type="button" onClick={onUnfreeze} className="w-full bg-blue-50 text-blue-600 py-2 rounded font-medium text-sm hover:bg-blue-100 transition-colors">
          Odmroź karnet
        </button>
      )}
    </div>
  );
}
