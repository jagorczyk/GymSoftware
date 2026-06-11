import type { ReactElement } from "react";
import { EmployeeRouteGuard } from "./EmployeeRouteGuard";
import { useEmployeeDashboardContext } from "../../employeeDashboardContext";
import type { EmployeePermission } from "../../permissions";
import { EmployeeHome } from "./EmployeeHome";
import { EmployeeGuestsList } from "./EmployeeGuestsList";
import { EmployeeGuestForm } from "./EmployeeGuestForm";
import { EmployeeGuestDetail } from "./EmployeeGuestDetail";
import { EmployeeLockersList } from "./EmployeeLockersList";
import { EmployeeLockerDetail } from "./EmployeeLockerDetail";
import { EmployeeLockerForm } from "./EmployeeLockerForm";
import { EmployeePresentList } from "./EmployeePresentList";
import { EmployeePresentDetail } from "./EmployeePresentDetail";
import { EmployeeSchedule } from "./EmployeeSchedule";
import { EmployeeWorkSchedule } from "./EmployeeWorkSchedule";
import { EmployeePassTypesList } from "./EmployeePassTypesList";
import { EmployeePassTypeForm } from "./EmployeePassTypeForm";

function Guarded(props: { permissions: EmployeePermission[]; children: ReactElement }) {
  return <EmployeeRouteGuard permissions={props.permissions}>{props.children}</EmployeeRouteGuard>;
}

export function EmployeeHomePage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeHome ctx={ctx} />
    </Guarded>
  );
}
export function EmployeeGuestsListPage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeGuestsList ctx={ctx} />
    </Guarded>
  );
}
export function EmployeeGuestCreatePage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeGuestForm ctx={ctx} />
    </Guarded>
  );
}
export function EmployeeGuestDetailPage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeGuestDetail ctx={ctx} />
    </Guarded>
  );
}
export function EmployeeLockersListPage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeLockersList ctx={ctx} />
    </Guarded>
  );
}
export function EmployeeLockerCreatePage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeLockerForm ctx={ctx} />
    </Guarded>
  );
}
export function EmployeeLockerDetailPage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeLockerDetail ctx={ctx} />
    </Guarded>
  );
}
export function EmployeePresentListPage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeePresentList ctx={ctx} />
    </Guarded>
  );
}
export function EmployeePresentDetailPage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeePresentDetail ctx={ctx} />
    </Guarded>
  );
}
export function EmployeeSchedulePage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeSchedule ctx={ctx} />
    </Guarded>
  );
}
export function EmployeeWorkSchedulePage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeeWorkSchedule ctx={ctx} />
    </Guarded>
  );
}
export function EmployeePassTypesListPage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeePassTypesList ctx={ctx} />
    </Guarded>
  );
}
export function EmployeePassTypeCreatePage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeePassTypeForm ctx={ctx} mode="create" />
    </Guarded>
  );
}
export function EmployeePassTypeEditPage() {
  const ctx = useEmployeeDashboardContext();
  return (
    <Guarded permissions={ctx.permissions}>
      <EmployeePassTypeForm ctx={ctx} mode="edit" />
    </Guarded>
  );
}
