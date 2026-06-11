import { useLocation, useParams } from "react-router-dom";
import type { AuditLog } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import type { OwnerContext } from "./types";

export function OwnerHistoryDetail({ ctx }: { ctx: OwnerContext }) {
  const { details } = ctx;
  const { logId } = useParams();
  const location = useLocation();
  const stateLog = (location.state as { log?: AuditLog } | null)?.log;

  if (!details && !stateLog) return <SelectGymPrompt />;

  const log = stateLog ?? details?.logs?.find((l: any) => l.id === Number(logId));

  if (!log) {
    return (
      <DetailPageLayout backTo="/owner/history" title="Wpis nie znaleziony">
        <p className="text-slate-500">Nie znaleziono wpisu o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout
      backTo="/owner/history"
      breadcrumb="Historia"
      title={log.action}
      subtitle={new Date(log.createdAt).toLocaleString()}
    >
      <FormSection title="Szczegóły wpisu">
        <dl className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Autor</dt>
            <dd className="font-medium text-slate-900 mt-1">{log.actorEmail ?? "system"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Data</dt>
            <dd className="font-medium text-slate-900 mt-1">{new Date(log.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Szczegóły</dt>
            <dd className="font-medium text-slate-900 mt-1 whitespace-pre-wrap">{log.payload ?? "—"}</dd>
          </div>
        </dl>
      </FormSection>
    </DetailPageLayout>
  );
}
