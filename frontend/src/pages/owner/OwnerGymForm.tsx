import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import { createOwnerGym, deleteOwnerGym, updateOwnerGym } from "../../api";
import {
  OwnerFormLayout,
  ownerFormCardClassName,
  ownerFormInputClassName,
  ownerFormLabelClassName,
} from "../../components/OwnerFormLayout";
import { dangerButtonClassName, primaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerGymForm({ ctx, mode }: { ctx: OwnerContext; mode: "create" | "edit" }) {
  const { auth, gyms, loadGymsAndDetails, setError, setInfo } = ctx;
  const { gymId } = useParams();
  const navigate = useNavigate();
  const gym = mode === "edit" ? gyms.find((g) => g.id === Number(gymId)) : null;

  const isNameFixed = mode === "edit" || gyms.length > 0;
  const fixedName = gym?.name ?? (gyms.length > 0 ? gyms[0].name : "");

  const [name, setName] = useState(isNameFixed ? fixedName : "");
  const [address, setAddress] = useState(gym?.address ?? "");
  const [city, setCity] = useState(gym?.city ?? "");
  const [postalCode, setPostalCode] = useState(gym?.postalCode ?? "");
  const [nip, setNip] = useState(gym?.nip ?? "");
  const [saving, setSaving] = useState(false);

  if (mode === "edit" && gymId && !gym) {
    return (
      <OwnerFormLayout backTo="/owner/gyms" title="Siłownia nie znaleziona">
        <div className={ownerFormCardClassName}>
          <p className="text-slate-500 dark:text-slate-400">Nie znaleziono siłowni o podanym ID.</p>
        </div>
      </OwnerFormLayout>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        await createOwnerGym(auth, { name, address, city, postalCode, nip });
        setInfo(`Utworzono siłownię „${name}”`);
      } else if (gym) {
        await updateOwnerGym(auth, gym.id, { name, address, city, postalCode, nip });
        setInfo(`Zapisano zmiany siłowni „${name}”`);
      }
      await loadGymsAndDetails();
      navigate("/owner/gyms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać siłowni");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!gym) return;
    if (!window.confirm("Czy na pewno chcesz usunąć tę siłownię?")) return;
    setSaving(true);
    try {
      await deleteOwnerGym(auth, gym.id);
      setInfo(`Usunięto siłownię „${gym.name}”`);
      await loadGymsAndDetails();
      navigate("/owner/gyms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć siłowni");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OwnerFormLayout
      backTo="/owner/gyms"
      title={mode === "create" ? "Nowa siłownia" : gym!.name}
      subtitle={mode === "edit" ? "Edytuj dane siłowni" : "Utwórz nową siłownię"}
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
          <label className={ownerFormLabelClassName}>Nazwa siłowni</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={ownerFormInputClassName}
            required
            disabled={isNameFixed}
          />
          {isNameFixed && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Nazwa siłowni jest wspólna dla całej Twojej sieci i nie można jej zmienić.
            </p>
          )}
        </div>
        <div>
          <label className={ownerFormLabelClassName}>Miasto</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={ownerFormInputClassName}
            required
          />
        </div>
        <div>
          <label className={ownerFormLabelClassName}>Kod pocztowy (00-000)</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            pattern="^\d{2}-\d{3}$"
            className={ownerFormInputClassName}
            required
          />
        </div>
        <div>
          <label className={ownerFormLabelClassName}>Adres</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={ownerFormInputClassName}
            required
          />
        </div>
        <div>
          <label className={ownerFormLabelClassName}>NIP (10 cyfr)</label>
          <input
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            pattern="^\d{10}$"
            className={ownerFormInputClassName}
            required
          />
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className={primaryButtonClassName}>
            <Save className="w-5 h-5" />
            {saving ? "Zapisywanie..." : mode === "create" ? "Utwórz siłownię" : "Zapisz zmiany"}
          </button>
        </div>
      </form>
    </OwnerFormLayout>
  );
}
