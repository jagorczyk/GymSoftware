import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import {
  createEmployeePassType,
  deleteEmployeePassType,
  getEmployeePassTypes,
} from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { LoadingState } from "../../components/LoadingState";
import {
  dangerButtonClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "../../components/formStyles";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import { formatPassTypeValidity } from "../../utils/passTypeLabels";
import type { EmployeeContext } from "./types";

export function EmployeePassTypeForm({ ctx, mode }: { ctx: EmployeeContext; mode: "create" | "edit" }) {
  const { auth, selectedGymId, setMessage, setError } = ctx;
  const { passTypeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === "edit");
  const [passType, setPassType] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [billingMode, setBillingMode] = useState<"duration" | "entries">("duration");
  const [maxEntries, setMaxEntries] = useState("1");

  useEffect(() => {
    if (mode !== "edit" || !selectedGymId || !passTypeId) return;
    setLoading(true);
    getEmployeePassTypes(auth, Number(selectedGymId))
      .then((items) => {
        const found = items.find((pt) => pt.id === Number(passTypeId));
        if (found) {
          setPassType(found);
          setName(found.name);
          setPrice(String(found.price));
          setDurationDays(String(found.durationDays));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się pobrać typu karnetu"))
      .finally(() => setLoading(false));
  }, [auth, mode, passTypeId, selectedGymId, setError]);

  if (!selectedGymId) return <SelectGymDashboardPrompt />;
  if (loading) return <LoadingState message="Ładowanie typu karnetu..." />;

  if (mode === "edit" && passTypeId && !passType) {
    return (
      <DetailPageLayout backTo="/employee/pass-types" title="Typ karnetu nie znaleziony">
        <p className="text-slate-500">Nie znaleziono typu karnetu o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId || mode !== "create") return;
    try {
      await createEmployeePassType(auth, Number(selectedGymId), {
        name,
        price: Number(price),
        durationDays: Number(durationDays),
        maxEntries: billingMode === "entries" ? Number(maxEntries) : null,
      });
      setMessage(`Dodano typ karnetu „${name}”`);
      navigate("/employee/pass-types");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać typu karnetu");
    }
  }

  async function onDelete() {
    if (!selectedGymId || !passType) return;
    try {
      await deleteEmployeePassType(auth, Number(selectedGymId), passType.id);
      setMessage(`Usunięto typ karnetu „${passType.name}”`);
      navigate("/employee/pass-types");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć typu karnetu");
    }
  }

  if (mode === "edit" && passType) {
    return (
      <DetailPageLayout
        backTo="/employee/pass-types"
        breadcrumb="Oferta"
        title={passType.name}
        subtitle={formatPassTypeValidity(passType)}
        headerExtra={
          <button type="button" onClick={onDelete} className={dangerButtonClassName}>
            <Trash2 className="w-4 h-4" />
            Usuń
          </button>
        }
      >
        <FormSection
          title="Szczegóły oferty"
          description="Edycja pól nie jest dostępna. Możesz usunąć i utworzyć nowy typ karnetu."
        >
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Nazwa</dt>
              <dd className="font-medium text-slate-900 mt-1">{passType.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Cena</dt>
              <dd className="font-medium text-slate-900 mt-1">{passType.price} zł</dd>
            </div>
            <div>
              <dt className="text-slate-500">Warunki</dt>
              <dd className="font-medium text-slate-900 mt-1">{formatPassTypeValidity(passType)}</dd>
            </div>
          </dl>
        </FormSection>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout
      backTo="/employee/pass-types"
      breadcrumb="Oferta"
      title="Nowy typ karnetu"
      subtitle="Zdefiniuj ofertę karnetów"
    >
      <FormSection title="Dane karnetu">
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className={labelClassName}>Nazwa karnetu</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              placeholder="np. Karnet OPEN 30 dni"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Cena (zł)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClassName} required />
            </div>
            <div>
              <label className={labelClassName}>
                {billingMode === "entries" ? "Ważność od zakupu (dni)" : "Czas trwania (dni)"}
              </label>
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBillingMode("duration")}
              className={`rounded-2xl border-2 p-4 text-left ${
                billingMode === "duration" ? "border-primary-500 bg-primary-50" : "border-slate-200"
              }`}
            >
              <p className="font-bold">Czasowy</p>
              <p className="text-sm text-slate-500 mt-1">Nielimitowane wejścia w okresie ważności.</p>
            </button>
            <button
              type="button"
              onClick={() => setBillingMode("entries")}
              className={`rounded-2xl border-2 p-4 text-left ${
                billingMode === "entries" ? "border-primary-500 bg-primary-50" : "border-slate-200"
              }`}
            >
              <p className="font-bold">Na wejścia</p>
              <p className="text-sm text-slate-500 mt-1">Np. jedno wejście ważne 90 dni.</p>
            </button>
          </div>
          {billingMode === "entries" && (
            <div>
              <label className={labelClassName}>Liczba wejść</label>
              <input
                type="number"
                min={1}
                value={maxEntries}
                onChange={(e) => setMaxEntries(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
          )}
          <button type="submit" className={primaryButtonClassName}>
            Dodaj typ karnetu
          </button>
        </form>
      </FormSection>
    </DetailPageLayout>
  );
}
