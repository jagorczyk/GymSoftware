import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { ScheduleView } from "../shared/ScheduleView";
import type { OwnerContext } from "./types";

export function OwnerSchedule({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, setError, setInfo } = ctx;

  if (!selectedGymId) return <SelectGymPrompt />;

  return (
    <ScheduleView
      auth={auth}
      gymId={Number(selectedGymId)}
      onError={(msg) => setError(msg)}
      onInfo={(msg) => setInfo(msg)}
    />
  );
}
