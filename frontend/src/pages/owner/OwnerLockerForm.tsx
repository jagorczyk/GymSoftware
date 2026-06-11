import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOwnerLocker } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { inputClassName, labelClassName, primaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerLockerForm({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, details, loadGymsAndDetails, setError, setInfo } = ctx;
  const navigate = useNavigate();
  const [lockerNumber, setLockerNumber] = useState("");

  if (!details) return <SelectGymPrompt />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId) return;
    try {
      await createOwnerLocker(auth, Number(selectedGymId), { lockerNumber });
      setInfo(`Dodano szafkę nr ${lockerNumber} do siłowni`);
      await loadGymsAndDetails();
      navigate("/owner/lockers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać szafki");
    }
  }

  return (
    <DetailPageLayout
      backTo="/owner/lockers"
      breadcrumb="Szafki"
      title="Nowa szafka"
      subtitle="Dodaj szafkę do wybranej siłowni"
    >
      <FormSection title="Numer szafki">
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className={labelClassName}>Numer szafki</label>
            <input
              type="text"
              value={lockerNumber}
              onChange={(e) => setLockerNumber(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <button type="submit" className={primaryButtonClassName}>
            Dodaj szafkę
          </button>
        </form>
      </FormSection>
    </DetailPageLayout>
  );
}
