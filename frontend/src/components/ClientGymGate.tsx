import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { useAppGymSelector } from "../appGymSelectorContext";
import { EmptyState } from "./EmptyState";
import { primaryButtonClassName } from "./formStyles";

type ClientGymGateProps = {
  children: ReactNode;
  noGymMessage?: string;
  selectGymMessage?: string;
};

export function ClientGymGate({
  children,
  noGymMessage = "Zapisz się na zajęcia i umów treningi po dołączeniu do klubu w sieci Gymlos.",
  selectGymMessage = "Wybierz siłownię w menu po lewej stronie.",
}: ClientGymGateProps) {
  const { state: gymSelector } = useAppGymSelector();
  const gymId = gymSelector.selectedGymId;

  if (gymId) {
    return <>{children}</>;
  }

  if (gymSelector.gyms.length === 0) {
    return (
      <EmptyState
        icon={<Store className="w-12 h-12 text-slate-400" />}
        title="Najpierw dołącz do klubu"
        description={noGymMessage}
        action={
          <Link to="/client/gyms/join" className={primaryButtonClassName}>
            <Store className="w-5 h-5" aria-hidden="true" />
            Dołącz do klubu
          </Link>
        }
      />
    );
  }

  return <EmptyState message={selectGymMessage} />;
}
