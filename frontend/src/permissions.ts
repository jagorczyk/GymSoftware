export type EmployeePermission =
  | "VIEW_DASHBOARD"
  | "MANAGE_GUESTS"
  | "SELL_PASSES"
  | "MANAGE_LOCKERS"
  | "CREATE_LOCKERS"
  | "MANAGE_PASS_TYPES"
  | "MANAGE_SCHEDULE"
  | "MANAGE_WORK_SCHEDULE"
  | "MANAGE_CLASSES"
  | "MANAGE_PRODUCTS"
  | "SELL_PRODUCTS"
  | "PERSONAL_TRAINER"
  | "MANAGE_SUPPORT";

export const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermission[] = [
  "VIEW_DASHBOARD",
  "MANAGE_GUESTS",
  "SELL_PASSES",
  "MANAGE_LOCKERS",
  "SELL_PRODUCTS",
];

export const OPTIONAL_EMPLOYEE_PERMISSIONS: EmployeePermission[] = [
  "MANAGE_SCHEDULE",
  "MANAGE_WORK_SCHEDULE",
  "CREATE_LOCKERS",
  "MANAGE_PASS_TYPES",
  "MANAGE_CLASSES",
  "MANAGE_PRODUCTS",
  "PERSONAL_TRAINER",
  "MANAGE_SUPPORT",
];

export const PERMISSION_LABELS: Record<EmployeePermission, string> = {
  VIEW_DASHBOARD: "Podgląd panelu i obecnych klientów",
  MANAGE_GUESTS: "Zarządzanie klientami",
  SELL_PASSES: "Sprzedaż karnetów",
  MANAGE_LOCKERS: "Przypisywanie i odbiór szafek",
  CREATE_LOCKERS: "Dodawanie nowych szafek",
  MANAGE_PASS_TYPES: "Zarządzanie ofertą karnetów",
  MANAGE_SCHEDULE: "Zarządzanie terminarzem",
  MANAGE_WORK_SCHEDULE: "Zarządzanie grafikiem pracy",
  MANAGE_CLASSES: "Zarządzanie zajęciami grupowymi",
  MANAGE_PRODUCTS: "Zarządzanie bazą produktów i magazynem",
  SELL_PRODUCTS: "Sprzedaż produktów (POS)",
  PERSONAL_TRAINER: "Profil trenera personalnego",
  MANAGE_SUPPORT: "Obsługa klienta (skrzynka wiadomości)",
};

export const EMPLOYEE_ROUTE_PERMISSIONS: Record<string, EmployeePermission> = {
  "/employee/dashboard": "VIEW_DASHBOARD",
  "/employee/guests": "MANAGE_GUESTS",
  "/employee/lockers/new": "CREATE_LOCKERS",
  "/employee/lockers": "MANAGE_LOCKERS",
  "/employee/pass-types/new": "MANAGE_PASS_TYPES",
  "/employee/pass-types": "MANAGE_PASS_TYPES",
  "/employee/present": "VIEW_DASHBOARD",
  "/employee/schedule": "MANAGE_SCHEDULE",
  "/employee/work-schedule": "MANAGE_WORK_SCHEDULE",
  "/employee/classes": "MANAGE_CLASSES",
  "/employee/pos": "SELL_PRODUCTS",
  "/employee/trainer-profile": "PERSONAL_TRAINER",
  "/employee/support": "MANAGE_SUPPORT",
};

export function hasEmployeePermission(
  permissions: EmployeePermission[],
  required: EmployeePermission
): boolean {
  return permissions.includes(required);
}

export function canAccessEmployeeRoute(path: string, permissions: EmployeePermission[]): boolean {
  const normalized = path.split("?")[0].replace(/\/$/, "") || "/";

  if (normalized === "/employee/lockers") {
    return (
      hasEmployeePermission(permissions, "MANAGE_LOCKERS") ||
      hasEmployeePermission(permissions, "CREATE_LOCKERS")
    );
  }

  const match = Object.entries(EMPLOYEE_ROUTE_PERMISSIONS)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => normalized === route || normalized.startsWith(`${route}/`));
  if (!match) return true;
  return hasEmployeePermission(permissions, match[1]);
}

export function resolveEmployeePermissions(
  selectedOptional: EmployeePermission[]
): EmployeePermission[] {
  return [...new Set([...DEFAULT_EMPLOYEE_PERMISSIONS, ...selectedOptional])];
}

export function optionalPermissionsFromList(
  permissions: EmployeePermission[] | string[] | undefined
): EmployeePermission[] {
  if (!permissions) return [];
  return OPTIONAL_EMPLOYEE_PERMISSIONS.filter((p) => permissions.includes(p));
}
