import { useParams } from "react-router-dom";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatusChip } from "../../components/StatusChip";
import { GuestPassActions } from "../../components/GuestPassActions";
import type { OwnerContext } from "./types";

export function OwnerPassDetail({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, details, loadGymsAndDetails, setError, setInfo } = ctx;
  const { passId } = useParams();

  if (!details || !selectedGymId) return <SelectGymPrompt />;

  const pass = details.passes.find((p) => p.id === Number(passId));
  const guestName = pass?.guestFirstName
    ? `${pass.guestFirstName} ${pass.guestLastName ?? ""}`.trim()
    : pass
      ? `Klient ID: ${pass.guestId}`
      : "";

  if (!pass) {
    return (
      <DetailPageLayout backTo="/owner/passes" title="Karnet nie znaleziony">
        <p className="text-slate-500">Nie znaleziono karnetu o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout
      backTo="/owner/passes"
      breadcrumb="Karnety"
      title={pass.passType}
      subtitle={guestName}
    >
      <FormSection title="Szczegóły karnetu">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <dt className="text-slate-500">Klient</dt>
            <dd className="font-medium text-slate-900 mt-1">{guestName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1">
              <StatusChip status={pass.status} />
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Okres</dt>
            <dd className="font-medium text-slate-900 mt-1">
              {pass.startDate} — {pass.endDate}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Cena</dt>
            <dd className="font-medium text-slate-900 mt-1">{pass.price} zł</dd>
          </div>
        </dl>
        <GuestPassActions
          auth={auth}
          gymId={Number(selectedGymId)}
          pass={pass}
          onUpdated={loadGymsAndDetails}
          setError={setError}
          setInfo={setInfo}
        />
      </FormSection>
    </DetailPageLayout>
  );
}
