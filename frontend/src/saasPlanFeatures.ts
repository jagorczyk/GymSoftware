export const SAAS_PLAN_FEATURES = [
  {
    id: "SCHEDULE",
    label: "Terminarz zajęć",
    description: "Kalendarz zajęć grupowych i rezerwacje",
    ownerRoutes: ["/owner/schedule"],
  },
  {
    id: "WORK_SCHEDULE",
    label: "Grafik pracowników",
    description: "Planowanie zmian i grafików personelu",
    ownerRoutes: ["/owner/work-schedule"],
  },
  {
    id: "TRAINER_BOOKINGS",
    label: "Trenerzy i rezerwacje PT",
    description: "Profile trenerów i rezerwacje treningów personalnych",
    ownerRoutes: ["/owner/trainers"],
  },
  {
    id: "LOCKERS",
    label: "Szafki",
    description: "Zarządzanie szafkami i przypisaniami",
    ownerRoutes: ["/owner/lockers"],
  },
  {
    id: "INVENTORY",
    label: "Magazyn / POS",
    description: "Produkty, sprzedaż i stany magazynowe",
    ownerRoutes: ["/owner/products"],
  },
  {
    id: "ANALYTICS",
    label: "Analityka",
    description: "Wykresy i statystyki biznesowe",
    ownerRoutes: ["/owner/analytics"],
  },
  {
    id: "CRM",
    label: "Marketing i CRM",
    description: "Kampanie e-mail i komunikacja z klientami",
    ownerRoutes: ["/owner/crm"],
  },
  {
    id: "CLASS_RATINGS",
    label: "Oceny zajęć",
    description: "Opinie klientów o zajęciach grupowych",
    ownerRoutes: ["/owner/class-ratings"],
  },
  {
    id: "NOTIFICATIONS",
    label: "Powiadomienia e-mail",
    description: "Automatyczne powiadomienia i ustawienia",
    ownerRoutes: ["/owner/notifications"],
  },
  {
    id: "SALES_REPORT",
    label: "Raport sprzedaży",
    description: "Raporty przychodów i eksport danych",
    ownerRoutes: ["/owner/sales-report"],
  },
  {
    id: "AUDIT_LOG",
    label: "Historia / audyt",
    description: "Logi operacji w systemie",
    ownerRoutes: ["/owner/history"],
  },
] as const;

export type SaasPlanFeatureId = (typeof SAAS_PLAN_FEATURES)[number]["id"];

export const SAAS_PLAN_FEATURE_PRESETS: Record<string, SaasPlanFeatureId[]> = {
  starter: ["LOCKERS", "SALES_REPORT", "AUDIT_LOG"],
  pro: [
    "LOCKERS",
    "SALES_REPORT",
    "AUDIT_LOG",
    "SCHEDULE",
    "WORK_SCHEDULE",
    "TRAINER_BOOKINGS",
    "CLASS_RATINGS",
    "NOTIFICATIONS",
  ],
  premium: SAAS_PLAN_FEATURES.map((feature) => feature.id),
};

export function hasSaasPlanFeature(features: string[] | undefined | null, featureId: SaasPlanFeatureId): boolean {
  if (!features || features.length === 0) return true;
  return features.includes(featureId);
}

export function formatSaasPlanFeatureLabels(featureIds: string[] | undefined | null): string[] {
  if (!featureIds || featureIds.length === 0) {
    return SAAS_PLAN_FEATURES.map((feature) => feature.label);
  }
  return SAAS_PLAN_FEATURES.filter((feature) => featureIds.includes(feature.id)).map((feature) => feature.label);
}

export function ownerRouteRequiresFeature(pathname: string): SaasPlanFeatureId | null {
  for (const feature of SAAS_PLAN_FEATURES) {
    if (feature.ownerRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return feature.id;
    }
  }
  return null;
}
