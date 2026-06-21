import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import { createPassType, deletePassType, updatePassType } from "../../api";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import {
  OwnerFormLayout,
  ownerFormCardClassName,
  ownerFormInputClassName,
  ownerFormLabelClassName,
} from "../../components/OwnerFormLayout";
import { dangerButtonClassName, primaryButtonClassName } from "../../components/formStyles";
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
  const [saving, setSaving] = useState(false);

  if (!details) return <SelectGymPrompt />;

  if (mode === "edit" && passTypeId && !passType) {
    return (
      <OwnerFormLayout backTo="/owner/pass-types" title="Typ karnetu nie znaleziony">
        <div className={ownerFormCardClassName}>
          <p className="text-slate-500 dark:text-slate-400">Nie znaleziono typu karnetu o podanym ID.</p>
        </div>
      </OwnerFormLayout>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId) return;
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedGymId || !passType) return;
    if (!window.confirm("Czy na pewno chcesz usunąć ten typ karnetu?")) return;
    setSaving(true);
    try {
      await deletePassType(auth, Number(selectedGymId), passType.id);
      setInfo(`Usunięto typ karnetu „${passType.name}”`);
      await loadGymsAndDetails();
      navigate("/owner/pass-types");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć typu karnetu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OwnerFormLayout
      backTo="/owner/pass-types"
      title={mode === "create" ? "Nowy typ karnetu" : "Edycja typu karnetu"}
      subtitle={mode === "edit" ? passType!.name : "Zdefiniuj ofertę karnetów"}
      headerExtra={
        mode === "edit" ? (
          <button type="button" onClick={onDelete} disabled={saving} className={dangerButtonClassName}>
            <Trash2 className="w-4 h-4" />
            Usuń
          </button>
        ) : undefined
      }
    >
      <form onSubmit={onSubmit} className={ownerFormCardClassName}>
        <div>
          <label className={ownerFormLabelClassName}>Nazwa karnetu</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={ownerFormInputClassName}
            placeholder="np. Karnet OPEN 30 dni"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={ownerFormLabelClassName}>Cena (zł)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={ownerFormInputClassName}
              required
            />
          </div>
          <div>
            <label className={ownerFormLabelClassName}>Czas trwania (dni)</label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className={ownerFormInputClassName}
              required
            />
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className={primaryButtonClassName}>
            <Save className="w-5 h-5" />
            {saving ? "Zapisywanie..." : mode === "create" ? "Dodaj typ karnetu" : "Zapisz zmiany"}
          </button>
        </div>
      </form>
    </OwnerFormLayout>
  );
}
