import { useParams } from "react-router-dom";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

export function EmployeeLockerDetail({ ctx }: { ctx: EmployeeContext }) {
  const { selectedGymId, overview } = ctx;
  const { lockerId } = useParams();

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  const key = overview?.activeKeys?.find((k: any) => k.lockerId === Number(lockerId));
  const locker = overview?.allLockers?.find((l: any) => l.id === Number(lockerId));

  if (!key && !locker) {
    return (
      <DetailPageLayout backTo="/employee/lockers" title="Szafka nie znaleziona">
        <p className="text-slate-500">Nie znaleziono aktywnego kluczyka dla tej szafki.</p>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout
      backTo="/employee/lockers"
      breadcrumb="Kluczyki"
      title={`Szafka ${key?.lockerNumber ?? locker?.lockerNumber}`}
      subtitle={key?.guestName ?? "Brak przypisanego klienta"}
    >
      <FormSection title="Szczegóły kluczyka">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Numer szafki</dt>
            <dd className="font-medium text-slate-900 mt-1">{key?.lockerNumber ?? locker?.lockerNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Klient</dt>
            <dd className="font-medium text-slate-900 mt-1">{key?.guestName ?? "—"}</dd>
          </div>
          {key?.assignedAt && (
            <div>
              <dt className="text-slate-500">Nadano</dt>
              <dd className="font-medium text-slate-900 mt-1">{new Date(key.assignedAt).toLocaleString()}</dd>
            </div>
          )}
        </dl>
      </FormSection>
    </DetailPageLayout>
  );
}
