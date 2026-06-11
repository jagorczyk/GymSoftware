const EXPIRING_DAYS = 7;

export type ExpiringPassItem = {
  guestId: number;
  firstName: string;
  lastName: string;
  endDate: string;
  daysRemaining?: number;
};

export type DashboardKpis = {
  presentNow: number;
  freeLockers: number;
  occupiedLockers: number;
  expiringPassesCount: number;
  salesLast7Days: number;
};

function parseDateOnly(value: string) {
  return new Date(value.includes("T") ? value : `${value}T12:00:00`);
}

function daysUntil(endDate: string) {
  const end = parseDateOnly(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

function isWithinDays(endDate: string, maxDays: number) {
  const left = daysUntil(endDate);
  return left >= 0 && left <= maxDays;
}

export function computeOwnerKpis(details: {
  guests: Array<{ isPresent?: boolean; activePassEndDate?: string | null }>;
  lockers: Array<{ status: string }>;
  passes: Array<{ status: string; startDate: string; price: number }>;
}): DashboardKpis {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const presentNow = details.guests.filter((g) => g.isPresent).length;
  const freeLockers = details.lockers.filter((l) => l.status === "AVAILABLE").length;
  const occupiedLockers = details.lockers.filter((l) => l.status === "OCCUPIED").length;

  const expiringPassesCount = details.guests.filter(
    (g) => g.activePassEndDate && isWithinDays(g.activePassEndDate, EXPIRING_DAYS)
  ).length;

  const salesLast7Days = details.passes
    .filter((p) => parseDateOnly(p.startDate) >= weekAgo)
    .reduce((sum, p) => sum + Number(p.price), 0);

  return { presentNow, freeLockers, occupiedLockers, expiringPassesCount, salesLast7Days };
}

export function ownerExpiringPasses(details: {
  guests: Array<{
    id: number;
    firstName: string;
    lastName: string;
    activePassEndDate?: string | null;
  }>;
}): ExpiringPassItem[] {
  return details.guests
    .filter((g) => g.activePassEndDate && isWithinDays(g.activePassEndDate, EXPIRING_DAYS))
    .map((g) => ({
      guestId: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      endDate: g.activePassEndDate!,
      daysRemaining: daysUntil(g.activePassEndDate!),
    }))
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
}

export function computeEmployeeKpis(overview: {
  presentGuests: unknown[];
  allLockers: Array<{ status: string }>;
  expiringPasses?: ExpiringPassItem[];
  salesLast7Days?: number;
}): DashboardKpis {
  const freeLockers = overview.allLockers.filter((l) => l.status === "AVAILABLE").length;
  const occupiedLockers = overview.allLockers.filter((l) => l.status === "OCCUPIED").length;
  return {
    presentNow: overview.presentGuests.length,
    freeLockers,
    occupiedLockers,
    expiringPassesCount: overview.expiringPasses?.length ?? 0,
    salesLast7Days: Number(overview.salesLast7Days ?? 0),
  };
}

export { EXPIRING_DAYS };
