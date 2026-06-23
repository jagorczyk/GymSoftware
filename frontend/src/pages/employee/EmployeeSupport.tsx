import { useMemo } from "react";
import { useAuth } from "../../authContext";
import { useAppGymSelector } from "../../appGymSelectorContext";
import { SupportInbox } from "../../components/SupportInbox";
import { createEmployeeSupportApi } from "../../supportApi";

export function EmployeeSupport() {
  const { auth } = useAuth();
  const { state: gymSelector } = useAppGymSelector();

  const api = useMemo(() => (auth ? createEmployeeSupportApi(auth) : null), [auth]);
  const gymId = gymSelector.selectedGymId;

  if (!gymId || !api) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        Wybierz siłownię, aby otworzyć skrzynkę wiadomości.
      </div>
    );
  }

  return <SupportInbox gymId={Number(gymId)} api={api} />;
}
