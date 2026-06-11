import { useParams } from "react-router-dom";
import { LogOut } from "lucide-react";
import { leaveGym } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { dangerButtonClassName } from "../../components/formStyles";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

export function EmployeePresentDetail({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, overview, setMessage, setError, refreshOverview } = ctx;
  const { guestId } = useParams();

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  const guest = overview?.presentGuests?.find((g: any) => g.guestId === Number(guestId));

  if (!guest) {
    return (
      <DetailPageLayout backTo="/employee/present" title="Klient nie znaleziony">
        <p className="text-slate-500">Klient nie jest obecnie na siłowni lub nie istnieje.</p>
      </DetailPageLayout>
    );
  }

  async function onLeaveGym() {
    try {
      await leaveGym(auth, Number(selectedGymId), guest!.guestId);
      setError("");
      setMessage(`Zakończono wizytę klienta ${guest.firstName} ${guest.lastName} i odebrano szafkę`);
      refreshOverview();
    } catch (err) {
      setMessage("");
      setError(err instanceof Error ? err.message : "Nie udało się zakończyć wizyty klienta");
    }
  }

  return (
    <DetailPageLayout
      backTo="/employee/present"
      breadcrumb="Obecni"
      title={`${guest.firstName} ${guest.lastName}`}
      subtitle={guest.email || "Brak email"}
      headerExtra={
        <button type="button" onClick={onLeaveGym} className={dangerButtonClassName}>
          <LogOut className="w-4 h-4" />
          Zakończ wizytę
        </button>
      }
    >
      <FormSection title="Klient na siłowni">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Imię i nazwisko</dt>
            <dd className="font-medium text-slate-900 mt-1">
              {guest.firstName} {guest.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900 mt-1">{guest.email || "—"}</dd>
          </div>
        </dl>
      </FormSection>
    </DetailPageLayout>
  );
}
