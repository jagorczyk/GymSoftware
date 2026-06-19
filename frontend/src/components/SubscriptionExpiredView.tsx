import { Lock, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

interface SubscriptionExpiredViewProps {
  role?: string;
  onNavigateToSubscription: () => void;
}

export function SubscriptionExpiredView({ role, onNavigateToSubscription }: SubscriptionExpiredViewProps) {
  const isOwner = role === "OWNER";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center shadow-inner mb-6">
        <Lock className="w-12 h-12" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
        Dostęp Zablokowany
      </h1>

      <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-md font-medium">
        Subskrypcja tej siłowni wygasła lub płatność nie została uregulowana. Wszystkie funkcje zostały tymczasowo zawieszone.
      </p>

      {isOwner ? (
        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={onNavigateToSubscription}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-red-500/20 outline-none flex justify-center items-center gap-3"
          >
            <CreditCard className="w-5 h-5" />
            Ureguluj płatność
          </button>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
            Przejdź do zakładki subskrypcji, aby odnowić dostęp.
          </p>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Prosimy o kontakt z właścicielem siłowni w celu wyjaśnienia problemu.
          </p>
        </div>
      )}
    </div>
  );
}
