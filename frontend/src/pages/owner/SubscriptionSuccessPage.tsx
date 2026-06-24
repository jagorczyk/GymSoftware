import { useState, useEffect, FormEvent, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Loader2, CheckCircle2, XCircle, Globe } from "lucide-react";
import { updateOwnerGym, getOwnerGyms, checkGymSubdomainAvailability } from "../../api";
import { setOwnerStripeCheckoutPending } from "../../auth";
import { useAuth } from "../../authContext";
import { useToast } from "../../components/Toast";
import { AuthLayout } from "../../components/AuthLayout";
import { primaryButtonClassName } from "../../components/formStyles";
import {
  formatPostalCodeInput,
  getDomainPreview,
  gymNameToSubdomain,
  validateAddress,
  validatePostalCode,
} from "../../utils/subdomain";
import { needsGymOnboarding } from "../../utils/gymOnboarding";

export function SubscriptionSuccessPage() {
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gymIdParam = searchParams.get("gymId");

  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [gymId, setGymId] = useState<number | null>(gymIdParam ? parseInt(gymIdParam, 10) : null);

  const [gymName, setGymName] = useState("");
  const [gymCity, setGymCity] = useState("");
  const [gymPostalCode, setGymPostalCode] = useState("");
  const [gymAddress, setGymAddress] = useState("");
  const [gymNip, setGymNip] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const previewSubdomain = useMemo(() => gymNameToSubdomain(gymName), [gymName]);
  const domainPreview = useMemo(() => getDomainPreview(previewSubdomain), [previewSubdomain]);

  const postalError = gymPostalCode ? validatePostalCode(gymPostalCode) : null;
  const addressError = gymAddress ? validateAddress(gymAddress) : null;

  useEffect(() => {
    setOwnerStripeCheckoutPending(false);
  }, []);

  useEffect(() => {
    if (!auth) return;

    getOwnerGyms(auth)
      .then((gyms) => {
        const targetGym = gymId ? gyms.find((g) => g.id === gymId) : gyms[0];
        if (!targetGym) {
          navigate("/owner");
          return;
        }

        if (!gymId) setGymId(targetGym.id);

        if (needsGymOnboarding(targetGym)) {
          setNeedsSetup(true);
        } else {
          showSuccess("Subskrypcja aktywna!");
          navigate("/owner");
        }
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Błąd ładowania");
        navigate("/owner");
      })
      .finally(() => setLoading(false));
  }, [auth, gymId, navigate, showError, showSuccess]);

  useEffect(() => {
    if (!gymName.trim() || !gymId) {
      setSubdomainAvailable(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setSubdomainChecking(true);
      checkGymSubdomainAvailability(gymName.trim(), gymId)
        .then((result) => setSubdomainAvailable(result.available))
        .catch(() => setSubdomainAvailable(null))
        .finally(() => setSubdomainChecking(false));
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [gymName, gymId]);

  const canSubmit =
    gymName.trim().length >= 2 &&
    gymCity.trim().length >= 2 &&
    !postalError &&
    !addressError &&
    gymPostalCode.length > 0 &&
    gymAddress.trim().length > 0 &&
    /^\d{10}$/.test(gymNip) &&
    subdomainAvailable === true &&
    !submitting;

  async function handleSetup(e: FormEvent) {
    e.preventDefault();
    if (!gymId || !auth || !canSubmit) return;

    setSubmitting(true);
    try {
      await updateOwnerGym(auth, gymId, {
        name: gymName.trim(),
        city: gymCity.trim(),
        postalCode: gymPostalCode,
        address: gymAddress.trim(),
        nip: gymNip,
      });
      showSuccess("Siłownia skonfigurowana!");
      navigate("/owner");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd podczas konfiguracji");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!needsSetup) {
    return null;
  }

  return (
    <AuthLayout
      title="Skonfiguruj siłownię"
      subtitle="Uzupełnij dane swojej siłowni, aby dokończyć konfigurację konta i korzystać z panelu."
    >
      <form onSubmit={(e) => void handleSetup(e)} className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Dane siłowni</h2>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">
            Nazwa siłowni
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Building2 className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              required
              minLength={2}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
              placeholder="Nazwa siłowni"
              disabled={submitting}
            />
          </div>

          {gymName.trim() && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Globe className="w-4 h-4 text-primary-500 shrink-0" />
                <span>
                  Adres panelu:{" "}
                  <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                    https://{domainPreview}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {subdomainChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="text-slate-500">Sprawdzanie dostępności...</span>
                  </>
                ) : subdomainAvailable === true ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Domena jest wolna</span>
                  </>
                ) : subdomainAvailable === false ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">
                      Ta domena jest już zajęta — wybierz inną nazwę
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">
              Miasto
            </label>
            <input
              type="text"
              value={gymCity}
              onChange={(e) => setGymCity(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
              placeholder="Warszawa"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">
              Kod pocztowy
            </label>
            <input
              type="text"
              value={gymPostalCode}
              onChange={(e) => setGymPostalCode(formatPostalCodeInput(e.target.value))}
              required
              inputMode="numeric"
              pattern="^\d{2}-\d{3}$"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all ${
                postalError
                  ? "border-red-300 dark:border-red-800 focus:border-red-500"
                  : "border-slate-100 dark:border-slate-800 focus:border-primary-500"
              }`}
              placeholder="00-000"
              disabled={submitting}
            />
            {postalError && <p className="text-xs text-red-600 dark:text-red-400">{postalError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">
              Adres
            </label>
            <input
              type="text"
              value={gymAddress}
              onChange={(e) => setGymAddress(e.target.value)}
              required
              minLength={5}
              className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all ${
                addressError
                  ? "border-red-300 dark:border-red-800 focus:border-red-500"
                  : "border-slate-100 dark:border-slate-800 focus:border-primary-500"
              }`}
              placeholder="ul. Główna 1"
              disabled={submitting}
            />
            {addressError && <p className="text-xs text-red-600 dark:text-red-400">{addressError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">
              NIP
            </label>
            <input
              type="text"
              value={gymNip}
              onChange={(e) => setGymNip(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              inputMode="numeric"
              pattern="^\d{10}$"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
              placeholder="1234567890"
              disabled={submitting}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full mt-6 ${primaryButtonClassName} disabled:cursor-not-allowed`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            "Zapisz i przejdź do panelu"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
