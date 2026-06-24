import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getOwnerGyms } from "../../api";
import { setOwnerStripeCheckoutPending } from "../../auth";
import { useAuth } from "../../authContext";
import { useToast } from "../../components/Toast";
import { needsGymOnboarding } from "../../utils/gymOnboarding";

export function SubscriptionSuccessPage() {
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gymIdParam = searchParams.get("gymId");
  const gymId = gymIdParam ? parseInt(gymIdParam, 10) : null;

  useEffect(() => {
    setOwnerStripeCheckoutPending(false);
  }, []);

  useEffect(() => {
    if (!auth) return;

    getOwnerGyms(auth)
      .then((gyms) => {
        const targetGym = gymId ? gyms.find((g) => g.id === gymId) : gyms[0];
        if (!targetGym) {
          navigate("/owner/dashboard", { replace: true });
          return;
        }

        if (needsGymOnboarding(targetGym)) {
          navigate("/owner/dashboard", { replace: true });
        } else {
          showSuccess("Subskrypcja aktywna!");
          navigate("/owner/dashboard", { replace: true });
        }
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Błąd ładowania");
        navigate("/owner/dashboard", { replace: true });
      });
  }, [auth, gymId, navigate, showError, showSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
    </div>
  );
}
