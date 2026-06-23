import { useMemo } from "react";
import { useAuth } from "../../authContext";
import { SupportInbox } from "../../components/SupportInbox";
import { createOwnerSupportApi } from "../../supportApi";
import { OwnerContext } from "./types";

export function OwnerSupport({ ctx }: { ctx: OwnerContext }) {
  const { auth } = useAuth();
  const { selectedGymId } = ctx;

  const api = useMemo(() => (auth ? createOwnerSupportApi(auth) : null), [auth]);

  if (!selectedGymId || !api) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        Wybierz siłownię, aby otworzyć skrzynkę wiadomości.
      </div>
    );
  }

  return <SupportInbox gymId={Number(selectedGymId)} api={api} />;
}
