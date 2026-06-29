import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { ClientClassesPage } from "./ClientClassesPage";
import { ClientTrainersPage } from "./ClientTrainersPage";
import { ClientMyBookings } from "./ClientMyBookings";

type ActivitiesTab = "classes" | "trainers" | "bookings";

function parseTab(value: string | null): ActivitiesTab {
  if (value === "trainers" || value === "bookings") return value;
  return "classes";
}

export function ClientActivitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  function setActiveTab(tab: ActivitiesTab) {
    setSearchParams({ tab }, { replace: true });
  }

  const tabClass = (tab: ActivitiesTab) =>
    `pb-3 font-bold text-sm transition-colors border-b-2 ${
      activeTab === tab
        ? "border-primary-500 text-primary-600 dark:text-primary-400"
        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
    }`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zajęcia i treningi"
        subtitle="Zapisz się na zajęcia grupowe, umów trening personalny lub sprawdź swoje rezerwacje."
      />

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6" role="tablist" aria-label="Sekcje zajęć">
        <button
          type="button"
          role="tab"
          id="tab-classes"
          aria-selected={activeTab === "classes"}
          aria-controls="panel-classes"
          onClick={() => setActiveTab("classes")}
          className={tabClass("classes")}
        >
          Zajęcia grupowe
        </button>
        <button
          type="button"
          role="tab"
          id="tab-trainers"
          aria-selected={activeTab === "trainers"}
          aria-controls="panel-trainers"
          onClick={() => setActiveTab("trainers")}
          className={tabClass("trainers")}
        >
          Nasi trenerzy
        </button>
        <button
          type="button"
          role="tab"
          id="tab-bookings"
          aria-selected={activeTab === "bookings"}
          aria-controls="panel-bookings"
          onClick={() => setActiveTab("bookings")}
          className={tabClass("bookings")}
        >
          Moje rezerwacje
        </button>
      </div>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="pt-2"
      >
        {activeTab === "classes" && <ClientClassesPage hideHeader />}
        {activeTab === "trainers" && <ClientTrainersPage hideHeader />}
        {activeTab === "bookings" && <ClientMyBookings />}
      </div>
    </div>
  );
}
