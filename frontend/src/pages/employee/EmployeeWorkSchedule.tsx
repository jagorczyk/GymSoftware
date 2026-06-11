import { useMemo } from "react";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import { WorkScheduleView } from "../shared/WorkScheduleView";
import type { EmployeeContext } from "./types";

export function EmployeeWorkSchedule({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, gyms, setError, setMessage } = ctx;

  const currentGym = useMemo(
    () => gyms.find((g) => g.gymId === Number(selectedGymId)),
    [gyms, selectedGymId]
  );

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  return (
    <WorkScheduleView
      auth={auth}
      gymId={Number(selectedGymId)}
      employees={
        currentGym
          ? [{ id: currentGym.employeeId, label: "Ja" }]
          : []
      }
      isOwner={false}
      lockedEmployeeId={currentGym?.employeeId}
      onError={(msg) => setError(msg)}
      onInfo={(msg) => setMessage(msg)}
    />
  );
}
