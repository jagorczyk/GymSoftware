import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEmployeeLocker } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { inputClassName, labelClassName, primaryButtonClassName } from "../../components/formStyles";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

export function EmployeeLockerForm({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, setMessage, setError, refreshOverview } = ctx;
  const navigate = useNavigate();
  const [lockerNumber, setLockerNumber] = useState("");

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await createEmployeeLocker(auth, Number(selectedGymId), { lockerNumber });
      setMessage(`Dodano szafkę nr ${lockerNumber} do siłowni`);
      refreshOverview();
      navigate("/employee/lockers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać szafki");
    }
  }

  return (
    <DetailPageLayout
      backTo="/employee/lockers"
      breadcrumb="Kluczyki"
      title="Nowa szafka"
      subtitle="Dodaj nową szafkę do siłowni"
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
