import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import { createOwnerLocker } from "../../api";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import {
  OwnerFormLayout,
  ownerFormCardClassName,
  ownerFormInputClassName,
  ownerFormLabelClassName,
} from "../../components/OwnerFormLayout";
import { primaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerLockerForm({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, details, loadGymsAndDetails, setError, setInfo } = ctx;
  const navigate = useNavigate();
  const [lockerNumber, setLockerNumber] = useState("");
  const [saving, setSaving] = useState(false);

  if (!details) return <SelectGymPrompt />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId) return;
    setSaving(true);
    try {
      await createOwnerLocker(auth, Number(selectedGymId), { lockerNumber });
      setInfo(`Dodano szafkę nr ${lockerNumber} do siłowni`);
      await loadGymsAndDetails();
      navigate("/owner/lockers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać szafki");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OwnerFormLayout
      backTo="/owner/lockers"
      title="Nowa szafka"
      subtitle="Dodaj szafkę do wybranej siłowni"
    >
      <form onSubmit={onSubmit} className={ownerFormCardClassName}>
        <div>
          <label className={ownerFormLabelClassName}>Numer szafki</label>
          <input
            type="text"
            value={lockerNumber}
            onChange={(e) => setLockerNumber(e.target.value)}
            className={ownerFormInputClassName}
            placeholder="np. A-12"
            required
          />
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className={primaryButtonClassName}>
            <Save className="w-5 h-5" />
            {saving ? "Zapisywanie..." : "Dodaj szafkę"}
          </button>
        </div>
      </form>
    </OwnerFormLayout>
  );
}
