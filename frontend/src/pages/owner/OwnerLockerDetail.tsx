import { useParams } from "react-router-dom";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatusChip } from "../../components/StatusChip";
import type { OwnerContext } from "./types";

export function OwnerLockerDetail({ ctx }: { ctx: OwnerContext }) {
  const { details } = ctx;
  const { lockerId } = useParams();

  if (!details) return <SelectGymPrompt />;

  const locker = details.lockers.find((l) => l.id === Number(lockerId));
  const guestName = locker?.guestId && locker.guestFirstName
    ? `${locker.guestFirstName} ${locker.guestLastName ?? ""}`.trim()
    : locker?.guestId
      ? `Klient ID: ${locker.guestId}`
      : null;

  if (!locker) {
    return (
      <DetailPageLayout backTo="/owner/lockers" title="Szafka nie znaleziona">
        <p className="text-slate-500">Nie znaleziono szafki o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout
      backTo="/owner/lockers"
      breadcrumb="Szafki"
      title={`Szafka ${locker.lockerNumber}`}
      subtitle={guestName ?? "Wolna"}
    >
      <FormSection title="Szczegóły szafki" description="Podgląd statusu szafki.">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Numer</dt>
            <dd className="font-medium text-slate-900 mt-1">{locker.lockerNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1">
              <StatusChip status={locker.status} />
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Przypisany klient</dt>
            <dd className="font-medium text-slate-900 mt-1">{guestName ?? "—"}</dd>
          </div>
        </dl>
      </FormSection>
    </DetailPageLayout>
  );
}
