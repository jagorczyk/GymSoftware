import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { UserCircle, KeyRound, Save, Mail, Phone, User, ShieldCheck, AlertCircle } from "lucide-react";
import {
  beginProfileMfaSetup,
  changeProfilePassword,
  confirmProfileMfaSetup,
  getProfile,
  ProfileView,
  updateProfile,
} from "../api";
import { FormSection } from "../components/FormSection";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import {
  inputClassName,
  labelClassName,
  panelSurfaceClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../components/formStyles";

export function ProfileSettingsPage() {
  const { auth } = useAuth();

  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mfaCode, setMfaCode] = useState("");
  const [mfaQrCodeDataUrl, setMfaQrCodeDataUrl] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaSetupStarted, setMfaSetupStarted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!auth) return;
    let cancelled = false;
    setLoadingProfile(true);
    getProfile(auth)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage({
            text: err instanceof Error ? err.message : "Nie udało się pobrać profilu",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateProfile(auth, { firstName, lastName });
      setProfile(updated);
      setMessage({ text: "Profil został zaktualizowany pomyślnie.", type: "success" });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Nie udało się zapisać profilu",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth || saving || !profile?.passwordChangeAllowed) return;
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Nowe hasła nie są identyczne.", type: "error" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await changeProfilePassword(auth, { currentPassword, newPassword });
      setMessage({ text: "Hasło zostało zmienione pomyślnie.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Nie udało się zmienić hasła",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBeginMfaSetup = async () => {
    if (!auth || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const data = await beginProfileMfaSetup(auth);
      setMfaQrCodeDataUrl(data.qrCodeDataUrl);
      setMfaSecret(data.secret);
      setMfaSetupStarted(true);
      setMfaCode("");
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Nie udało się rozpocząć konfiguracji MFA",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmMfaSetup = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth || saving || mfaCode.length !== 6) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await confirmProfileMfaSetup(auth, mfaCode);
      setProfile(updated);
      setMfaSetupStarted(false);
      setMfaQrCodeDataUrl(null);
      setMfaSecret(null);
      setMfaCode("");
      setMessage({ text: "MFA zostało aktywowane na Twoim koncie.", type: "success" });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Nie udało się aktywować MFA",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "OWNER":
        return "Właściciel";
      case "EMPLOYEE":
        return "Pracownik";
      case "GUEST":
        return "Klient";
      default:
        return role || "Użytkownik";
    }
  };

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    auth?.email?.split("@")[0] ||
    "Użytkownik";

  if (loadingProfile) {
    return <LoadingState message="Ładowanie profilu..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Ustawienia profilu"
        subtitle="Zarządzaj swoimi danymi osobowymi, preferencjami i bezpieczeństwem konta."
      />

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className={`${panelSurfaceClassName} p-6 flex flex-col items-center text-center`}>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/20 mb-4 ring-4 ring-white dark:ring-slate-950">
              <UserCircle className="w-14 h-14" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{displayName}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-4">{profile?.email ?? auth?.email}</p>
            <div className="inline-flex px-3 py-1 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-full text-xs font-bold border border-primary-100 dark:border-primary-900/50">
              {getRoleLabel(profile?.role ?? auth?.role)}
            </div>
            {profile?.googleLinked ? (
              <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">Konto powiązane z Google</p>
            ) : null}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <FormSection title="Dane osobowe" className={panelSurfaceClassName}>
            <div className="pb-4 flex items-center gap-3">
              <User className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Dane osobowe</h3>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClassName}>Imię</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Twoje imię"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClassName}>Nazwisko</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Twoje nazwisko"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClassName}>Adres email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={profile?.email ?? auth?.email ?? ""}
                    disabled
                    className={`${inputClassName} pl-10 text-slate-600 dark:text-slate-400 cursor-not-allowed`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClassName}>Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 000 000 000"
                    className={`${inputClassName} pl-10`}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={primaryButtonClassName}
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </FormSection>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Uwierzytelnianie dwuskładnikowe (MFA)</h3>
            </div>
            <div className="p-6 space-y-4">
              {profile?.mfaEnabled ? (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">MFA jest aktywne</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400/90 mt-1">
                      Przy logowaniu będziesz musiał podać 6-cyfrowy kod z aplikacji uwierzytelniającej.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-800 dark:text-amber-300">
                        {profile?.mfaMandatory ? "MFA jest wymagane" : "MFA nie jest skonfigurowane"}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400/90 mt-1">
                        {profile?.mfaMandatory
                          ? "Jako właściciel lub administrator musisz włączyć MFA, aby dodatkowo zabezpieczyć konto."
                          : "Możesz opcjonalnie włączyć MFA i logować się kodem z aplikacji Google Authenticator (lub podobnej)."}
                      </p>
                    </div>
                  </div>

                  {!mfaSetupStarted ? (
                    <button
                      type="button"
                      onClick={handleBeginMfaSetup}
                      disabled={saving}
                      className={`${primaryButtonClassName} w-full sm:w-auto`}
                    >
                      Skonfiguruj MFA
                    </button>
                  ) : (
                    <form onSubmit={handleConfirmMfaSetup} className="space-y-4">
                      {mfaQrCodeDataUrl ? (
                        <div className="flex flex-col items-center gap-3">
                          <img
                            src={mfaQrCodeDataUrl}
                            alt="Kod QR MFA"
                            className="w-48 h-48 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-3"
                          />
                          {mfaSecret ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center break-all">
                              Klucz ręczny: <span className="font-mono text-slate-700 dark:text-slate-300">{mfaSecret}</span>
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Zeskanuj kod QR w aplikacji uwierzytelniającej, a następnie wpisz wygenerowany 6-cyfrowy kod.
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-black text-center tracking-[0.5em] text-2xl text-slate-900 dark:text-white"
                        placeholder="123456"
                        maxLength={6}
                        required
                        disabled={saving || !mfaQrCodeDataUrl}
                      />
                      <button
                        type="submit"
                        disabled={saving || mfaCode.length !== 6 || !mfaQrCodeDataUrl}
                        className={`w-full sm:w-auto ${primaryButtonClassName}`}
                      >
                        {saving ? "Aktywowanie..." : "Aktywuj MFA"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          {profile?.passwordChangeAllowed ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
                <KeyRound className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Zmiana hasła</h3>
              </div>
              <form onSubmit={handleSavePassword} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className={labelClassName}>Obecne hasło</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Wprowadź obecne hasło"
                    className={inputClassName}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClassName}>Nowe hasło</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Wprowadź nowe hasło"
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClassName}>Potwierdź nowe hasło</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Potwierdź nowe hasło"
                      className={inputClassName}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                    className={primaryButtonClassName}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Zapisywanie..." : "Zmień hasło"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
                <KeyRound className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Zmiana hasła</h3>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4">
                  <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    To konto korzysta z logowania Google. Hasło jest zarządzane przez Google — nie możesz go zmienić w tej aplikacji.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
