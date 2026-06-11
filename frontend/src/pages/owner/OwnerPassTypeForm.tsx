import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { createPassType, deletePassType, updatePassType } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import {
  dangerButtonClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerPassTypeForm({ ctx, mode }: { ctx: OwnerContext; mode: "create" | "edit" }) {
  const { auth, selectedGymId, details, loadGymsAndDetails, setError, setInfo } = ctx;
  const { passTypeId } = useParams();
  const navigate = useNavigate();
  const passType =
    mode === "edit"
      ? details?.passTypes?.find((pt: any) => pt.id === Number(passTypeId))
      : null;

  const [name, setName] = useState(passType?.name ?? "");
  const [price, setPrice] = useState(passType ? String(passType.price) : "");
  const [durationDays, setDurationDays] = useState(passType ? String(passType.durationDays) : "30");

  if (!details) return <SelectGymPrompt />;

  if (mode === "edit" && passTypeId && !passType) {
    return (
      <DetailPageLayout backTo="/owner/pass-types" title="Typ karnetu nie znaleziony">
        <p className="text-slate-500">Nie znaleziono typu karnetu o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId) return;
    try {
      if (mode === "create") {
        await createPassType(auth, Number(selectedGymId), {
          name,
          price: Number(price),
          durationDays: Number(durationDays),
        });
        setInfo(`Dodano typ karnetu „${name}” (${price} zł, ${durationDays} dni)`);
      } else if (passType) {
        await updatePassType(auth, Number(selectedGymId), passType.id, {
          name,
          price: Number(price),
          durationDays: Number(durationDays),
        });
        setInfo(`Zaktualizowano typ karnetu „${name}”`);
      }
      await loadGymsAndDetails();
      navigate("/owner/pass-types");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać typu karnetu");
    }
  }

  async function onDelete() {
    if (!selectedGymId || !passType) return;
    try {
      await deletePassType(auth, Number(selectedGymId), passType.id);
      setInfo(`Usunięto typ karnetu „${passType.name}”`);
      await loadGymsAndDetails();
      navigate("/owner/pass-types");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć typu karnetu");
    }
  }

  if (mode === "edit" && passType) {
    return (
      <DetailPageLayout
        backTo="/owner/pass-types"
        breadcrumb="Oferta"
        title="Edycja typu karnetu"
        subtitle={passType.name}
        headerExtra={
          <button type="button" onClick={onDelete} className={dangerButtonClassName}>
            <Trash2 className="w-4 h-4" />
            Usuń
          </button>
        }
      >
        <FormSection title="Dane oferty">
          <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className={labelClassName}>Nazwa karnetu</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClassName} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Cena (zł)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClassName} required />
              </div>
              <div>
                <label className={labelClassName}>Czas trwania (dni)</label>
                <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className={inputClassName} required />
              </div>
            </div>
            <button type="submit" className={primaryButtonClassName}>
              Zapisz zmiany
            </button>
          </form>
        </FormSection>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout
      backTo="/owner/pass-types"
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
              <label className={labelClassName}>Czas trwania (dni)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
          </div>
          <button type="submit" className={primaryButtonClassName}>
            Dodaj typ karnetu
          </button>
        </form>
      </FormSection>
    </DetailPageLayout>
  );
}
