import { useState } from "react";
import { useAuth } from "../authContext";
import { UserCircle, KeyRound, Save, Mail, Phone, MapPin, Building2, User } from "lucide-react";
import { useTheme } from "../ThemeContext";

export function ProfileSettingsPage() {
  const { auth } = useAuth();
  const { theme } = useTheme();

  // Basic info state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    // TODO: Wire to backend API once available
    // await api.updateProfile(...)
    setTimeout(() => {
      setSaving(false);
      setMessage({ text: "Profil został zaktualizowany pomyślnie.", type: "success" });
    }, 1000);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Nowe hasła nie są identyczne.", type: "error" });
      return;
    }
    setSaving(true);
    setMessage(null);
    // TODO: Wire to backend API once available
    setTimeout(() => {
      setSaving(false);
      setMessage({ text: "Hasło zostało zmienione pomyślnie.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case "OWNER": return "Właściciel";
      case "EMPLOYEE": return "Pracownik";
      case "GUEST": return "Klient";
      default: return role || "Użytkownik";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">
          Ustawienia Profilu
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Zarządzaj swoimi danymi osobowymi, preferencjami i bezpieczeństwem konta.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400" 
            : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/20 mb-4 ring-4 ring-white dark:ring-slate-950">
              <UserCircle className="w-14 h-14" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {auth?.email?.split('@')[0] || "Użytkownik"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">
              {auth?.email}
            </p>
            <div className="inline-flex px-3 py-1 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-full text-xs font-black uppercase tracking-widest border border-primary-100 dark:border-primary-900/50">
              {getRoleLabel(auth?.role)}
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Personal Info Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
              <User className="w-5 h-5 text-primary-500" />
              <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Dane Osobowe
              </h3>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Imię</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Twoje imię"
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-slate-900 dark:text-slate-100 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nazwisko</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Twoje nazwisko"
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-slate-900 dark:text-slate-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Adres Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={auth?.email || ""}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 000 000 000"
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-slate-900 dark:text-slate-100 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Zapisywanie..." : "Zapisz Zmiany"}
                </button>
              </div>
            </form>
          </div>

          {/* Security Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
              <KeyRound className="w-5 h-5 text-indigo-500" />
              <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Zmiana Hasła
              </h3>
            </div>
            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Obecne Hasło</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Wprowadź obecne hasło"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-slate-100 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nowe Hasło</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Wprowadź nowe hasło"
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-slate-100 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Potwierdź Nowe Hasło</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Potwierdź nowe hasło"
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-slate-100 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Zapisywanie..." : "Zmień Hasło"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
