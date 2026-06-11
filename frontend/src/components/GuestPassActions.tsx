import { FormEvent, useState } from "react";
import type { AuthState } from "../auth";
import { cancelPass, renewPass, type PassView } from "../api";
import { FormSection } from "./FormSection";
import { inputClassName, labelClassName, primaryButtonClassName, dangerButtonClassName } from "./formStyles";
import { StatusChip } from "./StatusChip";

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
      {pass.status === "ACTIVE" && (
        <button type="button" onClick={onCancel} className={`${dangerButtonClassName} w-full`}>
          Anuluj karnet
        </button>
      )}
    </div>
  );
}
