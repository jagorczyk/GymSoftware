import { AuthState } from "./auth";
import type { EmployeePermission } from "./permissions";
import { AuthLoginResult, normalizeAuthLoginResult } from "./authMfa";
import { saveMfaTrustedDeviceToken, withTrustedDeviceToken } from "./mfaTrustedDevice";

const API_URL = "/api";

async function parseApiError(response: Response, fallback: string): Promise<never> {
  if (response.status === 401) {
    window.dispatchEvent(new Event("jwt_expired"));
  }
  if (response.status === 402) {
    window.dispatchEvent(new Event("subscription_required"));
  }
  let message = fallback;
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error.length > 0) {
      message = body.error;
    } else if (typeof body?.detail === "string" && body.detail.length > 0) {
      message = body.detail;
    } else if (typeof body?.message === "string" && body.message.length > 0) {
      message = body.message;
    }
  } catch {
    // response body is not JSON
  }
  throw new Error(message);
}

export type { AuthLoginResult } from "./authMfa";

export async function login(email: string, password: string): Promise<AuthLoginResult> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withTrustedDeviceToken({ email, password })),
  });
  if (!response.ok) await parseApiError(response, "Logowanie nie powiodło się");
  return normalizeAuthLoginResult(await response.json());
}

export async function loginWithGoogle(idToken: string, role?: string): Promise<AuthLoginResult> {
  const body: { idToken: string; role?: string } = { idToken };
  if (role) body.role = role;
  const response = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withTrustedDeviceToken(body)),
  });
  if (!response.ok) await parseApiError(response, "Logowanie Google nie powiodło się");
  return normalizeAuthLoginResult(await response.json());
}

export async function register(email: string, password: string, role: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  if (!response.ok) await parseApiError(response, "Rejestracja nie powiodła się");
}

export async function verifyEmail(email: string, code: string): Promise<AuthLoginResult> {
  const response = await fetch(`${API_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withTrustedDeviceToken({ email, code })),
  });
  if (!response.ok) await parseApiError(response, "Weryfikacja nie powiodła się");
  return normalizeAuthLoginResult(await response.json());
}

export async function beginMfaSetup(mfaToken: string): Promise<{ secret: string; qrCodeDataUrl: string; otpauthUrl: string }> {
  const response = await fetch(`${API_URL}/auth/mfa/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mfaToken }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się rozpocząć konfiguracji MFA");
  return response.json();
}

export async function confirmMfaSetup(mfaToken: string, code: string): Promise<AuthLoginResult> {
  const response = await fetch(`${API_URL}/auth/mfa/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mfaToken, code }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się aktywować MFA");
  return normalizeAuthLoginResult(await response.json());
}

export async function verifyMfaLogin(
  mfaToken: string,
  code: string,
  rememberDevice = false
): Promise<AuthLoginResult> {
  const response = await fetch(`${API_URL}/auth/mfa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mfaToken, code, rememberDevice }),
  });
  if (!response.ok) await parseApiError(response, "Nieprawidłowy kod MFA");
  const result = normalizeAuthLoginResult(await response.json());
  if (result.trustedDeviceToken) {
    saveMfaTrustedDeviceToken(result.trustedDeviceToken);
  }
  return result;
}

export async function resendVerification(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się wysłać kodu ponownie");
}

export type ProfileView = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  googleLinked: boolean;
  passwordChangeAllowed: boolean;
  mfaEnabled: boolean;
  mfaMandatory: boolean;
};

export async function getProfile(auth: AuthState): Promise<ProfileView> {
  const response = await fetch(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać profilu");
  return response.json();
}

export async function updateProfile(
  auth: AuthState,
  payload: { firstName?: string; lastName?: string }
): Promise<ProfileView> {
  const response = await fetch(`${API_URL}/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować profilu");
  return response.json();
}

export async function changeProfilePassword(
  auth: AuthState,
  payload: { currentPassword: string; newPassword: string }
): Promise<void> {
  const response = await fetch(`${API_URL}/profile/change-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zmienić hasła");
}

export async function beginProfileMfaSetup(
  auth: AuthState
): Promise<{ secret: string; qrCodeDataUrl: string; otpauthUrl: string }> {
  const response = await fetch(`${API_URL}/profile/mfa/setup`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się rozpocząć konfiguracji MFA");
  return response.json();
}

export async function confirmProfileMfaSetup(auth: AuthState, code: string): Promise<ProfileView> {
  const response = await fetch(`${API_URL}/profile/mfa/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się aktywować MFA");
  return response.json();
}

export interface GymSubscriptionView {
  id: number;
  saasPlanId: number;
  saasPlanName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  featureFlags?: string[];
}

export async function getOwnerGymSubscription(auth: AuthState, gymId: number): Promise<GymSubscriptionView | null> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/subscription`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać subskrypcji");
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function createOwnerCustomerPortalSession(auth: AuthState, gymId: number): Promise<{ portalUrl: string }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/subscription/portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się otworzyć portalu zarządzania");
  return response.json();
}

export async function createOwnerSaaSCheckoutSession(auth: AuthState, gymId: number): Promise<{ checkoutUrl: string }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się rozpocząć płatności");
  return response.json();
}

export async function getOwnerGyms(auth: AuthState): Promise<Array<{ id: number; name: string; address: string; city?: string; postalCode?: string; nip?: string; themeColor?: string; subdomain?: string }>> {
  const response = await fetch(`${API_URL}/owner/gyms`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać listy siłowni");
  return response.json();
}

export async function createOwnerGym(
  auth: AuthState,
  payload: { name: string; address?: string; city?: string; postalCode?: string; nip?: string; themeColor?: string }
): Promise<{ id: number; name: string; address: string; city?: string; postalCode?: string; nip?: string; themeColor?: string }> {
  const response = await fetch(`${API_URL}/owner/gyms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się utworzyć siłowni");
  return response.json();
}

export async function updateOwnerGym(
  auth: AuthState,
  gymId: number,
  payload: { name: string; address?: string; city?: string; postalCode?: string; nip?: string; themeColor?: string }
): Promise<{ id: number; name: string; address: string; city?: string; postalCode?: string; nip?: string; themeColor?: string }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Aktualizacja siłowni nie powiodła się");
  return response.json();
}

export async function checkGymSubdomainAvailability(
  gymName: string,
  excludeGymId?: number
): Promise<{ subdomain: string; available: boolean }> {
  const params = new URLSearchParams({ gymName });
  if (excludeGymId != null) params.set("excludeGymId", String(excludeGymId));
  const response = await fetch(`${API_URL}/public/gyms/subdomain/check?${params.toString()}`);
  if (!response.ok) await parseApiError(response, "Nie udało się sprawdzić dostępności domeny");
  return response.json();
}

export async function updateOwnerGymTheme(
  auth: AuthState,
  gymId: number,
  payload: { themeColor: string }
): Promise<{ id: number; name: string; address: string; themeColor?: string }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/theme`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Aktualizacja motywu nie powiodła się");
  return response.json();
}

export async function getCheckoutUrl(
  auth: AuthState,
  gymId: number
): Promise<{ checkoutUrl: string }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) await parseApiError(response, "Pobieranie linku płatności nie powiodło się");
  return response.json();
}

export async function createOwnerLocker(
  auth: AuthState,
  gymId: number,
  payload: { lockerNumber: string }
): Promise<{ id: number; lockerNumber: string; status: string }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/lockers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać szafki");
  return response.json();
}

export async function deleteOwnerGym(auth: AuthState, gymId: number): Promise<void> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć siłowni");
}

export async function getOwnerGymDetails(auth: AuthState, gymId: number): Promise<OwnerGymDetails> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/details`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać szczegółów siłowni");
  return response.json();
}

export type OwnerGymDetails = {
  gym: { id: number; name: string; address: string; city?: string; postalCode?: string; nip?: string; themeColor?: string; subdomain?: string };
  employees: Array<{ id: number; userId: number; email: string; firstName?: string; lastName?: string; permissions: string[]; rankId?: number; rankName?: string; avatarUrl?: string }>;
  passes: Array<{ id: number; guestId: number; passType: string; status: string; startDate: string; endDate: string; price: number; guestFirstName?: string; guestLastName?: string }>;
  lockers: Array<{ id: number; lockerNumber: string; status: string; guestId?: number | null; guestFirstName?: string; guestLastName?: string }>;
  logs: Array<{ id: number; action: string; payload: string; createdAt: string; actorEmail?: string }>;
  passTypes: Array<{ id: number; name: string; price: number; durationDays: number }>;
};

export type OwnerDashboardStats = {
  presentNow: number;
  freeLockers: number;
  occupiedLockers: number;
  expiringPassesCount: number;
  activePassesCount: number;
  salesLast7Days: number;
  expiringPasses: Array<{ guestId: number; firstName: string; lastName: string; endDate: string; daysRemaining: number }>;
};

export type PagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type OwnerGuest = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  hasActivePass: boolean;
  isPresent: boolean;
  hasLocker: boolean;
  activePassEndDate?: string | null;
  avatarUrl?: string | null;
};

export async function getOwnerDashboardStats(auth: AuthState, gymId: number): Promise<OwnerDashboardStats> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/dashboard-stats`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać statystyk");
  return response.json();
}

export async function getOwnerGuests(
  auth: AuthState,
  gymId: number,
  params?: { q?: string; page?: number; size?: number }
): Promise<PagedResponse<OwnerGuest>> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.page !== undefined) search.set("page", String(params.page));
  if (params?.size !== undefined) search.set("size", String(params.size));
  const query = search.toString();
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/guests${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać listy klientów");
  return response.json();
}

export async function createOwnerEmployee(
  auth: AuthState,
  gymId: number,
  payload: { email: string; password: string; firstName?: string; lastName?: string; permissions?: EmployeePermission[]; rankId?: number; avatarUrl?: string | null }
): Promise<{ id: number; userId: number; email: string; firstName?: string; lastName?: string; permissions: string[]; rankId?: number; rankName?: string; avatarUrl?: string }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/employees`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać pracownika");
  return response.json();
}

export async function updateOwnerEmployee(
  auth: AuthState,
  gymId: number,
  employeeId: number,
  payload: { email: string; password?: string; firstName?: string; lastName?: string; permissions?: EmployeePermission[]; rankId?: number; avatarUrl?: string | null }
): Promise<{ id: number; userId: number; email: string; firstName?: string; lastName?: string; permissions: string[]; rankId?: number; rankName?: string; avatarUrl?: string }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/employees/${employeeId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować danych pracownika");
  return response.json();
}

export async function deleteOwnerEmployee(auth: AuthState, gymId: number, employeeId: number): Promise<void> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/employees/${employeeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć pracownika");
}

export async function createPassType(
  auth: AuthState,
  gymId: number,
  payload: { name: string; price: number; durationDays: number }
): Promise<any> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/pass-types`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać typu karnetu");
  return response.json();
}

export async function deletePassType(auth: AuthState, gymId: number, passTypeId: number): Promise<void> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/pass-types/${passTypeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć typu karnetu");
}

export async function sellPass(auth: AuthState, gymId: number, payload: any): Promise<any> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/passes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się sprzedać karnetu");
  return response.json();
}

export async function getEmployeeGyms(auth: AuthState): Promise<
  Array<{ employeeId: number; gymId: number; gymName: string; gymAddress: string; subdomain?: string; permissions: string[]; themeColor?: string }>
> {
  const response = await fetch(`${API_URL}/employee/gyms`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać przypisanych siłowni");
  return response.json();
}

export async function getEmployeeLiveOverview(
  auth: AuthState,
  gymId: number
): Promise<{
  activeKeys: Array<{ lockerId: number; lockerNumber: string; guestId: number; guestName: string; assignedAt: string }>;
  presentGuests: Array<{ guestId: number; firstName: string; lastName: string; email: string }>;
  allLockers: Array<{ id: number; lockerNumber: string; status: string; guestId: number | null }>;
  passTypes: Array<{ id: number; name: string; price: number; durationDays: number }>;
  expiringPasses: Array<{
    guestId: number;
    firstName: string;
    lastName: string;
    endDate: string;
    daysRemaining: number;
  }>;
  salesLast7Days: number;
}> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/live`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać bieżącego podglądu siłowni");
  return response.json();
}

export async function getEmployeeGuests(
  auth: AuthState,
  gymId: number,
  query?: string
): Promise<Array<{ id: number; firstName: string; lastName: string; email: string }>> {
  const url = new URL(`${API_URL}/employee/gyms/${gymId}/guests`, window.location.origin);
  if (query && query.trim().length > 0) {
    url.searchParams.set("q", query.trim());
  }
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać listy klientów");
  return response.json();
}

export async function createEmployeeGuest(
  auth: AuthState,
  gymId: number,
  payload: { firstName: string; lastName: string; email?: string; phone?: string; notes?: string; avatarUrl?: string | null }
): Promise<GuestView> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/guests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zarejestrować klienta");
  return response.json();
}

export async function assignLocker(auth: AuthState, gymId: number, payload: any): Promise<void> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/lockers/assign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się nadać szafki klientowi");
}

export async function createEmployeeLocker(
  auth: AuthState,
  gymId: number,
  payload: { lockerNumber: string }
): Promise<{ id: number; lockerNumber: string; status: string }> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/lockers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać szafki");
  return response.json();
}

export async function getEmployeePassTypes(
  auth: AuthState,
  gymId: number
): Promise<Array<{ id: number; name: string; price: number; durationDays: number }>> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/pass-types`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać oferty karnetów");
  return response.json();
}

export async function createEmployeePassType(
  auth: AuthState,
  gymId: number,
  payload: { name: string; price: number; durationDays: number }
): Promise<any> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/pass-types`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać typu karnetu");
  return response.json();
}

export async function deleteEmployeePassType(
  auth: AuthState,
  gymId: number,
  passTypeId: number
): Promise<void> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/pass-types/${passTypeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć typu karnetu");
}

export async function leaveGym(auth: AuthState, gymId: number, guestId: number): Promise<void> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/guests/${guestId}/leave`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zakończyć wizyty klienta");
}

export async function returnLocker(auth: AuthState, gymId: number, guestId: number): Promise<void> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/guests/${guestId}/lockers/return`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się odebrać szafki");
}

export type GuestView = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  hasActivePass: boolean;
  isPresent: boolean;
  hasLocker: boolean;
  activePassEndDate: string | null;
  avatarUrl?: string | null;
};

export type PassView = {
  id: number;
  guestId: number;
  passType: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number;
  freezeStartDate?: string;
  freezeEndDate?: string;
};

export type GuestDetail = {
  guest: GuestView;
  passes: PassView[];
  recentCheckIns?: Array<{id:number; checkedInAt:string; checkedOutAt:string|null}>;
  activeFreezes?: Array<{id:number; passId:number; startDate:string; endDate:string; processed:boolean}>;
};

export async function getEmployeeGuestDetail(
  auth: AuthState,
  gymId: number,
  guestId: number
): Promise<GuestDetail> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/guests/${guestId}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać danych klienta");
  return response.json();
}

export async function updateEmployeeGuest(
  auth: AuthState,
  gymId: number,
  guestId: number,
  payload: { firstName: string; lastName: string; email?: string; phone?: string; notes?: string; avatarUrl?: string | null }
): Promise<GuestView> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/guests/${guestId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować klienta");
  return response.json();
}

export async function checkInGuest(auth: AuthState, gymId: number, guestId: number): Promise<void> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/guests/${guestId}/check-in`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zarejestrować wejścia");
}

export async function checkOutGuest(auth: AuthState, gymId: number, guestId: number): Promise<void> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/guests/${guestId}/check-out`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zarejestrować wyjścia");
}

export async function renewPass(
  auth: AuthState,
  gymId: number,
  passId: number,
  payload: { endDate: string; price: number }
): Promise<PassView> {
  const base =
    auth.role === "OWNER"
      ? `${API_URL}/owner/gyms/${gymId}/passes/${passId}/renew`
      : `${API_URL}/employee/gyms/${gymId}/passes/${passId}/renew`;
  const response = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się przedłużyć karnetu");
  return response.json();
}

export async function cancelPass(auth: AuthState, gymId: number, passId: number): Promise<PassView> {
  const base =
    auth.role === "OWNER"
      ? `${API_URL}/owner/gyms/${gymId}/passes/${passId}/cancel`
      : `${API_URL}/employee/gyms/${gymId}/passes/${passId}/cancel`;
  const response = await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się anulować karnetu");
  return response.json();
}

export async function getOwnerGuestDetail(
  auth: AuthState,
  gymId: number,
  guestId: number
): Promise<GuestDetail> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/guests/${guestId}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać danych klienta");
  return response.json();
}

export async function updateOwnerGuest(
  auth: AuthState,
  gymId: number,
  guestId: number,
  payload: { firstName: string; lastName: string; email?: string; phone?: string; notes?: string; avatarUrl?: string | null }
): Promise<GuestView> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/guests/${guestId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować klienta");
  return response.json();
}

export async function updatePassType(
  auth: AuthState,
  gymId: number,
  passTypeId: number,
  payload: { name: string; price: number; durationDays: number }
): Promise<{ id: number; name: string; price: number; durationDays: number }> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/pass-types/${passTypeId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować typu karnetu");
  return response.json();
}

export type SalesReport = {
  from: string;
  to: string;
  total: number;
  passCount: number;
  productRevenue?: number;
  days: Array<{ date: string; total: number; count: number }>;
  byPassType: Array<{ passType: string; total: number; count: number }>;
};

export async function getSalesReport(
  auth: AuthState,
  gymId: number,
  from?: string,
  to?: string
): Promise<SalesReport> {
  const url = new URL(`${API_URL}/owner/gyms/${gymId}/sales-report`, window.location.origin);
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać raportu sprzedaży");
  return response.json();
}

export type AuditLog = {
  id: number;
  action: string;
  payload: string | null;
  createdAt: string;
  actorEmail: string | null;
};

export async function getAuditLogs(
  auth: AuthState,
  gymId: number,
  params?: { from?: string; to?: string; action?: string; actorEmail?: string }
): Promise<AuditLog[]> {
  const url = new URL(`${API_URL}/owner/gyms/${gymId}/audit-logs`, window.location.origin);
  if (params?.from) url.searchParams.set("from", params.from);
  if (params?.to) url.searchParams.set("to", params.to);
  if (params?.action) url.searchParams.set("action", params.action);
  if (params?.actorEmail) url.searchParams.set("actorEmail", params.actorEmail);
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać historii");
  return response.json();
}

export type GymNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  guestId: number | null;
  passId: number | null;
  createdAt: string;
  readAt: string | null;
  emailSentAt: string | null;
};

export type NotificationSettings = {
  expiringPassEmailEnabled: boolean;
  expiringPassDaysBefore: number;
  notificationEmail: string | null;
};

export async function getNotifications(auth: AuthState, gymId: number): Promise<GymNotification[]> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/notifications`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać powiadomień");
  return response.json();
}

export async function getUnreadNotificationCount(auth: AuthState, gymId: number): Promise<number> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać liczby powiadomień");
  const data = await response.json();
  return Number(data.count ?? 0);
}

export async function markNotificationRead(
  auth: AuthState,
  gymId: number,
  notificationId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/owner/gyms/${gymId}/notifications/${notificationId}/read`,
    { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } }
  );
  if (!response.ok) await parseApiError(response, "Nie udało się oznaczyć powiadomienia");
}

export async function getNotificationSettings(
  auth: AuthState,
  gymId: number
): Promise<NotificationSettings> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/notification-settings`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać ustawień powiadomień");
  return response.json();
}

export async function updateNotificationSettings(
  auth: AuthState,
  gymId: number,
  payload: NotificationSettings
): Promise<NotificationSettings> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/notification-settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zapisać ustawień powiadomień");
  return response.json();
}

export type CalendarEvent = {
  id: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  color: string | null;
  createdByUserId: number;
  createdByEmail: string;
  canEdit: boolean;
};

export type CalendarEventPayload = {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  color?: string;
};

function calendarBasePath(role: "OWNER" | "EMPLOYEE" | "GUEST" | string, gymId: number) {
  return role === "OWNER"
    ? `${API_URL}/owner/gyms/${gymId}/calendar-events`
    : `${API_URL}/employee/gyms/${gymId}/calendar-events`;
}

export async function getCalendarEvents(
  auth: AuthState,
  gymId: number,
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  const url = new URL(calendarBasePath(auth.role, gymId), window.location.origin);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać terminarza");
  return response.json();
}

export async function createCalendarEvent(
  auth: AuthState,
  gymId: number,
  payload: CalendarEventPayload
): Promise<CalendarEvent> {
  const response = await fetch(calendarBasePath(auth.role, gymId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać wpisu do terminarza");
  return response.json();
}

export async function updateCalendarEvent(
  auth: AuthState,
  gymId: number,
  eventId: number,
  payload: CalendarEventPayload
): Promise<CalendarEvent> {
  const response = await fetch(`${calendarBasePath(auth.role, gymId)}/${eventId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować wpisu w terminarzu");
  return response.json();
}

export async function deleteCalendarEvent(auth: AuthState, gymId: number, eventId: number): Promise<void> {
  const response = await fetch(`${calendarBasePath(auth.role, gymId)}/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć wpisu z terminarza");
}

export type WorkScheduleEntryType =
  | "SHIFT"
  | "VACATION"
  | "SICK_LEAVE"
  | "DAY_OFF"
  | "TRAINING"
  | "OTHER";

export type WorkScheduleEntry = {
  id: number;
  employeeId: number;
  employeeName: string;
  entryType: WorkScheduleEntryType;
  title: string;
  note: string | null;
  startAt: string;
  endAt: string;
  color: string;
  canEdit: boolean;
};

export type WorkScheduleEntryPayload = {
  employeeId: number;
  entryType: WorkScheduleEntryType;
  title?: string;
  note?: string;
  startAt: string;
  endAt: string;
};

function workScheduleBasePath(role: "OWNER" | "EMPLOYEE" | "GUEST" | string, gymId: number) {
  return role === "OWNER"
    ? `${API_URL}/owner/gyms/${gymId}/work-schedule`
    : `${API_URL}/employee/gyms/${gymId}/work-schedule`;
}

export async function getWorkScheduleEntries(
  auth: AuthState,
  gymId: number,
  from: string,
  to: string,
  employeeId?: number
): Promise<WorkScheduleEntry[]> {
  const url = new URL(workScheduleBasePath(auth.role, gymId), window.location.origin);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  if (employeeId != null) url.searchParams.set("employeeId", String(employeeId));
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać grafiku pracy");
  return response.json();
}

export async function createWorkScheduleEntry(
  auth: AuthState,
  gymId: number,
  payload: WorkScheduleEntryPayload
): Promise<WorkScheduleEntry> {
  const response = await fetch(workScheduleBasePath(auth.role, gymId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać wpisu");
  return response.json();
}

export async function getTrainerProfile(auth: AuthState, gymId: number): Promise<any> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/trainer-profile`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać profilu trenera");
  return response.json();
}

export async function updateTrainerProfile(auth: AuthState, gymId: number, payload: any): Promise<any> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/trainer-profile`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zapisać profilu trenera");
  return response.json();
}

export async function getTrainerTrainings(auth: AuthState, gymId: number): Promise<any[]> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/trainer-profile/trainings`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać treningów");
  return response.json();
}

export async function cancelTrainerTraining(auth: AuthState, gymId: number, trainingId: number): Promise<void> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/trainer-profile/trainings/${trainingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się odwołać treningu");
}

export async function updateWorkScheduleEntry(
  auth: AuthState,
  gymId: number,
  entryId: number,
  payload: WorkScheduleEntryPayload
): Promise<WorkScheduleEntry> {
  const response = await fetch(`${workScheduleBasePath(auth.role, gymId)}/${entryId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować wpisu w grafiku pracy");
  return response.json();
}

export async function deleteWorkScheduleEntry(
  auth: AuthState,
  gymId: number,
  entryId: number
): Promise<void> {
  const response = await fetch(`${workScheduleBasePath(auth.role, gymId)}/${entryId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć wpisu z grafiku pracy");
}

export type DashboardMetrics = {
  activePasses: number;
  activeGuests: number;
  newGuestsThisMonth: number;
  checkInsToday: number;
  revenueThisMonth: number;
};

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type PassTypePopularity = {
  passTypeName: string;
  count: number;
};

export type AnalyticsDashboardDto = {
  metrics: DashboardMetrics;
  revenueOverTime: ChartDataPoint[];
  checkInsOverTime: ChartDataPoint[];
  passTypePopularity: PassTypePopularity[];
};

export async function getGymAnalytics(auth: AuthState, gymId: number): Promise<AnalyticsDashboardDto> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/analytics`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać analityki");
  return response.json();
}

export async function uploadAvatar(auth: AuthState, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/auth/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: formData,
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować zdjęcia");
  return response.json();
}

export async function uploadImage(auth: AuthState, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: formData,
  });
  if (!response.ok) await parseApiError(response, "Nie udało się wgrać zdjęcia");
  return response.json();
}

export type GroupClassView = {
  id: number;
  instructorId: number;
  instructorName: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  capacity: number;
  activeReservations: number;
  userReservationStatus?: string | null;
};

export type ClassReservationView = {
  id: number;
  classId: number;
  guestId: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  status: string;
  reservedAt: string;
};

function formatIsoStringForApi(isoStr: string): string {
  if (!isoStr) return isoStr;
  return isoStr.replace("Z", "").split(".")[0];
}

function classBasePath(role: string, gymId: number) {
  return role === "OWNER"
    ? `${API_URL}/owner/gyms/${gymId}/classes`
    : `${API_URL}/employee/gyms/${gymId}/classes`;
}

export async function getClasses(
  auth: AuthState,
  gymId: number,
  from: string,
  to: string
): Promise<GroupClassView[]> {
  const url = new URL(classBasePath(auth.role, gymId), window.location.origin);
  url.searchParams.set("from", formatIsoStringForApi(from));
  url.searchParams.set("to", formatIsoStringForApi(to));
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać zajęć");
  return response.json();
}

export async function createClass(
  auth: AuthState,
  gymId: number,
  payload: { instructorId: number; name: string; description?: string; startTime: string; endTime: string; capacity: number }
): Promise<GroupClassView> {
  const response = await fetch(classBasePath(auth.role, gymId), {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać zajęć");
  return response.json();
}

export async function updateClass(
  auth: AuthState,
  gymId: number,
  classId: number,
  payload: { instructorId: number; name: string; description?: string; startTime: string; endTime: string; capacity: number }
): Promise<GroupClassView> {
  const response = await fetch(`${classBasePath(auth.role, gymId)}/${classId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować zajęć");
  return response.json();
}

export async function deleteClass(auth: AuthState, gymId: number, classId: number): Promise<void> {
  const response = await fetch(`${classBasePath(auth.role, gymId)}/${classId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć zajęć");
}

export async function getClassReservations(
  auth: AuthState,
  gymId: number,
  classId: number
): Promise<ClassReservationView[]> {
  const response = await fetch(`${classBasePath(auth.role, gymId)}/${classId}/reservations`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać rezerwacji");
  return response.json();
}

export async function updateAttendance(
  auth: AuthState,
  gymId: number,
  classId: number,
  reservationId: number,
  status: string
): Promise<ClassReservationView> {
  const response = await fetch(`${classBasePath(auth.role, gymId)}/${classId}/reservations/${reservationId}/attendance`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować obecności");
  return response.json();
}

export async function getClientClasses(
  auth: AuthState,
  gymId: number,
  from: string,
  to: string
): Promise<GroupClassView[]> {
  const url = new URL(`${API_URL}/client/gyms/${gymId}/classes`, window.location.origin);
  url.searchParams.set("from", formatIsoStringForApi(from));
  url.searchParams.set("to", formatIsoStringForApi(to));
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać zajęć");
  return response.json();
}

export async function clientBookClass(auth: AuthState, gymId: number, classId: number): Promise<void> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/classes/${classId}/book`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zarezerwować miejsca");
}

export async function clientCancelClass(auth: AuthState, gymId: number, classId: number): Promise<void> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/classes/${classId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się anulować rezerwacji");
}

export type RankView = {
  id: number;
  name: string;
  permissions: EmployeePermission[];
};

export async function getOwnerRanks(auth: AuthState, gymId: number): Promise<RankView[]> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/ranks`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać rang");
  return response.json();
}

export async function createOwnerRank(auth: AuthState, gymId: number, payload: { name: string; permissions: EmployeePermission[] }): Promise<RankView> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/ranks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się utworzyć rangi");
  return response.json();
}

export async function updateOwnerRank(auth: AuthState, gymId: number, rankId: number, payload: { name: string; permissions: EmployeePermission[] }): Promise<RankView> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/ranks/${rankId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować rangi");
  return response.json();
}

export async function deleteOwnerRank(auth: AuthState, gymId: number, rankId: number): Promise<void> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/ranks/${rankId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć rangi");
}

export interface ProductView {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  barcode?: string | null;
}

export interface ProductSaleItemView {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ProductSaleView {
  id: number;
  soldByEmail: string;
  guestName: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: ProductSaleItemView[];
}

export async function getProducts(auth: AuthState, gymId: number, role: "owner" | "employee"): Promise<ProductView[]> {
  const response = await fetch(`${API_URL}/${role}/gyms/${gymId}/products`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać listy produktów");
  return response.json();
}

export async function createProduct(auth: AuthState, gymId: number, payload: { name: string; price: number; quantity: number; category: string }): Promise<ProductView> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać produktu");
  return response.json();
}

export async function updateProduct(auth: AuthState, gymId: number, productId: number, payload: { name: string; price: number; quantity: number; category: string }): Promise<ProductView> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/products/${productId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować produktu");
  return response.json();
}

export async function deleteProduct(auth: AuthState, gymId: number, productId: number): Promise<void> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć produktu");
}

export async function checkoutProducts(
  auth: AuthState,
  gymId: number,
  payload: { guestId: number | null; items: Array<{ productId: number; quantity: number }>; paymentMethod: string }
): Promise<ProductSaleView> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/sales/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Błąd podczas finalizacji sprzedaży");
  return response.json();
}

export async function getProductSales(auth: AuthState, gymId: number): Promise<ProductSaleView[]> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/sales/products`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać historii sprzedaży");
  return response.json();
}

export interface ClassRatingSummary {
  classId: number;
  className: string;
  instructorName: string | null;
  avgRating: number;
  ratingCount: number;
}

export interface ClassRatingView {
  id: number;
  classId: number;
  guestId: number;
  guestName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export async function freezePassEmployee(auth: AuthState, gymId: number, passId: number, payload: { startDate: string; endDate: string }): Promise<PassView> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/passes/${passId}/freeze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zamrozić karnetu");
  return response.json();
}

export async function unfreezePassEmployee(auth: AuthState, gymId: number, passId: number): Promise<PassView> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/passes/${passId}/unfreeze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  if (!response.ok) await parseApiError(response, "Nie udało się odmrozić karnetu");
  return response.json();
}

export async function getMyProductSalesHistory(auth: AuthState, gymId: number): Promise<ProductSaleView[]> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/sales/my-history`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać historii Twojej sprzedaży");
  return response.json();
}

export async function getProductByBarcode(auth: AuthState, gymId: number, code: string): Promise<ProductView> {
  const response = await fetch(`${API_URL}/employee/gyms/${gymId}/products/by-barcode?code=${encodeURIComponent(code)}`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  if (!response.ok) await parseApiError(response, "Nie znaleziono produktu");
  return response.json();
}

export async function getClassRatingsSummary(auth: AuthState, gymId: number): Promise<ClassRatingSummary[]> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/classes/ratings-summary`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać zestawienia ocen");
  return response.json();
}

export async function getClassRatings(auth: AuthState, gymId: number, classId: number): Promise<ClassRatingView[]> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/classes/${classId}/ratings`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać ocen zajęć");
  return response.json();
}

export function buildSalesReportCsvUrl(gymId: number, from?: string, to?: string): string {
  let params = "";
  if (from) params += `?from=${from}`;
  if (to) params += (params ? `&to=${to}` : `?to=${to}`);
  return `${API_URL}/owner/gyms/${gymId}/sales-report/export.csv${params}`;
}

export interface EmailCampaignView {
  id: number;
  subject: string;
  body: string;
  targetSegment: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  scheduledAt?: string;
  imageUrl?: string | null;
}

export async function getEmailCampaigns(auth: AuthState, gymId: number): Promise<EmailCampaignView[]> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/crm/campaigns`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać kampanii");
  return response.json();
}

export async function createEmailCampaign(
  auth: AuthState,
  gymId: number,
  payload: { subject: string; body: string; targetSegment: string; scheduledAt?: string; imageUrl?: string | null }
): Promise<EmailCampaignView> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/crm/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się utworzyć kampanii");
  return response.json();
}

export type TrainerProfileView = {
  id: number;
  employeeId: number;
  firstName: string;
  lastName: string;
  bio: string | null;
  specialization: string | null;
  hourlyRate: number;
};

export async function getOwnerTrainers(auth: AuthState, gymId: number): Promise<TrainerProfileView[]> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/trainers`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać trenerów");
  return response.json();
}

export async function createOwnerTrainer(
  auth: AuthState,
  gymId: number,
  payload: { employeeId: number; bio?: string; specialization?: string; hourlyRate: number }
): Promise<TrainerProfileView> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/trainers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dodać trenera");
  return response.json();
}

export async function updateOwnerTrainer(
  auth: AuthState,
  gymId: number,
  trainerId: number,
  payload: { bio?: string; specialization?: string; hourlyRate: number }
): Promise<TrainerProfileView> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/trainers/${trainerId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować profilu trenera");
  return response.json();
}

export async function deleteOwnerTrainer(auth: AuthState, gymId: number, trainerId: number): Promise<void> {
  const response = await fetch(`${API_URL}/owner/gyms/${gymId}/trainers/${trainerId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć trenera");
}

export type SaaSPlan = {
  id: number;
  name: string;
  price: number;
  stripeProductId: string;
  stripePriceId: string;
  features: string;
  active: boolean;
  featureFlags?: string[];
};

export type GymSubscriptionDTO = {
  id: number;
  gymId: number;
  gymName: string;
  gymAddress: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  saasPlanId: number;
  saasPlanName: string;
  status: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: string;
  createdAt: string;
  adminNotes?: string | null;
  featureFlagOverrides?: Record<string, boolean>;
  effectiveFeatureFlags?: string[];
};

export async function getSaaSPlans(auth: AuthState): Promise<SaaSPlan[]> {
  const response = await fetch(`${API_URL}/admin/saas/plans`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać planów SaaS");
  return response.json();
}

export type CreateSaaSPlanPayload = {
  name: string;
  price: number;
  features?: string;
  active?: boolean;
  featureFlags?: string[];
};

export type UpdateSaaSPlanPayload = CreateSaaSPlanPayload;

export async function createSaaSPlan(auth: AuthState, payload: CreateSaaSPlanPayload): Promise<SaaSPlan> {
  const response = await fetch(`${API_URL}/admin/saas/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się utworzyć planu");
  return response.json();
}

export async function updateSaaSPlan(auth: AuthState, planId: number, payload: UpdateSaaSPlanPayload): Promise<SaaSPlan> {
  const response = await fetch(`${API_URL}/admin/saas/plans/${planId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować planu");
  return response.json();
}

export async function deleteSaaSPlan(auth: AuthState, planId: number): Promise<void> {
  const response = await fetch(`${API_URL}/admin/saas/plans/${planId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć planu");
}

export async function getSaaSSubscriptions(auth: AuthState): Promise<GymSubscriptionDTO[]> {
  const response = await fetch(`${API_URL}/admin/saas/subscriptions`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać subskrypcji");
  return response.json();
}

export async function cancelSaaSSubscription(auth: AuthState, subscriptionId: number): Promise<void> {
  const response = await fetch(`${API_URL}/admin/saas/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się anulować subskrypcji");
}

export async function updateSaaSSubscriptionStatus(auth: AuthState, subscriptionId: number, status: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/saas/subscriptions/${subscriptionId}/status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zaktualizować statusu subskrypcji");
}

export async function changeSaaSSubscriptionPlan(auth: AuthState, subscriptionId: number, saasPlanId: number): Promise<void> {
  const response = await fetch(`${API_URL}/admin/saas/subscriptions/${subscriptionId}/plan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ saasPlanId }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zmienić pakietu subskrypcji");
}

export async function extendSaaSSubscription(
  auth: AuthState,
  subscriptionId: number,
  payload: { days: number; reactivate: boolean }
): Promise<GymSubscriptionDTO> {
  const response = await fetch(`${API_URL}/admin/saas/subscriptions/${subscriptionId}/extend`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się przedłużyć subskrypcji");
  return response.json();
}

export async function updateSaaSSubscriptionNotes(
  auth: AuthState,
  subscriptionId: number,
  adminNotes: string
): Promise<GymSubscriptionDTO> {
  const response = await fetch(`${API_URL}/admin/saas/subscriptions/${subscriptionId}/notes`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ adminNotes }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zapisać notatek");
  return response.json();
}

export async function updateSaaSSubscriptionFeatureOverrides(
  auth: AuthState,
  subscriptionId: number,
  overrides: Record<string, boolean>
): Promise<GymSubscriptionDTO> {
  const response = await fetch(`${API_URL}/admin/saas/subscriptions/${subscriptionId}/feature-overrides`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ overrides }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się zapisać nadpisań funkcji");
  return response.json();
}

export async function downloadSaaSSubscriptionsCsv(auth: AuthState): Promise<Blob> {
  const response = await fetch(`${API_URL}/admin/saas/subscriptions/export.csv`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się wyeksportować subskrypcji");
  return response.blob();
}

export async function downloadSaaSUsersCsv(auth: AuthState): Promise<Blob> {
  const response = await fetch(`${API_URL}/admin/saas/users/export.csv`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się wyeksportować użytkowników");
  return response.blob();
}

export type ImpersonationResponse = {
  token: string;
  role: string;
  email: string;
  impersonatorUserId: number;
  impersonatorEmail: string;
};

export async function impersonateSaaSUser(auth: AuthState, userId: number): Promise<ImpersonationResponse> {
  const response = await fetch(`${API_URL}/admin/saas/users/${userId}/impersonate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się rozpocząć podglądu konta");
  return response.json();
}

export async function resendSaaSUserVerification(auth: AuthState, userId: number): Promise<void> {
  const response = await fetch(`${API_URL}/admin/saas/users/${userId}/resend-verification`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się wysłać e-maila weryfikacyjnego");
}

export type SuperAdminAuditLog = {
  id: number;
  actorEmail: string;
  action: string;
  targetType?: string | null;
  targetId?: number | null;
  details?: string | null;
  createdAt: string;
};

export type SaaSHealthView = {
  databaseOk: boolean;
  databaseMessage: string;
  smtpConfigured: boolean;
  smtpMessage: string;
  stripeConfigured: boolean;
  stripeReachable: boolean;
  stripeMessage: string;
  scheduledJobs: Array<{ jobName: string; lastRunAt?: string | null; status: string; message?: string | null }>;
  stripeWebhook: {
    secretConfigured: boolean;
    endpointUrl: string;
    lastReceivedAt?: string | null;
    lastEventType?: string | null;
    status: string;
    message: string;
  };
};

export async function getSaaSHealth(auth: AuthState): Promise<SaaSHealthView> {
  const response = await fetch(`${API_URL}/admin/saas/health`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać statusu systemu");
  return response.json();
}

export async function getSuperAdminAuditLogs(auth: AuthState): Promise<SuperAdminAuditLog[]> {
  const response = await fetch(`${API_URL}/admin/saas/audit-logs`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać logów operacji");
  return response.json();
}

export async function resetSaaSPlatformData(auth: AuthState, confirmation: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/saas/system/reset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ confirmation }),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się wyczyścić platformy");
}

export async function getTenantSaaSPlans(): Promise<SaaSPlan[]> {
  const response = await fetch(`${API_URL}/auth/tenant/plans`);
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać planów SaaS");
  return response.json();
}

export async function registerTenant(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/auth/tenant/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) await parseApiError(response, "Rejestracja siłowni nie powiodła się");
  return response.json();
}

export type SaaSStatsView = {
  totalMrr: number;
  activeGyms: number;
  trialingGyms: number;
  canceledGyms: number;
  subscriptionsByPlan: Array<{ planName: string; count: number }>;
  subscriptionsByStatus: Array<{ statusName: string; count: number }>;
};

export async function getSaaSStats(auth: AuthState): Promise<SaaSStatsView> {
  const response = await fetch(`${API_URL}/admin/saas/stats`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać statystyk SaaS");
  return response.json();
}

export type SaaSAdminUserDTO = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
};

export async function getSaaSUsers(auth: AuthState): Promise<SaaSAdminUserDTO[]> {
  const response = await fetch(`${API_URL}/admin/saas/users`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać listy użytkowników");
  return response.json();
}

export async function deleteSaaSUser(auth: AuthState, userId: number): Promise<void> {
  const response = await fetch(`${API_URL}/admin/saas/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się usunąć użytkownika");
}
