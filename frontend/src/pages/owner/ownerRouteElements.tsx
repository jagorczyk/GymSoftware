import { useOwnerDashboardContext } from "../../ownerDashboardContext";
import { OwnerStats } from "./OwnerStats";
import { OwnerGymsList } from "./OwnerGymsList";
import { OwnerGymForm } from "./OwnerGymForm";
import { OwnerGuestsList } from "./OwnerGuestsList";
import { OwnerGuestDetail } from "./OwnerGuestDetail";
import { OwnerEmployeesList } from "./OwnerEmployeesList";
import { OwnerEmployeeForm } from "./OwnerEmployeeForm";
import { OwnerPassTypesList } from "./OwnerPassTypesList";
import { OwnerPassTypeForm } from "./OwnerPassTypeForm";
import { OwnerPassesList } from "./OwnerPassesList";
import { OwnerPassDetail } from "./OwnerPassDetail";
import { OwnerLockersList } from "./OwnerLockersList";
import { OwnerLockerForm } from "./OwnerLockerForm";
import { OwnerLockerDetail } from "./OwnerLockerDetail";
import { OwnerHistoryList } from "./OwnerHistoryList";
import { OwnerHistoryDetail } from "./OwnerHistoryDetail";
import { OwnerSchedule } from "./OwnerSchedule";
import { OwnerWorkSchedule } from "./OwnerWorkSchedule";
import { OwnerSalesReport } from "./OwnerSalesReport";
import { OwnerNotifications } from "./OwnerNotifications";
import { AnalyticsDashboardPage } from "./AnalyticsDashboardPage";
import { OwnerRanksList } from "./OwnerRanksList";
import { OwnerRankForm } from "./OwnerRankForm";
import { OwnerProducts } from "./OwnerProducts";
import { OwnerClassRatings } from "./OwnerClassRatings";
import { OwnerCrm } from "./OwnerCrm";
import { OwnerSupport } from "./OwnerSupport";
import { OwnerTrainersList } from "./OwnerTrainersList";
import { OwnerTrainerForm } from "./OwnerTrainerForm";
import { OwnerSubscription } from "./OwnerSubscription";

export function OwnerStatsPage() {
  return <OwnerStats ctx={useOwnerDashboardContext()} />;
}
export function OwnerGymsListPage() {
  return <OwnerGymsList ctx={useOwnerDashboardContext()} />;
}
export function OwnerGymCreatePage() {
  return <OwnerGymForm ctx={useOwnerDashboardContext()} mode="create" />;
}
export function OwnerGymEditPage() {
  return <OwnerGymForm ctx={useOwnerDashboardContext()} mode="edit" />;
}
export function OwnerGuestsListPage() {
  return <OwnerGuestsList ctx={useOwnerDashboardContext()} />;
}
export function OwnerGuestDetailPage() {
  return <OwnerGuestDetail ctx={useOwnerDashboardContext()} />;
}
export function OwnerEmployeesListPage() {
  return <OwnerEmployeesList ctx={useOwnerDashboardContext()} />;
}
export function OwnerEmployeeCreatePage() {
  return <OwnerEmployeeForm ctx={useOwnerDashboardContext()} mode="create" />;
}
export function OwnerEmployeeEditPage() {
  return <OwnerEmployeeForm ctx={useOwnerDashboardContext()} mode="edit" />;
}
export function OwnerPassTypesListPage() {
  return <OwnerPassTypesList ctx={useOwnerDashboardContext()} />;
}
export function OwnerPassTypeCreatePage() {
  return <OwnerPassTypeForm ctx={useOwnerDashboardContext()} mode="create" />;
}
export function OwnerPassTypeEditPage() {
  return <OwnerPassTypeForm ctx={useOwnerDashboardContext()} mode="edit" />;
}
export function OwnerPassesListPage() {
  return <OwnerPassesList ctx={useOwnerDashboardContext()} />;
}
export function OwnerPassDetailPage() {
  return <OwnerPassDetail ctx={useOwnerDashboardContext()} />;
}
export function OwnerLockersListPage() {
  return <OwnerLockersList ctx={useOwnerDashboardContext()} />;
}
export function OwnerLockerCreatePage() {
  return <OwnerLockerForm ctx={useOwnerDashboardContext()} />;
}
export function OwnerLockerDetailPage() {
  return <OwnerLockerDetail ctx={useOwnerDashboardContext()} />;
}
export function OwnerHistoryListPage() {
  return <OwnerHistoryList ctx={useOwnerDashboardContext()} />;
}
export function OwnerHistoryDetailPage() {
  return <OwnerHistoryDetail ctx={useOwnerDashboardContext()} />;
}
export function OwnerSchedulePage() {
  return <OwnerSchedule ctx={useOwnerDashboardContext()} />;
}
export function OwnerWorkSchedulePage() {
  return <OwnerWorkSchedule ctx={useOwnerDashboardContext()} />;
}
export function OwnerSalesReportPage() {
  return <OwnerSalesReport ctx={useOwnerDashboardContext()} />;
}
export function OwnerNotificationsPage() {
  return <OwnerNotifications ctx={useOwnerDashboardContext()} />;
}
export function OwnerAnalyticsPage() {
  return <AnalyticsDashboardPage ctx={useOwnerDashboardContext()} />;
}
export function OwnerRanksListPage() {
  return <OwnerRanksList ctx={useOwnerDashboardContext()} />;
}
export function OwnerRankCreatePage() {
  return <OwnerRankForm ctx={useOwnerDashboardContext()} mode="create" />;
}
export function OwnerRankEditPage() {
  return <OwnerRankForm ctx={useOwnerDashboardContext()} mode="edit" />;
}

export function OwnerProductsPage() {
  return <OwnerProducts ctx={useOwnerDashboardContext()} />;
}

export function OwnerClassRatingsPage() {
  return <OwnerClassRatings ctx={useOwnerDashboardContext()} />;
}
export function OwnerCrmPage() { return <OwnerCrm ctx={useOwnerDashboardContext()} />; }
export function OwnerSupportPage() { return <OwnerSupport ctx={useOwnerDashboardContext()} />; }

export function OwnerTrainersListPage() {
  return <OwnerTrainersList ctx={useOwnerDashboardContext()} />;
}
export function OwnerTrainerCreatePage() {
  return <OwnerTrainerForm ctx={useOwnerDashboardContext()} />;
}
export function OwnerTrainerEditPage() {
  return <OwnerTrainerForm ctx={useOwnerDashboardContext()} />;
}

export function OwnerSubscriptionPage() {
  return <OwnerSubscription />;
}
