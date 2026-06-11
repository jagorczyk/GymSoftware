import { useMemo } from "react";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { WorkScheduleView } from "../shared/WorkScheduleView";
import type { OwnerContext } from "./types";

export function OwnerWorkSchedule({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, details, setError, setInfo } = ctx;

  const employees = useMemo(
    () =>
      (details?.employees ?? []).map((e: { id: number; email: string }) => ({
        id: e.id,
        label: e.email,
      })),
    [details?.employees]
  );

  if (!selectedGymId) return <SelectGymPrompt />;

  return (
    <WorkScheduleView
      auth={auth}
      gymId={Number(selectedGymId)}
      employees={employees}
      isOwner
      onError={(msg) => setError(msg)}
      onInfo={(msg) => setInfo(msg)}
    />
  );
}
