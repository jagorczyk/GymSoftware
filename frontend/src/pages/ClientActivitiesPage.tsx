import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ClientClassesPage } from "./ClientClassesPage";
import { ClientTrainersPage } from "./ClientTrainersPage";
import { ClientMyBookings } from "./ClientMyBookings";

export function ClientActivitiesPage() {
  const [activeTab, setActiveTab] = useState<"classes" | "trainers" | "bookings">("classes");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zajęcia i Treningi"
        subtitle="Zapisz się na zajęcia grupowe, umów trening personalny lub sprawdź swoje rezerwacje."
      />

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("classes")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "classes"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Zajęcia grupowe
        </button>
        <button
          onClick={() => setActiveTab("trainers")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "trainers"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Nasi Trenerzy
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "bookings"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Moje Rezerwacje
        </button>
      </div>

      <div className="pt-2 animate-in fade-in duration-300">
        {activeTab === "classes" && <ClientClassesPage hideHeader />}
        {activeTab === "trainers" && <ClientTrainersPage hideHeader />}
        {activeTab === "bookings" && <ClientMyBookings />}
      </div>
    </div>
  );
}
