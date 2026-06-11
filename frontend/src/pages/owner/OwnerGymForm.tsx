import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { createOwnerGym, deleteOwnerGym, updateOwnerGym } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import {
  dangerButtonClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerGymForm({ ctx, mode }: { ctx: OwnerContext; mode: "create" | "edit" }) {
  const { auth, gyms, loadGymsAndDetails, setError, setInfo } = ctx;
  const { gymId } = useParams();
  const navigate = useNavigate();
  const gym = mode === "edit" ? gyms.find((g) => g.id === Number(gymId)) : null;

  const [name, setName] = useState(gym?.name ?? "");
  const [address, setAddress] = useState(gym?.address ?? "");

  if (mode === "edit" && gymId && !gym) {
    return (
      <DetailPageLayout backTo="/owner/gyms" title="Siłownia nie znaleziona">
        <p className="text-slate-500">Nie znaleziono siłowni o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (mode === "create") {
        await createOwnerGym(auth, { name, address });
        setInfo(`Utworzono siłownię „${name}”`);
      } else if (gym) {
        await updateOwnerGym(auth, gym.id, { name, address });
        setInfo(`Zapisano zmiany siłowni „${name}”`);
      }
      await loadGymsAndDetails();
      navigate("/owner/gyms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać siłowni");
    }
  }

  async function onDelete() {
    if (!gym) return;
    try {
      await deleteOwnerGym(auth, gym.id);
      setInfo(`Usunięto siłownię „${gym.name}”`);
      await loadGymsAndDetails();
      navigate("/owner/gyms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć siłowni");
    }
  }

  return (
    <DetailPageLayout
      backTo="/owner/gyms"
      breadcrumb="Siłownie"
      title={mode === "create" ? "Nowa siłownia" : gym!.name}
      subtitle={mode === "edit" ? "Edytuj dane siłowni" : "Utwórz nową siłownię"}
      headerExtra={
        mode === "edit" ? (
          <button type="button" onClick={onDelete} className={dangerButtonClassName}>
            <Trash2 className="w-4 h-4" />
            Usuń
          </button>
        ) : undefined
      }
    >
      <FormSection title="Dane siłowni">
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className={labelClassName}>Nazwa siłowni</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClassName} required />
          </div>
          <div>
            <label className={labelClassName}>Adres</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClassName} />
          </div>
          <button type="submit" className={primaryButtonClassName}>
            {mode === "create" ? "Utwórz siłownię" : "Zapisz zmiany"}
          </button>
        </form>
      </FormSection>
    </DetailPageLayout>
  );
}
