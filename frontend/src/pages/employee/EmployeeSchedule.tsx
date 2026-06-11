import { SelectGymDashboardPrompt } from "./EmployeeHome";
import { ScheduleView } from "../shared/ScheduleView";
import type { EmployeeContext } from "./types";

export function EmployeeSchedule({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, setError, setMessage } = ctx;

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  return (
    <ScheduleView
      auth={auth}
      gymId={Number(selectedGymId)}
      onError={(msg) => setError(msg)}
      onInfo={(msg) => setMessage(msg)}
    />
  );
}
